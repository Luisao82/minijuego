// Player — entidad visual del personaje en GameScene.
// Usa un único Phaser.GameObjects.Sprite con setFrame() para mostrar
// el frame correcto según el estado del personaje.
//
// Si el spritesheet del personaje no existe, usa 'sprite-default' como
// fallback. Si tampoco existe 'sprite-default', cae al dibujado pixel art
// con Graphics (sin imágenes).

import { COLORS } from '../config/gameConfig'
import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'

export const PLAYER_STATE = {
  NORMAL:        'normal',         // De pie en el palo
  JUMPING:       'jumping',        // Saltando sin bandera
  JUMPING_FLAG:  'jumping-flag',   // Saltando con bandera
  FLAG:          'flag',           // En el palo con bandera
  FALLING:       'falling',        // Cayendo sin bandera
  FALLING_FLAG:  'falling-flag',   // Cayendo con bandera
}

export class Player {

  constructor(scene, x, y, characterData = null, scale = SPRITE_CONFIG.scale, parent = null, spriteKey = null) {
    this._scene         = scene
    this._x             = x
    this._y             = y
    this._characterData = characterData
    this._state         = PLAYER_STATE.NORMAL

    // Determinar qué spritesheet usar.
    // spriteKey tiene prioridad (skin seleccionado), luego el del personaje, luego default.
    const id          = characterData?.id
    const charKey     = id ? `sprite-${id}` : null
    const resolvedKey = spriteKey && scene.textures.exists(spriteKey) ? spriteKey : charKey
    const key         = (resolvedKey && scene.textures.exists(resolvedKey))
      ? resolvedKey
      : scene.textures.exists('sprite-default') ? 'sprite-default' : null

    if (key) {
      this._sprite   = scene.add.sprite(x, y + 4, key, SPRITE_FRAMES.STAND)
        .setOrigin(0.5, 1)
        .setScale(scale)
      if (parent) parent.add(this._sprite)
      this._graphics = null
    } else {
      // Sin ningún spritesheet disponible — fallback pixel art
      this._sprite   = null
      this._graphics = scene.add.graphics()
      if (parent) parent.add(this._graphics)
    }

    // Estado de animación walk
    this._animTimer  = 0
    this._animToggle = false

    // Celebración
    this._celebTimer    = null
    this._celebGraphics = null   // solo en fallback pixel art
    this._celebFrame    = 0

    this.redraw()
  }

  // ── Posición ────────────────────────────────────────────────

  get x() { return this._x }
  set x(v) { this._x = v }

  get y() { return this._y }
  set y(v) { this._y = v }

  // ── Estado visual ───────────────────────────────────────────

  get state() { return this._state }

  setJumping(isJumping, hasFlag = false) {
    if (isJumping) {
      this._state = hasFlag ? PLAYER_STATE.JUMPING_FLAG : PLAYER_STATE.JUMPING
    } else {
      this._state = hasFlag ? PLAYER_STATE.FLAG : PLAYER_STATE.NORMAL
    }
    this._syncFrame()
  }

  setFlag(hasFlag) {
    const jumping = this._state === PLAYER_STATE.JUMPING || this._state === PLAYER_STATE.JUMPING_FLAG
    this._state = jumping
      ? (hasFlag ? PLAYER_STATE.JUMPING_FLAG : PLAYER_STATE.JUMPING)
      : (hasFlag ? PLAYER_STATE.FLAG : PLAYER_STATE.NORMAL)
    this._syncFrame()
  }

  setFalling() {
    const hadFlag = this._state === PLAYER_STATE.FLAG || this._state === PLAYER_STATE.JUMPING_FLAG
    this._state = hadFlag ? PLAYER_STATE.FALLING_FLAG : PLAYER_STATE.FALLING
    this._syncFrame()
  }

  _syncFrame() {
    if (!this._sprite) return
    switch (this._state) {
      case PLAYER_STATE.JUMPING:      this._sprite.setFrame(SPRITE_FRAMES.JUMP);       break
      case PLAYER_STATE.JUMPING_FLAG: this._sprite.setFrame(SPRITE_FRAMES.JUMP_FLAG);  break
      case PLAYER_STATE.FLAG:         this._sprite.setFrame(SPRITE_FRAMES.STAND_FLAG); break
      case PLAYER_STATE.FALLING:      this._sprite.setFrame(SPRITE_FRAMES.FALL);       break
      case PLAYER_STATE.FALLING_FLAG: this._sprite.setFrame(SPRITE_FRAMES.STAND_FLAG); break
      default:                        this._sprite.setFrame(SPRITE_FRAMES.STAND);      break
    }
  }

  // ── Dibujado ─────────────────────────────────────────────────

  redraw() {
    if (this._sprite) {
      this._sprite.setPosition(this._x, this._y + 4)
      return
    }

    // Fallback pixel art
    const g  = this._graphics
    const px = this._x
    const py = this._y

    g.clear()

    if (this._characterData?.drawFn) {
      this._characterData.drawFn(g, px, py, this._state)
      return
    }

    this._drawBody(g, px, py)
    this._drawArms(g, px, py)
  }

  // Anima entre STAND y WALK según la velocidad de movimiento.
  updateAnimation(dt, speed) {
    if (!this._sprite) return
    if (this._state === PLAYER_STATE.JUMPING      || this._state === PLAYER_STATE.JUMPING_FLAG) return
    if (this._state === PLAYER_STATE.FALLING      || this._state === PLAYER_STATE.FALLING_FLAG) return

    const SPEED_THRESHOLD = 15
    const INTERVAL_FACTOR = 18
    const MIN_INTERVAL    = 0.15

    const baseFrame = this._state === PLAYER_STATE.FLAG ? SPRITE_FRAMES.STAND_FLAG : SPRITE_FRAMES.STAND
    const walkFrame = this._state === PLAYER_STATE.FLAG ? SPRITE_FRAMES.STAND_FLAG : SPRITE_FRAMES.WALK

    if (speed < SPEED_THRESHOLD) {
      this._animToggle = false
      this._animTimer  = 0
      this._sprite.setFrame(baseFrame)
      return
    }

    const interval = Math.max(MIN_INTERVAL, INTERVAL_FACTOR / speed)
    this._animTimer += dt

    if (this._animTimer >= interval) {
      this._animTimer -= interval
      this._animToggle = !this._animToggle
      this._sprite.setFrame(this._animToggle ? walkFrame : baseFrame)
    }
  }

  setFlipX(flip) {
    this._sprite?.setFlipX(flip)
  }

  // ── Visibilidad ──────────────────────────────────────────────

  setVisible(visible) {
    this._sprite?.setVisible(visible)
    this._graphics?.setVisible(visible)
  }

  // ── Cabeza en el agua (game over sin bandera) ─────────────────

  showHead(waterY) {
    if (this._sprite) {
      // Reposicionar para que la cabeza quede asomando sobre el agua.
      // Con origin(0.5, 1) y scale×2, el sprite mide 48px de alto.
      // Colocamos la base un poco por debajo de waterY para que solo
      // se vea la parte superior (cabeza) del frame WATER.
      this._sprite
        .setPosition(this._x, waterY + 36)
        .setFrame(SPRITE_FRAMES.WATER)
        .setVisible(true)
      return
    }

    // Fallback pixel art
    const g  = this._scene.add.graphics()
    const cx = this._x
    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, waterY - 16, 10, 4)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, waterY - 12, 10, 10)
  }

  // ── Celebración (ganó la bandera) ────────────────────────────

  startCelebration(waterY, onComplete) {
    if (this._sprite) {
      this._sprite
        .setPosition(this._x, waterY + 36)
        .setFrame(SPRITE_FRAMES.CELEB_A)
        .setVisible(true)

      this._celebToggle = false
      this._celebTimer = this._scene.time.addEvent({
        delay:    350,
        callback: () => {
          this._celebToggle = !this._celebToggle
          this._sprite.setFrame(this._celebToggle ? SPRITE_FRAMES.CELEB_B : SPRITE_FRAMES.CELEB_A)
        },
        loop: true,
      })
    } else {
      // Fallback pixel art
      this._celebFrame    = 0
      this._celebGraphics = this._scene.add.graphics()
      this._drawCelebFrame(waterY)

      this._celebTimer = this._scene.time.addEvent({
        delay:    350,
        callback: () => {
          this._celebFrame = 1 - this._celebFrame
          this._drawCelebFrame(waterY)
        },
        loop: true,
      })
    }

    this._scene.time.delayedCall(2500, () => {
      this.stopCelebration()
      if (onComplete) onComplete()
    })
  }

  stopCelebration() {
    if (this._celebTimer) {
      this._celebTimer.destroy()
      this._celebTimer = null
    }
  }

  // ── Limpieza ─────────────────────────────────────────────────

  destroy() {
    this.stopCelebration()
    this._sprite?.destroy()
    this._sprite = null
    this._graphics?.destroy()
    this._graphics = null
    if (this._celebGraphics) {
      this._celebGraphics.destroy()
      this._celebGraphics = null
    }
  }

  // ── Fallback pixel art (sin spritesheet) ─────────────────────

  _drawBody(g, px, py) {
    g.fillStyle(0x3d2510, 1)
    g.fillRect(px - 5, py - 36, 10, 4)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(px - 5, py - 32, 10, 10)
    g.fillStyle(0xffffff, 1)
    g.fillRect(px - 7, py - 22, 14, 14)
    g.fillStyle(0xcc2222, 1)
    g.fillRect(px - 7, py - 8, 14, 6)
    g.fillStyle(0xf0bb78, 1)
    g.fillRect(px - 6, py - 2, 5, 6)
    g.fillRect(px + 1, py - 2, 5, 6)
  }

  _drawArms(g, px, py) {
    switch (this._state) {
      case PLAYER_STATE.JUMPING_FLAG:
      case PLAYER_STATE.FALLING_FLAG:
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 12, py - 42, 5, 22)
        g.fillStyle(COLORS.WOOD_DARK, 1)
        g.fillRect(px - 11, py - 64, 3, 24)
        g.fillStyle(COLORS.WHITE, 1)
        g.fillRect(px - 8, py - 64, 14, 10)
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 19, py - 20, 12, 5)
        break

      case PLAYER_STATE.JUMPING:
      case PLAYER_STATE.FALLING:
        // Pose de susto/vuelo: ambos brazos abiertos
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 19, py - 22, 12, 5)
        g.fillRect(px + 7,  py - 22, 12, 5)
        break

      case PLAYER_STATE.FLAG:
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px + 7, py - 20, 5, 12)
        g.fillRect(px - 12, py - 42, 5, 22)
        g.fillStyle(COLORS.WOOD_DARK, 1)
        g.fillRect(px - 11, py - 64, 3, 24)
        g.fillStyle(COLORS.WHITE, 1)
        g.fillRect(px - 8, py - 64, 14, 10)
        break

      default:
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 12, py - 20, 5, 12)
        g.fillRect(px + 7,  py - 20, 5, 12)
    }
  }

  _drawCelebFrame(waterY) {
    const g    = this._celebGraphics
    const cx   = this._x
    const wy   = waterY
    const wave = this._celebFrame === 0 ? -2 : 2

    g.clear()

    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, wy - 14, 10, 4)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, wy - 11, 10, 10)

    g.fillStyle(0xf0bb78, 1)
    g.fillRect(cx + wave - 2, wy - 28, 5, 14)

    g.fillStyle(COLORS.WOOD_DARK, 1)
    g.fillRect(cx + wave - 1, wy - 45, 3, 16)

    g.fillStyle(COLORS.WHITE, 1)
    if (this._celebFrame === 0) {
      g.fillRect(cx + wave + 2,  wy - 45, 14, 10)
    } else {
      g.fillRect(cx + wave - 16, wy - 45, 14, 10)
    }
  }
}
