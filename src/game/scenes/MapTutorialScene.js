import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { headingStyle, mutedStyle } from '../config/textStyles'
import { Narrator } from '../components/Narrator'
import { makeNavButton } from '../components/NavButton'
import { mapService } from '../services/MapService'
import { MAP_TUTORIAL_BLOCKS } from '../config/mapTutorialContent'

// Sigue el mismo layout visual que TutorialScene (narrador + diálogo cian)
// pero adaptado al reto del mapa: al terminar el último bloque, en lugar
// de "¡A JUGAR!", ofrece la elección de modo (GPS / METROS). La selección
// guarda `unlockMode` y `mapTutorialSeen` en MapService y devuelve a
// MapScene.

// ── Layout ─────────────────────────────────────────────────────
const DLG_M = 16
const DLG_H = 256
const DLG_X = DLG_M
const DLG_Y = GAME_HEIGHT - DLG_H - DLG_M
const DLG_W = GAME_WIDTH - DLG_M * 2

const FACE_W = 160
const NARR_SIZE = 150

const TITLE_H = 26
const TEXT_X = DLG_X + FACE_W + 14
const TEXT_Y = DLG_Y + TITLE_H + 16
const TEXT_W = DLG_W - FACE_W - 26

const IMG_CX = GAME_WIDTH / 2
const IMG_AREA_TOP = 30
const IMG_AREA_BTM = DLG_Y - 16
const IMG_CY = Math.round((IMG_AREA_TOP + IMG_AREA_BTM) / 2)
const IMG_MAX_W = 860
const IMG_MAX_H = IMG_AREA_BTM - IMG_AREA_TOP

const CHAR_DELAY = 28

// ── Paleta (misma que TutorialScene) ───────────────────────────
const CYAN = 0x00ccff
const DLG_DARK = 0x0a1628
const DLG_FACE = 0x0d2040

const NARRATOR_CONFIG = {
  cx: DLG_X + Math.round(FACE_W / 2),
  cy: DLG_Y + Math.round(DLG_H / 2),
  size: NARR_SIZE,
  spritesheet: 'narrator-tutorial',
  mouthCycle: [
    { frame: 0, duration: 90 },
    { frame: 1, duration: 75 },
    { frame: 2, duration: 55 },
    { frame: 1, duration: 75 },
  ],
  blinkMin: 3200,
  blinkMax: 7000,
  blinkDur: 130,
  depth: 3,
  talkSoundKey: 'sfx-talk',
  talkSoundVol: 0.22,
}

export class MapTutorialScene extends BaseScene {
  constructor() {
    super(SCENES.MAP_TUTORIAL)
  }

  init(data) {
    super.init(data)
    this.characterData = data?.character || null
  }

  create() {
    this.blockIdx = 0
    this.charIdx = 0
    this.isTyping = false
    this.waitingForInput = false
    this.typingTimer = null
    this.tutImg = null
    this.modeButtons = []

    this.drawBackground()
    this.drawDialogBox()
    this.drawBackButton()
    this.narrator = new Narrator(this, NARRATOR_CONFIG)
    this.createTextObjects()
    this.createContinueIndicator()
    this.setupInput()

    this.loadBlock(0)
  }

  drawBackground() {
    if (
      this.textures.exists('bg-characters') &&
      this.textures.get('bg-characters').key !== '__MISSING'
    ) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-characters')
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics().fillStyle(0x00080f, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }
    this.add.graphics().fillStyle(0x001a2e, 0.58).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

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

    const cLen = 11
    const corners = [
      [DLG_X + 2, DLG_Y + 2, 1, 1],
      [DLG_X + DLG_W - 2, DLG_Y + 2, -1, 1],
      [DLG_X + 2, DLG_Y + DLG_H - 2, 1, -1],
      [DLG_X + DLG_W - 2, DLG_Y + DLG_H - 2, -1, -1],
    ]
    g.lineStyle(2, CYAN, 0.9)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  drawBackButton() {
    // Vuelve al mapa sin cambiar el estado — el tutorial no se marca visto
    // hasta que el usuario elige modo al final. Si sale antes, lo verá de
    // nuevo la próxima vez.
    makeNavButton(
      this,
      12,
      12,
      210,
      58,
      'VOLVER AL MAPA',
      () => {
        this.stopAllTimers()
        this.scene.start(SCENES.MAP, { character: this.characterData })
      },
      { depth: 5 }
    )
  }

  updateTutImage() {
    const key = MAP_TUTORIAL_BLOCKS[this.blockIdx].image

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

  createTextObjects() {
    this.blockTitleObj = this.add
      .text(DLG_X + FACE_W + 16, DLG_Y + Math.round(TITLE_H / 2) + 3, '', {
        ...headingStyle(22, '#00ccff', 3),
        stroke: '#000000',
      })
      .setOrigin(0, 0.5)
      .setDepth(4)

    this.dialogText = this.add
      .text(TEXT_X, TEXT_Y, '', {
        ...headingStyle(34, '#e8f4ff', 2),
        stroke: '#000000',
        wordWrap: { width: TEXT_W },
        lineSpacing: 4,
      })
      .setDepth(4)
  }

  createContinueIndicator() {
    const x = DLG_X + DLG_W - 20
    const y = DLG_Y + DLG_H - 14

    this.continueInd = this.add
      .text(x, y, '▼', mutedStyle(16, '#00ccff'))
      .setOrigin(0.5)
      .setDepth(5)
      .setVisible(false)

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

  loadBlock(idx) {
    this.blockIdx = idx
    this.blockTitleObj.setText(MAP_TUTORIAL_BLOCKS[idx].title)
    this.updateTutImage()
    this.clearModeButtons()
    this.startPage()
  }

  startPage() {
    const text = MAP_TUTORIAL_BLOCKS[this.blockIdx].text
    this.fullPageText = text
    this.charIdx = 0
    this.isTyping = true
    this.waitingForInput = false

    this.dialogText.setText('')
    this.setContinueVisible(false)
    this.narrator.startTalking()

    this.typingTimer = this.time.addEvent({
      delay: CHAR_DELAY,
      loop: true,
      callback: this.typeNextChar,
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
    if (this.typingTimer) {
      this.typingTimer.destroy()
      this.typingTimer = null
    }
    this.isTyping = false
    this.narrator.stopTalking()

    if (this.blockIdx >= MAP_TUTORIAL_BLOCKS.length - 1) {
      this.onTutorialEnd()
    } else {
      this.waitingForInput = true
      this.setContinueVisible(true)
    }
  }

  advanceDialog() {
    if (this.isTyping) {
      this.isTyping = false
      if (this.typingTimer) {
        this.typingTimer.destroy()
        this.typingTimer = null
      }
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
    this.drawModeButtons()
  }

  drawModeButtons() {
    // Dos botones dentro del panel de diálogo, alineados a la derecha.
    const BW = 200
    const BH = 50
    const gap = 12
    const right = DLG_X + DLG_W - 12
    const yTop = DLG_Y + Math.round(DLG_H / 2) - BH - gap / 2
    const yBot = DLG_Y + Math.round(DLG_H / 2) + gap / 2

    const gpsBtn = makeNavButton(
      this,
      right - BW,
      yTop,
      BW,
      BH,
      'MODO GPS',
      () => this.pickMode('gps'),
      { depth: 5 }
    )
    const metersBtn = makeNavButton(
      this,
      right - BW,
      yBot,
      BW,
      BH,
      'MODO METROS',
      () => this.pickMode('meters'),
      { depth: 5 }
    )
    // makeNavButton devuelve un array de objetos o el bg; guardamos referencia
    // suelta para limpiarlos al avanzar (por si en algún momento re-entra).
    this.modeButtons.push(gpsBtn, metersBtn)
  }

  clearModeButtons() {
    // NavButton crea graphics + text que quedan como children de la escena;
    // se destruyen automáticamente al cambiar de escena. Aquí solo vaciamos
    // la referencia local.
    this.modeButtons = []
  }

  pickMode(mode) {
    this.stopAllTimers()
    mapService.setUnlockMode(mode)
    mapService.markMapTutorialSeen()
    this.scene.start(SCENES.MAP, { character: this.characterData })
  }

  stopAllTimers() {
    this.isTyping = false
    this.waitingForInput = false
    if (this.typingTimer) {
      this.typingTimer.destroy()
      this.typingTimer = null
    }
    this.narrator?.stopAllTimers()
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      // Solo avanza si tocan la zona del diálogo Y no está en la fase final
      // con los botones de modo (para que no se marquen como si fueran una
      // advance del texto).
      if (pointer.y < DLG_Y) return
      if (this.blockIdx >= MAP_TUTORIAL_BLOCKS.length - 1 && !this.isTyping) return
      this.advanceDialog()
    })
    this.input.keyboard.on('keydown-SPACE', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ENTER', () => this.advanceDialog())
    this.input.keyboard.on('keydown-ESC', () => {
      this.stopAllTimers()
      this.scene.start(SCENES.MAP, { character: this.characterData })
    })
  }

  _onShutdown() {
    this.narrator?.stopAllTimers()
  }
}
