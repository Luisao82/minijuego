import * as THREE from 'three'
import { BaseScene } from './BaseScene'
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CONTROL_PANEL,
  MOVEMENT,
  PHASE1,
  JUMP,
  GAME3D,
} from '../config/gameConfig'
import { COLOR_GOLD, COLOR_REWARD } from '../config/fonts'
import { headingStyle, uiLabelStyle } from '../config/textStyles'
import { mapService } from '../services/MapService'
import { skinService } from '../services/SkinService'
import { PowerBar } from '../entities/PowerBar'
import { BalanceBar } from '../entities/BalanceBar'
import { ImpulseSystem } from '../systems/ImpulseSystem'
import { BalanceSystem } from '../systems/BalanceSystem'
import { OilSystem } from '../systems/OilSystem'
import { PowerBarUI } from '../components/PowerBarUI'
import { BalanceUI } from '../components/BalanceUI'
import { createOilIndicator } from '../components/OilIndicator'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'
import { gameStatsService } from '../services/GameStatsService'
import { weightedRandom } from '../utils/math'
import { getGameOverMessage } from '../config/gameOverMessages'

// Vista 3D en primera persona (estilo Doom) — misma partida que GameScene:
// Fase 1 impulso (barra de poder) y Fase 2 equilibrio (botones rojo/azul),
// reutilizando las MISMAS entidades, sistemas y UI del panel de control.
// El mundo se renderiza con three.js a baja resolución y se vuelca en una
// CanvasTexture de Phaser escalada con NEAREST (pixel art), de modo que
// todo el HUD del juego original se dibuja encima sin cambios.

const RW = GAME_WIDTH / GAME3D.RENDER_SCALE
const RH = GAME_HEIGHT / GAME3D.RENDER_SCALE
const RT_KEY = 'rt-game3d'

export class Game3DScene extends BaseScene {
  constructor() {
    super(SCENES.GAME_3D)
  }

  init(data) {
    super.init(data)
    this.characterData = data.character || null
    const skinSpritesheet =
      data.skin ?? (this.characterData ? skinService.getActiveSkin(this.characterData) : null)
    this.skinKey = skinSpritesheet ? `sprite-${skinSpritesheet}` : null

    this.phase = null
    this.impulseResult = null
    this.hasPerfectImpulse = false

    // Movimiento (en metros de mundo 3D)
    this.distanceTraveled = 0
    this.maxDistance = 0
    this.initialSpeed = 0
    this.runDuration = 0
    this.runElapsed = 0

    // Bandera y salto
    this.hasFlag = false
    this.hasJumped = false
    this._jumpVy = 0
    this._jumpVz = 0
    this._eyeY = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT

    // Equilibrio
    this.balanceBar = null
    this.balanceSystem = null
    this.balanceUI = null
    this._roll = 0

    // Grasa
    this.oilSystem = null
    this.oilIndicator = null
    this._capturedGreasePercent = null

    // Caída
    this._fallDir = 1
    this._fallT = 0

    // Estado de resultado y UI
    this.canRestart = false
    this.collectionBtnBounds = null
    this.changeCharacterBtnBounds = null
    this.exitBtnBounds = null

    // Reloj interno del mundo 3D
    this._worldT = 0

    this.impulseSystem = null
    this.powerBar = null
    this.powerBarUI = null
  }

  create() {
    this._buildThree()
    this._buildRenderTarget()

    this.oilSystem = new OilSystem()

    this.createControlPanel()
    this.createHUD()
    this.startPhase1()
    this.setupInput()
  }

  // ========================================
  // MUNDO 3D
  // ========================================

  _buildThree() {
    const t = {}
    t.canvas = document.createElement('canvas')
    t.renderer = new THREE.WebGLRenderer({ canvas: t.canvas, antialias: false })
    t.renderer.outputColorSpace = THREE.SRGBColorSpace
    t.renderer.setSize(RW, RH, false)

    t.scene = new THREE.Scene()
    t.scene.background = new THREE.Color(GAME3D.SKY_COLOR)
    t.scene.fog = new THREE.Fog(GAME3D.SKY_COLOR, GAME3D.FOG_NEAR, GAME3D.FOG_FAR)

    t.camera = new THREE.PerspectiveCamera(75, RW / RH, 0.1, 400)
    t.camera.rotation.order = 'YXZ'
    t.camera.position.set(0, this._eyeY, 0)
    t.camera.rotation.x = -0.12

    // Las texturas se reutilizan de Phaser (ya precargadas en PreloadScene):
    // evita volver a descargar los fondos por red al entrar en la escena.
    const makeTex = (img) => {
      const tex = new THREE.Texture(img)
      tex.needsUpdate = true
      tex.colorSpace = THREE.SRGBColorSpace
      tex.magFilter = THREE.NearestFilter
      tex.minFilter = THREE.NearestFilter
      tex.generateMipmaps = false
      return tex
    }
    const texFromPhaser = (key) => makeTex(this.textures.get(key).getSourceImage())

    // Agua del Guadalquivir con oleaje por vértices. Material sin iluminación
    // para que el color coincida exactamente con el agua de los fondos 2D.
    const waterGeo = new THREE.PlaneGeometry(500, 500, 64, 64)
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshBasicMaterial({ color: GAME3D.WATER_COLOR })
    )
    water.rotation.x = -Math.PI / 2
    t.scene.add(water)
    t.waterPos = waterGeo.attributes.position
    t.waterBase = t.waterPos.array.slice()

    // Orillas: Triana a la izquierda, Sevilla a la derecha.
    // Se recorta la mitad superior de cada fondo (caserío) para que el agua
    // del dibujo no flote como un muro sobre el río 3D.
    // La orilla de Sevilla (fondo_a) tiene el cielo más claro que el resto de
    // fondos. Como es un color plano, se sustituye por el azul común al crear
    // la textura para que todo el horizonte 3D comparta un único cielo.
    const hexToRgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]
    const replaceColor = (img, fromHex, toHex, tolerance = 14) => {
      const from = hexToRgb(fromHex)
      const to = hexToRgb(toHex)
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, c.width, c.height)
      const p = data.data
      for (let i = 0; i < p.length; i += 4) {
        if (
          Math.abs(p[i] - from[0]) <= tolerance &&
          Math.abs(p[i + 1] - from[1]) <= tolerance &&
          Math.abs(p[i + 2] - from[2]) <= tolerance
        ) {
          p[i] = to[0]
          p[i + 1] = to[1]
          p[i + 2] = to[2]
        }
      }
      ctx.putImageData(data, 0, 0)
      return c
    }

    // Cada orilla se recorta exactamente por la línea de agua de su imagen:
    // el caserío apoya justo donde empieza el agua del plano 3D, sin que se
    // cuele la franja de agua dibujada en el fondo.
    const BANK_REPEAT_X = 3
    const bank = (key, x, rotY, waterline, { unifySkyFrom = null } = {}) => {
      const tex = unifySkyFrom
        ? makeTex(
            replaceColor(this.textures.get(key).getSourceImage(), unifySkyFrom, GAME3D.SKY_COLOR)
          )
        : texFromPhaser(key)
      tex.wrapS = THREE.RepeatWrapping
      tex.repeat.set(BANK_REPEAT_X, waterline)
      tex.offset.y = 1 - waterline
      const bankH = (320 / BANK_REPEAT_X) * waterline // mantiene la proporción del dibujo
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(320, bankH),
        new THREE.MeshBasicMaterial({ map: tex, fog: true })
      )
      m.position.set(x, bankH / 2, -40)
      m.rotation.y = rotY
      t.scene.add(m)
    }
    bank('bg-game-sevilla', -62, Math.PI / 2, GAME3D.BANK_WATERLINE_TRIANA) // fondo_b — caserío de Triana
    bank('bg-game', 62, -Math.PI / 2, GAME3D.BANK_WATERLINE_SEVILLA, {
      unifySkyFrom: GAME3D.SKY_COLOR_SEVILLA,
    }) // fondo_a — orilla de Sevilla

    // Puente de Triana frontal (frontal.webp), recortado justo bajo la base de
    // las columnas para que lleguen enteras al agua. El agua del dibujo está
    // pintada del mismo color que el plano 3D (incluida la vista a través de
    // los arcos), de modo que el río continúa sin corte hasta el puente.
    const puenteTex = makeTex(
      replaceColor(
        this.textures.get('bg-3d-frontal').getSourceImage(),
        GAME3D.SKY_COLOR_FRONTAL,
        GAME3D.SKY_COLOR,
        16
      )
    )
    puenteTex.offset.y = 1 - GAME3D.FRONTAL_CROP
    puenteTex.repeat.y = GAME3D.FRONTAL_CROP
    const puenteH = Math.round(150 * GAME3D.FRONTAL_CROP)
    const puente = new THREE.Mesh(
      new THREE.PlaneGeometry(150, puenteH),
      new THREE.MeshBasicMaterial({ map: puenteTex, fog: false })
    )
    puente.position.set(0, puenteH / 2, -170)
    t.scene.add(puente)

    // El palo: grosor uniforme y el mismo color plano que en las vistas 2D
    // (COLORS.WOOD_LIGHT, sin iluminación para que el tono no varíe)
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, GAME3D.POLE_LENGTH, 10, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.WOOD_LIGHT })
    )
    pole.rotation.x = Math.PI / 2
    pole.position.set(0, GAME3D.POLE_Y, -GAME3D.POLE_LENGTH / 2)
    t.scene.add(pole)

    // Bandera blanca en la punta (como en las vistas 2D)
    t.flagGroup = new THREE.Group()
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6),
      new THREE.MeshBasicMaterial({ color: COLORS.WOOD_DARK })
    )
    mast.position.set(0, GAME3D.POLE_Y + 0.75, 0)
    t.flagGroup.add(mast)
    t.flagCloth = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    )
    t.flagCloth.position.set(-0.42, GAME3D.POLE_Y + 1.25, 0)
    t.flagGroup.add(t.flagCloth)
    t.flagGroup.position.z = -GAME3D.POLE_LENGTH
    t.scene.add(t.flagGroup)

    // Barcaza paseando por el río
    t.boat = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFromPhaser('boat') }))
    t.boat.scale.set(7, 4, 1)
    t.boat.position.set(-30, 1.6, -80)
    t.scene.add(t.boat)

    this._three = t
  }

  _buildRenderTarget() {
    if (this.textures.exists(RT_KEY)) this.textures.remove(RT_KEY)
    this._rt = this.textures.createCanvas(RT_KEY, RW, RH)
    this._rt.setFilter(Phaser.Textures.FilterMode.NEAREST)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, RT_KEY).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
  }

  _renderThree(dt) {
    const t = this._three
    if (!t) return
    this._worldT += dt
    const wt = this._worldT

    // Oleaje
    for (let i = 0; i < t.waterPos.count; i++) {
      const x = t.waterBase[i * 3]
      const y = t.waterBase[i * 3 + 1]
      t.waterPos.array[i * 3 + 2] =
        Math.sin(x * 0.25 + wt * 1.6) * 0.14 + Math.cos(y * 0.2 + wt * 1.1) * 0.12
    }
    t.waterPos.needsUpdate = true

    // Barcaza y bandera con vida
    t.boat.position.x = -45 + ((wt * 2.2) % 95)
    t.boat.position.y = 1.6 + Math.sin(wt * 1.8) * 0.12
    t.flagCloth.rotation.y = Math.sin(wt * 3) * 0.3

    this._updateCamera(dt)

    t.renderer.render(t.scene, t.camera)
    this._rt.context.drawImage(t.canvas, 0, 0)
    this._rt.refresh()
  }

  _updateCamera(dt) {
    const cam = this._three.camera
    const baseEye = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT

    if (this.phase === 'impulse') {
      // Respiración en la salida mientras se decide el impulso
      cam.position.set(0, baseEye + Math.sin(this._worldT * 2) * 0.02, 0)
      cam.rotation.set(-0.12, 0, 0)
      return
    }

    if (this.phase === 'running') {
      // La inclinación de la cámara ES la barra de equilibrio
      if (this.balanceBar) this._roll = this.balanceBar.position * GAME3D.MAX_ROLL

      const speedRatio =
        this.runDuration > 0 ? Math.max(0, 1 - this.runElapsed / this.runDuration) : 0
      const speed = this.initialSpeed * speedRatio
      const bob = Math.sin(this.runElapsed * (4 + speed)) * 0.05 * Math.min(speed, 2)

      cam.position.set(Math.sin(this._roll) * 0.55, baseEye + bob, -this.distanceTraveled)
      cam.rotation.set(-0.12, 0, -this._roll * 0.9)
      return
    }

    if (this.phase === 'jumping') {
      cam.position.set(Math.sin(this._roll) * 0.55, this._eyeY, -this.distanceTraveled)
      cam.rotation.set(-0.12 - 0.1, 0, -this._roll * 0.9)
      return
    }

    if (this.phase === 'falling') {
      this._fallT += dt
      this._roll += dt * this._fallDir * 3.2
      this._eyeY -= dt * (2 + this._fallT * 6)
      if (this._eyeY <= 0.15) {
        this._eyeY = 0.15
        this._onWaterHit()
      }
      cam.position.set(Math.sin(this._roll) * 0.9, this._eyeY, -this.distanceTraveled)
      cam.rotation.z = -this._roll * 0.9
      return
    }

    // Resultado: la cámara descansa medio hundida, nivelándose despacio
    cam.rotation.z *= 1 - Math.min(1, dt * 2)
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
  // FASE 2 — Avance y equilibrio
  // ========================================

  startRunning() {
    this.powerBarUI?.destroy()
    this.powerBarUI = null
    this.phase = 'running'

    const impulse = this.impulseResult.impulseValue

    if (impulse <= 0.01) {
      this.maxDistance = 0
      this.distanceTraveled = 0
      this._fall()
      return
    }

    this.maxDistance = impulse * GAME3D.POLE_LENGTH
    this.runDuration =
      MOVEMENT.MIN_RUN_DURATION + impulse * (MOVEMENT.MAX_RUN_DURATION - MOVEMENT.MIN_RUN_DURATION)
    this.initialSpeed = (2 * this.maxDistance) / this.runDuration
    this.runElapsed = 0
    this.distanceTraveled = 0

    const equilibrio = this.characterData?.stats?.equilibrio || 5
    this.balanceBar = new BalanceBar(equilibrio)
    this.balanceSystem = new BalanceSystem(this.balanceBar)
    this.balanceUI = new BalanceUI(this, this.balanceBar, this.balanceSystem)
    this.balanceUI.create()
  }

  updateRunning(dt) {
    const progressRatio = Math.max(0, Math.min(1, this.distanceTraveled / GAME3D.POLE_LENGTH))
    this.oilSystem.update(dt, progressRatio)

    if (this.balanceBar) {
      const greaseRatio = this.oilSystem.getGreaseRatio(progressRatio)
      this.balanceSystem.update(dt, this.balanceUI?.getInputDirection() ?? 0, greaseRatio)
      this.balanceUI?.update(this.oilSystem.getDriftMultiplier(progressRatio))

      if (this.balanceSystem.isFailed()) {
        this.onBalanceLost()
        return
      }
    }

    if (this.runElapsed >= this.runDuration) return

    this.runElapsed += dt

    if (this.runElapsed >= this.runDuration) {
      this.distanceTraveled = Math.min(this.maxDistance, GAME3D.POLE_LENGTH)
      if (!this.hasFlag && this._checkFlagReached()) this._grabFlag()
      return
    }

    const t = this.runElapsed
    const T = this.runDuration
    this.distanceTraveled = this.initialSpeed * t * (1 - t / (2 * T))

    if (!this.hasFlag && this._checkFlagReached()) {
      this.distanceTraveled = GAME3D.POLE_LENGTH
      this._grabFlag()
    }
  }

  onBalanceLost() {
    this.sound.play('sfx-hit', { volume: 0.8 })
    this._destroyBalance()
    this._fall()
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

    const speedRatio =
      this.runDuration > 0 ? Math.max(0, 1 - this.runElapsed / this.runDuration) : 0
    const jumpStat = this.characterData?.stats?.jump ?? JUMP.EXTRA_DISTANCE
    this._jumpVz = this.initialSpeed * speedRatio + 1.2 + jumpStat * 0.25
    this._jumpVy = 2.1
    this._eyeY = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT
  }

  updateJumping(dt) {
    this._jumpVy -= 6 * dt
    this._eyeY += this._jumpVy * dt
    this.distanceTraveled += this._jumpVz * dt

    if (!this.hasFlag && this._checkFlagReached()) {
      this._onFlagGrabbed()
    }

    if (this._eyeY <= 0.15) {
      this._eyeY = 0.15
      this._onWaterHit()
    }
  }

  // ========================================
  // BANDERA
  // ========================================

  _checkFlagReached() {
    return this.distanceTraveled >= GAME3D.POLE_LENGTH - GAME3D.FLAG_GRAB_RANGE
  }

  _onFlagGrabbed({ captureGrease = false } = {}) {
    this.sound.play('sfx-flag', { volume: 1.0 })
    this.hasFlag = true
    this._three.flagGroup.visible = false
    if (captureGrease) this._capturedGreasePercent = this.oilSystem.getTotalGrease()
    this.oilSystem.reset()
  }

  _grabFlag() {
    this._onFlagGrabbed({ captureGrease: true })
    this._destroyBalance()
    this._fall()
  }

  // ========================================
  // CAÍDA AL AGUA
  // ========================================

  _fall() {
    this.phase = 'falling'
    this._fallT = 0
    this._fallDir = this._roll !== 0 ? Math.sign(this._roll) : Math.random() < 0.5 ? -1 : 1
    this._eyeY = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT
  }

  _onWaterHit() {
    if (this.phase === 'splash_done' || this.phase === 'done') return
    this.phase = 'splash_done'

    this.sound.play('sfx-chapuzon', { volume: 0.9 })
    this._splashFlash()
    this._playWaterSounds()

    if (this.hasFlag) {
      this.time.delayedCall(900, () => this.startRewardScreen())
    } else {
      this.time.delayedCall(600, () => this.showGameOver())
    }
  }

  _splashFlash() {
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xbfe3ff, 0.85)
      .setDepth(40)
    this.tweens.add({ targets: flash, alpha: 0, duration: 320, onComplete: () => flash.destroy() })
  }

  _playWaterSounds() {
    if (this.hasFlag) {
      ;[300, 520, 730, 930, 1120, 1300, 1480, 1660, 1840, 2020].forEach((delay) => {
        this.time.delayedCall(delay, () => this.sound.play('sfx-win', { volume: 0.65 }))
      })
    } else {
      this.time.delayedCall(350, () => this.sound.play('sfx-fail', { volume: 1.0 }))
    }
  }

  // ========================================
  // GAME OVER
  // ========================================

  showGameOver() {
    this.phase = 'done'

    gameStatsService.addRecord({
      timestamp: new Date().toISOString(),
      characterId: this.characterData?.id ?? 'unknown',
      skinKey: this.skinKey,
      perspectiveId: '3d',
      success: false,
      rewardId: null,
      greasePercent: this.oilSystem.getTotalGrease(),
      polePercent: Math.round((this.distanceTraveled / GAME3D.POLE_LENGTH) * 10000) / 100,
      impulseValue: this.impulseResult?.impulseValue ?? null,
      durationSecs: Math.round(this.runElapsed * 100) / 100,
      hasJumped: this.hasJumped,
    })

    const distPercent = Math.round((this.distanceTraveled / GAME3D.POLE_LENGTH) * 100)
    const { expression, phrase, color: exprColor } = getGameOverMessage(distPercent)

    const centerX = GAME_WIDTH / 2
    const centerY = CONTROL_PANEL.Y / 2
    const panelW = 620
    const panelH = 260

    const g = this.add.graphics().setDepth(45)
    g.fillStyle(COLORS.DARK_BG, 0.88)
    g.fillRect(centerX - panelW / 2, centerY - panelH / 2, panelW, panelH)
    g.lineStyle(2, COLORS.GOLD, 0.8)
    g.strokeRect(centerX - panelW / 2, centerY - panelH / 2, panelW, panelH)

    this.add
      .text(centerX, centerY - 85, expression, {
        ...headingStyle(44, exprColor, 5),
        stroke: '#000000',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(46)

    this.add
      .text(centerX, centerY - 22, phrase, {
        ...headingStyle(28, exprColor, 3),
        stroke: '#000000',
        align: 'center',
        wordWrap: { width: panelW - 50 },
      })
      .setOrigin(0.5)
      .setDepth(46)

    this.time.delayedCall(1000, () => {
      this.canRestart = true

      const restartText = this.add
        .text(centerX, centerY + 32, 'PULSA PARA REINTENTAR', {
          ...headingStyle(22, '#ffffff', 3),
          stroke: '#000000',
        })
        .setOrigin(0.5)
        .setDepth(46)
      this.tweens.add({ targets: restartText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 })

      const gap = 14
      const btnOpts = { fontSize: '22px', depth: 46 }
      const sizeChange = measureNavButtonSize(this, 'CAMBIAR PERSONAJE', btnOpts)
      const sizeCollection = measureNavButtonSize(this, 'VER PREMIOS', btnOpts)
      const btnH = Math.max(sizeChange.h, sizeCollection.h)
      const totalW = sizeChange.w + sizeCollection.w + gap
      const startX = centerX - totalW / 2
      const btnY = centerY + 58

      this.changeCharacterBtnBounds = makeNavButton(
        this,
        startX,
        btnY,
        sizeChange.w,
        btnH,
        'CAMBIAR PERSONAJE',
        () => this.scene.start(SCENES.CHARACTER_SELECT),
        btnOpts
      )

      this.collectionBtnBounds = makeNavButton(
        this,
        startX + sizeChange.w + gap,
        btnY,
        sizeCollection.w,
        btnH,
        'VER PREMIOS',
        () => this.scene.start(SCENES.COLLECTION, { character: this.characterData }),
        btnOpts
      )
    })
  }

  // ========================================
  // RECOMPENSA
  // ========================================

  startRewardScreen() {
    this.phase = 'done'
    const rewards = this.cache.json.get('rewards') || []
    const reward = weightedRandom(rewards, 'probabilidad')

    gameStatsService.addRecord({
      timestamp: new Date().toISOString(),
      characterId: this.characterData?.id ?? 'unknown',
      skinKey: this.skinKey,
      perspectiveId: '3d',
      success: true,
      rewardId: reward?.id ?? null,
      greasePercent: this._capturedGreasePercent ?? 0,
      polePercent: Math.round((this.distanceTraveled / GAME3D.POLE_LENGTH) * 10000) / 100,
      impulseValue: this.impulseResult?.impulseValue ?? null,
      durationSecs: Math.round(this.runElapsed * 100) / 100,
      hasJumped: this.hasJumped,
    })

    const newMapPiece = this.hasPerfectImpulse ? mapService.unlockRandom() : null

    this.scene.start(SCENES.REWARD, { reward, character: this.characterData, newMapPiece })
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))
    this.input.keyboard.on('keydown-SPACE', (event) => {
      if (!event.repeat) this.handleTap(null)
    })

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
      this.scene.restart({ character: this.characterData })
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

    const charName = this.characterData?.name || 'JUGADOR'
    this.add
      .text(16, Math.round(HUD_H / 2), `${charName} · VISTA 3D`, {
        ...headingStyle(36, COLOR_GOLD, 3),
        stroke: '#000000',
      })
      .setOrigin(0, 0.5)

    this.exitBtnBounds = makeNavButton(
      this,
      GAME_WIDTH - exitBtnW - HUD_MARGIN,
      HUD_MARGIN,
      exitBtnW,
      exitBtnH,
      'SALIR',
      () => this.scene.start(SCENES.MENU),
      exitBtnOpts
    )

    this.oilIndicator = createOilIndicator(this, 8, HUD_H + 12)
    this.oilIndicator.update(this.oilSystem.getTotalGrease())
  }

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
    this._renderThree(dt)
  }

  _onShutdown() {
    this.powerBarUI?.destroy()
    this.balanceUI?.destroy()
    if (this._three) {
      this._three.renderer.dispose()
      this._three.renderer.forceContextLoss()
      this._three = null
    }
    if (this.textures.exists(RT_KEY)) this.textures.remove(RT_KEY)
  }
}
