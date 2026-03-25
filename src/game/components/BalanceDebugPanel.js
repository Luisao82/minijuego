// Panel de debug del equilibrio — solo visible cuando DEBUG.BALANCE_PANEL = true
// Muestra en tiempo real todos los parámetros y fuerzas que afectan a la velocidad.
// Se instancia y destruye junto con la fase de equilibrio en GameScene.

import { BALANCE, GAME_WIDTH } from '../config/gameConfig'

const W     = 240
const H     = 320
const PAD   = 8
const X     = GAME_WIDTH - W - 8
const Y     = 44
const DEPTH = 200

// Velocidad terminal teórica: INPUT_FORCE / DAMPING — escala de la barra de velocidad
const VEL_SCALE = BALANCE.INPUT_FORCE / BALANCE.DAMPING

const COL_VALUE  = '#ffffff'
const COL_ACCENT = '#00ffcc'
const COL_DRIFT  = '#ff8844'
const COL_INPUT  = '#44aaff'
const COL_DAMP   = '#aa88ff'
const COL_NET    = '#ffff44'
const COL_WARN   = '#ffaa00'
const COL_DANGER = '#ff4444'

export class BalanceDebugPanel {

  constructor(scene) {
    this.scene = scene

    this.bg = scene.add.graphics().setDepth(DEPTH)
    this._drawBackground()

    this.titleText = scene.add.text(X + W / 2, Y + PAD, '[ BALANCE DEBUG ]', {
      fontFamily: 'monospace',
      fontSize:   '9px',
      color:      COL_ACCENT,
    }).setOrigin(0.5, 0).setDepth(DEPTH + 1)

    // Barra de posición + barra de velocidad (dinámicas)
    this.barsGfx = scene.add.graphics().setDepth(DEPTH + 1)

    // Texto de datos
    this.dataText = scene.add.text(X + PAD, Y + 62, '', {
      fontFamily:  'monospace',
      fontSize:    '10px',
      color:       COL_VALUE,
      lineSpacing: 3,
    }).setDepth(DEPTH + 1)
  }

  update(bar, system, oilMult, inputDir) {
    this._drawBars(bar, system, inputDir)
    this._updateText(bar, system, oilMult, inputDir)
  }

  destroy() {
    this.bg.destroy()
    this.titleText.destroy()
    this.barsGfx.destroy()
    this.dataText.destroy()
  }

  // ─── privado ───────────────────────────────────────────────────────────────

  _drawBackground() {
    this.bg.fillStyle(0x000000, 0.90)
    this.bg.fillRect(X, Y, W, H)
    this.bg.lineStyle(1, 0x00ffcc, 0.6)
    this.bg.strokeRect(X, Y, W, H)
    this.bg.lineStyle(1, 0x00ffcc, 0.15)
    this.bg.strokeRect(X + 2, Y + 2, W - 4, H - 4)
  }

  _drawBars(bar, system, inputDir) {
    const bW  = W - PAD * 2
    const bH  = 12
    const bX  = X + PAD
    const cx  = bX + bW / 2

    this.barsGfx.clear()

    // ── barra de POSICIÓN ──────────────────────────
    const posY     = Y + 22
    const limitPx  = bar.limit * (bW / 2)
    const cursorPx = bar.position * (bW / 2)

    this.barsGfx.fillStyle(0x111122, 1)
    this.barsGfx.fillRect(bX, posY, bW, bH)

    // zonas peligro
    this.barsGfx.fillStyle(0xff2222, 0.25)
    this.barsGfx.fillRect(bX, posY, bW / 2 - limitPx, bH)
    this.barsGfx.fillRect(cx + limitPx, posY, bW / 2 - limitPx, bH)

    // líneas de límite
    this.barsGfx.lineStyle(1, 0xff4444, 0.9)
    this.barsGfx.lineBetween(cx - limitPx, posY - 2, cx - limitPx, posY + bH + 2)
    this.barsGfx.lineBetween(cx + limitPx, posY - 2, cx + limitPx, posY + bH + 2)

    // centro
    this.barsGfx.lineStyle(1, 0x00ff88, 0.6)
    this.barsGfx.lineBetween(cx, posY - 2, cx, posY + bH + 2)

    // cursor de posición
    const distRatio   = Math.abs(bar.position) / bar.limit
    const cursorColor = distRatio > 0.85 ? 0xff2222 : distRatio > 0.55 ? 0xffaa00 : 0xffffff
    this.barsGfx.fillStyle(cursorColor, 1)
    this.barsGfx.fillRect(cx + cursorPx - 2, posY - 3, 4, bH + 6)

    this.barsGfx.lineStyle(1, 0x334455, 1)
    this.barsGfx.strokeRect(bX, posY, bW, bH)

    // etiqueta POS
    this.barsGfx.fillStyle(0x00ffcc, 0.5)
    this.barsGfx.fillRect(bX, posY, 22, bH)
    // (texto "POS" no se puede en Graphics, va implícito en el layout)

    // ── barra de VELOCIDAD ──────────────────────────
    const velY    = Y + 42
    const velPx   = Math.max(-bW / 2, Math.min(bW / 2, (bar.velocity / VEL_SCALE) * (bW / 2)))

    this.barsGfx.fillStyle(0x111122, 1)
    this.barsGfx.fillRect(bX, velY, bW, bH)

    // relleno de velocidad (desde centro hacia la dirección)
    const velColor = bar.velocity > 0 ? 0x4488ff : 0xff8844
    this.barsGfx.fillStyle(velColor, 0.7)
    if (velPx >= 0) {
      this.barsGfx.fillRect(cx, velY + 2, velPx, bH - 4)
    } else {
      this.barsGfx.fillRect(cx + velPx, velY + 2, -velPx, bH - 4)
    }

    // centro
    this.barsGfx.lineStyle(1, 0x00ff88, 0.6)
    this.barsGfx.lineBetween(cx, velY - 2, cx, velY + bH + 2)

    this.barsGfx.lineStyle(1, 0x334455, 1)
    this.barsGfx.strokeRect(bX, velY, bW, bH)
  }

  _updateText(bar, system, oilMult, inputDir) {
    const s  = (n, d = 2) => (n >= 0 ? '+' : '') + n.toFixed(d)
    const ar = (v) => v > 0 ? '→' : v < 0 ? '←' : '·'

    // Fuerzas que actúan sobre la velocidad (unidades por segundo)
    const dDrift = system.driftDirection * system.driftForce * (1 + oilMult)
    const dInput = inputDir * BALANCE.INPUT_FORCE
    const dDamp  = -bar.velocity * BALANCE.DAMPING
    const dNet   = dDrift + dInput + dDamp

    const driftArrow = system.driftDirection > 0 ? '→ (+1)' : '← (-1)'
    const inputLabel = inputDir !== 0 ? `${ar(inputDir)} (${s(inputDir, 0)})` : '·  ( 0)'

    const lines = [
      // ── posición / velocidad
      `pos    ${s(bar.position, 3)}   lim ±${bar.limit.toFixed(2)}`,
      `vel    ${s(bar.velocity, 3)}   cap ±${BALANCE.VELOCITY_CAP}${Math.abs(bar.velocity) >= BALANCE.VELOCITY_CAP ? ' ◄CAP' : ''}`,
      `────────────────────────`,
      // ── drift
      `drift  ${driftArrow}`,
      `fuerza ${system.driftForce.toFixed(2)} / ${system.maxDrift.toFixed(2)}`,
      `aceite ×${(1 + oilMult).toFixed(2)}  (+${(oilMult * 100).toFixed(0)}%)`,
      `────────────────────────`,
      // ── aceleraciones (u/s²) — cuánto cambia VEL cada segundo
      `ACELERACIONES (u/s²):`,
      `  drift  ${s(dDrift)}`,
      `  input  ${s(dInput)}`,
      `  damp   ${s(dDamp)}`,
      `  TOTAL  ${s(dNet)}  ← acel, no vel`,
      `────────────────────────`,
      // ── input y constantes
      `input  ${inputLabel}`,
      `────────────────────────`,
      `INPUT_F ${BALANCE.INPUT_FORCE}   DAMP ${BALANCE.DAMPING}`,
      `ΔCRUCE  ${BALANCE.DRIFT_GROWTH_PER_CROSS}`,
    ]

    this.dataText.setText(lines)
  }
}
