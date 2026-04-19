import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, PIXEL_FONT } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'
import { SPRITE_CONFIG } from '../config/spriteConfig'
import { unlockService } from '../services/UnlockService'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'

// Tamaño del "píxel de época": cada unidad lógica equivale a este número
// de píxeles reales de pantalla. Todos los grosores de franja y el paso
// de scroll son múltiplos exactos de este valor → el movimiento es siempre
// en saltos discretos, nunca interpolado (look auténtico de hardware retro).
const RETRO_PX = 6

// Patrón de franjas estilo ZX Spectrum — azul y amarillo, anchos irregulares.
// Los grosores son múltiplos de RETRO_PX para que el scroll sea pixel-perfect.
// (1 rp = 4px, 2 rp = 8px, 3 rp = 12px, etc.)
const SPECTRUM_PATTERN = [
  { color: 0xFFFF00, h: 3 * RETRO_PX },   // amarillo — 3 rp
  { color: 0x0000CD, h: 1 * RETRO_PX },   // azul     — 1 rp
  { color: 0xFFFF00, h: 2 * RETRO_PX },   // amarillo — 2 rp
  { color: 0x0000CD, h: 1 * RETRO_PX },   // azul     — 1 rp
  { color: 0xFFFF00, h: 4 * RETRO_PX },   // amarillo — 4 rp
  { color: 0x0000CD, h: 2 * RETRO_PX },   // azul     — 2 rp
  { color: 0xFFFF00, h: 1 * RETRO_PX },   // amarillo — 1 rp
  { color: 0x0000CD, h: 5 * RETRO_PX },   // azul     — 5 rp
  { color: 0xFFFF00, h: 2 * RETRO_PX },   // amarillo — 2 rp
  { color: 0x0000CD, h: 1 * RETRO_PX },   // azul     — 1 rp
  { color: 0xFFFF00, h: 5 * RETRO_PX },   // amarillo — 5 rp
  { color: 0x0000CD, h: 3 * RETRO_PX },   // azul     — 3 rp
]
// Ciclo total: (3+1+2+1+4+2+1+5+2+1+5+3) × 4 = 120px por vuelta

// Pre-computar array plano: un elemento por fila real de pantalla.
const PATTERN_COLORS = []
for (const stripe of SPECTRUM_PATTERN) {
  for (let i = 0; i < stripe.h; i++) PATTERN_COLORS.push(stripe.color)
}
const PATTERN_TOTAL = PATTERN_COLORS.length   // 120

// Scroll estroboscópico: avanza 3 píxeles retro por tick a máxima frecuencia
// (~60 ticks/s) → la vibración rápida simula el borde del Spectrum cargando datos.
const STRIPE_SCROLL_PX = RETRO_PX * 3   // 18px por tick (salto visible y chunky)
const STRIPE_DELAY_MS  = 16             // 1 frame (~60 ticks/s)
const DISPLAY_MIN_MS   = 5000       // tiempo mínimo de pantalla

export class PreloadScene extends BaseScene {

  constructor() {
    super(SCENES.PRELOAD)
  }

  preload() {
    this._startTime     = Date.now()
    this._stripeScrollY = 0   // offset en píxeles dentro del patrón

    this._buildScreen()
    this._startStripeAnimation()
    this._startReveal()
    this._loadAssets()
  }

  create() {
    // La escena arranca solo después de que hayan pasado DISPLAY_MIN_MS
    // desde el inicio, independientemente de cuánto tardó la carga real.
    const elapsed   = Date.now() - this._startTime
    const remaining = Math.max(0, DISPLAY_MIN_MS - elapsed)

    this.time.delayedCall(remaining, () => {
      this._stripeTimer?.remove()
      this._revealTimer?.remove()
      this.scene.start(SCENES.MENU)
    })
  }

  // ── Construcción visual ────────────────────────────────────────

  _buildScreen() {
    const cx = GAME_WIDTH  / 2
    const cy = GAME_HEIGHT / 2

    // 1 — Franjas Spectrum (capa más baja)
    this._stripesGfx = this.add.graphics()
    this._drawStripes()

    // 2 — Recuadro negro + imagen de portada
    // El recuadro negro tiene exactamente el tamaño de la imagen escalada
    // y actúa como "pantalla" donde la imagen se va revelando.
    const scl     = Math.min(GAME_WIDTH / 1025, GAME_HEIGHT / 836) * 0.80
    const imgW    = 1025 * scl
    const imgH    = 836  * scl
    const imgTopY = (cy - 18) - imgH / 2

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 1)
    bg.fillRect(cx - imgW / 2, imgTopY, imgW, imgH)
    const brd = 3 * RETRO_PX   // grosor del borde en píxeles retro
    bg.lineStyle(brd, 0x00FFFF, 1)
    bg.strokeRect(cx - imgW / 2 - brd / 2, imgTopY - brd / 2, imgW + brd, imgH + brd)

    this._revealImg = this.add.image(cx, imgTopY, 'img-preload')
      .setScale(scl)
      .setOrigin(0.5, 0)
      .setCrop(0, 0, 1025, 0)   // empieza completamente oculta

    // 3 — Indicador de carga pequeño en la parte inferior
    this._loadingText = this.add.text(cx, GAME_HEIGHT - 18, 'CARGANDO...', {
      ...PIXEL_FONT,
      fontSize: '10px',
      color: '#aaaaaa',
      strokeThickness: 2,
    }).setOrigin(0.5)

  }

  // ── Animación de franjas ───────────────────────────────────────

  _startStripeAnimation() {
    this._stripePaused    = false
    this._stripePauseLeft = 3   // máximo 3 paradas durante los 5 segundos

    // Programar la primera parada aleatoria
    this._scheduleNextPause()

    this._stripeTimer = this.time.addEvent({
      delay:    STRIPE_DELAY_MS,
      loop:     true,
      callback: () => {
        if (this._stripePaused) return
        this._stripeScrollY = (this._stripeScrollY + STRIPE_SCROLL_PX) % PATTERN_TOTAL
        this._drawStripes()
      },
    })
  }

  _scheduleNextPause() {
    if (this._stripePauseLeft <= 0) return

    // Tiempo aleatorio hasta la próxima parada (entre 400ms y 1800ms)
    const delay = Phaser.Math.Between(400, 1800)

    this.time.delayedCall(delay, () => {
      if (this._stripePauseLeft <= 0) return
      this._stripePaused = true
      this._stripePauseLeft--

      // Duración aleatoria de la parada (entre 80ms y 350ms)
      const pauseDuration = Phaser.Math.Between(80, 350)
      this.time.delayedCall(pauseDuration, () => {
        this._stripePaused = false
        this._scheduleNextPause()
      })
    })
  }

  // ── Revelado línea a línea ─────────────────────────────────────
  // Simula la carga del Spectrum: la imagen aparece de arriba abajo
  // a velocidad ligeramente aleatoria (2-5 filas por tick).
  // Con 836 filas y ~16ms/tick se completa en ≈ 4-5 segundos.
  _startReveal() {
    this._revealRows = 0
    this._revealTimer = this.time.addEvent({
      delay:    16,
      loop:     true,
      callback: () => {
        if (this._revealRows >= 836) { this._revealTimer.remove(); return }
        this._revealRows = Math.min(this._revealRows + Phaser.Math.Between(2, 5), 836)
        this._revealImg.setCrop(0, 0, 1025, this._revealRows)
      },
    })
  }

  // Agrupa filas consecutivas del mismo color en un único fillRect
  // para minimizar llamadas a la GPU (≈ 12 rects en lugar de 768).
  _drawStripes() {
    const g = this._stripesGfx
    g.clear()

    let y = 0
    while (y < GAME_HEIGHT) {
      const color = PATTERN_COLORS[(y + this._stripeScrollY) % PATTERN_TOTAL]
      let h = 1
      while (
        y + h < GAME_HEIGHT &&
        PATTERN_COLORS[(y + h + this._stripeScrollY) % PATTERN_TOTAL] === color
      ) { h++ }
      g.fillStyle(color, 1)
      g.fillRect(0, y, GAME_WIDTH, h)
      y += h
    }
  }

  // ── Carga de assets ───────────────────────────────────────────

  _loadAssets() {
    this.load.setPath('assets')

    this.load.image('btn-balance-left',       'ui/buttons/buttonRed.png')
    this.load.image('btn-balance-left-press', 'ui/buttons/buttonRedPress.png')
    this.load.image('btn-balance-right',       'ui/buttons/buttonBlue.png')
    this.load.image('btn-balance-right-press', 'ui/buttons/buttonBluePress.png')

    this.load.image('btn-nav-left',        'ui/buttons/left-stand.png')
    this.load.image('btn-nav-left-press',  'ui/buttons/left-press.png')
    this.load.image('btn-nav-right',       'ui/buttons/right-stand.png')
    this.load.image('btn-nav-right-press', 'ui/buttons/right-press.png')

    this.load.image('bg-menu',       'backgrounds/fondoIntro.png')
    this.load.image('bg-characters', 'backgrounds/fondoPersonajes.png')
    this.load.image('bg-game',         'backgrounds/fondo_a.png')
    this.load.image('bg-game-sevilla', 'backgrounds/fondo_b.png')
    this.load.image('bg-history',    'backgrounds/fondoHistory.png')

    // Narradores (spritesheet 140×35 px, 4 frames de 35×35: base, boca-media, boca-abierta, ojos-cerrados)
    this.load.spritesheet('narrator-history',  'sprites/narrators/narrator_history.png',  { frameWidth: 35, frameHeight: 35 })
    this.load.spritesheet('narrator-tutorial', 'sprites/narrators/narrator_tutorial.png', { frameWidth: 35, frameHeight: 35 })

    // Imágenes del tutorial
    this.load.image('tut-01', 'tutorial/01-bienvenido.png')
    this.load.image('tut-02', 'tutorial/02-impulso.png')
    this.load.image('tut-03', 'tutorial/03-zonas.png')
    this.load.image('tut-04', 'tutorial/04-equilibrio.png')
    this.load.image('tut-05', 'tutorial/05-salto.png')
    this.load.image('tut-06', 'tutorial/06-listo.png')

    // Imágenes históricas
    this.load.image('hist-intro',     'backgrounds/hist-intro.png')
    this.load.image('hist-sabio',     'backgrounds/hist-sabio.png')
    this.load.image('hist-picaresca', 'backgrounds/hist-picaresca.png')
    this.load.image('hist-leyenda',   'backgrounds/hist-leyenda.png')
    this.load.image('hist-mision',    'backgrounds/hist-mision.png')

    this.load.image('boat', 'sprites/barco.png')

    // Sprites de personajes (excluir hidden — no tienen portrait)
    CHARACTERS.filter(c => !c.hidden).forEach((char) => {
      this.load.image(char.sprite, `sprites/characters/${char.id}.png`)
    })

    // Spritesheet por defecto
    this.load.spritesheet('sprite-default', 'sprites/characters/spritesheet/default.png', {
      frameWidth:  SPRITE_CONFIG.frameWidth,
      frameHeight: SPRITE_CONFIG.frameHeight,
    })

    // Spritesheets de Easter eggs (pre-cargados para evitar flash)
    const eeChar = CHARACTERS.find(c => c.id === 'easter_egg')
    if (eeChar) {
      eeChar.skins.forEach(skin => {
        this.load.spritesheet(
          `sprite-${skin.spritesheet}`,
          `sprites/characters/spritesheet/${skin.spritesheet}.png`,
          { frameWidth: SPRITE_CONFIG.frameWidth, frameHeight: SPRITE_CONFIG.frameHeight },
        )
      })
    }

    // Condiciones de desbloqueo de personajes
    this.load.json('characters-unlock', 'characters-unlock.json')
    this.load.on('filecomplete-json-characters-unlock', () => {
      const unlockData = this.cache.json.get('characters-unlock')
      unlockService.setConditions(unlockData)
    })

    // Perspectivas de vista (config + condiciones de desbloqueo)
    this.load.json('perspectives', 'perspectives.json')
    this.load.on('filecomplete-json-perspectives', () => {
      const data = this.cache.json.get('perspectives')
      perspectiveUnlockService.setData(data)
    })

    // Premios: carga el JSON y luego las imágenes de cada premio
    this.load.json('rewards', 'rewards.json')
    this.load.on('filecomplete-json-rewards', () => {
      const rewards = this.cache.json.get('rewards')
      if (rewards && Array.isArray(rewards)) {
        rewards.forEach(reward => {
          this.load.image(reward.id, reward.imagen)
        })
      }
    })

    // Efectos de sonido
    this.load.audio('sfx-click',    'audio/click.wav')
    this.load.audio('sfx-hit',      'audio/hitHurt.wav')
    this.load.audio('sfx-chapuzon', 'audio/chapuzon.wav')
    this.load.audio('sfx-victoria', 'audio/victoria.wav')

    // Aplicar filtro NEAREST a texturas pixel art tras la carga
    this.load.on('filecomplete', (key) => {
      const texture = this.textures.get(key)
      if (texture && texture.source.length > 0) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
      }
    })
  }
}
