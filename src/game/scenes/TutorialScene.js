import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { Narrator } from '../components/Narrator'
import { makeNavButton } from '../components/NavButton'
import { launchEasterEgg } from '../utils/easterEgg'

// ============================================================
// CONTENIDO DEL TUTORIAL — edita aquí títulos y textos
// ============================================================
const BLOCKS = [
  {
    title: '¡Bienvenido a La Cucaña!',
    image: 'tut-01',
    text: '¡Eh, valiente! Soy tu guía en esta aventura. Voy a enseñarte cómo conquistar el palo más famoso del Guadalquivir. ¡Pon atención, que es fácil pero hay trampa!',
  },
  {
    title: 'Fase 1 — El Impulso',
    image: 'tut-02',
    text: 'Para correr por el palo necesitas impulso. Verás una barra que se mueve. Pulsa la pantalla, o cualquier tecla, cuando el indicador llegue a la ZONA VERDE para coger el máximo impulso. ¡Más verde, más lejos llegas!',
  },
  {
    title: 'Las Zonas de la Barra',
    image: 'tut-03',
    text: 'La barra tiene tres zonas: ROJA (poco impulso), AMARILLA (impulso normal) y VERDE (impulso máximo). Si te quedas en rojo, apenas llegarás a la mitad del palo. ¡Apunta al verde!',
  },
  {
    title: 'Fase 2 — El Equilibrio',
    image: 'tut-04',
    text: 'Una vez en el palo, ¡tienes que mantenerte en pie! El palo se mueve solo y tú debes compensar pulsando IZQUIERDA o DERECHA. Si te pasas del límite... ¡al río!',
  },
  {
    title: 'El Salto y la Bandera',
    image: 'tut-05',
    text: '¡Al final del palo está la bandera! Cuando llegues al extremo, pulsa para SALTAR y cogerla. ¡Ese es el momento de gloria! Si no saltas a tiempo, el impulso te llevará al agua.',
  },
  {
    title: '¡Ya lo sabes todo!',
    image: 'tut-06',
    text: 'Recuerda: VERDE en la barra, EQUILIBRIO con cabeza y SALTA al llegar. Cada personaje tiene sus propias estadísticas de velocidad y equilibrio, ¡elige el que más te guste y a por ella!',
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
const IMG_MAX_W    = 860
const IMG_MAX_H    = IMG_AREA_BTM - IMG_AREA_TOP

// Máquina de escribir
const CHAR_DELAY = 28

// Easter egg
const EE_TAP_THRESHOLD  = 12
const EE_TAP_TIMEOUT_MS = 1500

// ============================================================
// PALETA — moderno, azul/cian
// ============================================================
const CYAN     = 0x00ccff
const DLG_DARK = 0x0a1628
const DLG_FACE = 0x0d2040

const NARRATOR_CONFIG = {
  cx:          DLG_X + Math.round(FACE_W / 2),
  cy:          DLG_Y + Math.round(DLG_H / 2),
  size:        NARR_SIZE,
  spritesheet: 'narrator-tutorial',
  mouthCycle: [
    { frame: 0, duration: 180 },
    { frame: 1, duration: 120 },
    { frame: 2, duration:  80 },
    { frame: 1, duration: 120 },
  ],
  blinkMin: 3200,
  blinkMax: 7000,
  blinkDur: 130,
  depth:    3,
}

// ============================================================
// ESCENA
// ============================================================
export class TutorialScene extends Scene {

  constructor() {
    super(SCENES.TUTORIAL)
  }

  create() {
    this.blockIdx        = 0
    this.charIdx         = 0
    this.isTyping        = false
    this.waitingForInput = false
    this.typingTimer     = null
    this.tutImg          = null

    // Easter egg
    this._eeTapCount    = 0
    this._eeLastTapTime = 0
    this._eeTriggered   = false

    this.drawBackground()
    this.drawDialogBox()
    this.drawBackButton()
    this.narrator = new Narrator(this, NARRATOR_CONFIG)
    this.createTextObjects()
    this.createContinueIndicator()
    this.setupInput()

    this.loadBlock(0)
  }

  // =====================================================
  // FONDO — azul moderno, sin sepia
  // =====================================================

  drawBackground() {
    if (this.textures.exists('bg-characters') &&
        this.textures.get('bg-characters').key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-characters')
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics()
        .fillStyle(0x00080f, 1)
        .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    this.add.graphics()
      .fillStyle(0x001a2e, 0.58)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // =====================================================
  // CUADRO DE DIÁLOGO — cian/azul
  // =====================================================

  drawDialogBox() {
    const g = this.add.graphics().setDepth(2)

    g.fillStyle(0x000000, 0.55)
    g.fillRect(DLG_X + 4, DLG_Y + 4, DLG_W, DLG_H)

    g.fillStyle(DLG_DARK, 0.88)
    g.fillRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    g.lineStyle(3, CYAN, 1)
    g.strokeRect(DLG_X, DLG_Y, DLG_W, DLG_H)
    g.lineStyle(1, CYAN, 0.2)
    g.strokeRect(DLG_X + 4, DLG_Y + 4, DLG_W - 8, DLG_H - 8)

    g.fillStyle(DLG_FACE, 0.9)
    g.fillRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)
    g.lineStyle(2, CYAN, 0.45)
    g.strokeRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)

    g.lineStyle(2, CYAN, 0.6)
    g.lineBetween(DLG_X + FACE_W + 1, DLG_Y + 6, DLG_X + FACE_W + 1, DLG_Y + DLG_H - 6)

    g.fillStyle(CYAN, 0.07)
    g.fillRect(DLG_X + FACE_W + 2, DLG_Y, DLG_W - FACE_W - 2, TITLE_H + 6)

    g.lineStyle(1, CYAN, 0.35)
    g.lineBetween(DLG_X + FACE_W + 12, DLG_Y + TITLE_H + 6, DLG_X + DLG_W - 12, DLG_Y + TITLE_H + 6)

    const cLen    = 11
    const corners = [
      [DLG_X + 2,          DLG_Y + 2,          1,  1],
      [DLG_X + DLG_W - 2,  DLG_Y + 2,         -1,  1],
      [DLG_X + 2,          DLG_Y + DLG_H - 2,  1, -1],
      [DLG_X + DLG_W - 2,  DLG_Y + DLG_H - 2, -1, -1],
    ]
    g.lineStyle(2, CYAN, 0.9)
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
  // IMAGEN DEL BLOQUE
  // =====================================================

  updateTutImage() {
    const key = BLOCKS[this.blockIdx].image

    if (this.tutImg) {
      const old = this.tutImg
      this.tutImg = null
      this.tweens.add({ targets: old, alpha: 0, duration: 200, onComplete: () => old.destroy() })
    }

    if (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') {
      this.tutImg = this.add.image(IMG_CX, IMG_CY, key).setDepth(1).setAlpha(0)
      const scaleX = IMG_MAX_W / this.tutImg.width
      const scaleY = IMG_MAX_H / this.tutImg.height
      this.tutImg.setScale(Math.min(scaleX, scaleY))
      this.tweens.add({ targets: this.tutImg, alpha: 1, duration: 350 })
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
        color:      '#00ccff',
        stroke:     '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0, 0.5).setDepth(4)

    this.dialogText = this.add.text(TEXT_X, TEXT_Y, '', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '34px',
      color:      '#e8f4ff',
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
      color:      '#00ccff',
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
  // SISTEMA DE BLOQUES
  // =====================================================

  loadBlock(idx) {
    this.blockIdx = idx
    this.blockTitleObj.setText(BLOCKS[idx].title)
    this.updateTutImage()
    this.startPage()
  }

  startPage() {
    const text           = BLOCKS[this.blockIdx].text
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

    if (this.blockIdx >= BLOCKS.length - 1) {
      this.onTutorialEnd()
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
    this.loadBlock(this.blockIdx + 1)
  }

  onTutorialEnd() {
    this.setContinueVisible(false)
    this.drawPlayButton()
    this._activateEasterEgg()
  }

  drawPlayButton() {
    const btnW = 180
    const btnH = 36
    const btnX = DLG_X + DLG_W - btnW - 14
    const btnY = DLG_Y + DLG_H - btnH - 10

    const g = this.add.graphics().setDepth(5)
    const normal = () => {
      g.clear()
      g.fillStyle(0x002a3f, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, CYAN, 0.85)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    const hover = () => {
      g.clear()
      g.fillStyle(0x004466, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, 0x66eeff, 1)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }
    normal()

    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '¡A JUGAR! ▶', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '20px',
      color:      '#00ddff',
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
  // EASTER EGG
  // =====================================================

  _activateEasterEgg() {
    const img = this.narrator.getImage()
    if (!img || typeof img.setInteractive !== 'function') return

    img.setInteractive({ useHandCursor: false })
    img.on('pointerdown', () => this._onEasterEggTap())

    this._eeBaseX = img.x
    this._eeBaseY = img.y
  }

  _onEasterEggTap() {
    if (this._eeTriggered) return

    const now = Date.now()

    if (this._eeTapCount > 0 && (now - this._eeLastTapTime) > EE_TAP_TIMEOUT_MS) {
      this._eeTapCount = 0
      this._resetNarratorVisuals()
    }

    this._eeTapCount++
    this._eeLastTapTime = now

    this._updateEasterEggHints()

    if (this._eeTapCount >= EE_TAP_THRESHOLD) {
      this._eeTriggered = true
      this._triggerEasterEgg()
    }
  }

  _updateEasterEggHints() {
    const img = this.narrator.getImage()
    if (!img) return

    const count = this._eeTapCount

    if (count === 4) {
      this.tweens.add({
        targets: img, x: this._eeBaseX + 3,
        duration: 50, yoyo: true, repeat: 3,
        onComplete: () => { img.x = this._eeBaseX },
      })
    }

    if (count === 8) {
      this.tweens.add({
        targets: img, x: this._eeBaseX + 5,
        duration: 40, yoyo: true, repeat: 5,
        onComplete: () => { img.x = this._eeBaseX },
      })
      if (typeof img.setTint === 'function') img.setTint(0xffddaa)
    }

    if (count === 11) {
      this.tweens.add({
        targets: img,
        x: this._eeBaseX + 7, y: this._eeBaseY - 2,
        duration: 30, yoyo: true, repeat: 7,
        onComplete: () => { img.x = this._eeBaseX; img.y = this._eeBaseY },
      })
      if (typeof img.setTint === 'function') img.setTint(0xff8866)
      this.dialogText.setText('¡Eh, para, para! ¿Qué haces?')
    }

    if (count > 0 && count < EE_TAP_THRESHOLD) {
      const origSX = img.scaleX
      const origSY = img.scaleY
      this.tweens.add({
        targets: img,
        scaleX: origSX * 1.05, scaleY: origSY * 1.05,
        duration: 60, yoyo: true,
      })
    }
  }

  _resetNarratorVisuals() {
    const img = this.narrator.getImage()
    if (!img) return
    if (typeof img.clearTint === 'function') img.clearTint()
    img.x = this._eeBaseX
    img.y = this._eeBaseY
  }

  _triggerEasterEgg() {
    this.stopAllTimers()

    const flash = this.add.graphics().setDepth(100)
    flash.fillStyle(0xffffff, 0.9)
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.tweens.add({
      targets: flash, alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    })

    this.time.delayedCall(700, () => {
      launchEasterEgg(this, 'developer')
    })
  }

  // =====================================================
  // LIMPIEZA
  // =====================================================

  stopAllTimers() {
    this.isTyping        = false
    this.waitingForInput = false
    this._eeTriggered    = true
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
