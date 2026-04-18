import { PHASE1, GAME_WIDTH, CONTROL_PANEL, COLORS } from '../config/gameConfig'

// Componente UI de la Fase 1 — Barra de impulso
// Gestiona su propio ciclo de vida: create → update → destroy

export class PowerBarUI {

  constructor(scene, powerBar, characterData) {
    this._scene         = scene
    this._powerBar      = powerBar
    this._characterData = characterData
    this._elements      = []
    this._cursor        = null
    this._passText      = null
    this._instructionTween = null
  }

  create() {
    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX = GAME_WIDTH / 2
    const barY    = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX    = centerX - WIDTH / 2

    const barBg = this._scene.add.graphics()
    this._drawZones(barBg, barX, barY, WIDTH, HEIGHT)
    this._elements.push(barBg)

    this._cursor = this._scene.add.graphics()
    this._elements.push(this._cursor)

    this._passText = this._scene.add.text(centerX, barY - 16, '', {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#ffffff',
    }).setOrigin(0.5)
    this._elements.push(this._passText)

    const instrText = this._scene.add.text(centerX, barY + HEIGHT + 20, '¡PULSA PARA DETENER!', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#ffffff',
    }).setOrigin(0.5)
    this._elements.push(instrText)

    this._instructionTween = this._scene.tweens.add({
      targets:  instrText,
      alpha:    0.3,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
    })

    const weightLabel = this._characterData?.stats?.peso || 5
    this._elements.push(
      this._scene.add.text(barX + WIDTH + 16, barY + HEIGHT / 2, `PESO: ${weightLabel}`, {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#aaaaaa',
      }).setOrigin(0, 0.5),
    )

    this._updatePassCounter()
  }

  update() {
    this._updateCursor()
    this._updatePassCounter()
  }

  destroy() {
    this._instructionTween?.stop()
    this._elements.forEach(el => el?.destroy())
    this._elements         = []
    this._cursor           = null
    this._passText         = null
    this._instructionTween = null
  }

  // ── privado ──────────────────────────────────────────────────────────────────

  _drawZones(graphics, x, y, width, height) {
    const g = graphics
    const { ZONES } = PHASE1

    g.fillStyle(0x000000, 1)
    g.fillRect(x - 3, y - 3, width + 6, height + 6)

    const redWidth = ZONES.RED.end * width
    g.fillGradientStyle(COLORS.RED, COLORS.YELLOW, COLORS.RED, COLORS.YELLOW, 1, 1, 1, 1)
    g.fillRect(x, y, redWidth, height)

    const yellowX     = ZONES.YELLOW.start * width
    const yellowWidth = (ZONES.YELLOW.end - ZONES.YELLOW.start) * width
    g.fillStyle(COLORS.YELLOW, 1)
    g.fillRect(x + yellowX, y, yellowWidth, height)

    const greenX     = ZONES.GREEN.start * width
    const greenWidth = (ZONES.GREEN.end - ZONES.GREEN.start) * width
    g.fillGradientStyle(COLORS.YELLOW, COLORS.GREEN, COLORS.YELLOW, COLORS.GREEN, 1, 1, 1, 1)
    g.fillRect(x + greenX, y, greenWidth, height)

    g.lineStyle(2, COLORS.WHITE, 0.8)
    g.strokeRect(x, y, width, height)
  }

  _updateCursor() {
    if (!this._cursor) return

    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX = GAME_WIDTH / 2
    const barX    = centerX - WIDTH / 2
    const barY    = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const cursorX = barX + this._powerBar.position * WIDTH

    this._cursor.clear()
    this._cursor.fillStyle(COLORS.WHITE, 1)
    this._cursor.fillRect(cursorX - 2, barY - 8, 4, HEIGHT + 16)
    this._cursor.fillTriangle(cursorX, barY - 14, cursorX - 7, barY - 6,  cursorX + 7, barY - 6)
    this._cursor.fillTriangle(cursorX, barY + HEIGHT + 14, cursorX - 7, barY + HEIGHT + 6, cursorX + 7, barY + HEIGHT + 6)
  }

  _updatePassCounter() {
    if (!this._passText) return
    const attempt = Math.min(this._powerBar.passes + 1, this._powerBar.maxPasses)
    this._passText.setText(`INTENTO ${attempt}/${this._powerBar.maxPasses}`)
  }
}
