import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

// ============================================================
// BLOQUES DE TEXTO — 1 imagen por bloque
// Párrafos fusionados con \n\n para mostrar más texto por pantalla
// ============================================================
const BLOCKS = [
  {
    title: 'La Velá de Santa Ana',
    image: 'hist-intro',
    pages: [
      '¡Escúchame bien, valiente! Te lo voy a contar como si estuviéramos sentados con una "fresquita" en la calle Betis viendo caer la tarde.\n\nPara entender este juego, tienes que entender que Triana no es un barrio, es una religión. Y su fiesta mayor, la Velá, es el momento en que el corazón de Sevilla cruza el puente y se queda a vivir en la otra orilla.',
    ],
  },
  {
    title: 'El Milagro del Sabio',
    image: 'hist-sabio',
    pages: [
      'Todo este jaleo lo empezó Alfonso X, el que llamaban el Sabio. El pobre hombre tenía los ojos que no veía ni tres en un burro por una enfermedad "malaje".\n\nSe encomendó a la Señora Santa Ana, la abuela de todos los trianeros, y ¡catapum!, sanó por arte de magia.',
      'En agradecimiento, mandó levantar esa joya que es la Parroquia de Santa Ana en 1266. De ese "ir de velada" nos queda el nombre de nuestra fiesta.',
    ],
  },
  {
    title: 'La Picaresca se echa al río',
    image: 'hist-picaresca',
    pages: [
      'Pero claro, en Triana el espíritu es inquieto. La gente rezaba, sí, pero luego el cuerpo pedía alegría. La fiesta bajó del altar a la orilla del Guadalquivir.',
      'Lo que eran rezos se convirtieron en cantes, en avellanas verdes —que se comen por arrobas— y en el olor a sardina asada que te quita el sentido.\n\nLa Velá pasó de ser un rito de iglesia a ser la feria del pueblo, donde el río es el que manda.',
    ],
  },
  {
    title: 'La Leyenda de la Cucaña',
    image: 'hist-leyenda',
    pages: [
      'Y aquí llegamos a lo que te interesa: la Cucaña. Dicen los antiguos que esto viene de los marineros y calafates que vivían en el barrio.\n\nPara demostrar quién tenía más "age" y más equilibrio, ponían un palo en la proa de los barcos que venían de las Indias.',
      'Un palo largo, embadurnado de jabón de Triana —¡que resbala más que una anguila en una bañera!— y al final, el trofeo: una banderita que te corona como el rey del río.\n\nSi llegas, eres un héroe; si te caes —que te vas a caer—, el chapuzón en el Guadalquivir te bautiza como trianero de pura cepa.',
    ],
  },
  {
    title: 'Tu Misión',
    image: 'hist-mision',
    pages: [
      'Ahora te toca a ti, artista. Vas a subirte a ese palo con el puente de Triana de fondo y la Giralda mirándote de reojo.\n\nTen cuidado, que el jabón no tiene amigos y el río está esperando.\n\n¡Échale coraje, aprieta los dientes y no te olvides de la gracia, que en Triana hasta para caerse hay que tener arte!',
    ],
  },
]

// ============================================================
// LAYOUT
// ============================================================
const DLG_M    = 16
const DLG_H    = 384                               // mitad de pantalla (768 / 2)
const DLG_X    = DLG_M
const DLG_Y    = GAME_HEIGHT - DLG_H - DLG_M     // 368
const DLG_W    = GAME_WIDTH  - DLG_M * 2          // 992

const FACE_W   = 160
const NARR_SIZE = 150

const TITLE_H  = 26
const TEXT_X   = DLG_X + FACE_W + 14              // 190
const TEXT_Y   = DLG_Y + TITLE_H + 16             // 616
const TEXT_W   = DLG_W - FACE_W - 26              // 806

// Zona de imagen histórica (encima del diálogo)
const IMG_CX       = GAME_WIDTH / 2               // 512
const IMG_AREA_TOP = 30
const IMG_AREA_BTM = DLG_Y - 16                   // 558
const IMG_CY       = Math.round((IMG_AREA_TOP + IMG_AREA_BTM) / 2)  // 294
const IMG_MAX_W    = 680
const IMG_MAX_H    = IMG_AREA_BTM - IMG_AREA_TOP   // 528

// Máquina de escribir
const CHAR_DELAY = 28   // ms por carácter

// Animación boca del narrador
// Ciclo: neutral → medio abierta → abierta → medio abierta → (repite)
const MOUTH_CYCLE = [
  { key: 'narrator',        duration: 180 },
  { key: 'narrator-m-open', duration: 120 },
  { key: 'narrator-open',   duration: 80  },
  { key: 'narrator-m-open', duration: 120 },
]
const BLINK_MIN = 3200
const BLINK_MAX = 7000
const BLINK_DUR = 130

// Paleta
const AMBER    = 0xd4a520
const DLG_DARK = 0x0d0600
const DLG_FACE = 0x5c3318   // marrón medio — contrasta con la barba negra

export class HistoryScene extends Scene {

  constructor() {
    super(SCENES.HISTORY)
  }

  create() {
    // Estado
    this.blockIdx        = 0
    this.pageIdx         = 0
    this.charIdx         = 0
    this.isTyping        = false
    this.waitingForInput = false
    this.isTalking       = false
    this.mouthFrame      = 0
    this.typingTimer     = null
    this.mouthTimer      = null
    this.blinkTimer      = null

    this.drawBackground()
    this.drawDialogBox()
    this.drawBackButton()
    this.createNarrator()
    this.createHistImageLayer()
    this.createTextObjects()
    this.createContinueIndicator()
    this.setupInput()

    // Arrancar primer bloque
    this.loadBlock(0)
  }

  // =====================================================
  // FONDO
  // =====================================================

  drawBackground() {
    if (this.textures.exists('bg-history') &&
        this.textures.get('bg-history').key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-history')
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics()
        .fillStyle(0x0a0800, 1)
        .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    this.add.graphics()
      .fillStyle(0x3d1800, 0.48)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // =====================================================
  // CUADRO DE DIÁLOGO estilo RPG (parte inferior)
  // =====================================================

  drawDialogBox() {
    const g = this.add.graphics().setDepth(2)

    // Sombra
    g.fillStyle(0x000000, 0.55)
    g.fillRect(DLG_X + 4, DLG_Y + 4, DLG_W, DLG_H)

    // Fondo semi-transparente — se ve un poco el fondo a través del cuadro
    g.fillStyle(DLG_DARK, 0.78)
    g.fillRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    // Borde dorado exterior
    g.lineStyle(3, AMBER, 1)
    g.strokeRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    // Borde interior sutil
    g.lineStyle(1, AMBER, 0.18)
    g.strokeRect(DLG_X + 4, DLG_Y + 4, DLG_W - 8, DLG_H - 8)

    // Zona retrato del narrador — un poco más opaca para leer bien la cara
    g.fillStyle(DLG_FACE, 0.88)
    g.fillRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)
    g.lineStyle(2, AMBER, 0.45)
    g.strokeRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)

    // Separador vertical retrato | texto
    g.lineStyle(2, AMBER, 0.6)
    g.lineBetween(DLG_X + FACE_W + 1, DLG_Y + 6, DLG_X + FACE_W + 1, DLG_Y + DLG_H - 6)

    // Banda del título del bloque
    g.fillStyle(AMBER, 0.07)
    g.fillRect(DLG_X + FACE_W + 2, DLG_Y, DLG_W - FACE_W - 2, TITLE_H + 6)

    // Separador bajo el título
    g.lineStyle(1, AMBER, 0.35)
    g.lineBetween(DLG_X + FACE_W + 12, DLG_Y + TITLE_H + 6, DLG_X + DLG_W - 12, DLG_Y + TITLE_H + 6)

    // Esquinas retro
    const cLen = 11
    const corners = [
      [DLG_X + 2,         DLG_Y + 2,          1,  1],
      [DLG_X + DLG_W - 2, DLG_Y + 2,         -1,  1],
      [DLG_X + 2,         DLG_Y + DLG_H - 2,  1, -1],
      [DLG_X + DLG_W - 2, DLG_Y + DLG_H - 2, -1, -1],
    ]
    g.lineStyle(2, AMBER, 0.9)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  // =====================================================
  // BOTÓN VOLVER (esquina superior izquierda)
  // =====================================================

  drawBackButton() {
    const btnW = 118
    const btnH = 28
    const btnX = 12
    const btnY = 12

    const g = this.add.graphics().setDepth(5)

    const drawNormal = () => {
      g.clear()
      g.fillStyle(DLG_DARK, 0.9)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(1, AMBER, 0.6)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    const drawHover = () => {
      g.clear()
      g.fillStyle(0x3d1800, 0.95)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, AMBER, 1)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    drawNormal()

    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '◀ MENÚ', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '16px',
      color: '#d4a520',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6)

    g.setInteractive(new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    g.on('pointerover', drawHover)
    g.on('pointerout', drawNormal)
    g.on('pointerdown', () => {
      this.stopAllTimers()
      this.scene.start(SCENES.MENU)
    })
  }

  // =====================================================
  // NARRADOR — retrato con animación de boca y parpadeo
  // =====================================================

  createNarrator() {
    const faceCX = DLG_X + Math.round(FACE_W / 2)
    const faceCY = DLG_Y + Math.round(DLG_H / 2)

    if (this.textures.exists('narrator') &&
        this.textures.get('narrator').key !== '__MISSING') {
      this.narratorImg = this.add.image(faceCX, faceCY, 'narrator')
        .setDisplaySize(NARR_SIZE, NARR_SIZE)
        .setOrigin(0.5)
        .setDepth(3)
    } else {
      // Placeholder — cara pixel art básica hasta que exista narrator.png
      this.narratorImg = this.drawNarratorPlaceholder(faceCX, faceCY)
    }

    this.scheduleNextBlink()
  }

  drawNarratorPlaceholder(cx, cy) {
    const g = this.add.graphics().setDepth(3)
    const s  = NARR_SIZE
    const x  = cx - s / 2
    const y  = cy - s / 2
    g.fillStyle(0x2a1400, 1)
    g.fillRect(x, y, s, s)
    g.lineStyle(1, AMBER, 0.4)
    g.strokeRect(x, y, s, s)
    // Cara
    g.fillStyle(0xd4926a, 1)
    g.fillRect(x + s * 0.2, y + s * 0.15, s * 0.6, s * 0.7)
    // Ojos
    g.fillStyle(0x1a0a00, 1)
    g.fillRect(x + s * 0.3, y + s * 0.32, s * 0.12, s * 0.1)
    g.fillRect(x + s * 0.58, y + s * 0.32, s * 0.12, s * 0.1)
    // Boca
    g.fillRect(x + s * 0.35, y + s * 0.62, s * 0.3, s * 0.06)
    return g  // Graphics no tiene setTexture → applyFrame lo detecta y no actúa
  }

  // ---- Boca ----

  startTalking() {
    this.isTalking  = true
    this.mouthFrame = 0
    this.scheduleMouthFrame()
  }

  stopTalking() {
    this.isTalking = false
    if (this.mouthTimer) { this.mouthTimer.remove(); this.mouthTimer = null }
    this.applyFrame('narrator')
  }

  scheduleMouthFrame() {
    if (!this.isTalking) return
    const frame = MOUTH_CYCLE[this.mouthFrame % MOUTH_CYCLE.length]
    this.applyFrame(frame.key)
    this.mouthTimer = this.time.delayedCall(frame.duration, () => {
      this.mouthFrame++
      this.scheduleMouthFrame()
    })
  }

  // ---- Parpadeo ----

  scheduleNextBlink() {
    const delay = Phaser.Math.Between(BLINK_MIN, BLINK_MAX)
    this.blinkTimer = this.time.delayedCall(delay, () => {
      this.applyFrame('narrator-eyes')
      this.time.delayedCall(BLINK_DUR, () => {
        if (!this.isTalking) this.applyFrame('narrator')
        this.scheduleNextBlink()
      })
    })
  }

  // ---- Aplicar frame (seguro para Graphics y para texturas no cargadas) ----

  applyFrame(key) {
    if (!this.narratorImg || typeof this.narratorImg.setTexture !== 'function') return
    const tex = (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING')
      ? key
      : (this.textures.exists('narrator') ? 'narrator' : null)
    if (tex) this.narratorImg.setTexture(tex)
  }

  // =====================================================
  // IMAGEN HISTÓRICA (encima del diálogo)
  // =====================================================

  createHistImageLayer() {
    this.histImg           = null
    this.histImgPlaceholder = this.add.graphics().setDepth(1)
    this.histImgLabel       = this.add.text(IMG_CX, IMG_CY, '', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '22px',
      color: '#7a6030',
      align: 'center',
    }).setOrigin(0.5).setDepth(2).setVisible(false)
  }

  updateHistImage() {
    const block = BLOCKS[this.blockIdx]
    const key   = block.image

    // Desvanecer imagen anterior
    if (this.histImg) {
      const old = this.histImg
      this.histImg = null
      this.tweens.add({
        targets: old, alpha: 0, duration: 200,
        onComplete: () => { old.destroy() },
      })
    }
    this.histImgPlaceholder.clear()
    this.histImgLabel.setVisible(false)

    if (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') {
      this.histImg = this.add.image(IMG_CX, IMG_CY, key).setDepth(1).setAlpha(0)
      const scaleX = IMG_MAX_W / this.histImg.width
      const scaleY = IMG_MAX_H / this.histImg.height
      this.histImg.setScale(Math.min(scaleX, scaleY))
      this.tweens.add({ targets: this.histImg, alpha: 1, duration: 350 })
    } else {
      // Placeholder hasta que se creen las imágenes históricas
      const pw = 460; const ph = 280
      const px = IMG_CX - pw / 2; const py = IMG_CY - ph / 2
      this.histImgPlaceholder.fillStyle(0x1a0a00, 0.65)
      this.histImgPlaceholder.fillRect(px, py, pw, ph)
      this.histImgPlaceholder.lineStyle(2, AMBER, 0.35)
      this.histImgPlaceholder.strokeRect(px, py, pw, ph)
      this.histImgLabel.setText(`[ ${block.title} ]`).setVisible(true)
    }
  }

  // =====================================================
  // TÍTULO DEL BLOQUE Y TEXTO DEL DIÁLOGO
  // =====================================================

  createTextObjects() {
    // Título del bloque — primera línea del cuadro de texto
    this.blockTitleObj = this.add.text(
      DLG_X + FACE_W + 16,
      DLG_Y + Math.round(TITLE_H / 2) + 3,
      '',
      {
        fontFamily: '"Jersey 10", cursive',
        fontSize: '22px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0, 0.5).setDepth(4)

    // Texto de diálogo
    this.dialogText = this.add.text(TEXT_X, TEXT_Y, '', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '34px',
      color: '#f0d99a',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: TEXT_W },
      lineSpacing: 4,
    }).setDepth(4)
  }

  // =====================================================
  // INDICADOR DE CONTINUAR (▼) — parpadeo en esquina
  // =====================================================

  createContinueIndicator() {
    const x = DLG_X + DLG_W - 20
    const y = DLG_Y + DLG_H - 14

    this.continueInd = this.add.text(x, y, '▼', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(5).setVisible(false)

    // El tween anima alpha, setVisible(true/false) controla si se ve
    this.tweens.add({
      targets: this.continueInd,
      alpha: { from: 1, to: 0.15 },
      duration: 480,
      yoyo: true,
      repeat: -1,
    })
  }

  setContinueVisible(v) {
    this.continueInd.setVisible(v)
  }

  // =====================================================
  // SISTEMA DE BLOQUES Y PÁGINAS
  // =====================================================

  loadBlock(idx) {
    this.blockIdx = idx
    this.pageIdx  = 0
    this.updateHistImage()
    this.blockTitleObj.setText(BLOCKS[idx].title)
    this.startPage()
  }

  startPage() {
    const text = BLOCKS[this.blockIdx].pages[this.pageIdx]

    this.fullPageText    = text
    this.charIdx         = 0
    this.isTyping        = true
    this.waitingForInput = false

    this.dialogText.setText('')
    this.setContinueVisible(false)
    this.startTalking()

    this.typingTimer = this.time.addEvent({
      delay: CHAR_DELAY,
      loop: true,
      callback: this.typeNextChar,
      callbackScope: this,
    })
  }

  typeNextChar() {
    // Guarda: evita llamadas obsoletas del timer tras haber parado el typing
    if (!this.isTyping) return
    if (this.charIdx < this.fullPageText.length) {
      this.charIdx++
      this.dialogText.setText(this.fullPageText.substring(0, this.charIdx))
    } else {
      this.onPageComplete()
    }
  }

  onPageComplete() {
    // Null-safe: puede llamarse desde advanceDialog() con timer ya destruido
    if (this.typingTimer) { this.typingTimer.destroy(); this.typingTimer = null }
    this.isTyping = false
    this.stopTalking()

    const block     = BLOCKS[this.blockIdx]
    const lastPage  = this.pageIdx >= block.pages.length - 1
    const lastBlock = this.blockIdx >= BLOCKS.length - 1

    if (lastPage && lastBlock) {
      this.onHistoryEnd()
    } else {
      this.waitingForInput = true
      this.setContinueVisible(true)
    }
  }

  advanceDialog() {
    if (this.isTyping) {
      // Saltar al final: desactivar isTyping PRIMERO para que typeNextChar no reintente
      this.isTyping = false
      if (this.typingTimer) { this.typingTimer.destroy(); this.typingTimer = null }
      this.dialogText.setText(this.fullPageText)
      this.onPageComplete()
      return
    }

    if (!this.waitingForInput) return

    this.waitingForInput = false
    this.setContinueVisible(false)

    const block = BLOCKS[this.blockIdx]

    if (this.pageIdx < block.pages.length - 1) {
      this.pageIdx++
      this.startPage()
    } else {
      this.loadBlock(this.blockIdx + 1)
    }
  }

  onHistoryEnd() {
    this.dialogText.setText('¡Eso es todo, valiente! ¡A por el palo!')
    this.setContinueVisible(false)
    this.drawPlayButton()
  }

  drawPlayButton() {
    const btnW = 180
    const btnH = 36
    const btnX = DLG_X + DLG_W - btnW - 14
    const btnY = DLG_Y + DLG_H - btnH - 10

    const g = this.add.graphics().setDepth(5)
    const normal = () => {
      g.clear()
      g.fillStyle(0x0e2600, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, 0x44dd44, 0.85)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    const hover = () => {
      g.clear()
      g.fillStyle(0x1a4a00, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, 0x66ff66, 1)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    normal()

    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '¡A JUGAR! ▶', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '20px',
      color: '#88ff88',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6)

    g.setInteractive(new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    g.on('pointerover', hover)
    g.on('pointerout', normal)
    g.on('pointerdown', () => {
      this.stopAllTimers()
      this.scene.start(SCENES.CHARACTER_SELECT)
    })
  }

  // =====================================================
  // LIMPIEZA DE TIMERS
  // =====================================================

  stopAllTimers() {
    this.isTalking       = false
    this.isTyping        = false
    this.waitingForInput = false
    if (this.typingTimer) { this.typingTimer.destroy(); this.typingTimer = null }
    if (this.mouthTimer)  { this.mouthTimer.remove();  this.mouthTimer  = null }
    if (this.blinkTimer)  { this.blinkTimer.remove();  this.blinkTimer  = null }
  }

  // =====================================================
  // INPUT
  // =====================================================

  setupInput() {
    // Click/tap en la zona del diálogo → avanzar
    // Usamos input a nivel de escena + comprobación de coordenada Y
    // para evitar conflictos con Graphics interactivos
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= DLG_Y) this.advanceDialog()
    })

    this.input.keyboard.on('keydown-SPACE', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ENTER', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ESC', () => {
      this.stopAllTimers()
      this.scene.start(SCENES.MENU)
    })
  }
}
