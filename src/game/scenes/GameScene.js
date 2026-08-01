import { BaseGameScene } from './BaseGameScene'
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  POLE,
  BOAT,
  JUMP,
  OIL,
  COLORS,
} from '../config/gameConfig'
import { getStoredPerspective } from '../config/perspectiveConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { SPRITE_CONFIG } from '../config/spriteConfig'
import { Player } from '../entities/Player'
import { BackgroundBoat } from '../entities/BackgroundBoat'
import { JumpSystem } from '../systems/JumpSystem'
import { FallSystem } from '../systems/FallSystem'
import { OilSystem } from '../systems/OilSystem'
import { flagDeliveryService } from '../services/FlagDeliveryService'

// Vista lateral 2D de la partida (perspectivas Triana y Sevilla).
// El flujo de juego vive en BaseGameScene; aquí solo la presentación:
// fondo según perspectiva, palo, jugador (sprite), grasa sobre el palo,
// salto/caída con animaciones y celebración.

const WIN_CELEBRATION_DELAY_MS = 600
const LOSE_HEAD_DELAY_MS = 400

export class GameScene extends BaseGameScene {
  constructor() {
    super(SCENES.GAME)
  }

  init(data) {
    super.init(data)

    // Ignorar la perspectiva guardada si está bloqueada (ej. '3d' seleccionada
    // antes de que pasara a desbloquearse con el 100 % de completado)
    const perspId = data.perspective?.id ?? getStoredPerspective()
    this.perspective =
      (perspectiveUnlockService.isUnlocked(perspId)
        ? perspectiveUnlockService.getById(perspId)
        : null) ?? perspectiveUnlockService.getById('triana')

    this.poleY = GAME_HEIGHT * POLE.Y_FACTOR
    this.waterY = this.poleY + 60

    this.flagGraphics = null
    this.oilOverlay = null
    this.jumpSystem = null
    this.fallSystem = null
    this.player = null
  }

  preload() {
    if (!this.skinKey) return
    if (this.textures.exists(this.skinKey)) return

    const spritesheetName = this.skinKey.replace('sprite-', '')
    this.load.setPath('assets')
    this.load.spritesheet(this.skinKey, `sprites/characters/spritesheet/${spritesheetName}.png`, {
      frameWidth: SPRITE_CONFIG.frameWidth,
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

    this.oilSystem = new OilSystem()
    this.oilOverlay = this.add.graphics()
    this.gameWorld.add(this.oilOverlay)
    this._drawOilOverlay()

    this.player = new Player(
      this,
      POLE.START_X,
      this.poleY - 4,
      this.characterData,
      SPRITE_CONFIG.scale,
      this.gameWorld,
      this.skinKey
    )
    this.fallSystem = new FallSystem(this, this.gameWorld)

    this.createControlPanel()
    this.createHUD()
    this.setupInput()

    if (flagDeliveryService.consume()) {
      this._playFlagDeliveryCeremony()
    } else {
      this.startPhase1()
    }
  }

  // Cinemática de introducción tras conseguir la bandera en la partida
  // anterior — un barquito entra por la izquierda del río, "planta" la
  // bandera bajo el palo y se aleja. Durante la ceremonia la fase de
  // impulso no arranca y un tap en cualquier parte de la pantalla salta al
  // final. Un tap sobre el barquito queda reservado para una futura escena.
  _playFlagDeliveryCeremony() {
    this.phase = 'ceremony'
    this.flagGraphics.setVisible(false)

    // El barquito recorre el río de IZQUIERDA a DERECHA en coords del
    // mundo: entra por la izquierda de la pantalla (Triana), se detiene
    // bajo la bandera para plantarla y continúa "engrasando" el palo
    // hasta que se acerca al barco grande, donde se desvanece — NO pasa
    // por delante del barco grande. El sprite ya mira a la derecha
    // nativamente (escalera delante = lado derecho del frame, motor
    // detrás = lado izquierdo), así que NO necesita flipX. En Sevilla el
    // flip de gameWorld invierte automáticamente la dirección en pantalla
    // sin tocar las coords del mundo.
    const spriteScale = SPRITE_CONFIG.scale
    const startWorldX = -150
    // Se desvanece justo antes del borde izquierdo del barco grande
    // (POLE.START_X = borde izquierdo del casco). Restamos ~30 px para
    // que el fundido termine limpio, sin solapamiento visible.
    const exitWorldX = POLE.START_X - 30
    const stopWorldX = POLE.END_X
    const y = this.poleY + 36

    this._backgroundBoat = new BackgroundBoat(this, {
      startX: startWorldX,
      y,
      scale: spriteScale,
      depth: 5,
      enterSpeedPxPerSec: 110,
      leaveSpeedPxPerSec: 75,
      plantFrameDelayMs: 220,
      leaveAltFrameMs: 220,
      leaveFinalFrameMs: 550,
      leaveFadeMs: 0, // Corte seco al llegar al final — la partida arranca justo después
      parent: this.gameWorld,
      onClick: () => {
        // TODO(cutscene-click): abrir una escena narrativa del barquero
        // (formato tipo HistoryScene / TutorialScene). Sprite ya está
        // marcado interactive; el tap sobre el barco NO debe saltar la
        // cinemática — eso ya lo maneja skipHandler más abajo.
      },
    })

    const skipHandler = (pointer) => {
      if (!this._backgroundBoat) return
      // El botón SALIR conserva su función durante la cinemática.
      if (
        pointer &&
        this.exitBtnBounds &&
        Phaser.Geom.Rectangle.Contains(this.exitBtnBounds, pointer.x, pointer.y)
      )
        return
      // Tap sobre el barquito → reservado para futura escena, no salta.
      const boatSprite = this._backgroundBoat.sprite
      if (
        pointer &&
        boatSprite &&
        Phaser.Geom.Rectangle.Contains(boatSprite.getBounds(), pointer.x, pointer.y)
      )
        return
      this._backgroundBoat.skip()
    }
    // Se registra como listener aparte del handleTap normal para poder
    // desmontarlo cuando la ceremonia acaba.
    this._ceremonySkipHandler = skipHandler
    this.input.on('pointerdown', skipHandler)

    this._backgroundBoat.play({
      targetX: stopWorldX,
      exitX: exitWorldX,
      onFlagPlanted: () => this.flagGraphics.setVisible(true),
      onDone: () => this._endFlagDeliveryCeremony(),
    })
  }

  _endFlagDeliveryCeremony() {
    if (this._ceremonySkipHandler) {
      this.input.off('pointerdown', this._ceremonySkipHandler)
      this._ceremonySkipHandler = null
    }
    // Si se hizo skip antes de que sonase el frame de plantar, garantiza el
    // estado final visible (bandera en el palo).
    this.flagGraphics.setVisible(true)
    this._backgroundBoat = null
    this.startPhase1()
  }

  _setupGameWorld() {
    const S = this.perspective.scale
    this.gameWorld = this.add.container(0, 0)
    if (this.perspective.flipX) {
      this.gameWorld.x = (GAME_WIDTH / 2) * (1 + S)
      this.gameWorld.y = this.poleY * (1 - S) + this.perspective.yOffset
      this.gameWorld.scaleX = -S
      this.gameWorld.scaleY = S
    }
  }

  // ========================================
  // HOOKS DEL FLUJO COMPARTIDO
  // ========================================

  getPoleLength() {
    return POLE.LENGTH
  }

  getPerspectiveId() {
    return this.perspective?.id ?? 'triana'
  }

  getRestartData() {
    return { character: this.characterData, perspective: this.perspective }
  }

  onOilChanged() {
    this._drawOilOverlay()
  }

  onRunProgress(dt) {
    this.player.x = POLE.START_X - this.distanceTraveled
    this.player.updateAnimation(dt, this.runSystem.currentSpeed)
    this.player.redraw()
  }

  isFlagReached() {
    return this._checkFlagCollision()
  }

  snapToFlag() {
    this.player.x = POLE.END_X
    this.player.redraw()
  }

  onFlagTaken() {
    this.flagGraphics.setVisible(false)
    this.player.setFlag(true)
    this.player.redraw()
  }

  // ========================================
  // SALTO
  // ========================================

  onJumpStart() {
    this.jumpSystem = new JumpSystem()
    this.jumpSystem.start({
      playerX: this.player.x,
      playerY: this.player.y,
      runElapsed: this.runSystem.elapsed,
      runDuration: this.runSystem.duration,
      initialSpeed: this.runSystem.initialSpeed,
      waterY: this.waterY,
      jumpDistance: this.characterData?.stats?.jump ?? JUMP.EXTRA_DISTANCE,
    })

    this.player.setJumping(true, this.hasFlag)
  }

  updateJumping(dt) {
    const { x, y } = this.jumpSystem.update(dt)
    this.player.x = x
    this.player.y = y
    this.distanceTraveled = POLE.START_X - this.player.x

    if (!this.hasFlag && this._checkFlagCollision()) {
      this._onFlagGrabbed()
    }

    if (this.player.y >= this.waterY) {
      this.player.y = this.waterY
      this.player.setVisible(false)
      this.fallSystem.splash(this.player.x, this.waterY)
      this._waterOutcome()
      return
    }

    this.player.redraw()
  }

  // ========================================
  // BANDERA
  // ========================================

  _checkFlagCollision() {
    const charTop = this.player.y - 36
    const charBottom = this.player.y + 4
    const charLeft = this.player.x - 12

    const flagTop = this.poleY - 28
    const flagBottom = this.poleY + 2
    const flagRight = POLE.END_X + POLE.FLAG_GRAB_RANGE

    return charLeft <= flagRight && charTop < flagBottom && charBottom > flagTop
  }

  // ========================================
  // CAÍDA, CELEBRACIÓN Y RESULTADO
  // ========================================

  onFallStart() {
    this.fallSystem.fall(this.player, this.waterY, () => this._waterOutcome())
  }

  _afterSplashWin() {
    this.time.delayedCall(WIN_CELEBRATION_DELAY_MS, () => this.showCelebration())
  }

  _afterSplashLose() {
    this.time.delayedCall(LOSE_HEAD_DELAY_MS, () => {
      this.player.showHead(this.waterY)
      this.showGameOver()
    })
  }

  showCelebration() {
    this.phase = 'celebrating'
    this._disableExitButton()
    this.player.startCelebration(this.waterY, () => this.startRewardScreen())
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
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.perspective.backgroundKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
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
    const boat = this.add
      .image(boatCenterX, boatCenterY, 'boat')
      .setDisplaySize(BOAT.DISPLAY_WIDTH, BOAT.DISPLAY_HEIGHT)
    this.gameWorld.add(boat)
  }

  _onShutdown() {
    super._onShutdown()
    this.player?.destroy()
    this._backgroundBoat?.destroy()
    this._backgroundBoat = null
    if (this._ceremonySkipHandler) {
      this.input.off('pointerdown', this._ceremonySkipHandler)
      this._ceremonySkipHandler = null
    }
  }
}
