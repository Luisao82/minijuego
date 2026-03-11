// Player — entidad visual del personaje en GameScene
// Encapsula el dibujado, los estados visuales y la animación de celebración.
//
// Extensibilidad:
//   Para añadir un personaje con spritesheet o aspecto distinto, pasa
//   characterData.drawFn = (graphics, px, py, state) => { ... }
//   Si drawFn no existe, se usa el dibujado pixel art genérico.

import { COLORS } from '../config/gameConfig'

export const PLAYER_STATE = {
  NORMAL:        'normal',         // De pie en el palo
  JUMPING:       'jumping',        // Saltando sin bandera
  JUMPING_FLAG:  'jumping-flag',   // Saltando con bandera
  FLAG:          'flag',           // En el palo con bandera
}

export class Player {

  constructor(scene, x, y, characterData = null) {
    this._scene         = scene
    this._x             = x
    this._y             = y
    this._characterData = characterData
    this._state         = PLAYER_STATE.NORMAL
    this._graphics      = scene.add.graphics()

    // Celebración
    this._celebGraphics = null
    this._celebTimer    = null
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
  }

  setFlag(hasFlag) {
    const jumping = this._state === PLAYER_STATE.JUMPING || this._state === PLAYER_STATE.JUMPING_FLAG
    this._state = jumping
      ? (hasFlag ? PLAYER_STATE.JUMPING_FLAG : PLAYER_STATE.JUMPING)
      : (hasFlag ? PLAYER_STATE.FLAG : PLAYER_STATE.NORMAL)
  }

  // ── Dibujado ─────────────────────────────────────────────────

  redraw() {
    const g  = this._graphics
    const px = this._x
    const py = this._y

    g.clear()

    // Si el personaje tiene una función de dibujado personalizada, usarla
    if (this._characterData?.drawFn) {
      this._characterData.drawFn(g, px, py, this._state)
      return
    }

    this._drawBody(g, px, py)
    this._drawArms(g, px, py)
  }

  _drawBody(g, px, py) {
    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(px - 5, py - 36, 10, 4)
    // Cabeza
    g.fillStyle(0xffcc88, 1)
    g.fillRect(px - 5, py - 32, 10, 10)
    // Torso
    g.fillStyle(0xffffff, 1)
    g.fillRect(px - 7, py - 22, 14, 14)
    // Bañador rojo
    g.fillStyle(0xcc2222, 1)
    g.fillRect(px - 7, py - 8, 14, 6)
    // Piernas
    g.fillStyle(0xf0bb78, 1)
    g.fillRect(px - 6, py - 2, 5, 6)
    g.fillRect(px + 1, py - 2, 5, 6)
  }

  _drawArms(g, px, py) {
    switch (this._state) {
      case PLAYER_STATE.JUMPING_FLAG:
        // Brazo izquierdo arriba con bandera + brazo derecho adelante
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
        // Pose superman: ambos brazos adelante
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 19, py - 22, 12, 5)
        g.fillRect(px - 19, py - 16, 12, 5)
        break

      case PLAYER_STATE.FLAG:
        // En el palo con bandera: brazo izquierdo arriba con bandera
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px + 7, py - 20, 5, 12)
        g.fillRect(px - 12, py - 42, 5, 22)
        g.fillStyle(COLORS.WOOD_DARK, 1)
        g.fillRect(px - 11, py - 64, 3, 24)
        g.fillStyle(COLORS.WHITE, 1)
        g.fillRect(px - 8, py - 64, 14, 10)
        break

      default:
        // Normal: brazos a los lados
        g.fillStyle(0xf0bb78, 1)
        g.fillRect(px - 12, py - 20, 5, 12)
        g.fillRect(px + 7, py - 20, 5, 12)
    }
  }

  // ── Visibilidad ──────────────────────────────────────────────

  setVisible(visible) {
    this._graphics.setVisible(visible)
  }

  // ── Cabeza en el agua (game over sin bandera) ─────────────────

  showHead(waterY) {
    const g  = this._scene.add.graphics()
    const cx = this._x

    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, waterY - 16, 10, 4)
    // Cabeza
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, waterY - 12, 10, 10)
  }

  // ── Celebración (ganó la bandera) ────────────────────────────

  startCelebration(waterY, onComplete) {
    this._celebFrame    = 0
    this._celebGraphics = this._scene.add.graphics()
    this._drawCelebFrame(waterY)

    this._celebTimer = this._scene.time.addEvent({
      delay: 350,
      callback: () => {
        this._celebFrame = 1 - this._celebFrame
        this._drawCelebFrame(waterY)
      },
      loop: true,
    })

    this._scene.time.delayedCall(2500, () => {
      this.stopCelebration()
      if (onComplete) onComplete()
    })
  }

  _drawCelebFrame(waterY) {
    const g    = this._celebGraphics
    const cx   = this._x
    const wy   = waterY
    const wave = this._celebFrame === 0 ? -2 : 2

    g.clear()

    // Cabeza asomando del agua
    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, wy - 14, 10, 4)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, wy - 11, 10, 10)

    // Brazo levantado agitando la bandera
    g.fillStyle(0xf0bb78, 1)
    g.fillRect(cx + wave - 2, wy - 28, 5, 14)

    // Palo de la bandera
    g.fillStyle(COLORS.WOOD_DARK, 1)
    g.fillRect(cx + wave - 1, wy - 45, 3, 16)

    // Bandera blanca (cambia de lado al agitar)
    g.fillStyle(COLORS.WHITE, 1)
    if (this._celebFrame === 0) {
      g.fillRect(cx + wave + 2, wy - 45, 14, 10)
    } else {
      g.fillRect(cx + wave - 16, wy - 45, 14, 10)
    }
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
    if (this._celebGraphics) {
      this._celebGraphics.destroy()
      this._celebGraphics = null
    }
    this._graphics.destroy()
  }
}
