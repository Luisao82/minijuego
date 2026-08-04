import { BaseScene } from './BaseScene'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle, mutedStyle } from '../config/textStyles'
import { Narrator } from '../components/Narrator'
import { makeNavButton } from '../components/NavButton'

// Base para escenas narradas al estilo "libro de historia": fondo con
// tinte, cuadro de diálogo RPG con retrato del narrador a la izquierda,
// título arriba, texto con máquina de escribir, imagen ilustrativa en la
// mitad superior y navegación por bloques (con páginas dentro de cada
// bloque). HistoryScene y AndanaScene extienden esta base — la lógica
// vive aquí, cada subclase solo aporta contenido y callbacks.
//
// Contrato para las subclases (obligatorio):
//   getBlocks()               → [{ title, image, pages: string[] }, ...]
//   getEndText()              → string mostrado tras el último bloque
//   getNarratorSpritesheet()  → key de textura del narrador
//   getBackButtonConfig()     → { label, onClick }
//   getEndButtonConfig()      → { label, onClick }
//
// Contrato para las subclases (opcional):
//   getBackgroundKey()        → key de textura de fondo (o null)
//   getPalette()              → colores personalizados (merge con default)
//   getNarratorConfigOverrides() → overrides puntuales del Narrator config

// ============================================================
// LAYOUT
// ============================================================
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
const IMG_MAX_W = 840
const IMG_MAX_H = IMG_AREA_BTM - IMG_AREA_TOP

// Máquina de escribir
const CHAR_DELAY = 28

// Paleta por defecto (History) — ámbar sobre madera oscura
const DEFAULT_PALETTE = {
  accent: 0xd4a520,
  dlgDark: 0x0d0600,
  dlgFace: 0x5c3318,
  bgFallback: 0x0a0800,
  bgTint: 0x3d1800,
  bgTintAlpha: 0.48,
  textColor: '#f0d99a',
  placeholderColor: '#7a6030',
}

const DEFAULT_MOUTH_CYCLE = [
  { frame: 0, duration: 90 },
  { frame: 1, duration: 75 },
  { frame: 2, duration: 55 },
  { frame: 1, duration: 75 },
]

export class BaseNarratedScene extends BaseScene {
  create() {
    this._palette = { ...DEFAULT_PALETTE, ...(this.getPalette?.() ?? {}) }
    this._blocks = this.getBlocks()
    this._endText = this.getEndText()

    this.blockIdx = 0
    this.pageIdx = 0
    this.charIdx = 0
    this.isTyping = false
    this.waitingForInput = false
    this.typingTimer = null

    this.drawBackground()
    this.drawDialogBox()
    this.drawBackButton()
    this.narrator = new Narrator(this, this._buildNarratorConfig())
    this.createImageLayer()
    this.createTextObjects()
    this.createContinueIndicator()
    this.setupInput()

    this.loadBlock(0)
  }

  _buildNarratorConfig() {
    return {
      cx: DLG_X + Math.round(FACE_W / 2),
      cy: DLG_Y + Math.round(DLG_H / 2),
      size: NARR_SIZE,
      spritesheet: this.getNarratorSpritesheet(),
      mouthCycle: DEFAULT_MOUTH_CYCLE,
      blinkMin: 3200,
      blinkMax: 7000,
      blinkDur: 130,
      depth: 3,
      talkSoundKey: 'sfx-talk',
      talkSoundVol: 0.22,
      ...(this.getNarratorConfigOverrides?.() ?? {}),
    }
  }

  // =====================================================
  // FONDO
  // =====================================================

  drawBackground() {
    const key = this.getBackgroundKey?.()
    if (key && this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics().fillStyle(this._palette.bgFallback, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    this.add
      .graphics()
      .fillStyle(this._palette.bgTint, this._palette.bgTintAlpha)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // =====================================================
  // CUADRO DE DIÁLOGO estilo RPG
  // =====================================================

  drawDialogBox() {
    const { accent, dlgDark, dlgFace } = this._palette
    const g = this.add.graphics().setDepth(2)

    g.fillStyle(0x000000, 0.55)
    g.fillRect(DLG_X + 4, DLG_Y + 4, DLG_W, DLG_H)

    g.fillStyle(dlgDark, 0.78)
    g.fillRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    g.lineStyle(3, accent, 1)
    g.strokeRect(DLG_X, DLG_Y, DLG_W, DLG_H)

    g.lineStyle(1, accent, 0.18)
    g.strokeRect(DLG_X + 4, DLG_Y + 4, DLG_W - 8, DLG_H - 8)

    g.fillStyle(dlgFace, 0.88)
    g.fillRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)
    g.lineStyle(2, accent, 0.45)
    g.strokeRect(DLG_X + 3, DLG_Y + 3, FACE_W - 3, DLG_H - 6)

    g.lineStyle(2, accent, 0.6)
    g.lineBetween(DLG_X + FACE_W + 1, DLG_Y + 6, DLG_X + FACE_W + 1, DLG_Y + DLG_H - 6)

    g.fillStyle(accent, 0.07)
    g.fillRect(DLG_X + FACE_W + 2, DLG_Y, DLG_W - FACE_W - 2, TITLE_H + 6)

    g.lineStyle(1, accent, 0.35)
    g.lineBetween(DLG_X + FACE_W + 12, DLG_Y + TITLE_H + 6, DLG_X + DLG_W - 12, DLG_Y + TITLE_H + 6)

    const cLen = 11
    const corners = [
      [DLG_X + 2, DLG_Y + 2, 1, 1],
      [DLG_X + DLG_W - 2, DLG_Y + 2, -1, 1],
      [DLG_X + 2, DLG_Y + DLG_H - 2, 1, -1],
      [DLG_X + DLG_W - 2, DLG_Y + DLG_H - 2, -1, -1],
    ]
    g.lineStyle(2, accent, 0.9)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  // =====================================================
  // BOTÓN DE VOLVER / SALTAR
  // =====================================================

  drawBackButton() {
    const cfg = this.getBackButtonConfig()
    makeNavButton(
      this,
      12,
      12,
      170,
      58,
      cfg.label,
      () => {
        this.stopAllTimers()
        cfg.onClick()
      },
      { depth: 5 }
    )
  }

  // =====================================================
  // IMAGEN ILUSTRATIVA
  // =====================================================

  createImageLayer() {
    this.storyImg = null
    this.storyImgPlaceholder = this.add.graphics().setDepth(1)
    this.storyImgLabel = this.add
      .text(IMG_CX, IMG_CY, '', {
        ...headingStyle(22, this._palette.placeholderColor, 0),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setVisible(false)
  }

  updateStoryImage() {
    const block = this._blocks[this.blockIdx]
    const key = block.image

    if (this.storyImg) {
      const old = this.storyImg
      this.storyImg = null
      this.tweens.add({ targets: old, alpha: 0, duration: 200, onComplete: () => old.destroy() })
    }
    this.storyImgPlaceholder.clear()
    this.storyImgLabel.setVisible(false)

    if (key && this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') {
      this.storyImg = this.add.image(IMG_CX, IMG_CY, key).setDepth(1).setAlpha(0)
      const scaleX = IMG_MAX_W / this.storyImg.width
      const scaleY = IMG_MAX_H / this.storyImg.height
      this.storyImg.setScale(Math.min(scaleX, scaleY))
      this.tweens.add({ targets: this.storyImg, alpha: 1, duration: 350 })
    } else {
      const pw = 460
      const ph = 280
      const px = IMG_CX - pw / 2
      const py = IMG_CY - ph / 2
      this.storyImgPlaceholder.fillStyle(0x1a0a00, 0.65)
      this.storyImgPlaceholder.fillRect(px, py, pw, ph)
      this.storyImgPlaceholder.lineStyle(2, this._palette.accent, 0.35)
      this.storyImgPlaceholder.strokeRect(px, py, pw, ph)
      this.storyImgLabel.setText(`[ ${block.title} ]`).setVisible(true)
    }
  }

  // =====================================================
  // TÍTULO Y TEXTO DEL DIÁLOGO
  // =====================================================

  createTextObjects() {
    this.blockTitleObj = this.add
      .text(DLG_X + FACE_W + 16, DLG_Y + Math.round(TITLE_H / 2) + 3, '', {
        ...headingStyle(22, COLOR_GOLD, 3),
        stroke: '#000000',
      })
      .setOrigin(0, 0.5)
      .setDepth(4)

    this.dialogText = this.add
      .text(TEXT_X, TEXT_Y, '', {
        ...headingStyle(34, this._palette.textColor, 2),
        stroke: '#000000',
        wordWrap: { width: TEXT_W },
        lineSpacing: 4,
      })
      .setDepth(4)
  }

  // =====================================================
  // INDICADOR DE CONTINUAR (▼)
  // =====================================================

  createContinueIndicator() {
    const x = DLG_X + DLG_W - 20
    const y = DLG_Y + DLG_H - 14

    this.continueInd = this.add
      .text(x, y, '▼', mutedStyle(16, COLOR_GOLD))
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

  // =====================================================
  // SISTEMA DE BLOQUES Y PÁGINAS
  // =====================================================

  loadBlock(idx) {
    this.blockIdx = idx
    this.pageIdx = 0
    this.updateStoryImage()
    this.blockTitleObj.setText(this._blocks[idx].title)
    this.startPage()
  }

  startPage() {
    const text = this._blocks[this.blockIdx].pages[this.pageIdx]
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

    this.waitingForInput = true
    this.setContinueVisible(true)
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

    const block = this._blocks[this.blockIdx]
    const lastPage = this.pageIdx >= block.pages.length - 1
    const lastBlock = this.blockIdx >= this._blocks.length - 1

    if (lastPage && lastBlock) {
      this.onNarrativeEnd()
      return
    }

    if (!lastPage) {
      this.pageIdx++
      this.startPage()
    } else {
      this.loadBlock(this.blockIdx + 1)
    }
  }

  onNarrativeEnd() {
    this.dialogText.setText(this._endText)
    this.setContinueVisible(false)
    this.drawEndButton()
  }

  drawEndButton() {
    const cfg = this.getEndButtonConfig()
    const btnW = 220
    const btnH = 50
    const btnX = DLG_X + DLG_W - btnW - 14
    const btnY = DLG_Y + DLG_H - btnH - 10

    makeNavButton(
      this,
      btnX,
      btnY,
      btnW,
      btnH,
      cfg.label,
      () => {
        this.stopAllTimers()
        cfg.onClick()
      },
      { depth: 5, fontSize: '30px' }
    )
  }

  // =====================================================
  // LIMPIEZA
  // =====================================================

  stopAllTimers() {
    this.isTyping = false
    this.waitingForInput = false
    if (this.typingTimer) {
      this.typingTimer.destroy()
      this.typingTimer = null
    }
    this.narrator?.stopAllTimers()
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
    this.input.keyboard.on('keydown-ESC', () => {
      this.stopAllTimers()
      this.getBackButtonConfig().onClick()
    })
  }

  _onShutdown() {
    this.narrator?.stopAllTimers()
  }
}
