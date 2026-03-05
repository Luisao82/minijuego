import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, PHASE1, POLE, MOVEMENT, CONTROL_PANEL, BOAT, JUMP, BALANCE } from '../config/gameConfig'
import { PowerBar } from '../entities/PowerBar'
import { BalanceBar } from '../entities/BalanceBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'
import { BalanceSystem } from '../systems/BalanceSystem'

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
    this.waterY = this.poleY + 60  // El agua está justo debajo del palo
    this.playerX = POLE.START_X
    this.playerY = this.poleY - 4

    // Movimiento
    this.distanceTraveled = 0
    this.maxDistance = 0
    this.initialSpeed = 0
    this.runDuration = 0
    this.runElapsed = 0

    // Salto
    this.isJumping = false
    this.hasJumped = false
    this.jumpElapsed = 0
    this.jumpStartX = 0
    this.jumpStartY = 0
    this.jumpVx = 0
    this.jumpVy0 = 0

    // Bandera
    this.hasFlag = false
    this.flagGraphics = null

    // Equilibrio (Fase 2 — activo durante la carrera)
    this.balanceBar = null
    this.balanceSystem = null
    this.balanceUI = []
    this.balanceInputDir = 0  // -1 izq, 0 nada, +1 der

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

    g.fillStyle(0x000000, 1)
    g.fillRect(x - 3, y - 3, width + 6, height + 6)

    const redWidth = ZONES.RED.end * width
    g.fillGradientStyle(COLORS.RED,COLORS.YELLOW,COLORS.RED,COLORS.YELLOW ,1,1,1,1)
    g.fillRect(x, y, redWidth, height)

    const yellowX = ZONES.YELLOW.start * width
    const yellowWidth = (ZONES.YELLOW.end - ZONES.YELLOW.start) * width
  
    
    g.fillStyle(COLORS.YELLOW, 1)
    g.fillRect(x + yellowX, y, yellowWidth, height)

    const greenX = ZONES.GREEN.start * width
    const greenWidth = (ZONES.GREEN.end - ZONES.GREEN.start) * width

    g.fillGradientStyle(COLORS.YELLOW,COLORS.GREEN,COLORS.YELLOW,COLORS.GREEN ,1,1,1,1)
    g.fillRect(x + greenX, y, greenWidth, height)

    g.lineStyle(2, COLORS.WHITE, 0.8)
    g.strokeRect(x, y, width, height)

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

    // Iniciar equilibrio (Fase 2) junto con la carrera
    const equilibrio = this.characterData?.stats?.equilibrio || 5
    this.balanceBar = new BalanceBar(equilibrio)
    this.balanceSystem = new BalanceSystem(this.balanceBar)
    this.balanceInputDir = 0
    this.createBalanceUI()
  }

  updateRunning(delta) {
    const dt = delta / 1000

    // Actualizar equilibrio (Fase 2)
    if (this.balanceBar) {
      this.balanceSystem.update(dt, this.balanceInputDir)
      this.updateBalanceUI()

      if (this.balanceSystem.isFailed()) {
        this.onBalanceLost()
        return
      }
    }

    // Si la carrera ya terminó, el personaje se queda en el palo manteniendo equilibrio
    // (puede saltar para intentar llegar a la bandera)
    if (this.runElapsed >= this.runDuration) {
      return
    }

    this.runElapsed += dt

    // ¿Ha terminado el recorrido en este frame?
    if (this.runElapsed >= this.runDuration) {
      this.playerX = POLE.START_X - this.maxDistance
      this.distanceTraveled = this.maxDistance

      if (this.playerX < POLE.END_X) {
        this.playerX = POLE.END_X
        this.distanceTraveled = POLE.START_X - POLE.END_X
      }

      // Auto-grab si llega a la bandera
      if (!this.hasFlag && this.checkFlagCollision()) {
        this.redrawPlayer()
        this.grabFlag()
        return
      }

      this.redrawPlayer()
      return
    }

    // Movimiento con desaceleración lineal
    const t = this.runElapsed
    const T = this.runDuration
    this.distanceTraveled = this.initialSpeed * t * (1 - t / (2 * T))
    this.playerX = POLE.START_X - this.distanceTraveled

    // Auto-grab si pasa por la bandera durante la carrera
    if (!this.hasFlag && this.checkFlagCollision()) {
      this.playerX = POLE.END_X
      this.distanceTraveled = POLE.START_X - POLE.END_X
      this.redrawPlayer()
      this.grabFlag()
      return
    }

    this.redrawPlayer()
  }

  // ========================================
  // SALTO
  // ========================================

  startJump() {
    this.cleanBalanceUI()
    this.balanceBar = null
    this.balanceSystem = null

    this.hasJumped = true
    this.isJumping = true
    this.phase = 'jumping'
    this.jumpElapsed = 0
    this.jumpStartX = this.playerX
    this.jumpStartY = this.playerY

    // Velocidad horizontal actual de la carrera (puede ser ~0 si ya frenó)
    const t = this.runElapsed
    const T = this.runDuration
    const currentRunSpeed = T > 0 ? Math.max(this.initialSpeed * (1 - t / T), 0) : 0

    // Tiempo estimado de vuelo hasta el agua (fórmula cuadrática)
    // 0.5*g*t² + vy0*t - drop = 0, drop = waterY - playerY
    const drop = this.waterY - this.playerY
    const a = 0.5 * JUMP.GRAVITY
    const b = JUMP.VY0
    const c = -drop
    const discriminant = b * b - 4 * a * c
    const flightTime = (-b + Math.sqrt(discriminant)) / (2 * a)

    // Velocidad extra del salto para cubrir EXTRA_DISTANCE
    const jumpDistance = this.characterData?.stats?.jump
      ? this.characterData.stats.jump
      : JUMP.EXTRA_DISTANCE
    const boostSpeed = jumpDistance / flightTime

    this.jumpVx = currentRunSpeed + boostSpeed
    this.jumpVy0 = JUMP.VY0
  }

  updateJumping(delta) {
    const dt = delta / 1000
    this.jumpElapsed += dt

    // Posición con física de proyectil
    this.playerX = this.jumpStartX - this.jumpVx * this.jumpElapsed
    this.playerY = this.jumpStartY + this.jumpVy0 * this.jumpElapsed
      + 0.5 * JUMP.GRAVITY * this.jumpElapsed * this.jumpElapsed

    // Actualizar distancia recorrida para el HUD
    this.distanceTraveled = POLE.START_X - this.playerX

    // Auto-grab bandera si colisiona durante el salto
    if (!this.hasFlag && this.checkFlagCollision()) {
      this.hasFlag = true
      this.flagGraphics.setVisible(false)
    }

    // Llegó al agua
    if (this.playerY >= this.waterY) {
      this.playerY = this.waterY
      this.isJumping = false
      this.playerGraphics.setVisible(false)
      this.createSplash()
      if (this.hasFlag) {
        this.time.delayedCall(600, () => this.showCelebration())
      } else {
        this.time.delayedCall(400, () => {
          this.showHeadInWater()
          this.showGameOver()
        })
      }
      this.phase = 'splash_done'
      return
    }

    this.redrawPlayer()
  }

  // ========================================
  // COLISIÓN CON LA BANDERA
  // ========================================

  checkFlagCollision() {
    // Hitbox del personaje (aproximado)
    const charTop = this.playerY - 36
    const charBottom = this.playerY + 4
    const charLeft = this.playerX - 12

    // Hitbox de la bandera (palo + tela)
    const flagTop = this.poleY - 28
    const flagBottom = this.poleY + 2
    const flagRight = POLE.END_X + POLE.FLAG_GRAB_RANGE

    // Overlap en ambos ejes (AABB)
    return charLeft <= flagRight && charTop < flagBottom && charBottom > flagTop
  }

  grabFlag() {
    this.hasFlag = true
    this.flagGraphics.setVisible(false)
    this.cleanBalanceUI()
    this.balanceBar = null
    this.balanceSystem = null
    this.redrawPlayer()
    // Cae al agua con la bandera → celebración
    this.startFalling()
  }

  // ========================================
  // FASE 2 — EQUILIBRIO
  // ========================================

  createBalanceUI() {
    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX = GAME_WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX = centerX - WIDTH / 2

    // Fondo de la barra
    const barBg = this.add.graphics()
    barBg.fillStyle(COLORS.BLACK, 1)
    barBg.fillRect(barX - 3, barY - 3, WIDTH + 6, HEIGHT + 6)
    // Interior oscuro
    barBg.fillStyle(0x1a1a2e, 1)
    barBg.fillRect(barX, barY, WIDTH, HEIGHT)
    // Borde
    barBg.lineStyle(2, COLORS.WHITE, 0.6)
    barBg.strokeRect(barX, barY, WIDTH, HEIGHT)

    // Línea central verde (equilibrio perfecto)
    barBg.fillStyle(COLORS.GREEN, 1)
    barBg.fillRect(centerX - 1, barY - 4, 2, HEIGHT + 8)

    // Marcas de límite izquierda y derecha
    const limitOffset = BALANCE.LIMIT * (WIDTH / 2)
    barBg.fillStyle(COLORS.RED, 0.6)
    barBg.fillRect(centerX - limitOffset - 1, barY - 2, 2, HEIGHT + 4)
    barBg.fillRect(centerX + limitOffset - 1, barY - 2, 2, HEIGHT + 4)

    // Zonas de peligro (fondo rojizo cerca de los límites)
    barBg.fillStyle(COLORS.RED, 0.2)
    barBg.fillRect(barX, barY, WIDTH * ((1 - BALANCE.LIMIT) / 2), HEIGHT)
    barBg.fillRect(barX + WIDTH - WIDTH * ((1 - BALANCE.LIMIT) / 2), barY, WIDTH * ((1 - BALANCE.LIMIT) / 2), HEIGHT)

    this.balanceUI.push(barBg)

    // Cursor rojo móvil
    this.balanceCursor = this.add.graphics()
    this.balanceUI.push(this.balanceCursor)

    // Texto de instrucción
    const instrText = this.add.text(centerX, barY - 20, '¡MANTÉN EL EQUILIBRIO!', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5)
    this.balanceUI.push(instrText)

    // Temporizador visual
    this.balanceTimerText = this.add.text(centerX, barY + HEIGHT + 16, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#aaaaaa',
    }).setOrigin(0.5)
    this.balanceUI.push(this.balanceTimerText)

    // Botón izquierdo (◀) — cerca del pulgar izquierdo
    const btnSize = BALANCE.BUTTON_SIZE
    const btnY = CONTROL_PANEL.CENTER_Y - btnSize / 2
    const btnMargin = 40

    this.btnLeft = this.add.graphics()
    this.drawBalanceButton(this.btnLeft, btnMargin, btnY, btnSize, '◀')
    this.btnLeft.setInteractive(
      new Phaser.Geom.Rectangle(btnMargin, btnY, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains,
    )
    this.btnLeft.on('pointerdown', () => { this.balanceInputDir = -1 })
    this.btnLeft.on('pointerup', () => { if (this.balanceInputDir === -1) this.balanceInputDir = 0 })
    this.btnLeft.on('pointerout', () => { if (this.balanceInputDir === -1) this.balanceInputDir = 0 })
    this.balanceUI.push(this.btnLeft)

    // Texto del botón izquierdo
    const btnLeftText = this.add.text(btnMargin + btnSize / 2, btnY + btnSize / 2, '◀', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
    this.balanceUI.push(btnLeftText)

    // Botón derecho (▶) — cerca del pulgar derecho
    const btnRightX = GAME_WIDTH - btnMargin - btnSize

    this.btnRight = this.add.graphics()
    this.drawBalanceButton(this.btnRight, btnRightX, btnY, btnSize, '▶')
    this.btnRight.setInteractive(
      new Phaser.Geom.Rectangle(btnRightX, btnY, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains,
    )
    this.btnRight.on('pointerdown', () => { this.balanceInputDir = 1 })
    this.btnRight.on('pointerup', () => { if (this.balanceInputDir === 1) this.balanceInputDir = 0 })
    this.btnRight.on('pointerout', () => { if (this.balanceInputDir === 1) this.balanceInputDir = 0 })
    this.balanceUI.push(this.btnRight)

    // Texto del botón derecho
    const btnRightText = this.add.text(btnRightX + btnSize / 2, btnY + btnSize / 2, '▶', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
    this.balanceUI.push(btnRightText)
  }

  drawBalanceButton(graphics, x, y, size) {
    const g = graphics
    // Fondo del botón pixel art
    g.fillStyle(0x2a2a4a, 1)
    g.fillRect(x, y, size, size)
    // Borde exterior
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(x, y, size, size)
    // Borde interior (doble marco retro)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(x + 3, y + 3, size - 6, size - 6)
  }

  updateBalanceUI() {
    if (!this.balanceCursor || !this.balanceBar) return

    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX = GAME_WIDTH / 2
    const barY = CONTROL_PANEL.CENTER_Y - HEIGHT / 2

    // Posición del cursor: position va de -1 a +1, mapear a la barra
    const cursorX = centerX + this.balanceBar.position * (WIDTH / 2)

    this.balanceCursor.clear()
    this.balanceCursor.fillStyle(COLORS.RED, 1)
    this.balanceCursor.fillRect(cursorX - 2, barY - 6, 4, HEIGHT + 12)
    // Triángulos indicadores arriba y abajo
    this.balanceCursor.fillTriangle(
      cursorX, barY - 12,
      cursorX - 6, barY - 4,
      cursorX + 6, barY - 4,
    )
    this.balanceCursor.fillTriangle(
      cursorX, barY + HEIGHT + 12,
      cursorX - 6, barY + HEIGHT + 4,
      cursorX + 6, barY + HEIGHT + 4,
    )

    // Actualizar temporizador (tiempo en equilibrio)
    if (this.balanceTimerText && this.balanceSystem) {
      const elapsed = this.balanceSystem.getElapsedTime()
      this.balanceTimerText.setText(`${elapsed.toFixed(1)}s`)
    }
  }

  onBalanceLost() {
    this.cleanBalanceUI()
    this.balanceBar = null
    this.balanceSystem = null
    this.startFalling()
  }

  cleanBalanceUI() {
    this.balanceUI.forEach(el => {
      if (el && el.destroy) el.destroy()
    })
    this.balanceUI = []
    this.balanceCursor = null
    this.balanceTimerText = null
    this.btnLeft = null
    this.btnRight = null
    this.balanceInputDir = 0
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
        if (this.hasFlag) {
          this.time.delayedCall(600, () => this.showCelebration())
        } else {
          this.time.delayedCall(400, () => {
            this.showHeadInWater()
            this.showGameOver()
          })
        }
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

  showHeadInWater() {
    const g = this.add.graphics()
    const cx = this.playerX
    const wy = this.waterY

    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, wy - 16, 10, 4)
    // Cabeza
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, wy - 12, 10, 10)
  }

  showGameOver() {
    this.phase = 'done'

    const centerX = GAME_WIDTH / 2
    const centerY = CONTROL_PANEL.Y / 2

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
  // CELEBRACIÓN (bandera cogida)
  // ========================================

  showCelebration() {
    this.phase = 'celebrating'

    this.celebGraphics = this.add.graphics()
    this.celebFrame = 0
    this.drawCelebration()

    // Alternar frames para efecto de agitar bandera
    this.celebTimer = this.time.addEvent({
      delay: 350,
      callback: () => {
        this.celebFrame = 1 - this.celebFrame
        this.drawCelebration()
      },
      loop: true,
    })

    // Mostrar pantalla de victoria tras la celebración
    this.time.delayedCall(2500, () => {
      this.celebTimer.destroy()
      this.showVictory()
    })
  }

  drawCelebration() {
    const g = this.celebGraphics
    g.clear()
    const cx = this.playerX
    const wy = this.waterY

    // Cabeza asomando del agua
    g.fillStyle(0x3d2510, 1)
    g.fillRect(cx - 6, wy - 14, 10, 4)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(cx - 6, wy - 11, 10, 10)

    // Brazo levantado agitando la bandera (1px separado de la cabeza, más corto)
    const wave = this.celebFrame === 0 ? -2 : 2
    g.fillStyle(0xf0bb78, 1)
    g.fillRect(cx + wave - 2, wy - 28, 5, 14)

    // Palo de la bandera (más corto)
    g.fillStyle(COLORS.WOOD_DARK, 1)
    g.fillRect(cx + wave - 1, wy - 45, 3, 16)

    // Bandera blanca (cambia de lado al agitar)
    g.fillStyle(COLORS.WHITE, 1)
    if (this.celebFrame === 0) {
      g.fillRect(cx + wave + 2, wy - 45, 14, 10)
    } else {
      g.fillRect(cx + wave - 16, wy - 45, 14, 10)
    }
  }

  showVictory() {
    this.phase = 'done'

    const centerX = GAME_WIDTH / 2
    const centerY = CONTROL_PANEL.Y / 2

    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.85)
    g.fillRect(centerX - 200, centerY - 60, 400, 120)
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(centerX - 200, centerY - 60, 400, 120)

    this.add.text(centerX, centerY - 20, '¡BANDERA!', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)

    this.add.text(centerX, centerY + 20, '¡HAS COGIDO LA BANDERA!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5)

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
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))
    this.input.keyboard.on('keydown-SPACE', (event) => {
      if (event.repeat) return
      this.handleTap(null)
    })
    this.input.keyboard.on('keydown-ESC', () => this.scene.start(SCENES.MENU))

    // Flechas para el equilibrio (activo durante la carrera)
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.phase === 'running' && this.balanceBar) this.balanceInputDir = -1
    })
    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.phase === 'running' && this.balanceBar) this.balanceInputDir = 1
    })
    this.input.keyboard.on('keyup-LEFT', () => {
      if (this.balanceInputDir === -1) this.balanceInputDir = 0
    })
    this.input.keyboard.on('keyup-RIGHT', () => {
      if (this.balanceInputDir === 1) this.balanceInputDir = 0
    })
  }

  handleTap(pointer) {
    if (this.phase === 'impulse' && this.impulseSystem.isActive()) {
      this.onBarStopped()
    } else if (this.phase === 'running' && !this.hasJumped) {
      // Ignorar taps en la zona del panel (botones de equilibrio)
      if (pointer && pointer.y >= CONTROL_PANEL.Y) return
      this.startJump()
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

    // Palo — prolongación horizontal del barco, pegado a su borde izquierdo
    // Se extiende desde el barco hacia la izquierda con un pequeño overlap
    const poleOverlap = 30
    g.fillStyle(COLORS.WOOD_LIGHT, 1)
    g.fillRect(POLE.END_X, this.poleY - 3, POLE.LENGTH + poleOverlap, 9)
    // Borde superior/inferior para dar volumen
    g.lineStyle(1, COLORS.WOOD_DARK, 0.6)
    g.strokeRect(POLE.END_X, this.poleY - 3, POLE.LENGTH + poleOverlap, 9)

    // Bandera (IZQUIERDA — separada para poder ocultarla al cogerla)
    this.flagGraphics = this.add.graphics()
    this.flagGraphics.fillStyle(COLORS.WOOD_DARK, 1)
    this.flagGraphics.fillRect(POLE.END_X - 2, this.poleY - 28, 3, 30)
    this.flagGraphics.fillStyle(COLORS.WHITE, 1)
    this.flagGraphics.fillRect(POLE.END_X - 18, this.poleY - 28, 16, 10)

    // Barco (sprite) — centro del barco alineado verticalmente con el palo
    const boatCenterX = BOAT.RIGHT_X - BOAT.DISPLAY_WIDTH / 2
    const boatCenterY = this.poleY + BOAT.DISPLAY_HEIGHT * (0.15 - BOAT.DECK_Y_RATIO)
    this.add.image(boatCenterX, boatCenterY, 'boat')
      .setDisplaySize(BOAT.DISPLAY_WIDTH, BOAT.DISPLAY_HEIGHT)
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

    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(px - 5, py - 36, 10, 4)
    // Cabeza
    g.fillStyle(0xffcc88, 1)
    g.fillRect(px - 5, py - 32, 10, 10)
    // Torso (piel desnuda)
    g.fillStyle(0xffffff, 1)
    g.fillRect(px - 7, py - 22, 14, 14)
    // Bañador rojo
    g.fillStyle(0xcc2222, 1)
    g.fillRect(px - 7, py - 8, 14, 6)
    // Piernas (piel)
    g.fillStyle(0xf0bb78, 1)
    g.fillRect(px - 6, py - 2, 5, 6)
    g.fillRect(px + 1, py - 2, 5, 6)

    if (this.isJumping && this.hasFlag) {
      // Saltando con bandera: brazo izquierdo arriba con bandera, derecho adelante
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px - 12, py - 42, 5, 22)
      g.fillStyle(COLORS.WOOD_DARK, 1)
      g.fillRect(px - 11, py - 64, 3, 24)
      g.fillStyle(COLORS.WHITE, 1)
      g.fillRect(px - 8, py - 64, 14, 10)
      // Brazo derecho estirado hacia delante (izquierda en pantalla)
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px - 19, py - 20, 12, 5)
    } else if (this.isJumping) {
      // Saltando sin bandera: ambos brazos estirados hacia delante (pose superman)
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px - 19, py - 22, 12, 5)
      g.fillRect(px - 19, py - 16, 12, 5)
    } else if (this.hasFlag) {
      // En el palo con bandera: brazo izquierdo arriba con bandera
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px + 7, py - 20, 5, 12)
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px - 12, py - 42, 5, 22)
      g.fillStyle(COLORS.WOOD_DARK, 1)
      g.fillRect(px - 11, py - 64, 3, 24)
      g.fillStyle(COLORS.WHITE, 1)
      g.fillRect(px - 8, py - 64, 14, 10)
    } else {
      // Brazos normales (piel)
      g.fillStyle(0xf0bb78, 1)
      g.fillRect(px - 12, py - 20, 5, 12)
      g.fillRect(px + 7, py - 20, 5, 12)
    }
  }

  // ========================================
  // HUD
  // ========================================

  createHUD() {
    const g = this.add.graphics()

    g.fillStyle(COLORS.DARK_BG, 0.4)
    g.fillRect(0, 0, GAME_WIDTH, 36)
    g.fillStyle(COLORS.GOLD, 1)
    g.fillRect(0, 36, GAME_WIDTH, 2)

    const charName = this.characterData?.name || 'JUGADOR'
    this.add.text(16, 10, charName, {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    })

   
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

    if (this.phase === 'jumping') {
      this.updateJumping(delta)
    }
  }
}
