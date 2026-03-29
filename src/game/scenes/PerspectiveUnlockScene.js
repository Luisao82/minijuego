import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { makeNavButton } from '../components/NavButton'

const PANEL_W  = 560
const PANEL_H  = 620
const PANEL_X  = Math.round((GAME_WIDTH - PANEL_W) / 2)
const PANEL_Y  = Math.round((GAME_HEIGHT - PANEL_H) / 2)
const CENTER_X = GAME_WIDTH / 2

const THUMB_W = PANEL_W - 48
const THUMB_H = 290

export class PerspectiveUnlockScene extends Scene {

  constructor() {
    super(SCENES.PERSPECTIVE_UNLOCK)
  }

  init(data) {
    this.unlockedPerspectives = data.unlockedPerspectives || []
    this.characterData        = data.character || null
    this.nextUnlocks          = data.nextUnlocks || []    // personajes pendientes de mostrar
    this.nextScene            = data.nextScene || SCENES.CHARACTER_SELECT
    this.currentIndex         = 0
    this.canInteract          = false
  }

  create() {
    this._drawBackground()
    this._showCurrent()
  }

  // ── Fondo ─────────────────────────────────────────────────────

  _drawBackground() {
    this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-characters')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    const ov = this.add.graphics()
    ov.fillStyle(0x000000, 0.78)
    ov.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ── Revelación de la perspectiva actual ───────────────────────

  _showCurrent() {
    this.canInteract = false

    if (this.contentContainer) this.contentContainer.destroy()
    if (this.buttonContainer)  this.buttonContainer.destroy()

    this.contentContainer = this.add.container(0, 0)
    this.contentContainer.setAlpha(0)

    const perspId = this.unlockedPerspectives[this.currentIndex]
    const persp   = perspectiveUnlockService.getById(perspId)

    if (!persp) {
      this._proceed()
      return
    }

    this._drawPanel()
    this._drawBanner()
    this._drawThumb(persp)
    this._drawLabel(persp)
    this._drawButtons()

    this.tweens.add({
      targets:  this.contentContainer,
      alpha:    1,
      duration: 300,
      ease:     'Quad.easeOut',
      onComplete: () => this._animateThumb(),
    })
  }

  _drawPanel() {
    const g = this.add.graphics()

    g.fillStyle(0x000000, 0.5)
    g.fillRect(PANEL_X + 6, PANEL_Y + 6, PANEL_W, PANEL_H)

    g.fillStyle(COLORS.DARK_BG, 1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    g.fillStyle(COLORS.GOLD, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, 56)

    this.contentContainer.add(g)
  }

  _drawBanner() {
    this.contentContainer.add(
      this.add.text(CENTER_X, PANEL_Y + 30, '¡NUEVA VISTA DESBLOQUEADA!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '12px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5),
    )
  }

  _drawThumb(persp) {
    const thumbY = PANEL_Y + 56 + 16
    const cx     = CENTER_X
    const cy     = thumbY + THUMB_H / 2

    // Marco
    const frameG = this.add.graphics()
    frameG.lineStyle(2, COLORS.UI_BORDER, 1)
    frameG.strokeRect(PANEL_X + 24, thumbY, THUMB_W, THUMB_H)
    this.contentContainer.add(frameG)

    // Thumbnail (empieza en escala 0 para el tween de entrada)
    const thumb = this.add.image(cx, cy, persp.backgroundKey)
    const sx = THUMB_W / thumb.width
    const sy = THUMB_H / thumb.height
    const baseScale = Math.max(sx, sy)
    thumb.setScale(0).setOrigin(0.5)

    // Máscara para recortar al área del thumbnail
    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(PANEL_X + 24, thumbY, THUMB_W, THUMB_H)
    thumb.setMask(maskGfx.createGeometryMask())

    this.contentContainer.add(thumb)
    this.thumbObject    = thumb
    this.thumbBaseScale = baseScale

    this._drawStars(cx, cy, Math.min(THUMB_W, THUMB_H) / 2)
  }

  _drawStars(cx, cy, radius) {
    const positions = [
      { x: cx - radius - 20, y: cy - radius + 10 },
      { x: cx + radius + 20, y: cy - radius + 10 },
      { x: cx - radius - 14, y: cy + radius - 10 },
      { x: cx + radius + 14, y: cy + radius - 10 },
      { x: cx,               y: cy - radius - 20 },
    ]

    positions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize:   '18px',
        color:      '#ffd700',
      }).setOrigin(0.5).setAlpha(0)

      this.contentContainer.add(star)

      this.tweens.add({
        targets:  star,
        alpha:    1,
        scaleX:   { from: 0.3, to: 1 },
        scaleY:   { from: 0.3, to: 1 },
        delay:    500 + i * 80,
        duration: 300,
        ease:     'Back.easeOut',
      })
      this.tweens.add({
        targets:  star,
        alpha:    { from: 1, to: 0.3 },
        delay:    900 + i * 80,
        duration: 700,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    })
  }

  _drawLabel(persp) {
    const labelY = PANEL_Y + 56 + 16 + THUMB_H + 18

    this.contentContainer.add(
      this.add.text(CENTER_X, labelY, persp.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '22px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 4,
        letterSpacing:   6,
      }).setOrigin(0.5),
    )

    this.contentContainer.add(
      this.add.text(CENTER_X, labelY + 38, 'Vista desbloqueada', {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color:      '#aaaaaa',
      }).setOrigin(0.5),
    )
  }

  // ── Botones ──────────────────────────────────────────────────

  _drawButtons() {
    const btnH  = 52
    const btnY  = PANEL_Y + PANEL_H - btnH - 16
    const isLast = this.currentIndex >= this.unlockedPerspectives.length - 1

    this.buttonContainer = this.add.container(0, 0)
    this.buttonContainer.setAlpha(0)

    if (isLast) {
      makeNavButton(
        this,
        CENTER_X - 120, btnY, 240, btnH,
        'CONTINUAR ▶',
        () => { if (this.canInteract) this._proceed() },
        { depth: 6 },
      )
    } else {
      makeNavButton(
        this,
        CENTER_X - 120, btnY, 240, btnH,
        'SIGUIENTE ▶',
        () => { if (this.canInteract) this._nextPerspective() },
        { depth: 6 },
      )
    }
  }

  // ── Animación del thumbnail ───────────────────────────────────

  _animateThumb() {
    this.tweens.add({
      targets:  this.thumbObject,
      scaleX:   this.thumbBaseScale,
      scaleY:   this.thumbBaseScale,
      duration: 450,
      ease:     'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets:  this.buttonContainer,
          alpha:    1,
          duration: 250,
          ease:     'Quad.easeOut',
          onComplete: () => { this.canInteract = true },
        })
      },
    })
  }

  // ── Navegación ───────────────────────────────────────────────

  _nextPerspective() {
    this.currentIndex++
    this._showCurrent()
  }

  _proceed() {
    // Si hay personajes pendientes de mostrar, ir a CharacterUnlockScene primero
    if (this.nextUnlocks?.length > 0) {
      this.scene.start(SCENES.CHARACTER_UNLOCK, {
        unlockedCharacters: this.nextUnlocks,
        character:          this.characterData,
      })
      return
    }

    // Destino final según nextScene
    if (this.nextScene === SCENES.GAME) {
      this.scene.start(SCENES.GAME, { character: this.characterData })
    } else if (this.nextScene === SCENES.COLLECTION) {
      this.scene.start(SCENES.COLLECTION, { character: this.characterData })
    } else {
      this.scene.start(SCENES.CHARACTER_SELECT)
    }
  }
}
