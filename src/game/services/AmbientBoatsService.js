import { GAME_WIDTH } from '../config/gameConfig'
import { AmbientBoat } from '../entities/AmbientBoat'

// AmbientBoatsService — orquestador persistente de barcos ambientales.
// Vive fuera de las escenas para que su estado sobreviva a los shutdowns
// de GameScene (partidas consecutivas). MenuScene lo resetea al entrar
// para que cada "sesión de juego" tenga su propia flota aleatoria.
//
// División de responsabilidades:
//   - El servicio mantiene el estado LÓGICO (posición, dirección, velocidad,
//     tiempo transcurrido) y avanza cada frame vía game.events STEP.
//   - Cuando GameScene está montado se llama a attachToScene: se crean los
//     sprites (AmbientBoat) para el estado existente y para futuros spawns.
//   - detachFromScene destruye sprites SIN tocar el estado; los barcos
//     "siguen navegando" durante RewardScene y reaparecen al volver.
//
// Pausa cooperativa (reference-counted): pause(reason) puede llamarse
// múltiples veces por distintos motivos (modal, ceremonia, ...) y solo se
// reanuda cuando todas las razones han hecho resume().

const DEFAULT_CONFIG = {
  maxOnScreen: 3,
  spawnIntervalMs: [8000, 15000],
  initialDelayMs: [500, 3000],
  entryOffscreenMargin: 120,
  pauseDuringConfirmDialog: true,
}

class AmbientBoatsService {
  constructor() {
    this._game = null
    this._catalog = null
    this._config = { ...DEFAULT_CONFIG }
    this._activeBoats = []
    this._elapsedMs = 0
    this._pausedReasons = new Set()
    this._running = false
    this._nextSpawnAtMs = Infinity
    this._attachedScene = null
    this._attachedContainer = null
    this._onNarrativeClick = null
    this._stepHandler = null
  }

  // Inicializa una única vez con la instancia global del Game y el catálogo
  // cargado desde el JSON. Se puede llamar varias veces (idempotente sobre
  // los listeners) para actualizar el catálogo en caliente durante desarrollo.
  init(game, catalog) {
    this._game = game
    this._catalog = catalog
    this._config = { ...DEFAULT_CONFIG, ...(catalog?.config ?? {}) }

    if (!this._stepHandler) {
      this._stepHandler = (_time, delta) => this._step(delta)
      game.events.on('step', this._stepHandler)
    }
    this._running = true
  }

  isReady() {
    return !!this._catalog && !!this._catalog.boats
  }

  // Regenera la flota. Se llama al entrar en MenuScene para que cada nueva
  // "sesión" tenga su propia distribución aleatoria de barcos.
  reset() {
    this._destroyAllSprites()
    this._activeBoats = []
    this._elapsedMs = 0
    this._pausedReasons.clear()
    if (!this.isReady()) return
    // Primer spawn: entre initialDelayMs — hueco corto para que ya se vea
    // algún barco al entrar en la primera partida sin esperar.
    this._nextSpawnAtMs = this._randRange(this._config.initialDelayMs)
  }

  attachToScene(scene, container, { onNarrativeClick } = {}) {
    if (!this.isReady()) return
    this._attachedScene = scene
    this._attachedContainer = container
    this._onNarrativeClick = onNarrativeClick ?? null

    // Materializar sprites para el estado existente en la posición actual.
    this._activeBoats.forEach((state) => {
      if (state.sprite) return
      state.sprite = this._createSpriteFor(state)
    })
  }

  detachFromScene() {
    this._destroyAllSprites()
    this._attachedScene = null
    this._attachedContainer = null
    this._onNarrativeClick = null
  }

  pause(reason = 'default') {
    this._pausedReasons.add(reason)
  }

  resume(reason = 'default') {
    this._pausedReasons.delete(reason)
  }

  isPaused() {
    return this._pausedReasons.size > 0
  }

  // ── loop principal ─────────────────────────────────────────

  _step(deltaMs) {
    if (!this._running || !this.isReady() || this.isPaused()) return

    this._elapsedMs += deltaMs

    for (let i = this._activeBoats.length - 1; i >= 0; i--) {
      const state = this._activeBoats[i]
      const t = (this._elapsedMs - state.spawnAtMs) / 1000
      const x = state.spawnX + state.direction * state.speedPxPerSec * t

      const exited =
        state.direction > 0 ? x >= state.exitX : x <= state.exitX

      if (exited) {
        state.sprite?.destroy()
        this._activeBoats.splice(i, 1)
        continue
      }

      if (state.sprite) state.sprite.setPosition(x, state.y)
    }

    if (this._elapsedMs >= this._nextSpawnAtMs) {
      this._trySpawn()
      this._nextSpawnAtMs = this._elapsedMs + this._randRange(this._config.spawnIntervalMs)
    }
  }

  // ── spawn ──────────────────────────────────────────────────

  _trySpawn() {
    if (this._activeBoats.length >= this._config.maxOnScreen) return

    // Descartar del pool los barcos marcados como `unique` que ya estén
    // navegando (personas reales — no pueden aparecer dos veces a la vez).
    const activeIds = new Set(this._activeBoats.map((s) => s.catalogEntry.id))
    const enabled = this._catalog.boats.filter(
      (entry) =>
        entry &&
        (entry.weight ?? 0) > 0 &&
        !(entry.unique && activeIds.has(entry.id))
    )
    if (!enabled.length) return

    const total = enabled.reduce((sum, e) => sum + e.weight, 0)
    let roll = Math.random() * total
    let picked = enabled[enabled.length - 1]
    for (const entry of enabled) {
      roll -= entry.weight
      if (roll <= 0) {
        picked = entry
        break
      }
    }

    const layerKey = picked.depthLayer ?? 'mid'
    const layerCfg = this._config.depthLayers?.[layerKey] ?? { z: 1, scaleMul: 1, speedMul: 1, alpha: 1 }
    const yRange = this._config.yRangePerLayer?.[layerKey] ?? [460, 480]

    // Anti-colisión: si ya hay barcos en la misma capa, el nuevo debe
    // moverse en el mismo sentido. Si el catálogo obliga a un sentido
    // contrario, descartamos este spawn y volveremos a intentar más tarde.
    const sameLayer = this._activeBoats.find((s) => s.layerKey === layerKey)
    let direction
    if (sameLayer) {
      const req = picked.direction
      if ((req === 'ltr' && sameLayer.direction < 0) ||
          (req === 'rtl' && sameLayer.direction > 0)) {
        return
      }
      direction = sameLayer.direction
    } else {
      direction = this._resolveDirection(picked.direction)
    }

    const margin = this._config.entryOffscreenMargin ?? 120
    const spawnX = direction > 0 ? -margin : GAME_WIDTH + margin
    const exitX = direction > 0 ? GAME_WIDTH + margin : -margin

    // Escala final: si el barco declara `scale`, se usa tal cual y se salta
    // el multiplicador de capa (útil para el barco atracado que no debe
    // encogerse por perspectiva). Si no, baseScale × scaleMul de capa.
    const baseScale = picked.baseScale ?? this._config.defaultBaseScale ?? 1
    const finalScale =
      picked.scale != null ? picked.scale : baseScale * (layerCfg.scaleMul ?? 1)

    const state = {
      id: `${picked.id}-${this._elapsedMs}-${Math.random().toString(36).slice(2, 6)}`,
      catalogEntry: picked,
      layerKey,
      layerCfg,
      finalScale,
      direction,
      speedPxPerSec: (picked.baseSpeedPxPerSec ?? 60) * (layerCfg.speedMul ?? 1),
      y: this._randRange(yRange),
      spawnX,
      exitX,
      spawnAtMs: this._elapsedMs,
      sprite: null,
    }

    this._activeBoats.push(state)
    if (this._attachedScene) {
      state.sprite = this._createSpriteFor(state)
    }
  }

  _resolveDirection(dirSpec) {
    if (dirSpec === 'ltr') return 1
    if (dirSpec === 'rtl') return -1
    return Math.random() < 0.5 ? -1 : 1
  }

  _createSpriteFor(state) {
    const t = (this._elapsedMs - state.spawnAtMs) / 1000
    const x = state.spawnX + state.direction * state.speedPxPerSec * t
    return new AmbientBoat(this._attachedScene, {
      catalogEntry: state.catalogEntry,
      layerConfig: state.layerCfg,
      finalScale: state.finalScale,
      x,
      y: state.y,
      direction: state.direction,
      parent: this._attachedContainer,
      onClick: this._onNarrativeClick,
    })
  }

  _destroyAllSprites() {
    this._activeBoats.forEach((state) => {
      state.sprite?.destroy()
      state.sprite = null
    })
  }

  _randRange([min, max]) {
    if (min === max) return min
    return min + Math.random() * (max - min)
  }
}

export const ambientBoatsService = new AmbientBoatsService()
