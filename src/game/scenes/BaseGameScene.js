import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, COLORS, CONTROL_PANEL, PHASE1 } from '../config/gameConfig'
import { COLOR_GOLD, COLOR_REWARD } from '../config/fonts'
import { headingStyle, uiLabelStyle } from '../config/textStyles'
import { mapService } from '../services/MapService'
import { skinService } from '../services/SkinService'
import { gameStatsService } from '../services/GameStatsService'
import { PowerBar } from '../entities/PowerBar'
import { BalanceBar } from '../entities/BalanceBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'
import { BalanceSystem } from '../systems/BalanceSystem'
import { RunSystem } from '../systems/RunSystem'
import { PowerBarUI } from '../components/PowerBarUI'
import { BalanceUI } from '../components/BalanceUI'
import { createOilIndicator } from '../components/OilIndicator'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'
import { showExitConfirmModal } from '../components/ExitConfirmModal'
import { createGameOverPanel } from '../components/GameOverPanel'
import { weightedRandom } from '../utils/math'

// Flujo compartido de la partida, común a todas las vistas (2D y 3D):
// fases (impulso → carrera/equilibrio → salto/caída → resultado), input,
// HUD, panel de control, modal de salida, estadísticas, game over y premio.
//
// Las subclases son la capa de presentación: dibujan su mundo y responden a
// los hooks. Deben implementar:
//   getPoleLength()      — longitud del palo en sus unidades (px o metros)
//   getPerspectiveId()   — id de perspectiva para las estadísticas
//   getRestartData()     — data para scene.restart() al reintentar
//   isFlagReached()      — si el jugador alcanza la bandera este frame
//   onJumpStart()        — arranca su JumpSystem y visuales del salto
//   updateJumping(dt)    — avanza el salto y detecta el agua
//   onFallStart()        — animación de caída (tween 2D / cámara 3D)
//   _afterSplashWin()    — transición tras el chapuzón con bandera
//   _afterSplashLose()   — transición tras el chapuzón sin bandera
// Y pueden sobreescribir: getHudTitle(), snapToFlag(), onFlagTaken(),
// onRunProgress(dt), onOilChanged(), onFrame(dt).

// Palmadas escalonadas del público tras el chapuzón con bandera
const APPLAUSE_DELAYS_MS = [
  300, 520, 730, 930, 1120, 1300, 1480, 1660, 1840, 2020, 2210, 2420, 2650, 2900,
]
const FAIL_SOUND_DELAY_MS = 350

export class BaseGameScene extends BaseScene {
  init(data) {
    super.init(data)
    this.characterData = data.character || null

    const skinSpritesheet =
      data.skin ?? (this.characterData ? skinService.getActiveSkin(this.characterData) : null)
    this.skinKey = skinSpritesheet ? `sprite-${skinSpritesheet}` : null

    this.phase = null
    this.impulseResult = null
    this.hasPerfectImpulse = false

    this.runSystem = null
    this.distanceTraveled = 0

    this.hasFlag = false
    this.hasJumped = false

    this.powerBar = null
    this.impulseSystem = null
    this.powerBarUI = null

    this.balanceBar = null
    this.balanceSystem = null
    this.balanceUI = null

    this.oilSystem = null
    this.oilIndicator = null
    this._capturedGreasePercent = null

    this.canRestart = false
    this.collectionBtnBounds = null
    this.changeCharacterBtnBounds = null

    this.exitBtnBounds = null
    this._exitBtnObjs = null
    this._exitModal = null
    this._prePausePhase = null
  }

  // ========================================
  // FASE 1 — Barra de impulso
  // ========================================

  startPhase1() {
    const weight = this.characterData?.stats?.peso || 5
    this.powerBar = new PowerBar(weight)
    this.impulseSystem = new ImpulseSystem(this.powerBar)
    this.phase = 'impulse'
    this.powerBarUI = new PowerBarUI(this, this.powerBar, this.characterData)
    this.powerBarUI.create()
  }

  onBarStopped() {
    this.impulseResult = this.impulseSystem.isActive()
      ? this.impulseSystem.stop()
      : this.impulseSystem.getResult()

    this.hasPerfectImpulse = this.impulseResult.impulseValue >= PHASE1.PERFECT_IMPULSE_MIN
    if (this.hasPerfectImpulse) {
      this.sound.play('sfx-maxpower', { volume: 0.7 })
      this._showMaxPowerText()
    }

    this.startRunning()
  }

  _showMaxPowerText() {
    // Override de stroke '#000000' y shadow verde de glow (no es el patrón base).
    const txt = this.add
      .text(GAME_WIDTH / 2, CONTROL_PANEL.Y - 10, '¡MAX POWER!', {
        ...uiLabelStyle(28, COLOR_REWARD, 4),
        stroke: '#000000',
        shadow: { offsetX: 2, offsetY: 2, color: '#006600', blur: 0, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(50)

    this.tweens.add({
      targets: txt,
      y: 390,
      alpha: 1,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: txt,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeIn',
            onComplete: () => txt.destroy(),
          })
        })
      },
    })
  }

  // ========================================
  // FASE 2 — Carrera y equilibrio
  // ========================================

  startRunning() {
    this.powerBarUI?.destroy()
    this.powerBarUI = null
    this.phase = 'running'

    this.runSystem = new RunSystem(this.getPoleLength())
    this.runSystem.start(this.impulseResult.impulseValue)

    if (this.runSystem.stalled) {
      this.distanceTraveled = 0
      this._startFall()
      return
    }

    const equilibrio = this.characterData?.stats?.equilibrio || 5
    this.balanceBar = new BalanceBar(equilibrio)
    this.balanceSystem = new BalanceSystem(this.balanceBar)
    this.balanceUI = new BalanceUI(this, this.balanceBar, this.balanceSystem)
    this.balanceUI.create()
  }

  updateRunning(dt) {
    const poleLength = this.getPoleLength()
    const progressRatio = Math.max(0, Math.min(1, this.distanceTraveled / poleLength))
    this.oilSystem.update(dt, progressRatio)
    this.onOilChanged()

    if (this.balanceBar) {
      const greaseRatio = this.oilSystem.getGreaseRatio(progressRatio)
      this.balanceSystem.update(dt, this.balanceUI?.getInputDirection() ?? 0, greaseRatio)
      // BalanceUI recibe el multiplicador final para la visualización
      // (no necesita conocer la mecánica interna del growth factor).
      this.balanceUI?.update(this.oilSystem.getDriftMultiplier(progressRatio))

      if (this.balanceSystem.isFailed()) {
        this.onBalanceLost()
        return
      }
    }

    if (this.runSystem.finished) return

    this.runSystem.update(dt)
    this.distanceTraveled = this.runSystem.distance
    this.onRunProgress(dt)

    if (!this.hasFlag && this.isFlagReached()) {
      this.runSystem.forceToEnd()
      this.distanceTraveled = this.runSystem.distance
      this.snapToFlag()
      this._grabFlag()
    }
  }

  onBalanceLost() {
    this.sound.play('sfx-hit', { volume: 0.8 })
    this._destroyBalance()
    this._startFall()
  }

  _destroyBalance() {
    this.balanceUI?.destroy()
    this.balanceUI = null
    this.balanceBar = null
    this.balanceSystem = null
  }

  // ========================================
  // SALTO
  // ========================================

  startJump() {
    this._destroyBalance()
    this.hasJumped = true
    this.phase = 'jumping'
    this.onJumpStart()
  }

  // ========================================
  // BANDERA
  // ========================================

  // Estado y feedback compartidos al cogerla, salte o no el jugador.
  // captureGrease solo aplica en la fase de equilibrio (no en salto, donde
  // la grasa ya no afecta y _capturedGreasePercent no se usa).
  _onFlagGrabbed({ captureGrease = false } = {}) {
    this.sound.play('sfx-flag', { volume: 1.0 })
    this.hasFlag = true
    if (captureGrease) this._capturedGreasePercent = this.oilSystem.getTotalGrease()
    this.oilSystem.reset()
    this.onFlagTaken()
  }

  _grabFlag() {
    this._onFlagGrabbed({ captureGrease: true })
    this._destroyBalance()
    this._startFall()
  }

  // ========================================
  // CAÍDA Y CHAPUZÓN
  // ========================================

  _startFall() {
    this.phase = 'falling'
    this.onFallStart()
  }

  // Punto de convergencia de todas las formas de acabar en el agua
  // (caída de la carrera, salto largo, salto corto)
  _waterOutcome() {
    if (this.phase === 'splash_done' || this.phase === 'done') return
    this.phase = 'splash_done'

    this._playWaterSounds()

    if (this.hasFlag) {
      this._afterSplashWin()
    } else {
      this._afterSplashLose()
    }
  }

  _playWaterSounds() {
    if (this.hasFlag) {
      // Aplausos: esperamos a que el chapuzón suene y luego palmadas escalonadas
      APPLAUSE_DELAYS_MS.forEach((delay) => {
        this.time.delayedCall(delay, () => this.sound.play('sfx-win', { volume: 0.65 }))
      })
    } else {
      // Esperamos a que el chapuzón baje antes de soltar el oooohh
      this.time.delayedCall(FAIL_SOUND_DELAY_MS, () => {
        this.sound.play('sfx-fail', { volume: 1.0 })
      })
    }
  }

  // ========================================
  // GAME OVER Y PREMIO
  // ========================================

  showGameOver() {
    this.phase = 'done'
    this._disableExitButton()
    this._recordRun({ success: false })

    const distPercent = Math.round((this.distanceTraveled / this.getPoleLength()) * 100)

    createGameOverPanel(this, {
      distPercent,
      onChangeCharacter: () => this.scene.start(SCENES.CHARACTER_SELECT),
      onCollection: () => this.scene.start(SCENES.COLLECTION, { character: this.characterData }),
      onReady: ({ changeCharacterBounds, collectionBounds }) => {
        this.canRestart = true
        this.changeCharacterBtnBounds = changeCharacterBounds
        this.collectionBtnBounds = collectionBounds
      },
    })
  }

  startRewardScreen() {
    this.phase = 'done'
    const rewards = this.cache.json.get('rewards') || []
    const reward = weightedRandom(rewards, 'probabilidad')

    this._recordRun({ success: true, reward })

    const newMapPiece = this.hasPerfectImpulse ? mapService.unlockRandom() : null

    this.scene.start(SCENES.REWARD, { reward, character: this.characterData, newMapPiece })
  }

  _recordRun({ success, reward = null }) {
    gameStatsService.addRecord({
      timestamp: new Date().toISOString(),
      characterId: this.characterData?.id ?? 'unknown',
      skinKey: this.skinKey,
      perspectiveId: this.getPerspectiveId(),
      success,
      rewardId: reward?.id ?? null,
      greasePercent: success ? (this._capturedGreasePercent ?? 0) : this.oilSystem.getTotalGrease(),
      polePercent: Math.round((this.distanceTraveled / this.getPoleLength()) * 10000) / 100,
      impulseValue: this.impulseResult?.impulseValue ?? null,
      durationSecs: Math.round((this.runSystem?.elapsed ?? 0) * 100) / 100,
      hasJumped: this.hasJumped,
    })
  }

  // ========================================
  // SALIR DE LA PARTIDA
  // ========================================

  _showExitConfirm() {
    // Bloqueado mientras se muestra el resultado de la partida (game over,
    // celebración) — esas pantallas ya tienen su propia salida y, si se abre
    // encima, el modal de confirmación se monta sobre el panel de resultado.
    const canExit = this.phase === 'impulse' || this.phase === 'running' || this.phase === 'jumping'
    if (!canExit || this._exitModal) return

    this._prePausePhase = this.phase
    this.phase = 'paused'
    this._exitModal = showExitConfirmModal(this, {
      onConfirm: () => this.scene.start(SCENES.MENU),
      onResume: () => this._closeExitConfirm(),
    })
  }

  _closeExitConfirm() {
    this._exitModal?.destroy()
    this._exitModal = null
    this.phase = this._prePausePhase
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))
    this.input.keyboard.on('keydown-SPACE', (event) => {
      if (!event.repeat) this.handleTap(null)
    })
    this.input.keyboard.on('keydown-ESC', () => this._showExitConfirm())

    this.input.keyboard.on('keydown-LEFT', (e) => {
      if (e.repeat || this.phase !== 'running' || !this.balanceUI) return
      this.balanceUI.pressLeft()
    })
    this.input.keyboard.on('keydown-RIGHT', (e) => {
      if (e.repeat || this.phase !== 'running' || !this.balanceUI) return
      this.balanceUI.pressRight()
    })
    this.input.keyboard.on('keyup-LEFT', () => this.balanceUI?.releaseLeft())
    this.input.keyboard.on('keyup-RIGHT', () => this.balanceUI?.releaseRight())
  }

  handleTap(pointer) {
    if (this._exitModal) return
    if (
      pointer &&
      this.exitBtnBounds &&
      Phaser.Geom.Rectangle.Contains(this.exitBtnBounds, pointer.x, pointer.y)
    )
      return

    if (this.phase === 'impulse' && this.impulseSystem.isActive()) {
      this.onBarStopped()
    } else if (this.phase === 'running' && !this.hasJumped) {
      if (pointer && pointer.y >= CONTROL_PANEL.Y) return
      this.startJump()
    } else if (this.phase === 'done' && this.canRestart) {
      if (
        pointer &&
        [this.collectionBtnBounds, this.changeCharacterBtnBounds].some(
          (bounds) => bounds && Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)
        )
      )
        return
      this.scene.restart(this.getRestartData())
    }
  }

  // ========================================
  // HUD Y PANEL DE CONTROL
  // ========================================

  createControlPanel() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BLACK, 0.8)
    g.fillRect(0, CONTROL_PANEL.Y, GAME_WIDTH, CONTROL_PANEL.HEIGHT)
  }

  createHUD() {
    const HUD_MARGIN = 10
    const exitBtnOpts = { depth: 5, fontSize: '24px', paddingX: 16, paddingY: 8 }
    const { w: exitBtnW, h: exitBtnH } = measureNavButtonSize(this, 'SALIR', exitBtnOpts)
    const HUD_H = exitBtnH + HUD_MARGIN * 2

    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.4)
    g.fillRect(0, 0, GAME_WIDTH, HUD_H)
    g.fillStyle(COLORS.GOLD, 1)
    g.fillRect(0, HUD_H, GAME_WIDTH, 2)

    this.add
      .text(16, Math.round(HUD_H / 2), this.getHudTitle(), {
        ...headingStyle(36, COLOR_GOLD, 3),
        stroke: '#000000',
      })
      .setOrigin(0, 0.5)

    const exitBtnObjsStart = this.children.list.length
    this.exitBtnBounds = makeNavButton(
      this,
      GAME_WIDTH - exitBtnW - HUD_MARGIN,
      HUD_MARGIN,
      exitBtnW,
      exitBtnH,
      'SALIR',
      () => this._showExitConfirm(),
      exitBtnOpts
    )
    this._exitBtnObjs = this.children.list.slice(exitBtnObjsStart)

    this.oilIndicator = createOilIndicator(this, 8, HUD_H + 12)
    this.oilIndicator.update(this.oilSystem.getTotalGrease())
  }

  // Atenúa y desactiva el botón SALIR una vez se muestra el resultado de la
  // partida — esas pantallas ya tienen su propia salida (CAMBIAR PERSONAJE,
  // VER PREMIOS, VOLVER A JUGAR...) y dejarlo activo permite abrir el modal
  // de confirmación encima del panel de resultado.
  _disableExitButton() {
    this._exitBtnObjs?.forEach((o) => {
      o.disableInteractive?.()
      o.setAlpha?.(0.35)
    })
  }

  // ========================================
  // HOOKS DE PRESENTACIÓN (subclases)
  // ========================================

  getHudTitle() {
    return this.characterData?.name || 'JUGADOR'
  }

  // La bandera ya está clavada al final del palo por RunSystem.forceToEnd();
  // las subclases pueden además ajustar sus visuales (posición del sprite...)
  snapToFlag() {}

  // Feedback visual al coger la bandera (ocultarla del palo, sprite del jugador...)
  onFlagTaken() {}

  // Presentación del avance durante la carrera (mover sprite, animación...)
  onRunProgress(_dt) {}

  // La grasa ha cambiado este frame (overlay del palo en 2D)
  onOilChanged() {}

  // Trabajo por frame de la subclase al final del update (render 3D...)
  onFrame(_dt) {}

  // ========================================
  // UPDATE
  // ========================================

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05)

    if (this.phase === 'impulse') {
      this.impulseSystem.update(dt)
      this.powerBarUI?.update()
      if (this.powerBar.finished) this.onBarStopped()
    }

    if (this.phase === 'running') this.updateRunning(dt)
    if (this.phase === 'jumping') this.updateJumping(dt)

    this.oilIndicator?.update(this.oilSystem.getTotalGrease())
    this.onFrame(dt)
  }

  _onShutdown() {
    this.powerBarUI?.destroy()
    this.balanceUI?.destroy()
  }
}
