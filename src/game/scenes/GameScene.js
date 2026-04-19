import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, POLE, MOVEMENT, CONTROL_PANEL, BOAT, JUMP, OIL } from '../config/gameConfig'
import { getStoredPerspective } from '../config/perspectiveConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { SPRITE_CONFIG } from '../config/spriteConfig'
import { skinService } from '../services/SkinService'
import { Player } from '../entities/Player'
import { PowerBar } from '../entities/PowerBar'
import { makeNavButton } from '../components/NavButton'
import { BalanceBar } from '../entities/BalanceBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'
import { BalanceSystem } from '../systems/BalanceSystem'
import { OilSystem } from '../systems/OilSystem'
import { JumpSystem } from '../systems/JumpSystem'
import { FallSystem } from '../systems/FallSystem'
import { PowerBarUI } from '../components/PowerBarUI'
import { BalanceUI } from '../components/BalanceUI'
import { createOilIndicator } from '../components/OilIndicator'
import { gameStatsService } from '../services/GameStatsService'
import { weightedRandom } from '../utils/math'

export class GameScene extends Scene {

  constructor() {
    super(SCENES.GAME)
  }

  init(data) {
    this.characterData = data.character || null

    const skinSpritesheet = data.skin
      ?? (this.characterData ? skinService.getActiveSkin(this.characterData) : null)
    this.skinKey = skinSpritesheet ? `sprite-${skinSpritesheet}` : null

    this.phase         = null
    this.impulseResult = null

    const perspId = data.perspective?.id ?? getStoredPerspective()
    this.perspective = perspectiveUnlockService.getById(perspId)
      ?? perspectiveUnlockService.getById('triana')

    this.poleY  = GAME_HEIGHT * POLE.Y_FACTOR
    this.waterY = this.poleY + 60

    // Movimiento
    this.distanceTraveled = 0
    this.maxDistance      = 0
    this.initialSpeed     = 0
    this.runDuration      = 0
    this.runElapsed       = 0

    // Bandera y salto
    this.hasFlag   = false
    this.hasJumped = false
    this.flagGraphics = null

    // Equilibrio — refs necesarias para updateRunning
    this.balanceBar    = null
    this.balanceSystem = null

    // Grasa
    this.oilSystem    = null
    this.oilOverlay   = null
    this.oilIndicator = null

    // Sistemas y componentes extraídos
    this.jumpSystem  = null
    this.fallSystem  = null
    this.powerBarUI  = null
    this.balanceUI   = null

    // Estado de resultado y UI
    this.canRestart             = false
    this.collectionBtnBounds    = null
    this._capturedGreasePercent = null
  }

  preload() {
    if (!this.skinKey) return
    if (this.textures.exists(this.skinKey)) return

    const spritesheetName = this.skinKey.replace('sprite-', '')
    this.load.setPath('assets')
    this.load.spritesheet(this.skinKey, `sprites/characters/spritesheet/${spritesheetName}.png`, {
      frameWidth:  SPRITE_CONFIG.frameWidth,
      frameHeight: SPRITE_CONFIG.frameHeight,
    })
    this.load.once(`filecomplete-spritesheet-${this.skinKey}`, () => {
      const texture = this.textures.get(this.skinKey)
      if (texture?.source.length > 0) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
      }
    })
  }

  create() {
    this.drawSimpleBackground()
    this._setupGameWorld()
    this.drawPole()

    this.oilSystem  = new OilSystem()
    this.oilOverlay = this.add.graphics()
    this.gameWorld.add(this.oilOverlay)
    this._drawOilOverlay()

    this.player     = new Player(this, POLE.START_X, this.poleY - 4, this.characterData, SPRITE_CONFIG.scale, this.gameWorld, this.skinKey)
    this.fallSystem = new FallSystem(this, this.gameWorld)

    this.createControlPanel()
    this.createHUD()
    this.startPhase1()
    this.setupInput()
  }

  _setupGameWorld() {
    const S = this.perspective.scale
    this.gameWorld = this.add.container(0, 0)
    if (this.perspective.flipX) {
      this.gameWorld.x      = GAME_WIDTH / 2 * (1 + S)
      this.gameWorld.y      = this.poleY * (1 - S) + this.perspective.yOffset
      this.gameWorld.scaleX = -S
      this.gameWorld.scaleY = S
    }
  }

  // ========================================
  // FASE 1 — Barra de impulso
  // ========================================

  startPhase1() {
    const weight       = this.characterData?.stats?.peso || 5
    this.powerBar      = new PowerBar(weight)
    this.impulseSystem = new ImpulseSystem(this.powerBar)
    this.phase         = 'impulse'
    this.powerBarUI    = new PowerBarUI(this, this.powerBar, this.characterData)
    this.powerBarUI.create()
  }

  onBarStopped() {
    this.impulseResult = this.impulseSystem.isActive()
      ? this.impulseSystem.stop()
      : this.impulseSystem.getResult()
    this.startRunning()
  }

  // ========================================
  // MOVIMIENTO DEL PERSONAJE
  // ========================================

  startRunning() {
    this.powerBarUI?.destroy()
    this.powerBarUI = null
    this.phase = 'running'

    const impulse    = this.impulseResult.impulseValue
    const poleLength = POLE.START_X - POLE.END_X

    if (impulse <= 0.01) {
      this.maxDistance      = 0
      this.distanceTraveled = 0
      this._fall()
      return
    }

    this.maxDistance  = impulse * poleLength
    this.runDuration  = MOVEMENT.MIN_RUN_DURATION + impulse * (MOVEMENT.MAX_RUN_DURATION - MOVEMENT.MIN_RUN_DURATION)
    this.initialSpeed = 2 * this.maxDistance / this.runDuration
    this.runElapsed   = 0
    this.distanceTraveled = 0

    const equilibrio   = this.characterData?.stats?.equilibrio || 5
    this.balanceBar    = new BalanceBar(equilibrio)
    this.balanceSystem = new BalanceSystem(this.balanceBar)
    this.balanceUI     = new BalanceUI(this, this.balanceBar, this.balanceSystem)
    this.balanceUI.create()
  }

  updateRunning(delta) {
    const dt = delta / 1000

    const poleLength    = POLE.START_X - POLE.END_X
    const progressRatio = Math.max(0, Math.min(1, this.distanceTraveled / poleLength))
    this.oilSystem.update(dt, progressRatio)
    this._drawOilOverlay()

    if (this.balanceBar) {
      const oilMult = this.oilSystem.getDriftMultiplier(progressRatio)
      this.balanceSystem.update(dt, this.balanceUI?.getInputDirection() ?? 0, oilMult)
      this.balanceUI?.update(oilMult)

      if (this.balanceSystem.isFailed()) {
        this.onBalanceLost()
        return
      }
    }

    if (this.runElapsed >= this.runDuration) return

    this.runElapsed += dt

    if (this.runElapsed >= this.runDuration) {
      this.player.x = POLE.START_X - this.maxDistance
      this.distanceTraveled = this.maxDistance

      if (this.player.x < POLE.END_X) {
        this.player.x = POLE.END_X
        this.distanceTraveled = POLE.START_X - POLE.END_X
      }

      this.player.updateAnimation(dt, 0)

      if (!this.hasFlag && this._checkFlagCollision()) {
        this.player.redraw()
        this._grabFlag()
        return
      }

      this.player.redraw()
      return
    }

    const t = this.runElapsed
    const T = this.runDuration
    this.distanceTraveled = this.initialSpeed * t * (1 - t / (2 * T))
    this.player.x         = POLE.START_X - this.distanceTraveled

    const currentSpeed = T > 0 ? Math.max(0, this.initialSpeed * (1 - t / T)) : 0
    this.player.updateAnimation(dt, currentSpeed)

    if (!this.hasFlag && this._checkFlagCollision()) {
      this.player.x         = POLE.END_X
      this.distanceTraveled = POLE.START_X - POLE.END_X
      this.player.redraw()
      this._grabFlag()
      return
    }

    this.player.redraw()
  }

  onBalanceLost() {
    this.sound.play('sfx-hit', { volume: 0.8 })
    this.balanceUI?.destroy()
    this.balanceUI     = null
    this.balanceBar    = null
    this.balanceSystem = null
    this._fall()
  }

  // ========================================
  // SALTO
  // ========================================

  startJump() {
    this.balanceUI?.destroy()
    this.balanceUI     = null
    this.balanceBar    = null
    this.balanceSystem = null

    this.hasJumped  = true
    this.phase      = 'jumping'

    this.jumpSystem = new JumpSystem()
    this.jumpSystem.start({
      playerX:      this.player.x,
      playerY:      this.player.y,
      runElapsed:   this.runElapsed,
      runDuration:  this.runDuration,
      initialSpeed: this.initialSpeed,
      waterY:       this.waterY,
      jumpDistance: this.characterData?.stats?.jump ?? JUMP.EXTRA_DISTANCE,
    })

    this.player.setJumping(true, this.hasFlag)
  }

  updateJumping(delta) {
    const { x, y } = this.jumpSystem.update(delta / 1000)
    this.player.x = x
    this.player.y = y
    this.distanceTraveled = POLE.START_X - this.player.x

    if (!this.hasFlag && this._checkFlagCollision()) {
      this.hasFlag = true
      this.flagGraphics.setVisible(false)
      this.player.setFlag(true)
      this.oilSystem.reset()
    }

    if (this.player.y >= this.waterY) {
      this.player.y = this.waterY
      this.player.setVisible(false)
      this.fallSystem.splash(this.player.x, this.waterY)

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
  // BANDERA
  // ========================================

  _checkFlagCollision() {
    const charTop    = this.player.y - 36
    const charBottom = this.player.y + 4
    const charLeft   = this.player.x - 12

    const flagTop    = this.poleY - 28
    const flagBottom = this.poleY + 2
    const flagRight  = POLE.END_X + POLE.FLAG_GRAB_RANGE

    return charLeft <= flagRight && charTop < flagBottom && charBottom > flagTop
  }

  _grabFlag() {
    this.sound.play('sfx-victoria', { volume: 1.0 })
    this.hasFlag = true
    this.flagGraphics.setVisible(false)
    this.balanceUI?.destroy()
    this.balanceUI     = null
    this.balanceBar    = null
    this.balanceSystem = null
    this._capturedGreasePercent = this.oilSystem.getTotalGrease()
    this.oilSystem.reset()
    this.player.setFlag(true)
    this.player.redraw()
    this._fall()
  }

  // ========================================
  // CAÍDA AL AGUA
  // ========================================

  _fall() {
    this.phase = 'falling'
    this.fallSystem.fall(this.player, this.waterY, () => {
      if (this.hasFlag) {
        this.time.delayedCall(600, () => this.showCelebration())
      } else {
        this.time.delayedCall(400, () => {
          this.player.showHead(this.waterY)
          this.showGameOver()
        })
      }
    })
  }

  // ========================================
  // GAME OVER
  // ========================================

  showGameOver() {
    this.phase = 'done'

    gameStatsService.addRecord({
      timestamp:     new Date().toISOString(),
      characterId:   this.characterData?.id ?? 'unknown',
      skinKey:       this.skinKey,
      perspectiveId: this.perspective?.id ?? 'triana',
      success:       false,
      rewardId:      null,
      greasePercent: this.oilSystem.getTotalGrease(),
      polePercent:   Math.round((this.distanceTraveled / POLE.LENGTH) * 10000) / 100,
      impulseValue:  this.impulseResult?.impulseValue ?? null,
      durationSecs:  Math.round(this.runElapsed * 100) / 100,
      hasJumped:     this.hasJumped,
    })

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
  // CELEBRACIÓN
  // ========================================

  showCelebration() {
    this.phase = 'celebrating'
    this.player.startCelebration(this.waterY, () => this.startRewardScreen())
  }

  startRewardScreen() {
    this.phase  = 'done'
    const rewards = this.cache.json.get('rewards') || []
    const reward  = weightedRandom(rewards, 'probabilidad')

    gameStatsService.addRecord({
      timestamp:     new Date().toISOString(),
      characterId:   this.characterData?.id ?? 'unknown',
      skinKey:       this.skinKey,
      perspectiveId: this.perspective?.id ?? 'triana',
      success:       true,
      rewardId:      reward?.id ?? null,
      greasePercent: this._capturedGreasePercent ?? 0,
      polePercent:   Math.round((this.distanceTraveled / POLE.LENGTH) * 10000) / 100,
      impulseValue:  this.impulseResult?.impulseValue ?? null,
      durationSecs:  Math.round(this.runElapsed * 100) / 100,
      hasJumped:     this.hasJumped,
    })

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
      if (e.repeat || this.phase !== 'running' || !this.balanceUI) return
      this.balanceUI.pressLeft()
    })
    this.input.keyboard.on('keydown-RIGHT', (e) => {
      if (e.repeat || this.phase !== 'running' || !this.balanceUI) return
      this.balanceUI.pressRight()
    })
    this.input.keyboard.on('keyup-LEFT',  () => { this.balanceUI?.releaseLeft() })
    this.input.keyboard.on('keyup-RIGHT', () => { this.balanceUI?.releaseRight() })
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
      this.scene.restart({ character: this.characterData, perspective: this.perspective })
    }
  }

  // ========================================
  // FONDO Y ESCENARIO
  // ========================================

  _drawOilOverlay() {
    if (!this.oilOverlay || !this.oilSystem) return
    this.oilOverlay.clear()

    const zones = this.oilSystem.getZones()
    const zoneW = POLE.LENGTH / OIL.NUM_ZONES

    zones.forEach((grease, i) => {
      const alpha = (grease / 100) * OIL.OVERLAY_ALPHA
      if (alpha < 0.01) return
      const zoneLeft = POLE.START_X - (i + 1) * zoneW
      this.oilOverlay.fillStyle(0x000000, alpha)
      this.oilOverlay.fillRect(zoneLeft, this.poleY - 3, zoneW, 5)
    })
  }

  drawSimpleBackground() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.perspective.backgroundKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
  }

  createControlPanel() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BLACK, 0.8)
    g.fillRect(0, CONTROL_PANEL.Y, GAME_WIDTH, CONTROL_PANEL.HEIGHT)
  }

  drawPole() {
    const g = this.add.graphics()
    this.gameWorld.add(g)
    const poleOverlap = 30

    g.fillStyle(COLORS.WOOD_LIGHT, 1)
    g.fillRect(POLE.END_X, this.poleY - 4, POLE.LENGTH + poleOverlap, 9)
    g.lineStyle(1, COLORS.WOOD_DARK, 0.6)
    g.strokeRect(POLE.END_X, this.poleY - 4, POLE.LENGTH + poleOverlap, 9)

    this.flagGraphics = this.add.graphics()
    this.gameWorld.add(this.flagGraphics)
    this.flagGraphics.fillStyle(COLORS.WOOD_DARK, 1)
    this.flagGraphics.fillRect(POLE.END_X - 1, this.poleY - 28, 3, 30)
    this.flagGraphics.fillStyle(COLORS.WHITE, 1)
    this.flagGraphics.fillRect(POLE.END_X - 18, this.poleY - 28, 16, 10)

    const boatCenterX = BOAT.RIGHT_X - BOAT.DISPLAY_WIDTH / 2
    const boatCenterY = this.poleY + BOAT.DISPLAY_HEIGHT * (0.15 - BOAT.DECK_Y_RATIO)
    const boat = this.add.image(boatCenterX, boatCenterY, 'boat')
      .setDisplaySize(BOAT.DISPLAY_WIDTH, BOAT.DISPLAY_HEIGHT)
    this.gameWorld.add(boat)
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

    this.oilIndicator = createOilIndicator(this, 8, 44)
    this.oilIndicator.update(this.oilSystem.getTotalGrease())
  }

  // ========================================
  // UPDATE
  // ========================================

  update(time, delta) {
    if (this.phase === 'impulse') {
      this.impulseSystem.update(delta / 1000)
      this.powerBarUI?.update()
      if (this.powerBar.finished) this.onBarStopped()
    }

    if (this.phase === 'running') this.updateRunning(delta)
    if (this.phase === 'jumping') this.updateJumping(delta)

    this.oilIndicator?.update(this.oilSystem.getTotalGrease())
  }
}
