import { BALANCE, GAME_WIDTH, CONTROL_PANEL, COLORS, DEBUG } from '../config/gameConfig'
import { BalanceDebugPanel } from './BalanceDebugPanel'

// Componente UI de la Fase 2 — Barra de equilibrio y botones táctiles
// Gestiona su propio ciclo de vida: create → update → destroy
// Encapsula el estado de input direccional (izquierda / derecha).
// En los modos analógicos (móvil / tabla) no hay botones: un indicador bajo
// la barra muestra la fuerza que aplica el jugador al inclinarse.

const INDICATOR = { WIDTH: 200, HEIGHT: 8, GAP: 18 }

export class BalanceUI {
  constructor(scene, balanceBar, balanceSystem, { analog = false } = {}) {
    this._scene = scene
    this._balanceBar = balanceBar
    this._balanceSystem = balanceSystem
    this._elements = []
    this._cursor = null
    this._timerText = null
    this._btnLeft = null
    this._btnRight = null
    this._debugPanel = null
    this._inputDir = 0
    this._analog = analog
    this._indicator = null
    this._analogInput = 0
  }

  create() {
    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX = GAME_WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX = centerX - WIDTH / 2

    const barBg = this._scene.add.graphics()
    barBg.fillStyle(COLORS.BLACK, 1)
    barBg.fillRect(barX - 3, barY - 3, WIDTH + 6, HEIGHT + 6)
    barBg.fillStyle(0x1a1a2e, 1)
    barBg.fillRect(barX, barY, WIDTH, HEIGHT)
    barBg.lineStyle(2, COLORS.WHITE, 0.6)
    barBg.strokeRect(barX, barY, WIDTH, HEIGHT)

    barBg.fillStyle(COLORS.GREEN, 1)
    barBg.fillRect(centerX - 1, barY - 4, 2, HEIGHT + 8)

    const limit = this._balanceBar.limit
    const limitOffset = limit * (WIDTH / 2)
    barBg.fillStyle(COLORS.RED, 0.6)
    barBg.fillRect(centerX - limitOffset - 1, barY - 2, 2, HEIGHT + 4)
    barBg.fillRect(centerX + limitOffset - 1, barY - 2, 2, HEIGHT + 4)

    const dangerWidth = WIDTH * ((1 - limit) / 2)
    barBg.fillStyle(COLORS.RED, 0.2)
    barBg.fillRect(barX, barY, dangerWidth, HEIGHT)
    barBg.fillRect(barX + WIDTH - dangerWidth, barY, dangerWidth, HEIGHT)
    this._elements.push(barBg)

    this._cursor = this._scene.add.graphics()
    this._elements.push(this._cursor)

    if (this._analog) {
      this._indicator = this._scene.add.graphics()
      this._elements.push(this._indicator)
    } else {
      this._createButtons()
    }

    if (DEBUG.BALANCE_PANEL) {
      this._debugPanel = new BalanceDebugPanel(this._scene)
    }
  }

  update(oilMult = 0) {
    this._updateCursor()
    this._updateIndicator()
    this._updateTimer()
    this._debugPanel?.update(this._balanceBar, this._balanceSystem, oilMult, this._inputDir)
  }

  getInputDirection() {
    return this._inputDir
  }

  // Fuerza aplicada este frame (-1..1), para el indicador de los modos analógicos
  setAnalogInput(value) {
    this._analogInput = value
  }

  pressLeft() {
    this._inputDir = -1
    this._btnLeft
      ?.setTexture('btn-balance-left-press')
      .setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
  }

  releaseLeft() {
    if (this._inputDir === -1) this._inputDir = 0
    this._btnLeft
      ?.setTexture('btn-balance-left')
      .setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
  }

  pressRight() {
    this._inputDir = 1
    this._btnRight
      ?.setTexture('btn-balance-right-press')
      .setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
  }

  releaseRight() {
    if (this._inputDir === 1) this._inputDir = 0
    this._btnRight
      ?.setTexture('btn-balance-right')
      .setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
  }

  destroy() {
    this._elements.forEach((el) => el?.destroy())
    this._elements = []
    this._cursor = null
    this._timerText = null
    this._btnLeft = null
    this._btnRight = null
    this._indicator = null
    this._inputDir = 0
    this._debugPanel?.destroy()
    this._debugPanel = null
  }

  // ── privado ──────────────────────────────────────────────────────────────────

  _createButtons() {
    const btnSize = BALANCE.BUTTON_SIZE
    const btnY = CONTROL_PANEL.CENTER_Y - btnSize / 2
    const btnMargin = 40

    this._btnLeft = this._scene.add
      .image(btnMargin + btnSize / 2, btnY + btnSize / 2, 'btn-balance-left')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive()
    this._btnLeft.on('pointerdown', () => this.pressLeft())
    this._btnLeft.on('pointerup', () => this.releaseLeft())
    this._btnLeft.on('pointerout', () => this.releaseLeft())
    this._elements.push(this._btnLeft)

    const btnRightX = GAME_WIDTH - btnMargin - btnSize
    this._btnRight = this._scene.add
      .image(btnRightX + btnSize / 2, btnY + btnSize / 2, 'btn-balance-right')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive()
    this._btnRight.on('pointerdown', () => this.pressRight())
    this._btnRight.on('pointerup', () => this.releaseRight())
    this._btnRight.on('pointerout', () => this.releaseRight())
    this._elements.push(this._btnRight)
  }

  _updateCursor() {
    if (!this._cursor || !this._balanceBar) return

    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX = GAME_WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const cursorX = centerX + this._balanceBar.position * (WIDTH / 2)

    this._cursor.clear()
    this._cursor.fillStyle(COLORS.RED, 1)
    this._cursor.fillRect(cursorX - 2, barY - 6, 4, HEIGHT + 12)
    this._cursor.fillTriangle(cursorX, barY - 12, cursorX - 6, barY - 4, cursorX + 6, barY - 4)
    this._cursor.fillTriangle(
      cursorX,
      barY + HEIGHT + 12,
      cursorX - 6,
      barY + HEIGHT + 4,
      cursorX + 6,
      barY + HEIGHT + 4
    )
  }

  // Barra fina bajo la de equilibrio que se llena desde el centro hacia el lado
  // en que empuja el jugador, proporcional a su inclinación
  _updateIndicator() {
    if (!this._indicator) return

    const { HEIGHT } = BALANCE.BAR
    const x = GAME_WIDTH / 2 - INDICATOR.WIDTH / 2
    const y = CONTROL_PANEL.CENTER_Y + HEIGHT / 2 + INDICATOR.GAP
    const fill = Math.round(this._analogInput * (INDICATOR.WIDTH / 2))

    this._indicator.clear()
    this._indicator.fillStyle(COLORS.BLACK, 1)
    this._indicator.fillRect(x - 2, y - 2, INDICATOR.WIDTH + 4, INDICATOR.HEIGHT + 4)
    this._indicator.fillStyle(0x1a1a2e, 1)
    this._indicator.fillRect(x, y, INDICATOR.WIDTH, INDICATOR.HEIGHT)
    this._indicator.fillStyle(COLORS.GOLD, 1)
    this._indicator.fillRect(
      GAME_WIDTH / 2 + Math.min(0, fill),
      y,
      Math.abs(fill),
      INDICATOR.HEIGHT
    )
    this._indicator.fillStyle(COLORS.WHITE, 1)
    this._indicator.fillRect(GAME_WIDTH / 2 - 1, y - 2, 2, INDICATOR.HEIGHT + 4)
  }

  _updateTimer() {
    if (!this._timerText || !this._balanceSystem) return
    this._timerText.setText(`${this._balanceSystem.getElapsedTime().toFixed(1)}s`)
  }
}
