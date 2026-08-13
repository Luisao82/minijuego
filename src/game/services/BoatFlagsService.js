import { BOAT } from '../config/gameConfig'
import { BoatFlag } from '../entities/BoatFlag'

// BoatFlagsService — asigna banderas a los slots del barco principal y las
// materializa como sprites al entrar en GameScene.
//
// Diseño:
//   - La ASIGNACIÓN (qué bandera va en cada slot) se sortea una única vez
//     por sesión en reset(), llamado desde MenuScene. Persiste durante
//     todas las partidas consecutivas para que el jugador no vea saltos.
//   - attachToScene() crea los sprites según la asignación actual. El
//     servicio no toca lógica de juego — solo dibuja y expone el click.
//   - detachFromScene() destruye los sprites (GameScene shutdown) sin
//     tocar la asignación.
//
// Sorteo por slot:
//   Para cada slot: pool = [emptyOption(weight=emptyWeight), ...flagsDisponibles]
//   Se hace weighted random. Si sale la bandera fantasma → slot vacío.
//   Si sale una bandera → esa bandera se retira del pool para los siguientes
//   slots (nunca se repite la misma bandera dos veces).

const EMPTY_MARKER = { __empty: true }

class BoatFlagsService {
  constructor() {
    this._catalog = null
    this._config = null
    this._assignments = [] // [{ slot, flag|null }]
    this._attachedScene = null
    this._attachedContainer = null
    this._perspectiveFlipped = false
    this._onFlagClick = null
    this._sprites = []
  }

  init(catalog) {
    this._catalog = catalog
    this._config = catalog?.config ?? {}
  }

  isReady() {
    return (
      !!this._catalog && Array.isArray(this._catalog.slots) && Array.isArray(this._catalog.flags)
    )
  }

  getConfirmMessage() {
    return this._config?.confirmMessage ?? null
  }

  // Regenera la asignación slot→bandera. Llamado en MenuScene.create().
  reset() {
    this._destroySprites()
    this._assignments = []
    if (!this.isReady()) return

    const pool = this._catalog.flags.filter((f) => (f.weight ?? 0) > 0).slice()
    const emptyWeight = this._config.emptyWeight ?? 0

    for (const slot of this._catalog.slots) {
      const picked = this._weightedPickOrEmpty(pool, emptyWeight)
      if (picked === EMPTY_MARKER) {
        this._assignments.push({ slot, flag: null })
      } else {
        this._assignments.push({ slot, flag: picked })
        // Sin repeticiones: la bandera se retira para los siguientes slots.
        const idx = pool.indexOf(picked)
        if (idx >= 0) pool.splice(idx, 1)
      }
    }
  }

  attachToScene(scene, container, { perspectiveFlipped = false, onFlagClick } = {}) {
    if (!this.isReady()) return
    this._attachedScene = scene
    this._attachedContainer = container
    this._perspectiveFlipped = perspectiveFlipped
    this._onFlagClick = onFlagClick ?? null

    for (const { slot, flag } of this._assignments) {
      if (!flag) continue
      const sprite = this._createSpriteFor(slot, flag)
      if (sprite) this._sprites.push(sprite)
    }
  }

  detachFromScene() {
    this._destroySprites()
    this._attachedScene = null
    this._attachedContainer = null
    this._perspectiveFlipped = false
    this._onFlagClick = null
  }

  // ── internos ────────────────────────────────────────────────────

  _createSpriteFor(slot, flag) {
    const flagW = this._config.flagNativeWidth ?? 30
    const flagH = this._config.flagNativeHeight ?? 15
    const scale = BOAT.DISPLAY_WIDTH / this._boatNativeWidth() // = BOAT_SCALE

    // El barco tiene origen (0.5, 0.5). Su top-left en world:
    const boatCenterX = BOAT.RIGHT_X - BOAT.DISPLAY_WIDTH / 2
    const boatCenterY = this._boatCenterY()
    const boatTopLeftX = boatCenterX - BOAT.DISPLAY_WIDTH / 2
    const boatTopLeftY = boatCenterY - BOAT.DISPLAY_HEIGHT / 2

    // slot.x / slot.y son la esquina top-left de la bandera EN LA IMAGEN
    // NATIVA del barco (175×83). Convertimos al centro y a coords world.
    const worldX = boatTopLeftX + (slot.x + flagW / 2) * scale
    const worldY = boatTopLeftY + (slot.y + flagH / 2) * scale

    return new BoatFlag(this._attachedScene, {
      textureKey: flag.textureKey,
      x: worldX,
      y: worldY,
      scale,
      perspectiveFlipped: this._perspectiveFlipped,
      parent: this._attachedContainer,
      onClick: this._onFlagClick,
      meta: { slot, flag },
    })
  }

  _destroySprites() {
    this._sprites.forEach((s) => s.destroy())
    this._sprites = []
  }

  _weightedPickOrEmpty(flagPool, emptyWeight) {
    const options = [{ ref: EMPTY_MARKER, weight: emptyWeight }]
    for (const f of flagPool) options.push({ ref: f, weight: f.weight ?? 0 })
    const total = options.reduce((sum, o) => sum + o.weight, 0)
    if (total <= 0) return EMPTY_MARKER
    let roll = Math.random() * total
    for (const o of options) {
      roll -= o.weight
      if (roll <= 0) return o.ref
    }
    return options[options.length - 1].ref
  }

  // El barco se dibuja con setDisplaySize(BOAT.DISPLAY_WIDTH, BOAT.DISPLAY_HEIGHT)
  // sobre una imagen nativa. Guardamos aquí las constantes que necesitamos
  // para la conversión — coinciden con las de gameConfig.
  _boatNativeWidth() {
    // BOAT.DISPLAY_WIDTH = BOAT_IMAGE_W * BOAT_SCALE = 175 * 3
    return 175
  }

  _boatCenterY() {
    // Mismo cálculo que GameScene.drawPole() para colocar el barco.
    // Ver src/game/config/gameConfig.js:
    //   BOAT.DECK_Y_RATIO = 0.32
    //   boatCenterY = poleY + BOAT.DISPLAY_HEIGHT * (0.15 - BOAT.DECK_Y_RATIO)
    // Necesitamos poleY que depende de GAME_HEIGHT y POLE.Y_FACTOR.
    // Lo importamos abajo para no acoplar demasiado.
    return this._cachedBoatCenterY
  }

  // GameScene nos pasa el poleY exacto al hacer attach — es el dato del
  // que dependen la Y de las banderas.
  setPoleY(poleY) {
    this._cachedBoatCenterY = poleY + BOAT.DISPLAY_HEIGHT * (0.15 - BOAT.DECK_Y_RATIO)
  }
}

export const boatFlagsService = new BoatFlagsService()
