import { BaseGameScene } from './BaseGameScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { GAME3D, RENDER_WIDTH, RENDER_HEIGHT } from '../config/game3dConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle } from '../config/textStyles'
import { OilSystem } from '../systems/OilSystem'
import { JumpSystem } from '../systems/JumpSystem'
import { World3D } from '../render3d/World3D'
import { CameraController } from '../render3d/CameraController'

// Vista 3D en primera persona (estilo Doom) — misma partida que las vistas 2D:
// el flujo (impulso, equilibrio, salto, bandera, premios, stats) vive en
// BaseGameScene y reutiliza los mismos sistemas. Aquí solo la presentación:
// el mundo three.js (World3D) se renderiza a baja resolución y se vuelca en
// una CanvasTexture de Phaser escalada con NEAREST (pixel art), de modo que
// todo el HUD del juego original se dibuja encima sin cambios.

const RT_KEY = 'rt-game3d'

export class Game3DScene extends BaseGameScene {
  constructor() {
    super(SCENES.GAME_3D)
  }

  init(data) {
    super.init(data)
    this._world = null
    this._rt = null
    this._loadingText = null
    this.cameraController = null
    this.jumpSystem = null
    this._jumpEyeY = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT
  }

  create() {
    this.oilSystem = new OilSystem()
    this.cameraController = new CameraController()

    // La textura del render 3D se añade la primera para que HUD y panel
    // queden por encima. Se rellena en cuanto three.js (chunk aparte,
    // import dinámico) y el mundo estén listos.
    this._buildRenderTarget()
    this.createControlPanel()
    this.createHUD()
    this.setupInput()

    this._loadingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CARGANDO VISTA 3D...', {
        ...headingStyle(28, COLOR_GOLD, 3),
        stroke: '#000000',
      })
      .setOrigin(0.5)

    // El token invalida promesas de creaciones anteriores si la escena
    // se reinicia o se cierra mientras three.js sigue cargando
    const buildToken = {}
    this._buildToken = buildToken

    World3D.create(this.textures).then((world) => {
      if (this._buildToken !== buildToken || !this.scene.isActive(SCENES.GAME_3D)) {
        world.dispose()
        return
      }
      this._world = world
      this._loadingText?.destroy()
      this._loadingText = null
      this.startPhase1()
    })
  }

  _buildRenderTarget() {
    if (this.textures.exists(RT_KEY)) this.textures.remove(RT_KEY)
    this._rt = this.textures.createCanvas(RT_KEY, RENDER_WIDTH, RENDER_HEIGHT)
    this._rt.setFilter(Phaser.Textures.FilterMode.NEAREST)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, RT_KEY).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
  }

  // ========================================
  // HOOKS DEL FLUJO COMPARTIDO
  // ========================================

  getPoleLength() {
    return GAME3D.POLE_LENGTH
  }

  getPerspectiveId() {
    return '3d'
  }

  getHudTitle() {
    return `${this.characterData?.name || 'JUGADOR'} · VISTA 3D`
  }

  getRestartData() {
    return { character: this.characterData }
  }

  isFlagReached() {
    return this.distanceTraveled >= GAME3D.POLE_LENGTH - GAME3D.FLAG_GRAB_RANGE
  }

  onFlagTaken() {
    this._world?.setFlagVisible(false)
  }

  // ========================================
  // SALTO — mismo JumpSystem que en 2D, en metros y con el eje de avance
  // invertido (JumpSystem avanza con x decreciente; aquí x = -distancia)
  // ========================================

  onJumpStart() {
    const eyeStart = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT
    const jumpStat = this.characterData?.stats?.jump ?? 5

    this.jumpSystem = new JumpSystem()
    this.jumpSystem.start({
      playerX: -this.distanceTraveled,
      playerY: 0,
      runElapsed: this.runSystem.elapsed,
      runDuration: this.runSystem.duration,
      initialSpeed: this.runSystem.initialSpeed,
      waterY: eyeStart - GAME3D.CAMERA.WATER_EYE_Y,
      jumpDistance: GAME3D.JUMP.EXTRA_DISTANCE + jumpStat * GAME3D.JUMP.EXTRA_PER_STAT,
      gravity: GAME3D.JUMP.GRAVITY,
      vy0: GAME3D.JUMP.VY0,
    })
    this._jumpEyeY = eyeStart
  }

  updateJumping(dt) {
    const { x, y } = this.jumpSystem.update(dt)
    this.distanceTraveled = -x
    this._jumpEyeY = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT - y

    if (!this.hasFlag && this.isFlagReached()) {
      this._onFlagGrabbed()
    }

    if (this._jumpEyeY <= GAME3D.CAMERA.WATER_EYE_Y) {
      this._jumpEyeY = GAME3D.CAMERA.WATER_EYE_Y
      this._onWaterHit()
    }
  }

  // ========================================
  // CAÍDA Y CHAPUZÓN
  // ========================================

  onFallStart() {
    this.cameraController.startFall()
  }

  _onWaterHit() {
    if (this.phase === 'splash_done' || this.phase === 'done') return

    this.sound.play('sfx-chapuzon', { volume: 0.9 })
    this._splashFlash()
    this._waterOutcome()
  }

  _splashFlash() {
    const S = GAME3D.SPLASH
    const flash = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        S.FLASH_COLOR,
        S.FLASH_ALPHA
      )
      .setDepth(40)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: S.FLASH_MS,
      onComplete: () => flash.destroy(),
    })
  }

  _afterSplashWin() {
    this.time.delayedCall(GAME3D.SPLASH.WIN_DELAY_MS, () => this.startRewardScreen())
  }

  _afterSplashLose() {
    this.time.delayedCall(GAME3D.SPLASH.LOSE_DELAY_MS, () => this.showGameOver())
  }

  // ========================================
  // RENDER DEL MUNDO 3D
  // ========================================

  onFrame(dt) {
    if (!this._world) return

    const pose = this.cameraController.update(dt, {
      phase: this.phase,
      balancePosition: this.balanceBar?.position ?? 0,
      runElapsed: this.runSystem?.elapsed ?? 0,
      runDuration: this.runSystem?.duration ?? 0,
      initialSpeed: this.runSystem?.initialSpeed ?? 0,
      distance: this.distanceTraveled,
      jumpEyeY: this._jumpEyeY,
    })

    if (pose.hitWater) this._onWaterHit()

    this._world.applyCamera(pose)
    this._world.update(dt)
    this._rt.context.drawImage(this._world.render(), 0, 0)
    this._rt.refresh()
  }

  _onShutdown() {
    super._onShutdown()
    this._world?.dispose()
    this._world = null
    if (this.textures.exists(RT_KEY)) this.textures.remove(RT_KEY)
  }
}
