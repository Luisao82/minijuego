import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { uiLabelStyle, headingStyle } from '../config/textStyles'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'
import { createFireworks } from '../components/Fireworks'
import { getCompletion } from '../services/CompletionService'
import { finaleService } from '../services/FinaleService'
import { startGame } from '../utils/startGame'

// Escena final del juego: se muestra automáticamente (una sola vez) al
// alcanzar el 100 % de completado, y bajo demanda desde Estadísticas.
// Secuencia: paneo de cámara hacia el cielo nocturno → pausa → fuegos
// artificiales tras las casas + CONGRATULATION + mensaje configurable
// (public/assets/finale.json) → botón VOLVER.
//
// El fondo, tiempos, sonido y parámetros de los fuegos se leen de
// `finale.json`; si el fondo nocturno no está cargado se usa el diurno.

const FALLBACK_BG = 'bg-game-sevilla'
const TITLE_Y = 300

export class FinaleScene extends BaseScene {
  constructor() {
    super(SCENES.FINALE)
  }

  init(data) {
    super.init(data)
    this.returnTo = data.returnTo || SCENES.MENU
    this.returnData = data.returnData || {}
  }

  create() {
    this.config = this.cache.json.get('finale') || {}

    // Registrar que el final ya se ha visto para el total de contenido
    // actual: no volverá a auto-mostrarse hasta que una actualización amplíe
    // el juego y el jugador re-conquiste el 100 %
    const rewardsCount = (this.cache.json.get('rewards') || []).length
    finaleService.markShown(getCompletion(rewardsCount).totals.total)

    this._drawBackground()
    this._createFireworks()
    this._startCameraRise()
    this.setupInput()
  }

  _onShutdown() {
    this.fireworks?.destroy()
  }

  // ── Fondo nocturno con paneo ──────────────────────────────────
  // El "paneo de cámara" se hace moviendo la imagen (no la cámara) para que
  // los textos y el botón no necesiten scrollFactor.

  _drawBackground() {
    const wanted = this.config.backgroundKey ?? 'bg-finale'
    const key = this.textures.exists(wanted) ? wanted : FALLBACK_BG

    const img = this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0)
    const scale = Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height)
    img.setScale(scale)
    img.x = Math.round((GAME_WIDTH - img.width * scale) / 2)

    // Posición inicial: se ve la parte baja de la imagen (río y orilla)
    this._bgTopY = 0
    this._bgBottomY = Math.min(0, Math.round(GAME_HEIGHT - img.height * scale))
    img.y = this._bgBottomY
    this.bg = img
  }

  _startCameraRise() {
    const panMs = this.config.panDurationMs ?? 2500
    const delayMs = this.config.fireworksDelayMs ?? 1000

    // Sin recorrido de paneo (imagen poco alta) o con "reducir movimiento":
    // saltar directamente al encuadre final
    if (this.prefersReducedMotion || this._bgBottomY === this._bgTopY) {
      this.bg.y = this._bgTopY
      this.time.delayedCall(delayMs, () => this._startCelebration())
      return
    }

    this.tweens.add({
      targets: this.bg,
      y: this._bgTopY,
      duration: panMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.bg.y = Math.round(this.bg.y)
      },
      onComplete: () => {
        this.time.delayedCall(delayMs, () => this._startCelebration())
      },
    })
  }

  // ── Fuegos artificiales ───────────────────────────────────────

  _createFireworks() {
    const fw = this.config.fireworks ?? {}
    const colors = (fw.colors ?? [])
      .map((c) => parseInt(String(c).replace('#', ''), 16))
      .filter((n) => Number.isFinite(n))

    this.fireworks = createFireworks(this, {
      ...(colors.length ? { colors } : {}),
      launchY: Math.round(GAME_HEIGHT * (fw.launchYRatio ?? 0.36)),
      burstYMin: Math.round(GAME_HEIGHT * (fw.burstYMinRatio ?? 0.08)),
      burstYMax: Math.round(GAME_HEIGHT * (fw.burstYMaxRatio ?? 0.32)),
      // Máscara de cielo: los fuegos solo se ven por encima de la línea de
      // tejados, así parecen lanzados desde detrás de las casas
      skyBottomY:
        typeof fw.skyLineRatio === 'number' ? Math.round(GAME_HEIGHT * fw.skyLineRatio) : undefined,
      intervalMinMs: fw.intervalMinMs,
      intervalMaxMs: fw.intervalMaxMs,
      pixelSizeMin: fw.pixelSizeMin,
      pixelSizeMax: fw.pixelSizeMax,
      particlesMin: fw.particlesMin,
      particlesMax: fw.particlesMax,
      sfxKey: this.config.explosionSfx ?? 'sfx-chapuzon',
      sfxVolume: this.config.explosionVolume ?? 0.45,
      depth: 2,
    })
  }

  // ── Celebración: fuegos + textos + botón ──────────────────────

  _startCelebration() {
    this.fireworks.start()
    this._drawTexts()
    this._drawBackButton()
  }

  _drawTexts() {
    const title = this.add
      .text(GAME_WIDTH / 2, TITLE_Y, 'CONGRATULATION', {
        ...uiLabelStyle(42, COLOR_GOLD, 6),
        stroke: '#000000',
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setScale(0)

    // Entrada retro: golpe de escala + pulso lento permanente
    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: title,
          alpha: 0.75,
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      },
    })

    // El mensaje va sobre el agua (zona oscura bajo las casas) para no
    // pisar el caserío del fondo nocturno
    const message = this.config.message ?? '¡Has completado el juego!'
    const msgText = this.add
      .text(GAME_WIDTH / 2, Math.round(GAME_HEIGHT * 0.63), message, {
        ...headingStyle(30, '#ffffff', 3),
        stroke: '#000000',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5)
      .setAlpha(0)

    this.tweens.add({
      targets: msgText,
      alpha: 1,
      delay: 400,
      duration: 500,
      ease: 'Quad.easeOut',
    })
  }

  _drawBackButton() {
    const opts = { depth: 6, fontSize: '30px' }
    const { w, h } = measureNavButtonSize(this, 'VOLVER', opts)
    makeNavButton(
      this,
      Math.round(GAME_WIDTH / 2 - w / 2),
      GAME_HEIGHT - h - 24,
      w,
      h,
      'VOLVER',
      () => this._goBack(),
      opts
    )
  }

  // ── Navegación ────────────────────────────────────────────────

  setupInput() {
    this.input.keyboard.on('keydown-ESC', () => this._goBack())
  }

  _goBack() {
    if (this.returnTo === SCENES.GAME) {
      startGame(this, this.returnData)
    } else {
      this.scene.start(this.returnTo, this.returnData)
    }
  }
}
