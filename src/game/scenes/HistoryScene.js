import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

// ============================================================
// TEXTO DE LA HISTORIA — editar aquí para actualizar el contenido
// ============================================================
const HISTORIA_TEXTO = `¡Escúchame bien, valiente, que te lo voy a contar como si estuviéramos sentados con una "fresquita" en la calle Betis viendo caer la tarde!

Para entender este juego, tienes que entender que Triana no es un barrio, es una religión. Y su fiesta mayor, la Velá, es el momento en que el corazón de Sevilla cruza el puente y se queda a vivir en la otra orilla.

——— El Milagro del Sabio ———

Todo este jaleo lo empezó Alfonso X, el que llamaban el Sabio. El pobre hombre tenía los ojos que no veía ni tres en un burro por una enfermedad "malaje". Se encomendó a la Señora Santa Ana, la abuela de todos los trianeros, y ¡catapum!, sanó por arte de magia. En agradecimiento, mandó levantar esa joya que es la Parroquia de Santa Ana en 1266. Los vecinos empezaron a ir allí a "velar" a la Santa, y de ese "ir de velada" nos queda el nombre de nuestra fiesta.

——— La Picaresca se echa al río ———

Pero claro, en Triana el espíritu es inquieto. La gente rezaba, sí, pero luego el cuerpo pedía alegría. La fiesta bajó del altar a la orilla del Guadalquivir. Lo que eran rezos se convirtieron en cantes, en avellanas verdes —que se comen por arrobas— y en el olor a sardina asada que te quita el sentido. La Velá pasó de ser un rito de iglesia a ser la feria del pueblo, donde el río es el que manda.

——— La Leyenda de la Cucaña ———

Y aquí llegamos a lo que te interesa: la Cucaña. Dicen los antiguos que esto viene de los marineros y calafates que vivían en el barrio. Para demostrar quién tenía más "age" y más equilibrio, ponían un palo en la proa de los barcos que venían de las Indias.

La leyenda cuenta que no solo era por el premio, sino por el honor. Un palo largo, embadurnado de jabón de Triana —¡que resbala más que una anguila en una bañera!—, y al final, el trofeo: una banderita que te corona como el rey del río. Si llegas, eres un héroe; si te caes —que te vas a caer—, el chapuzón en el Guadalquivir te bautiza como trianero de pura cepa.

——— Tu Misión ———

Ahora te toca a ti, artista. Vas a subirte a ese palo con el puente de Triana de fondo y la Giralda mirándote de reojo. Ten cuidado, que el jabón no tiene amigos y el río está esperando.

¡Échale coraje, aprieta los dientes y no te olvides de la gracia, que en Triana hasta para caerse hay que tener arte!`

// ============================================================
// Layout
// ============================================================
const PANEL_W = 880
const PANEL_H = 590
const PANEL_X = Math.round((GAME_WIDTH - PANEL_W) / 2)   // 72
const PANEL_Y = Math.round((GAME_HEIGHT - PANEL_H) / 2)  // 89

const PADDING = 48
const TEXT_W = PANEL_W - PADDING * 2                     // 784

const TITLE_H = 76
const FOOTER_H = 56

const TEXT_AREA_TOP = PANEL_Y + TITLE_H                  // 165
const TEXT_AREA_BOTTOM = PANEL_Y + PANEL_H - FOOTER_H    // 623
const TEXT_AREA_H = TEXT_AREA_BOTTOM - TEXT_AREA_TOP      // 458

const CHAR_DELAY = 22  // ms por carácter (~45 chars/seg)

// Paleta pergamino
const AMBER = 0xd4a520
const DARK_PARCHMENT = 0x1a0d00

export class HistoryScene extends Scene {

  constructor() {
    super(SCENES.HISTORY)
  }

  create() {
    this.fullText = HISTORIA_TEXTO
    this.charIndex = 0
    this.typing = true
    this.done = false

    this.drawBackground()
    this.drawPanel()
    this.drawTitle()
    this.createTextArea()
    this.drawFooter()
    this.startTypewriter()
    this.setupInput()
  }

  // ========================================
  // FONDO — imagen de historia + overlay sepia
  // ========================================

  drawBackground() {
    if (this.textures.exists('bg-history') &&
        this.textures.get('bg-history').key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-history')
      const scaleX = GAME_WIDTH / bg.width
      const scaleY = GAME_HEIGHT / bg.height
      bg.setScale(Math.max(scaleX, scaleY))
    } else {
      // Fallback hasta que la imagen esté disponible
      this.add.graphics()
        .fillStyle(0x0a0800, 1)
        .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    // Overlay cálido sepia
    this.add.graphics()
      .fillStyle(0x3d1800, 0.58)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ========================================
  // PANEL — marco estilo pergamino
  // ========================================

  drawPanel() {
    const g = this.add.graphics()

    // Sombra
    g.fillStyle(0x000000, 0.45)
    g.fillRect(PANEL_X + 7, PANEL_Y + 7, PANEL_W, PANEL_H)

    // Fondo oscuro cálido
    g.fillStyle(DARK_PARCHMENT, 0.94)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    // Borde ámbar dorado
    g.lineStyle(3, AMBER, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    // Borde interior sutil
    g.lineStyle(1, AMBER, 0.25)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    // Franja del título
    g.fillStyle(AMBER, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, TITLE_H)

    // Separador bajo el título
    g.lineStyle(1, AMBER, 0.55)
    g.lineBetween(PANEL_X + PADDING, PANEL_Y + TITLE_H, PANEL_X + PANEL_W - PADDING, PANEL_Y + TITLE_H)

    // Separador sobre el footer
    g.lineStyle(1, AMBER, 0.3)
    g.lineBetween(PANEL_X + PADDING, TEXT_AREA_BOTTOM, PANEL_X + PANEL_W - PADDING, TEXT_AREA_BOTTOM)

    // Esquinas decorativas retro
    const cLen = 16
    const l = PANEL_X + 8
    const r = PANEL_X + PANEL_W - 8
    const t = PANEL_Y + 8
    const b = PANEL_Y + PANEL_H - 8
    g.lineStyle(2, AMBER, 0.85)
    g.lineBetween(l, t, l + cLen, t); g.lineBetween(l, t, l, t + cLen)
    g.lineBetween(r, t, r - cLen, t); g.lineBetween(r, t, r, t + cLen)
    g.lineBetween(l, b, l + cLen, b); g.lineBetween(l, b, l, b - cLen)
    g.lineBetween(r, b, r - cLen, b); g.lineBetween(r, b, r, b - cLen)

    // Rombos decorativos en esquinas interiores
    const cx = GAME_WIDTH / 2
    const rhombG = this.add.graphics()
    rhombG.fillStyle(AMBER, 0.6)
    ;[PANEL_X + PADDING / 2, PANEL_X + PANEL_W - PADDING / 2].forEach(x => {
      rhombG.fillRect(x - 4, PANEL_Y + TITLE_H - 4, 8, 8)
    })
    rhombG.fillRect(cx - 4, PANEL_Y + TITLE_H - 4, 8, 8)
  }

  // ========================================
  // TÍTULO
  // ========================================

  drawTitle() {
    const cx = GAME_WIDTH / 2
    const titleY = PANEL_Y + TITLE_H / 2

    this.add.text(cx - 210, titleY, '✦', {
      fontFamily: 'monospace', fontSize: '13px', color: '#d4a520',
    }).setOrigin(0.5)

    this.add.text(cx + 210, titleY, '✦', {
      fontFamily: 'monospace', fontSize: '13px', color: '#d4a520',
    }).setOrigin(0.5)

    this.add.text(cx, titleY, 'La Velá de Santa Ana', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '42px',
      color: '#d4a520',
      stroke: '#000000',
      strokeThickness: 5,
      letterSpacing: 2,
    }).setOrigin(0.5)
  }

  // ========================================
  // ÁREA DE TEXTO — máscara + scroll automático
  // ========================================

  createTextArea() {
    // Máscara que recorta el texto al área visible del panel
    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(PANEL_X + PADDING - 6, TEXT_AREA_TOP + 6, TEXT_W + 12, TEXT_AREA_H - 12)

    // Contenedor desplazable (su y cambia al hacer scroll)
    this.textContainer = this.add.container(PANEL_X + PADDING, TEXT_AREA_TOP + 12)
    this.textContainer.setMask(maskShape.createGeometryMask())

    // Objeto de texto (empieza vacío, crece con el efecto máquina de escribir)
    this.textObj = this.add.text(0, 0, '', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#f0d99a',
      wordWrap: { width: TEXT_W },
      lineSpacing: 5,
    })
    this.textContainer.add(this.textObj)
  }

  // ========================================
  // FOOTER — botones SALTAR / VOLVER AL MENÚ
  // ========================================

  drawFooter() {
    const btnH = 34
    const btnY = TEXT_AREA_BOTTOM + Math.round((FOOTER_H - btnH) / 2)

    // Botón VOLVER AL MENÚ (izquierda)
    this.makeButton(
      PANEL_X + PADDING, btnY, 210, btnH,
      '◀  VOLVER AL MENÚ',
      () => this.goBack(),
    )

    // Botón SALTAR (derecha, se transforma al terminar)
    const skipX = PANEL_X + PANEL_W - PADDING - 150
    const skipG = this.add.graphics()
    const drawSkipNormal = () => {
      skipG.clear()
      skipG.fillStyle(0x2a1800, 1)
      skipG.fillRect(skipX, btnY, 150, btnH)
      skipG.lineStyle(1, AMBER, 0.4)
      skipG.strokeRect(skipX, btnY, 150, btnH)
    }
    const drawSkipHover = () => {
      skipG.clear()
      skipG.fillStyle(0x4a2c00, 1)
      skipG.fillRect(skipX, btnY, 150, btnH)
      skipG.lineStyle(1, AMBER, 0.85)
      skipG.strokeRect(skipX, btnY, 150, btnH)
    }
    drawSkipNormal()

    this.skipLabel = this.add.text(skipX + 75, btnY + btnH / 2, 'SALTAR  ▶▶', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a08040',
    }).setOrigin(0.5)

    skipG.setInteractive(
      new Phaser.Geom.Rectangle(skipX, btnY, 150, btnH),
      Phaser.Geom.Rectangle.Contains,
    )
    skipG.on('pointerover', drawSkipHover)
    skipG.on('pointerout', drawSkipNormal)
    skipG.on('pointerdown', () => this.skipToEnd())

    this.skipG = skipG
  }

  makeButton(x, y, w, h, label, onPress) {
    const g = this.add.graphics()
    const drawNormal = () => {
      g.clear()
      g.fillStyle(0x2a1800, 1)
      g.fillRect(x, y, w, h)
      g.lineStyle(2, AMBER, 0.8)
      g.strokeRect(x, y, w, h)
      g.lineStyle(1, AMBER, 0.2)
      g.strokeRect(x + 3, y + 3, w - 6, h - 6)
    }
    const drawHover = () => {
      g.clear()
      g.fillStyle(0x5a3000, 1)
      g.fillRect(x, y, w, h)
      g.lineStyle(2, AMBER, 1)
      g.strokeRect(x, y, w, h)
    }
    drawNormal()
    this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'monospace', fontSize: '12px', color: '#d4a520',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)
    g.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains)
    g.on('pointerover', drawHover)
    g.on('pointerout', drawNormal)
    g.on('pointerdown', onPress)
  }

  // ========================================
  // MÁQUINA DE ESCRIBIR
  // ========================================

  startTypewriter() {
    this.typingTimer = this.time.addEvent({
      delay: CHAR_DELAY,
      loop: true,
      callback: this.typeNextChar,
      callbackScope: this,
    })
  }

  typeNextChar() {
    if (this.charIndex < this.fullText.length) {
      this.charIndex++
      this.textObj.setText(this.fullText.substring(0, this.charIndex))
      this.scrollToLatest()
    } else {
      this.typingTimer.destroy()
      this.typing = false
      this.done = true
      this.onTypingDone()
    }
  }

  // Mantiene visible el texto más reciente (scroll automático hacia abajo)
  scrollToLatest() {
    const normalY = TEXT_AREA_TOP + 12
    const scrolledY = TEXT_AREA_BOTTOM - 12 - this.textObj.height
    this.textContainer.y = Math.min(normalY, scrolledY)
  }

  skipToEnd() {
    if (!this.typing) return
    this.typingTimer.destroy()
    this.typing = false
    this.charIndex = this.fullText.length
    this.textObj.setText(this.fullText)
    this.scrollToLatest()
    this.done = true
    this.onTypingDone()
  }

  onTypingDone() {
    // Transformar el botón SALTAR → indicador de "fin"
    if (this.skipLabel) this.skipLabel.setText('FIN  ✓').setColor('#d4a520')
    if (this.skipG) this.skipG.removeAllListeners()
  }

  goBack() {
    if (this.typing) this.typingTimer.destroy()
    this.scene.start(SCENES.MENU)
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.keyboard.on('keydown-ESC', () => this.goBack())
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.typing) this.skipToEnd()
    })
  }
}
