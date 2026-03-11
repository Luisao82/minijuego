import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { Narrator } from '../components/Narrator'
import { makeNavButton } from '../components/NavButton'

// ============================================================
// BLOQUES DE TEXTO — 1 imagen por bloque
// ============================================================
const BLOCKS = [
  {
    title: 'La Velá de Santa Ana',
    image: 'hist-intro',
    pages: [
      '¡Escúchame bien, valiente! Te lo voy a contar como si estuviéramos sentados con una "fresquita" en la calle Betis viendo caer la tarde.',
      'Para entender este juego, tienes que entender que Triana no es un barrio, es una religión. Y su fiesta mayor, la Velá, es el momento en que el corazón de Sevilla cruza el puente y se queda a vivir en la otra orilla.',
    ],
  },
  {
    title: 'El Milagro del Sabio',
    image: 'hist-sabio',
    pages: [
      'Todo este jaleo lo empezó Alfonso X, el que llamaban el Sabio. El pobre hombre tenía los ojos que no veía ni tres en un burro por una enfermedad "malaje".',
      'Se encomendó a la Señora Santa Ana, la abuela de todos los trianeros, y ¡catapum!, sanó por arte de magia.',
      'En agradecimiento, mandó levantar esa joya que es la Parroquia de Santa Ana en 1266. De ese "ir de velada" nos queda el nombre de nuestra fiesta.',
    ],
  },
  {
    title: 'La Picaresca se echa al río',
    image: 'hist-picaresca',
    pages: [
      'Pero claro, en Triana el espíritu es inquieto. La gente rezaba, sí, pero luego el cuerpo pedía alegría. La fiesta bajó del altar a la orilla del Guadalquivir.',
      'Lo que eran rezos se convirtieron en cantes, en avellanas verdes —que se comen por arrobas— y en el olor a sardina asada que te quita el sentido.',
      'La Velá pasó de ser un rito de iglesia a ser la feria del pueblo, donde el río es el que manda.',
    ],
  },
  {
    title: 'La Leyenda de la Cucaña',
    image: 'hist-leyenda',
    pages: [
      'Y aquí llegamos a lo que te interesa: la Cucaña. Dicen los antiguos que esto viene de los marineros y calafates que vivían en el barrio.',
      'Para demostrar quién tenía más "age" y más equilibrio, ponían un palo en la proa de los barcos que venían de las Indias.',
      'Un palo largo, embadurnado de jabón de Triana —¡que resbala más que una anguila en una bañera!— y al final, el trofeo: una banderita que te corona como el rey del río.',
      'Si llegas, eres un héroe; si te caes —que te vas a caer—, el chapuzón en el Guadalquivir te bautiza como trianero de pura cepa.',
    ],
  },
  {
    title: 'Tu Misión',
    image: 'hist-mision',
    pages: [
      'Ahora te toca a ti, artista. Vas a subirte a ese palo con el puente de Triana de fondo y la Giralda mirándote de reojo.\nTen cuidado, que el jabón no tiene amigos y el río está esperando.',
      '¡Échale coraje, aprieta los dientes y no te olvides de la gracia, que en Triana hasta para caerse hay que tener arte!',
    ],
  },
]

// ============================================================
// LAYOUT
// ============================================================
const DLG_M    = 16
const DLG_H    = 256
const DLG_X    = DLG_M
const DLG_Y    = GAME_HEIGHT - DLG_H - DLG_M
const DLG_W    = GAME_WIDTH  - DLG_M * 2

const FACE_W    = 160
const NARR_SIZE = 150

const TITLE_H  = 26
const TEXT_X   = DLG_X + FACE_W + 14
const TEXT_Y   = DLG_Y + TITLE_H + 16
const TEXT_W   = DLG_W - FACE_W - 26

const IMG_CX       = GAME_WIDTH / 2
const IMG_AREA_TOP = 30
const IMG_AREA_BTM = DLG_Y - 16
const IMG_CY       = Math.round((IMG_AREA_TOP + IMG_AREA_BTM) / 2)
const IMG_MAX_W    = 840
const IMG_MAX_H    = IMG_AREA_BTM - IMG_AREA_TOP

// Máquina de escribir
const CHAR_DELAY = 28

// Configuración del narrador (extraída para fácil sustitución por otro narrador)
const NARRATOR_CONFIG = {
  cx:   DLG_X + Math.round(FACE_W / 2),
  cy:   DLG_Y + Math.round(DLG_H / 2),
  size: NARR_SIZE,
  textures: {
    base:         'narrator',
    eyes:         'narrator-eyes',
    mouthHalfOpen: 'narrator-m-open',
    mouthOpen:    'narrator-open',
  },
  mouthCycle: [
    { key: 'narrator',        duration: 180 },
    { key: 'narrator-m-open', duration: 120 },
    { key: 'narrator-open',   duration:  80 },
    { key: 'narrator-m-open', duration: 120 },
  ],
  blinkMin: 3200,
  blinkMax: 7000,
  blinkDur: 130,
  depth:    3,
}

const AMBER    = 0xd4a520
const DLG_DARK = 0x0d0600
const DLG_FACE = 0x5c3318

export class HistoryScene extends Scene {

  constructor() {
    super(SCENES.HISTORY)
  }

  create() {
    this.blockIdx        = 0
    this.pageIdx         = 0
    this.charIdx         = 0
    this.isTyping        = false
    this.waitingForInput = false
    this.typingTimer     = null

    this.drawBackground()
    this.drawDialogBox()
    this.drawBackButton()
    this.narrator = new Narrator(this, NARRATOR_CONFIG)
    this.createHistImageLayer()
    this.createTextObjects()
    this.createContinueIndicator()
    this.setupInput()

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
  // CUADRO DE DIÁLOGO estilo RPG
  // =====================================================

  drawDialogBox() {
    const g = this.add.graphics().setDepth(2)

    g.fillStyle(0x000000, 0.55)
    g.fillRect(DLG_X + 4, DLG_Y + 4, DLG_W, DLG_H)

    g.fillStyle(DLG_DARK, 0.78)
    g.fillRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    g.lineStyle(3, AMBER, 1)
    g.strokeRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    g.lineStyle(1, AMBER, 0.18)
    g.strokeRect(DLG_X + 4, DLG_Y + 4, DLG_W - 8, DLG_H - 8)

    g.fillStyle(DLG_FACE, 0.88)
    g.fillRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)
    g.lineStyle(2, AMBER, 0.45)
    g.strokeRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)

    g.lineStyle(2, AMBER, 0.6)
    g.lineBetween(DLG_X + FACE_W + 1, DLG_Y + 6, DLG_X + FACE_W + 1, DLG_Y + DLG_H - 6)

    g.fillStyle(AMBER, 0.07)
    g.fillRect(DLG_X + FACE_W + 2, DLG_Y, DLG_W - FACE_W - 2, TITLE_H + 6)

    g.lineStyle(1, AMBER, 0.35)
    g.lineBetween(DLG_X + FACE_W + 12, DLG_Y + TITLE_H + 6, DLG_X + DLG_W - 12, DLG_Y + TITLE_H + 6)

    const cLen    = 11
    const corners = [
      [DLG_X + 2,          DLG_Y + 2,          1,  1],
      [DLG_X + DLG_W - 2,  DLG_Y + 2,         -1,  1],
      [DLG_X + 2,          DLG_Y + DLG_H - 2,  1, -1],
      [DLG_X + DLG_W - 2,  DLG_Y + DLG_H - 2, -1, -1],
    ]
    g.lineStyle(2, AMBER, 0.9)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  // =====================================================
  // BOTÓN VOLVER
  // =====================================================

  drawBackButton() {
    makeNavButton(
      this, 12, 12, 170, 58,
      '◀ MENÚ',
      () => { this.stopAllTimers(); this.scene.start(SCENES.MENU) },
      { depth: 5 },
    )
  }

  // =====================================================
  // IMAGEN HISTÓRICA
  // =====================================================

  createHistImageLayer() {
    this.histImg            = null
    this.histImgPlaceholder = this.add.graphics().setDepth(1)
    this.histImgLabel       = this.add.text(IMG_CX, IMG_CY, '', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '22px',
      color:      '#7a6030',
      align:      'center',
    }).setOrigin(0.5).setDepth(2).setVisible(false)
  }

  updateHistImage() {
    const block = BLOCKS[this.blockIdx]
    const key   = block.image

    if (this.histImg) {
      const old = this.histImg
      this.histImg = null
      this.tweens.add({ targets: old, alpha: 0, duration: 200, onComplete: () => old.destroy() })
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
  // TÍTULO Y TEXTO DEL DIÁLOGO
  // =====================================================

  createTextObjects() {
    this.blockTitleObj = this.add.text(
      DLG_X + FACE_W + 16,
      DLG_Y + Math.round(TITLE_H / 2) + 3,
      '',
      {
        fontFamily: '"Jersey 10", cursive',
        fontSize:   '22px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0, 0.5).setDepth(4)

    this.dialogText = this.add.text(TEXT_X, TEXT_Y, '', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '34px',
      color:      '#f0d99a',
      stroke:     '#000000',
      strokeThickness: 2,
      wordWrap: { width: TEXT_W },
      lineSpacing: 4,
    }).setDepth(4)
  }

  // =====================================================
  // INDICADOR DE CONTINUAR (▼)
  // =====================================================

  createContinueIndicator() {
    const x = DLG_X + DLG_W - 20
    const y = DLG_Y + DLG_H - 14

    this.continueInd = this.add.text(x, y, '▼', {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      '#ffd700',
    }).setOrigin(0.5).setDepth(5).setVisible(false)

    this.tweens.add({
      targets:  this.continueInd,
      alpha:    { from: 1, to: 0.15 },
      duration: 480,
      yoyo:     true,
      repeat:   -1,
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
    const text           = BLOCKS[this.blockIdx].pages[this.pageIdx]
    this.fullPageText    = text
    this.charIdx         = 0
    this.isTyping        = true
    this.waitingForInput = false

    this.dialogText.setText('')
    this.setContinueVisible(false)
    this.narrator.startTalking()

    this.typingTimer = this.time.addEvent({
      delay:         CHAR_DELAY,
      loop:          true,
      callback:      this.typeNextChar,
      callbackScope: this,
    })
  }

  typeNextChar() {
    if (!this.isTyping) return
    if (this.charIdx < this.fullPageText.length) {
      this.charIdx++
      this.dialogText.setText(this.fullPageText.substring(0, this.charIdx))
    } else {
      this.onPageComplete()
    }
  }

  onPageComplete() {
    if (this.typingTimer) { this.typingTimer.destroy(); this.typingTimer = null }
    this.isTyping = false
    this.narrator.stopTalking()

    const block     = BLOCKS[this.blockIdx]
    const lastPage  = this.pageIdx  >= block.pages.length - 1
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
      fontSize:   '20px',
      color:      '#88ff88',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6)

    g.setInteractive(new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains)
    g.on('pointerover',  hover)
    g.on('pointerout',   normal)
    g.on('pointerdown',  () => {
      this.stopAllTimers()
      this.scene.start(SCENES.CHARACTER_SELECT)
    })
  }

  // =====================================================
  // LIMPIEZA
  // =====================================================

  stopAllTimers() {
    this.isTyping        = false
    this.waitingForInput = false
    if (this.typingTimer) { this.typingTimer.destroy(); this.typingTimer = null }
    this.narrator.stopAllTimers()
  }

  // =====================================================
  // INPUT
  // =====================================================

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= DLG_Y) this.advanceDialog()
    })
    this.input.keyboard.on('keydown-SPACE', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ENTER', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ESC',   () => {
      this.stopAllTimers()
      this.scene.start(SCENES.MENU)
    })
  }
}
