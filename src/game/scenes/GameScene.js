import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, PHASE1, POLE, MOVEMENT, CONTROL_PANEL, BOAT, JUMP, BALANCE, OIL } from '../config/gameConfig'
import { Player } from '../entities/Player'
import { PowerBar } from '../entities/PowerBar'
import { makeNavButton } from '../components/NavButton'
import { BalanceBar } from '../entities/BalanceBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'
import { BalanceSystem } from '../systems/BalanceSystem'
import { OilSystem } from '../systems/OilSystem'
import { createOilIndicator } from '../components/OilIndicator'

export class GameScene extends Scene {

  constructor() {
    super(SCENES.GAME)
  }

  init(data) {
    this.characterData = data.character || null
    this.phase = null
    this.impulseResult = null

    // Posición del palo y el agua
    this.poleY  = GAME_HEIGHT * POLE.Y_FACTOR
    this.waterY = this.poleY + 60

    // Movimiento
    this.distanceTraveled = 0
    this.maxDistance      = 0
    this.initialSpeed     = 0
    this.runDuration      = 0
    this.runElapsed       = 0

    // Salto
    this.isJumping  = false
    this.hasJumped  = false
    this.jumpElapsed = 0
    this.jumpStartX  = 0
    this.jumpStartY  = 0
    this.jumpVx      = 0
    this.jumpVy0     = 0

    // Bandera
    this.hasFlag    = false
    this.flagGraphics = null

    // Equilibrio
    this.balanceBar      = null
    this.balanceSystem   = null
    this.balanceUI       = []
    this.balanceInputDir = 0

    // Grasa
    this.oilSystem    = null
    this.oilOverlay   = null
    this.oilIndicator = null

    // UI
    this.phase1UI          = []
    this.canRestart        = false
    this.collectionBtnBounds = null
  }

  create() {
    this.drawSimpleBackground()
    this.drawPole()

    // Overlay de grasa — encima del palo, debajo del personaje
    this.oilSystem  = new OilSystem()
    this.oilOverlay = this.add.graphics()
    this._drawOilOverlay()

    this.player = new Player(this, POLE.START_X, this.poleY - 4, this.characterData)
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
    this.powerBar     = new PowerBar(weight)
    this.impulseSystem = new ImpulseSystem(this.powerBar)
    this.phase = 'impulse'
    this.createPowerBarUI()
  }

  createPowerBarUI() {
    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX = GAME_WIDTH / 2
    const barY    = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX    = centerX - WIDTH / 2

    const barBg = this.add.graphics()
    this.drawBarZones(barBg, barX, barY, WIDTH, HEIGHT)
    this.phase1UI.push(barBg)

    this.barCursor = this.add.graphics()
    this.phase1UI.push(this.barCursor)

    this.passText = this.add.text(centerX, barY - 16, '', {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#ffffff',
    }).setOrigin(0.5)
    this.phase1UI.push(this.passText)

    this.instructionText = this.add.text(centerX, barY + HEIGHT + 20, '¡PULSA PARA DETENER!', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#ffffff',
    }).setOrigin(0.5)
    this.phase1UI.push(this.instructionText)

    this.instructionTween = this.tweens.add({
      targets:  this.instructionText,
      alpha:    0.3,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
    })

    const weightLabel = this.characterData?.stats?.peso || 5
    this.phase1UI.push(
      this.add.text(barX + WIDTH + 16, barY + HEIGHT / 2, `PESO: ${weightLabel}`, {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#aaaaaa',
      }).setOrigin(0, 0.5),
    )

    this.updatePassCounter()
  }

  drawBarZones(graphics, x, y, width, height) {
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

  updatePowerBarUI() {
    if (!this.barCursor) return

    const { WIDTH, HEIGHT } = PHASE1.BAR
    const centerX  = GAME_WIDTH / 2
    const barX     = centerX - WIDTH / 2
    const barY     = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const cursorX  = barX + this.powerBar.position * WIDTH

    this.barCursor.clear()
    this.barCursor.fillStyle(COLORS.WHITE, 1)
    this.barCursor.fillRect(cursorX - 2, barY - 8, 4, HEIGHT + 16)
    this.barCursor.fillTriangle(cursorX, barY - 14, cursorX - 7, barY - 6,  cursorX + 7, barY - 6)
    this.barCursor.fillTriangle(cursorX, barY + HEIGHT + 14, cursorX - 7, barY + HEIGHT + 6, cursorX + 7, barY + HEIGHT + 6)
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
    this.phase1UI.forEach(el => { if (el?.destroy) el.destroy() })
    this.phase1UI      = []
    this.barCursor     = null
    this.passText      = null
    this.instructionText = null
  }

  // ========================================
  // MOVIMIENTO DE LOS PERSONAJES
  // ========================================

  startRunning() {
    this.cleanPhase1UI()
    this.phase = 'running'

    const impulse    = this.impulseResult.impulseValue
    const poleLength = POLE.START_X - POLE.END_X

    if (impulse <= 0.01) {
      this.maxDistance      = 0
      this.distanceTraveled = 0
      this.startFalling()
      return
    }

    this.maxDistance  = impulse * poleLength
    this.runDuration  = MOVEMENT.MIN_RUN_DURATION + impulse * (MOVEMENT.MAX_RUN_DURATION - MOVEMENT.MIN_RUN_DURATION)
    this.initialSpeed = 2 * this.maxDistance / this.runDuration
    this.runElapsed   = 0
    this.distanceTraveled = 0

    const equilibrio = this.characterData?.stats?.equilibrio || 5
    this.balanceBar    = new BalanceBar(equilibrio)
    this.balanceSystem = new BalanceSystem(this.balanceBar)
    this.balanceInputDir = 0
    this.createBalanceUI()
  }

  updateRunning(delta) {
    const dt = delta / 1000

    // Actualizar grasa y overlay en cada frame de running
    const poleLength     = POLE.START_X - POLE.END_X
    const progressRatio  = Math.max(0, Math.min(1, this.distanceTraveled / poleLength))
    this.oilSystem.update(dt, progressRatio)
    this._drawOilOverlay()

    if (this.balanceBar) {
      const oilMult = this.oilSystem.getDriftMultiplier(progressRatio)
      this.balanceSystem.update(dt, this.balanceInputDir, oilMult)
      this.updateBalanceUI()

      if (this.balanceSystem.isFailed()) {
        this.onBalanceLost()
        return
      }
    }

    if (this.runElapsed >= this.runDuration) return

    this.runElapsed += dt

    if (this.runElapsed >= this.runDuration) {
      this.player.x        = POLE.START_X - this.maxDistance
      this.distanceTraveled = this.maxDistance

      if (this.player.x < POLE.END_X) {
        this.player.x        = POLE.END_X
        this.distanceTraveled = POLE.START_X - POLE.END_X
      }

      this.player.updateAnimation(dt, 0)   // personaje parado al final de la carrera

      if (!this.hasFlag && this.checkFlagCollision()) {
        this.player.redraw()
        this.grabFlag()
        return
      }

      this.player.redraw()
      return
    }

    const t = this.runElapsed
    const T = this.runDuration
    this.distanceTraveled = this.initialSpeed * t * (1 - t / (2 * T))
    this.player.x         = POLE.START_X - this.distanceTraveled

    // Velocidad instantánea: derivada de distanceTraveled respecto al tiempo
    const currentSpeed = T > 0 ? Math.max(0, this.initialSpeed * (1 - t / T)) : 0
    this.player.updateAnimation(dt, currentSpeed)

    if (!this.hasFlag && this.checkFlagCollision()) {
      this.player.x        = POLE.END_X
      this.distanceTraveled = POLE.START_X - POLE.END_X
      this.player.redraw()
      this.grabFlag()
      return
    }

    this.player.redraw()
  }

  // ========================================
  // SALTO
  // ========================================

  startJump() {
    this.cleanBalanceUI()
    this.balanceBar    = null
    this.balanceSystem = null

    this.hasJumped  = true
    this.isJumping  = true
    this.phase      = 'jumping'
    this.jumpElapsed = 0
    this.jumpStartX  = this.player.x
    this.jumpStartY  = this.player.y

    this.player.setJumping(true, this.hasFlag)

    const t              = this.runElapsed
    const T              = this.runDuration
    const currentRunSpeed = T > 0 ? Math.max(this.initialSpeed * (1 - t / T), 0) : 0

    const drop        = this.waterY - this.player.y
    const a           = 0.5 * JUMP.GRAVITY
    const b           = JUMP.VY0
    const discriminant = b * b - 4 * a * (-drop)
    const flightTime   = (-b + Math.sqrt(discriminant)) / (2 * a)

    const jumpDistance = this.characterData?.stats?.jump ?? JUMP.EXTRA_DISTANCE
    const boostSpeed   = jumpDistance / flightTime

    this.jumpVx  = currentRunSpeed + boostSpeed
    this.jumpVy0 = JUMP.VY0
  }

  updateJumping(delta) {
    const dt = delta / 1000
    this.jumpElapsed += dt

    this.player.x = this.jumpStartX - this.jumpVx * this.jumpElapsed
    this.player.y = this.jumpStartY
      + this.jumpVy0 * this.jumpElapsed
      + 0.5 * JUMP.GRAVITY * this.jumpElapsed * this.jumpElapsed

    this.distanceTraveled = POLE.START_X - this.player.x

    if (!this.hasFlag && this.checkFlagCollision()) {
      this.hasFlag = true
      this.flagGraphics.setVisible(false)
      this.player.setFlag(true)
      this.oilSystem.reset()
    }

    if (this.player.y >= this.waterY) {
      this.player.y = this.waterY
      this.isJumping = false
      this.player.setVisible(false)
      this.createSplash()

      if (this.hasFlag) {
        this.time.delayedCall(600, () => this.showCelebration())
      } else {
        this.time.delayedCall(400, () => {
          this.player.showHead(this.waterY)
          this.showGameOver()
        })
      }
      this.phase = 'splash_done'
      return
    }

    this.player.redraw()
  }

  // ========================================
  // COLISIÓN CON LA BANDERA
  // ========================================

  checkFlagCollision() {
    const charTop    = this.player.y - 36
    const charBottom = this.player.y + 4
    const charLeft   = this.player.x - 12

    const flagTop    = this.poleY - 28
    const flagBottom = this.poleY + 2
    const flagRight  = POLE.END_X + POLE.FLAG_GRAB_RANGE

    return charLeft <= flagRight && charTop < flagBottom && charBottom > flagTop
  }

  grabFlag() {
    this.hasFlag = true
    this.flagGraphics.setVisible(false)
    this.cleanBalanceUI()
    this.balanceBar    = null
    this.balanceSystem = null
    this.oilSystem.reset()
    this.player.setFlag(true)
    this.player.redraw()
    this.startFalling()
  }

  // ========================================
  // FASE 2 — EQUILIBRIO
  // ========================================

  createBalanceUI() {
    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX = GAME_WIDTH / 2
    const barY    = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const barX    = centerX - WIDTH / 2

    const barBg = this.add.graphics()
    barBg.fillStyle(COLORS.BLACK, 1)
    barBg.fillRect(barX - 3, barY - 3, WIDTH + 6, HEIGHT + 6)
    barBg.fillStyle(0x1a1a2e, 1)
    barBg.fillRect(barX, barY, WIDTH, HEIGHT)
    barBg.lineStyle(2, COLORS.WHITE, 0.6)
    barBg.strokeRect(barX, barY, WIDTH, HEIGHT)

    barBg.fillStyle(COLORS.GREEN, 1)
    barBg.fillRect(centerX - 1, barY - 4, 2, HEIGHT + 8)

    const limit       = this.balanceBar.limit
    const limitOffset = limit * (WIDTH / 2)
    barBg.fillStyle(COLORS.RED, 0.6)
    barBg.fillRect(centerX - limitOffset - 1, barY - 2, 2, HEIGHT + 4)
    barBg.fillRect(centerX + limitOffset - 1, barY - 2, 2, HEIGHT + 4)

    const dangerWidth = WIDTH * ((1 - limit) / 2)
    barBg.fillStyle(COLORS.RED, 0.2)
    barBg.fillRect(barX, barY, dangerWidth, HEIGHT)
    barBg.fillRect(barX + WIDTH - dangerWidth, barY, dangerWidth, HEIGHT)

    this.balanceUI.push(barBg)

    this.balanceCursor = this.add.graphics()
    this.balanceUI.push(this.balanceCursor)

    const instrText = this.add.text(centerX, barY - 20, '¡MANTÉN EL EQUILIBRIO!', {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#ffffff',
    }).setOrigin(0.5)
    this.balanceUI.push(instrText)

    this.balanceTimerText = this.add.text(centerX, barY + HEIGHT + 16, '', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#aaaaaa',
    }).setOrigin(0.5)
    this.balanceUI.push(this.balanceTimerText)


    const btnSize   = BALANCE.BUTTON_SIZE
    const btnY      = CONTROL_PANEL.CENTER_Y - btnSize / 2
    const btnMargin = 40

    this.btnLeft = this.add.image(btnMargin + btnSize / 2, btnY + btnSize / 2, 'btn-balance-left')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive()
    this.btnLeft.on('pointerdown', () => { this.balanceInputDir = -1; this.btnLeft.setTexture('btn-balance-left-press').setDisplaySize(btnSize, btnSize) })
    this.btnLeft.on('pointerup',   () => { if (this.balanceInputDir === -1) this.balanceInputDir = 0; this.btnLeft.setTexture('btn-balance-left').setDisplaySize(btnSize, btnSize) })
    this.btnLeft.on('pointerout',  () => { if (this.balanceInputDir === -1) this.balanceInputDir = 0; this.btnLeft.setTexture('btn-balance-left').setDisplaySize(btnSize, btnSize) })
    this.balanceUI.push(this.btnLeft)

    const btnRightX = GAME_WIDTH - btnMargin - btnSize
    this.btnRight = this.add.image(btnRightX + btnSize / 2, btnY + btnSize / 2, 'btn-balance-right')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive()
    this.btnRight.on('pointerdown', () => { this.balanceInputDir = 1; this.btnRight.setTexture('btn-balance-right-press').setDisplaySize(btnSize, btnSize) })
    this.btnRight.on('pointerup',   () => { if (this.balanceInputDir === 1) this.balanceInputDir = 0; this.btnRight.setTexture('btn-balance-right').setDisplaySize(btnSize, btnSize) })
    this.btnRight.on('pointerout',  () => { if (this.balanceInputDir === 1) this.balanceInputDir = 0; this.btnRight.setTexture('btn-balance-right').setDisplaySize(btnSize, btnSize) })
    this.balanceUI.push(this.btnRight)
  }

  drawBalanceButton(graphics, x, y, size) {
    const g = graphics
    g.fillStyle(0x2a2a4a, 1)
    g.fillRect(x, y, size, size)
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(x, y, size, size)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(x + 3, y + 3, size - 6, size - 6)
  }

  updateBalanceUI() {
    if (!this.balanceCursor || !this.balanceBar) return

    const { WIDTH, HEIGHT } = BALANCE.BAR
    const centerX  = GAME_WIDTH / 2
    const barY     = CONTROL_PANEL.CENTER_Y - HEIGHT / 2
    const cursorX  = centerX + this.balanceBar.position * (WIDTH / 2)

    this.balanceCursor.clear()
    this.balanceCursor.fillStyle(COLORS.RED, 1)
    this.balanceCursor.fillRect(cursorX - 2, barY - 6, 4, HEIGHT + 12)
    this.balanceCursor.fillTriangle(cursorX, barY - 12, cursorX - 6, barY - 4,  cursorX + 6, barY - 4)
    this.balanceCursor.fillTriangle(cursorX, barY + HEIGHT + 12, cursorX - 6, barY + HEIGHT + 4, cursorX + 6, barY + HEIGHT + 4)

    if (this.balanceTimerText && this.balanceSystem) {
      this.balanceTimerText.setText(`${this.balanceSystem.getElapsedTime().toFixed(1)}s`)
    }

  }

  onBalanceLost() {
    this.cleanBalanceUI()
    this.balanceBar    = null
    this.balanceSystem = null
    this.startFalling()
  }

  cleanBalanceUI() {
    this.balanceUI.forEach(el => { if (el?.destroy) el.destroy() })
    this.balanceUI        = []
    this.balanceCursor    = null
    this.balanceTimerText = null
    this.btnLeft          = null
    this.btnRight         = null
    this.balanceInputDir  = 0
  }

  // ========================================
  // CAÍDA AL AGUA
  // ========================================

  startFalling() {
    this.phase = 'falling'
    const pos  = { y: this.player.y }

    this.tweens.add({
      targets:  pos,
      y:        this.waterY + 40,
      duration: MOVEMENT.FALL_DURATION,
      ease:     'Quad.easeIn',
      onUpdate: () => {
        this.player.y = pos.y
        this.player.redraw()
      },
      onComplete: () => {
        this.player.setVisible(false)
        this.createSplash()
        if (this.hasFlag) {
          this.time.delayedCall(600, () => this.showCelebration())
        } else {
          this.time.delayedCall(400, () => {
            this.player.showHead(this.waterY)
            this.showGameOver()
          })
        }
      },
    })
  }

  createSplash() {
    const splashX = this.player.x
    const splashY = this.waterY

    for (let i = 0; i < 10; i++) {
      const dropG   = this.add.graphics()
      const offsetX = Phaser.Math.Between(-15, 15)
      const size    = Phaser.Math.Between(2, 5)

      dropG.fillStyle(COLORS.WHITE, 0.9)
      dropG.fillRect(splashX + offsetX, splashY, size, size)

      this.tweens.add({
        targets:  dropG,
        y:        -Phaser.Math.Between(20, 50),
        alpha:    0,
        duration: Phaser.Math.Between(300, 600),
        ease:     'Quad.easeOut',
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
    const centerY = CONTROL_PANEL.Y / 2
    const panelW  = 400
    const panelH  = 222

    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.88)
    g.fillRect(centerX - panelW / 2, centerY - panelH / 2, panelW, panelH)
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(centerX - panelW / 2, centerY - panelH / 2, panelW, panelH)
    g.lineStyle(1, COLORS.GOLD, 0.2)
    g.strokeRect(centerX - panelW / 2 + 3, centerY - panelH / 2 + 3, panelW - 6, panelH - 6)

    this.add.text(centerX, centerY - 52, '¡AL AGUA!', {
      fontFamily: 'monospace',
      fontSize:   '28px',
      color:      '#ff6644',
      stroke:     '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)

    const poleLength  = POLE.START_X - POLE.END_X
    const distPercent = Math.round((this.distanceTraveled / poleLength) * 100)
    this.add.text(centerX, centerY - 14, `DISTANCIA: ${distPercent}%`, {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#ffffff',
    }).setOrigin(0.5)

    this.time.delayedCall(1000, () => {
      this.canRestart = true

      const restartText = this.add.text(centerX, centerY + 22, 'PULSA PARA REINTENTAR', {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color:      '#aaaaaa',
      }).setOrigin(0.5)
      this.tweens.add({ targets: restartText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 })

      const btnW = 220
      const btnH = 58
      const btnX = centerX - btnW / 2
      const btnY = centerY + 45

      this.collectionBtnBounds = makeNavButton(
        this, btnX, btnY, btnW, btnH,
        'VER PREMIOS',
        () => this.scene.start(SCENES.COLLECTION, { character: this.characterData }),
      )
    })
  }

  // ========================================
  // CELEBRACIÓN (bandera cogida)
  // ========================================

  showCelebration() {
    this.phase = 'celebrating'
    this.player.startCelebration(this.waterY, () => this.startRewardScreen())
  }

  startRewardScreen() {
    this.phase = 'done'
    const rewards = this.cache.json.get('rewards') || []
    const reward  = rewards.length > 0
      ? rewards[Phaser.Math.Between(0, rewards.length - 1)]
      : null
    this.scene.start(SCENES.REWARD, { reward, character: this.characterData })
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))
    this.input.keyboard.on('keydown-SPACE', (event) => { if (!event.repeat) this.handleTap(null) })
    this.input.keyboard.on('keydown-ESC',   () => this.scene.start(SCENES.MENU))

    this.input.keyboard.on('keydown-LEFT',  (e) => {
      if (e.repeat || this.phase !== 'running' || !this.balanceBar) return
      this.balanceInputDir = -1
      if (this.btnLeft) this.btnLeft.setTexture('btn-balance-left-press').setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
    })
    this.input.keyboard.on('keydown-RIGHT', (e) => {
      if (e.repeat || this.phase !== 'running' || !this.balanceBar) return
      this.balanceInputDir = 1
      if (this.btnRight) this.btnRight.setTexture('btn-balance-right-press').setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
    })
    this.input.keyboard.on('keyup-LEFT',  () => {
      if (this.balanceInputDir === -1) this.balanceInputDir = 0
      if (this.btnLeft) this.btnLeft.setTexture('btn-balance-left').setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
    })
    this.input.keyboard.on('keyup-RIGHT', () => {
      if (this.balanceInputDir === 1) this.balanceInputDir = 0
      if (this.btnRight) this.btnRight.setTexture('btn-balance-right').setDisplaySize(BALANCE.BUTTON_SIZE, BALANCE.BUTTON_SIZE)
    })
  }

  handleTap(pointer) {
    if (this.phase === 'impulse' && this.impulseSystem.isActive()) {
      this.onBarStopped()
    } else if (this.phase === 'running' && !this.hasJumped) {
      if (pointer && pointer.y >= CONTROL_PANEL.Y) return
      this.startJump()
    } else if (this.phase === 'done' && this.canRestart) {
      if (pointer && this.collectionBtnBounds &&
          Phaser.Geom.Rectangle.Contains(this.collectionBtnBounds, pointer.x, pointer.y)) return
      this.scene.restart({ character: this.characterData })
    }
  }

  // ========================================
  // FONDO Y ESCENARIO
  // ========================================

  _drawOilOverlay() {
    if (!this.oilOverlay || !this.oilSystem) return
    this.oilOverlay.clear()

    const zones  = this.oilSystem.getZones()
    const zoneW  = POLE.LENGTH / OIL.NUM_ZONES
    // Solo la mitad superior del palo (por donde pasa el personaje)
    const oilTop = this.poleY - 3   // borde superior del palo
    const oilH   = 5                // top ~5px de los 9px del palo

    zones.forEach((grease, i) => {
      const alpha = (grease / 100) * OIL.OVERLAY_ALPHA
      if (alpha < 0.01) return
      // Zona 0 = inicio del personaje (derecha), zona N-1 = bandera (izquierda)
      const zoneX = POLE.START_X - (i + 1) * zoneW
      this.oilOverlay.fillStyle(0x000000, alpha)
      this.oilOverlay.fillRect(zoneX, oilTop, zoneW, oilH)
    })
  }

  drawSimpleBackground() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
  }

  createControlPanel() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BLACK, 0.8)
    g.fillRect(0, CONTROL_PANEL.Y, GAME_WIDTH, CONTROL_PANEL.HEIGHT)
  }

  drawPole() {
    const g          = this.add.graphics()
    const poleOverlap = 30

    g.fillStyle(COLORS.WOOD_LIGHT, 1)
    g.fillRect(POLE.END_X, this.poleY - 3, POLE.LENGTH + poleOverlap, 9)
    g.lineStyle(1, COLORS.WOOD_DARK, 0.6)
    g.strokeRect(POLE.END_X, this.poleY - 3, POLE.LENGTH + poleOverlap, 9)

    this.flagGraphics = this.add.graphics()
    this.flagGraphics.fillStyle(COLORS.WOOD_DARK, 1)
    this.flagGraphics.fillRect(POLE.END_X - 2, this.poleY - 28, 3, 30)
    this.flagGraphics.fillStyle(COLORS.WHITE, 1)
    this.flagGraphics.fillRect(POLE.END_X - 18, this.poleY - 28, 16, 10)

    const boatCenterX = BOAT.RIGHT_X - BOAT.DISPLAY_WIDTH / 2
    const boatCenterY = this.poleY + BOAT.DISPLAY_HEIGHT * (0.15 - BOAT.DECK_Y_RATIO)
    this.add.image(boatCenterX, boatCenterY, 'boat')
      .setDisplaySize(BOAT.DISPLAY_WIDTH, BOAT.DISPLAY_HEIGHT)
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
      fontSize:   '18px',
      color:      '#ffd700',
      stroke:     '#000000',
      strokeThickness: 2,
    })

    this.add.text(GAME_WIDTH - 16, 10, 'ESC: MENÚ', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#666666',
    }).setOrigin(1, 0)

    // Indicador de grasa: siempre visible, esquina superior izquierda bajo la franja
    this.oilIndicator = createOilIndicator(this, 8, 44)
    this.oilIndicator.update(this.oilSystem.getTotalGrease())
  }

  // ========================================
  // UPDATE
  // ========================================

  update(time, delta) {
    if (this.phase === 'impulse') {
      this.impulseSystem.update(delta / 1000)
      this.updatePowerBarUI()
      this.updatePassCounter()
      if (this.powerBar.finished) this.onBarStopped()
    }

    if (this.phase === 'running') this.updateRunning(delta)

    if (this.phase === 'jumping') this.updateJumping(delta)

    // Indicador de grasa siempre activo
    this.oilIndicator?.update(this.oilSystem.getTotalGrease())
  }
}
