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

    // Imágenes PNG del personaje en juego — reemplazan el dibujo con Graphics si están cargadas.
    // 'char-character' = pose estática / 'char-character-mov' = pose con brazos y piernas abiertos.
    // Ambas se alternan según la velocidad de movimiento para simular la animación.
    const CHAR_W = 32 //64   // ancho de pantalla; ajustar si la imagen se ve pequeña o grande
    const CHAR_H = 48 //96   // alto de pantalla (pies en poleY mediante setOrigin(0.5, 1))

    const baseKey = characterData?.gameSprite     ?? 'char-character'
    const movKey  = characterData?.gameSpriteMov  ?? 'char-character-mov'
    const jumpKey = characterData?.gameSpriteJump ?? 'char-character-jump'

    this._img = scene.textures.exists(baseKey)
      ? scene.add.image(this._x, this._y + 4, baseKey)
          .setOrigin(0.5, 1)
          .setDisplaySize(CHAR_W, CHAR_H)
      : null

    this._imgMov = (this._img && scene.textures.exists(movKey))
      ? scene.add.image(this._x, this._y + 4, movKey)
          .setOrigin(0.5, 1)
          .setDisplaySize(CHAR_W, CHAR_H)
          .setVisible(false)
      : null

    this._imgJump = (this._img && scene.textures.exists(jumpKey))
      ? scene.add.image(this._x, this._y + 4, jumpKey)
          .setOrigin(0.5, 1)
          .setDisplaySize(CHAR_W, CHAR_H)
          .setVisible(false)
      : null

    // Estado de animación
    this._animTimer = 0    // acumulador de tiempo desde el último cambio de frame
    this._animFrame = 0    // 0 = pose base, 1 = pose mov

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
    this._syncJumpImage()
  }

  setFlag(hasFlag) {
    const jumping = this._state === PLAYER_STATE.JUMPING || this._state === PLAYER_STATE.JUMPING_FLAG
    this._state = jumping
      ? (hasFlag ? PLAYER_STATE.JUMPING_FLAG : PLAYER_STATE.JUMPING)
      : (hasFlag ? PLAYER_STATE.FLAG : PLAYER_STATE.NORMAL)
  }

  // Muestra la imagen de salto cuando el estado es JUMPING o JUMPING_FLAG,
  // y la oculta (volviendo a la animación de movimiento) en el resto de casos.
  _syncJumpImage() {
    if (!this._imgJump) return
    const jumping = this._state === PLAYER_STATE.JUMPING || this._state === PLAYER_STATE.JUMPING_FLAG
    this._imgJump.setVisible(jumping)
    if (jumping) {
      // Mientras el personaje está en el aire, ocultamos las otras imágenes
      this._img?.setVisible(false)
      this._imgMov?.setVisible(false)
    }
    // Al volver al palo, updateAnimation se encargará de restablecer _img/_imgMov
  }

  // ── Dibujado ─────────────────────────────────────────────────

  redraw() {
    // Si hay imagen PNG, posicionarla y omitir el dibujo con graphics
    if (this._img) {
      this._img.setPosition(this._x, this._y + 4)
      this._imgMov?.setPosition(this._x, this._y + 4)
      this._imgJump?.setPosition(this._x, this._y + 4)
      this._graphics.clear()
      return
    }

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

  // Anima el personaje alternando entre la pose base y la pose de movimiento.
  // speed: velocidad actual en unidades de juego por segundo.
  // Si no hay imágenes o speed es 0, muestra la pose base estática.
  updateAnimation(dt, speed) {
    if (!this._img || !this._imgMov) return
    // Durante el salto, la imagen de salto ya está activa; no tocar el resto
    if (this._state === PLAYER_STATE.JUMPING || this._state === PLAYER_STATE.JUMPING_FLAG) return

    const SPEED_THRESHOLD = 15   // px/s — por debajo de esto, el personaje queda estático
    const INTERVAL_FACTOR = 10   // px — intervalo = INTERVAL_FACTOR / speed (segundos)
    const MIN_INTERVAL    = 0.07 // s — intervalo mínimo incluso a máxima velocidad

    if (speed < SPEED_THRESHOLD) {
      // Parado: pose base, sin animación
      this._animFrame = 0
      this._animTimer = 0
      this._img.setVisible(true)
      this._imgMov.setVisible(false)
      return
    }

    const interval = Math.max(MIN_INTERVAL, INTERVAL_FACTOR / speed)
    this._animTimer += dt

    if (this._animTimer >= interval) {
      this._animTimer -= interval
      this._animFrame = 1 - this._animFrame
      this._img.setVisible(this._animFrame === 0)
      this._imgMov.setVisible(this._animFrame === 1)
    }
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
    this._img?.setVisible(visible)
    if (!visible) {
      // Cuando se oculta todo, apagamos también las imágenes secundarias
      this._imgMov?.setVisible(false)
      this._imgJump?.setVisible(false)
    }
    // Al mostrarse de nuevo, _syncJumpImage / updateAnimation restablecerán el frame correcto
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
    this._img?.destroy()
    this._img = null
    this._imgMov?.destroy()
    this._imgMov = null
    this._imgJump?.destroy()
    this._imgJump = null
    this._graphics.destroy()
  }
}
