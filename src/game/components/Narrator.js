// Narrator — retrato animado del narrador (boca + parpadeo)
//
// Usa un spritesheet de 4 frames (35×35 px cada uno):
//   0 → base (reposo)
//   1 → boca medio abierta
//   2 → boca abierta
//   3 → ojos cerrados (parpadeo)
//
// Extensibilidad:
//   Para crear un narrador diferente, basta con pasar una config con
//   otra clave de spritesheet. La lógica de animación es idéntica.

export class Narrator {

  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   cx: number,
   *   cy: number,
   *   size: number,
   *   spritesheet: string,
   *   baseFrame?: number,
   *   blinkFrame?: number,
   *   mouthCycle: Array<{ frame: number, duration: number }>,
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
    const { cx, cy, size, spritesheet, baseFrame = 0, depth = 3 } = this._config

    if (this._scene.textures.exists(spritesheet) &&
        this._scene.textures.get(spritesheet).key !== '__MISSING') {
      this._img = this._scene.add.image(cx, cy, spritesheet, baseFrame)
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
    this._applyFrame(this._config.baseFrame ?? 0)
  }

  _scheduleMouthFrame() {
    if (!this._isTalking) return
    const cycle = this._config.mouthCycle
    const step  = cycle[this._mouthFrame % cycle.length]
    this._applyFrame(step.frame)
    this._mouthTimer = this._scene.time.delayedCall(step.duration, () => {
      this._mouthFrame++
      this._scheduleMouthFrame()
    })
  }

  // ── Parpadeo ─────────────────────────────────────────────────

  _scheduleNextBlink() {
    const { blinkMin = 3200, blinkMax = 7000, blinkDur = 130, blinkFrame = 3, baseFrame = 0 } = this._config
    const delay = Phaser.Math.Between(blinkMin, blinkMax)

    this._blinkTimer = this._scene.time.delayedCall(delay, () => {
      this._applyFrame(blinkFrame)
      this._scene.time.delayedCall(blinkDur, () => {
        if (!this._isTalking) this._applyFrame(baseFrame)
        this._scheduleNextBlink()
      })
    })
  }

  // ── Aplicar frame (seguro para Graphics) ─────────────────────

  _applyFrame(frameIndex) {
    if (!this._img || typeof this._img.setFrame !== 'function') return
    this._img.setFrame(frameIndex)
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
