import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, PHASE1, POLE, MOVEMENT, CONTROL_PANEL } from '../config/gameConfig'
import { PowerBar } from '../entities/PowerBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'

export class GameScene extends Scene {

  constructor() {
    super(SCENES.GAME)
  }

  init(data) {
    this.characterData = data.character || null
    this.phase = null
    this.impulseResult = null

    // Posición del personaje
    this.poleY = GAME_HEIGHT * POLE.Y_FACTOR
    this.waterY = GAME_HEIGHT * 0.6
    this.playerX = POLE.START_X
    this.playerY = this.poleY - 4

    // Movimiento
    this.distanceTraveled = 0
    this.maxDistance = 0
    this.initialSpeed = 0
    this.runDuration = 0
    this.runElapsed = 0

    // UI tracking para limpieza
    this.phase1UI = []
    this.canRestart = false
  }

  create() {
    this.drawSimpleBackground()
    this.drawPole()
    this.createPlayer()
    this.createControlPanel()
    this.createHUD()
    this.startPhase1()
    this.setupInput()
  }

  // ========================================
  // FASE 1 — Barra de impulso
  // ========================================

  startPhase1() {
    const weight = this.characterData?.stats?.peso || 5
    this.powerBar = new PowerBar(weight)
    this.impulseSystem = new ImpulseSystem(this.powerBar)
    this.phase = 'impulse'
    this.createPowerBarUI()
  }

  createPowerBarUI() {
    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX = GAME_WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX = centerX - WIDTH / 2

    // Gráficos estáticos de la barra
    const barBg = this.add.graphics()
    this.drawBarZones(barBg, barX, barY, WIDTH, HEIGHT)
    this.phase1UI.push(barBg)

    // Etiquetas de zona
    const zoneLabelStyle = {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#000000',
      fontStyle: 'bold',
    }
    const { ZONES } = PHASE1
    const redCenter = barX + (ZONES.RED.end / 2) * WIDTH
    const yellowCenter = barX + ((ZONES.YELLOW.start + ZONES.YELLOW.end) / 2) * WIDTH
    const greenCenter = barX + ((ZONES.GREEN.start + ZONES.GREEN.end) / 2) * WIDTH

    this.phase1UI.push(
      this.add.text(redCenter, barY + HEIGHT / 2, 'MALA', zoneLabelStyle).setOrigin(0.5),
      this.add.text(yellowCenter, barY + HEIGHT / 2, 'REGULAR', zoneLabelStyle).setOrigin(0.5),
      this.add.text(greenCenter, barY + HEIGHT / 2, 'ÓPTIMA', zoneLabelStyle).setOrigin(0.5),
    )

    // Cursor móvil
    this.barCursor = this.add.graphics()
    this.phase1UI.push(this.barCursor)

    // Contador de intentos (encima de la barra)
    this.passText = this.add.text(centerX, barY - 16, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5)
    this.phase1UI.push(this.passText)

    // Texto de instrucción (debajo de la barra)
    this.instructionText = this.add.text(centerX, barY + HEIGHT + 20, '¡PULSA PARA DETENER!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5)
    this.phase1UI.push(this.instructionText)

    this.instructionTween = this.tweens.add({
      targets: this.instructionText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Peso del personaje como pista
    const weightLabel = this.characterData?.stats?.peso || 5
    this.phase1UI.push(
      this.add.text(barX + WIDTH + 16, barY + HEIGHT / 2, `PESO: ${weightLabel}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5)
    )

    this.updatePassCounter()
  }

  drawBarZones(graphics, x, y, width, height) {
    const g = graphics
    const { ZONES } = PHASE1

    g.fillStyle(0x111111, 1)
    g.fillRect(x - 3, y - 3, width + 6, height + 6)

    const redWidth = ZONES.RED.end * width
    g.fillStyle(COLORS.RED, 1)
    g.fillRect(x, y, redWidth, height)

    const yellowX = ZONES.YELLOW.start * width
    const yellowWidth = (ZONES.YELLOW.end - ZONES.YELLOW.start) * width
    g.fillStyle(COLORS.YELLOW, 1)
    g.fillRect(x + yellowX, y, yellowWidth, height)

    const greenX = ZONES.GREEN.start * width
    const greenWidth = (ZONES.GREEN.end - ZONES.GREEN.start) * width
    g.fillStyle(COLORS.GREEN, 1)
    g.fillRect(x + greenX, y, greenWidth, height)

    g.lineStyle(2, COLORS.WHITE, 0.8)
    g.strokeRect(x, y, width, height)

    g.lineStyle(2, 0x000000, 0.6)
    const sep1 = x + ZONES.RED.end * width
    const sep2 = x + ZONES.YELLOW.end * width
    g.beginPath()
    g.moveTo(sep1, y)
    g.lineTo(sep1, y + height)
    g.strokePath()
    g.beginPath()
    g.moveTo(sep2, y)
    g.lineTo(sep2, y + height)
    g.strokePath()
  }

  updatePowerBarUI() {
    if (!this.barCursor) return

    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX = GAME_WIDTH / 2
    const barX = centerX - WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const cursorX = barX + this.powerBar.position * WIDTH

    this.barCursor.clear()
    this.barCursor.fillStyle(COLORS.WHITE, 1)
    this.barCursor.fillRect(cursorX - 2, barY - 8, 4, HEIGHT + 16)
    this.barCursor.fillTriangle(
      cursorX, barY - 14,
      cursorX - 7, barY - 6,
      cursorX + 7, barY - 6
    )
    this.barCursor.fillTriangle(
      cursorX, barY + HEIGHT + 14,
      cursorX - 7, barY + HEIGHT + 6,
      cursorX + 7, barY + HEIGHT + 6
    )
  }

  updatePassCounter() {
    if (!this.passText) return
    const attempt = Math.min(this.powerBar.passes + 1, this.powerBar.maxPasses)
    this.passText.setText(`INTENTO ${attempt}/${this.powerBar.maxPasses}`)
  }

  onBarStopped() {
    this.impulseResult = this.impulseSystem.isActive()
      ? this.impulseSystem.stop()
      : this.impulseSystem.getResult()
    this.startRunning()
  }

  cleanPhase1UI() {
    this.phase1UI.forEach(el => {
      if (el && el.destroy) el.destroy()
    })
    this.phase1UI = []
    this.barCursor = null
    this.passText = null
    this.instructionText = null
  }

  // ========================================
  // MOVIMIENTO DEL PERSONAJE
  // ========================================

  startRunning() {
    this.cleanPhase1UI()
    this.phase = 'running'

    const impulse = this.impulseResult.impulseValue
    const poleLength = POLE.START_X - POLE.END_X

    // Sin impulso → cae directamente
    if (impulse <= 0.01) {
      this.maxDistance = 0
      this.distanceTraveled = 0
      this.startFalling()
      return
    }

    this.maxDistance = impulse * poleLength

    // Duración proporcional al impulso (más impulso = más recorrido = más tiempo)
    this.runDuration = MOVEMENT.MIN_RUN_DURATION
      + impulse * (MOVEMENT.MAX_RUN_DURATION - MOVEMENT.MIN_RUN_DURATION)

    // Velocidad inicial calculada para que con desaceleración lineal
    // recorra exactamente maxDistance en runDuration
    // v(t) = v0*(1 - t/T), x(T) = v0*T/2 → v0 = 2*maxDistance/T
    this.initialSpeed = 2 * this.maxDistance / this.runDuration
    this.runElapsed = 0
    this.distanceTraveled = 0
  }

  updateRunning(delta) {
    const dt = delta / 1000
    this.runElapsed += dt

    // ¿Ha terminado el recorrido?
    if (this.runElapsed >= this.runDuration) {
      this.playerX = POLE.START_X - this.maxDistance
      this.distanceTraveled = this.maxDistance
      this.redrawPlayer()
      this.startFalling()
      return
    }

    const t = this.runElapsed
    const T = this.runDuration

    // Desaceleración lineal: x(t) = v0 * t * (1 - t/(2T))
    this.distanceTraveled = this.initialSpeed * t * (1 - t / (2 * T))
    this.playerX = POLE.START_X - this.distanceTraveled

    // Seguridad: no pasar de la bandera
    if (this.playerX <= POLE.END_X) {
      this.playerX = POLE.END_X
      this.distanceTraveled = POLE.START_X - POLE.END_X
      this.redrawPlayer()
      this.startFalling()
      return
    }

    this.redrawPlayer()
  }

  // ========================================
  // CAÍDA AL AGUA
  // ========================================

  startFalling() {
    this.phase = 'falling'

    this.tweens.add({
      targets: this,
      playerY: this.waterY + 40,
      duration: MOVEMENT.FALL_DURATION,
      ease: 'Quad.easeIn',
      onUpdate: () => this.redrawPlayer(),
      onComplete: () => {
        this.playerGraphics.setVisible(false)
        this.createSplash()
        this.showGameOver()
      },
    })
  }

  createSplash() {
    const splashX = this.playerX
    const splashY = this.waterY

    for (let i = 0; i < 10; i++) {
      const dropG = this.add.graphics()
      const offsetX = Phaser.Math.Between(-15, 15)
      const size = Phaser.Math.Between(2, 5)

      dropG.fillStyle(COLORS.WHITE, 0.9)
      dropG.fillRect(splashX + offsetX, splashY, size, size)

      // Cada gota sube y luego cae
      this.tweens.add({
        targets: dropG,
        y: -Phaser.Math.Between(20, 50),
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Quad.easeOut',
        onComplete: () => dropG.destroy(),
      })
    }
  }

  // ========================================
  // GAME OVER
  // ========================================

  showGameOver() {
    this.phase = 'done'

    const centerX = GAME_WIDTH / 2
    const centerY = GAME_HEIGHT / 2

    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.85)
    g.fillRect(centerX - 200, centerY - 60, 400, 120)
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(centerX - 200, centerY - 60, 400, 120)

    this.add.text(centerX, centerY - 20, '¡AL AGUA!', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ff6644',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)

    const poleLength = POLE.START_X - POLE.END_X
    const distPercent = Math.round((this.distanceTraveled / poleLength) * 100)
    this.add.text(centerX, centerY + 20, `DISTANCIA: ${distPercent}%`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Reinicio con retardo para evitar doble tap
    this.time.delayedCall(1000, () => {
      this.canRestart = true
      const restartText = this.add.text(centerX, centerY + 80, 'PULSA PARA REINTENTAR', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaaaaa',
      }).setOrigin(0.5)
      this.tweens.add({
        targets: restartText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      })
    })
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.on('pointerdown', () => this.handleTap())
    this.input.keyboard.on('keydown-SPACE', () => this.handleTap())
    this.input.keyboard.on('keydown-ESC', () => this.scene.start(SCENES.MENU))
  }

  handleTap() {
    if (this.phase === 'impulse' && this.impulseSystem.isActive()) {
      this.onBarStopped()
    } else if (this.phase === 'done' && this.canRestart) {
      this.scene.restart({ character: this.characterData })
    }
  }

  // ========================================
  // FONDO Y ESCENARIO (layout invertido: barcaza derecha, bandera izquierda)
  // ========================================

  drawSimpleBackground() {
    // Fondo pixel art a tamaño completo (el panel se dibuja encima)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
  }

  createControlPanel() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BLACK, 1)
    g.fillRect(0, CONTROL_PANEL.Y, GAME_WIDTH, CONTROL_PANEL.HEIGHT)
  }

  drawPole() {
    const g = this.add.graphics()

    // Barcaza (DERECHA)
    g.fillStyle(0x5c3a1e, 1)
    g.fillRect(884, this.poleY + 10, 120, 25)
    g.fillRect(894, this.poleY + 35, 100, 10)
    g.lineStyle(1, 0x3d2510, 1)
    g.strokeRect(884, this.poleY + 10, 120, 25)

    // Soporte del palo (DERECHA)
    g.fillStyle(0x4a3520, 1)
    g.fillRect(866, this.poleY - 15, 20, 30)

    // Palo de la cucaña (de derecha a izquierda)
    g.fillStyle(COLORS.WOOD_LIGHT, 1)
    g.fillRect(POLE.END_X - 10, this.poleY - 4, POLE.START_X - POLE.END_X + 30, 10)

    // Bandera (IZQUIERDA — final del recorrido)
    g.fillStyle(COLORS.WOOD_DARK, 1)
    g.fillRect(POLE.END_X - 6, this.poleY - 30, 3, 36)
    g.fillStyle(COLORS.WHITE, 1)
    g.fillRect(POLE.END_X - 24, this.poleY - 30, 18, 12)
  }

  // ========================================
  // PERSONAJE (movible — se redibuja cada frame)
  // ========================================

  createPlayer() {
    this.playerGraphics = this.add.graphics()
    this.redrawPlayer()
  }

  redrawPlayer() {
    const g = this.playerGraphics
    g.clear()

    const px = this.playerX
    const py = this.playerY

    // Cabeza
    g.fillStyle(0xffcc88, 1)
    g.fillRect(px - 6, py - 36, 12, 12)
    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(px - 6, py - 38, 12, 4)
    // Camiseta
    g.fillStyle(0xcc3333, 1)
    g.fillRect(px - 8, py - 24, 16, 14)
    // Pantalón
    g.fillStyle(0x2244aa, 1)
    g.fillRect(px - 7, py - 10, 6, 10)
    g.fillRect(px + 1, py - 10, 6, 10)
    // Brazos
    g.fillStyle(0xffcc88, 1)
    g.fillRect(px - 14, py - 22, 6, 12)
    g.fillRect(px + 8, py - 22, 6, 12)
  }

  // ========================================
  // HUD
  // ========================================

  createHUD() {
    const g = this.add.graphics()

    g.fillStyle(COLORS.DARK_BG, 0.8)
    g.fillRect(0, 0, GAME_WIDTH, 36)
    g.fillStyle(COLORS.GOLD, 1)
    g.fillRect(0, 36, GAME_WIDTH, 2)

    const charName = this.characterData?.name || 'JUGADOR'
    this.add.text(16, 10, charName, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    })

    this.add.text(GAME_WIDTH / 2, 10, 'FASE 1: IMPULSO', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    this.add.text(GAME_WIDTH - 16, 10, 'ESC: MENÚ', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666',
    }).setOrigin(1, 0)
  }

  // ========================================
  // UPDATE
  // ========================================

  update(time, delta) {
    if (this.phase === 'impulse') {
      this.impulseSystem.update(delta / 1000)
      this.updatePowerBarUI()
      this.updatePassCounter()

      if (this.powerBar.finished) {
        this.onBarStopped()
      }
    }

    if (this.phase === 'running') {
      this.updateRunning(delta)
    }
  }
}
