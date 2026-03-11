// Narrator — retrato animado del narrador (boca + parpadeo)
//
// Extensibilidad:
//   Para crear un narrador diferente (otra cara, otra voz visual),
//   basta con pasar una config distinta al constructor:
//   - textures: { base, eyes, mouthHalfOpen, mouthOpen }
//   - mouthCycle: [{ key, duration }, ...]
//   - blinkMin, blinkMax, blinkDur
//   La lógica de animación es idéntica para todos los narradores.

export class Narrator {

  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   cx: number,
   *   cy: number,
   *   size: number,
   *   textures: { base: string, eyes: string, mouthHalfOpen: string, mouthOpen: string },
   *   mouthCycle: Array<{ key: string, duration: number }>,
   *   blinkMin?: number,
   *   blinkMax?: number,
   *   blinkDur?: number,
   *   depth?: number
   * }} config
   */
  constructor(scene, config) {
    this._scene      = scene
    this._config     = config
    this._isTalking  = false
    this._mouthFrame = 0
    this._mouthTimer = null
    this._blinkTimer = null
    this._img        = null

    this._createPortrait()
    this._scheduleNextBlink()
  }

  // ── Creación del retrato ──────────────────────────────────────

  _createPortrait() {
    const { cx, cy, size, textures, depth = 3 } = this._config

    if (this._scene.textures.exists(textures.base) &&
        this._scene.textures.get(textures.base).key !== '__MISSING') {
      this._img = this._scene.add.image(cx, cy, textures.base)
        .setDisplaySize(size, size)
        .setOrigin(0.5)
        .setDepth(depth)
    } else {
      this._img = this._drawPlaceholder(cx, cy, size, depth)
    }
  }

  _drawPlaceholder(cx, cy, s, depth) {
    const g = this._scene.add.graphics().setDepth(depth)
    const x = cx - s / 2
    const y = cy - s / 2

    g.fillStyle(0x2a1400, 1)
    g.fillRect(x, y, s, s)
    g.lineStyle(1, 0xd4a520, 0.4)
    g.strokeRect(x, y, s, s)
    // Cara
    g.fillStyle(0xd4926a, 1)
    g.fillRect(x + s * 0.2, y + s * 0.15, s * 0.6, s * 0.7)
    // Ojos
    g.fillStyle(0x1a0a00, 1)
    g.fillRect(x + s * 0.3,  y + s * 0.32, s * 0.12, s * 0.1)
    g.fillRect(x + s * 0.58, y + s * 0.32, s * 0.12, s * 0.1)
    // Boca
    g.fillRect(x + s * 0.35, y + s * 0.62, s * 0.3, s * 0.06)

    // Graphics no tiene setTexture → _applyFrame lo detecta y no actúa
    return g
  }

  // ── Animación de boca ─────────────────────────────────────────

  startTalking() {
    this._isTalking  = true
    this._mouthFrame = 0
    this._scheduleMouthFrame()
  }

  stopTalking() {
    this._isTalking = false
    if (this._mouthTimer) { this._mouthTimer.remove(); this._mouthTimer = null }
    this._applyFrame(this._config.textures.base)
  }

  _scheduleMouthFrame() {
    if (!this._isTalking) return
    const cycle = this._config.mouthCycle
    const frame = cycle[this._mouthFrame % cycle.length]
    this._applyFrame(frame.key)
    this._mouthTimer = this._scene.time.delayedCall(frame.duration, () => {
      this._mouthFrame++
      this._scheduleMouthFrame()
    })
  }

  // ── Parpadeo ─────────────────────────────────────────────────

  _scheduleNextBlink() {
    const { blinkMin = 3200, blinkMax = 7000, blinkDur = 130, textures } = this._config
    const delay = Phaser.Math.Between(blinkMin, blinkMax)

    this._blinkTimer = this._scene.time.delayedCall(delay, () => {
      this._applyFrame(textures.eyes)
      this._scene.time.delayedCall(blinkDur, () => {
        if (!this._isTalking) this._applyFrame(textures.base)
        this._scheduleNextBlink()
      })
    })
  }

  // ── Aplicar frame (seguro para Graphics y texturas no cargadas) ─

  _applyFrame(key) {
    if (!this._img || typeof this._img.setTexture !== 'function') return
    const scene = this._scene
    const tex = (scene.textures.exists(key) && scene.textures.get(key).key !== '__MISSING')
      ? key
      : (scene.textures.exists(this._config.textures.base) ? this._config.textures.base : null)
    if (tex) this._img.setTexture(tex)
  }

  // ── Limpieza ─────────────────────────────────────────────────

  stopAllTimers() {
    this._isTalking = false
    if (this._mouthTimer) { this._mouthTimer.remove(); this._mouthTimer = null }
    if (this._blinkTimer) { this._blinkTimer.remove(); this._blinkTimer = null }
  }

  destroy() {
    this.stopAllTimers()
    if (this._img && this._img.destroy) this._img.destroy()
  }
}
