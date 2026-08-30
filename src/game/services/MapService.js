// MapService — estado del mapa de Sevilla y de los retos GPS.
//
// Persistencia en localStorage con prefijo `cucana_`, cubierto por
// NativeStorageBridge para durabilidad en las builds nativas.
//
// Además de las piezas del mapa (comportamiento heredado), gestiona:
//   - los bloques temáticos definidos en map-data.json,
//   - el modo de desbloqueo elegido ('gps' | 'meters'),
//   - el contador de metros recorridos hacia el siguiente bloque,
//   - los POIs marcados como visitados en persona,
//   - qué bloques se han completado y cómo.
//
// La estructura de bloques (contenido inmutable de la app) se cachea al
// llamar a `setMapData(data)` desde PreloadScene una vez cargado el JSON.

import { latLonToPixel, pixelToPiece } from '../utils/geo'
import { MAP_PIXEL_WIDTH, MAP_PIXEL_HEIGHT, PIECE_ORIGINAL_SIZE } from '../config/mapBounds'

const STORAGE_KEY = 'cucana_map'

export const ALL_PIECES = []
for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) ALL_PIECES.push(`piece-${r}-${c}`)

// Factory: devuelve un estado nuevo con sus propios arrays. Nunca
// compartir referencias entre llamadas — mutar el estado devuelto por
// load() contaminaría llamadas futuras si el objeto estuviese cacheado.
function createEmptyState() {
  return {
    unlocked: [],
    seen: [],
    visitedInPerson: [],
    unlockMode: null, // 'gps' | 'meters' | null (aún no elegido)
    unlockDistanceCounter: 0,
    activeBlockId: null,
    completedBlocks: [], // [{ id, mode, completedAt }]
    mapTutorialSeen: false,
  }
}

function load() {
  const empty = createEmptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    return { ...empty, ...parsed }
  } catch (_) {
    return empty
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (_) {}
}

class MapService {
  constructor() {
    this._mapData = null
    this._poiIndex = null // Map<poiId, { poi, blockId, pieceRow, pieceCol, pxLocal }>
  }

  // ── Datos de contenido (bloques y POIs) ─────────────────────────

  // Cachea el JSON del mapa. Se llama una vez desde PreloadScene tras
  // cargar map-data.json. En tests se puede llamar directamente con datos
  // sintéticos.
  setMapData(data) {
    this._mapData = data || null
    this._poiIndex = null
  }

  getMapData() {
    return this._mapData
  }

  getMapBounds() {
    return this._mapData?.mapBounds ?? null
  }

  getBlocks() {
    const blocks = this._mapData?.blocks ?? []
    return [...blocks].sort((a, b) => a.order - b.order)
  }

  getBlock(blockId) {
    return this.getBlocks().find((b) => b.id === blockId) ?? null
  }

  getFirstBlock() {
    return this.getBlocks()[0] ?? null
  }

  getNextBlock(blockId) {
    const block = this.getBlock(blockId)
    if (!block) return null
    return this.getBlocks().find((b) => b.order === block.order + 1) ?? null
  }

  // Indexa cada POI con su bloque, la pieza en la que cae y su pixel
  // local dentro de esa pieza. Perezoso: se calcula al primer uso y se
  // reutiliza mientras `_mapData` no cambie.
  _buildPoiIndex() {
    if (this._poiIndex) return this._poiIndex
    const index = new Map()
    const bounds = this.getMapBounds()
    if (!bounds) {
      this._poiIndex = index
      return index
    }
    this.getBlocks().forEach((block) => {
      ;(block.pois ?? []).forEach((poi) => {
        if (poi.lat === null || poi.lat === undefined) return
        if (poi.lon === null || poi.lon === undefined) return
        const px = latLonToPixel(poi.lat, poi.lon, bounds, MAP_PIXEL_WIDTH, MAP_PIXEL_HEIGHT)
        const { row, col } = pixelToPiece(px.x, px.y, PIECE_ORIGINAL_SIZE)
        index.set(poi.id, {
          poi,
          blockId: block.id,
          pieceRow: row,
          pieceCol: col,
          pxLocal: {
            x: px.x - col * PIECE_ORIGINAL_SIZE,
            y: px.y - row * PIECE_ORIGINAL_SIZE,
          },
        })
      })
    })
    this._poiIndex = index
    return index
  }

  // Devuelve los POIs cuya posición derivada cae dentro de la pieza (row, col),
  // ya en píxel local a la pieza y con los campos que consume la UI.
  // Si `blockId` está definido, filtra por ese bloque.
  getPoisForPiece(row, col, blockId = null) {
    const index = this._buildPoiIndex()
    const result = []
    for (const entry of index.values()) {
      if (entry.pieceRow !== row || entry.pieceCol !== col) continue
      if (blockId && entry.blockId !== blockId) continue
      result.push({
        ...entry.poi,
        x: entry.pxLocal.x,
        y: entry.pxLocal.y,
        blockId: entry.blockId,
      })
    }
    return result
  }

  getPoiPiece(poiId) {
    const entry = this._buildPoiIndex().get(poiId)
    return entry ? { row: entry.pieceRow, col: entry.pieceCol } : null
  }

  // ── Piezas del mapa (comportamiento heredado) ───────────────────

  getUnlocked() {
    return load().unlocked
  }

  isUnlocked(pieceId) {
    return load().unlocked.includes(pieceId)
  }

  unlockRandom() {
    const state = load()
    const pending = ALL_PIECES.filter((id) => !state.unlocked.includes(id))
    if (pending.length === 0) return null
    const newPiece = pending[Math.floor(Math.random() * pending.length)]
    state.unlocked.push(newPiece)
    save(state)
    return newPiece
  }

  markSeen(pieceId) {
    const state = load()
    if (!state.seen.includes(pieceId)) {
      state.seen.push(pieceId)
      save(state)
    }
  }

  isSeen(pieceId) {
    return load().seen.includes(pieceId)
  }

  getProgress() {
    return load().unlocked.length / ALL_PIECES.length
  }

  hasUnseenPieces() {
    const state = load()
    return state.unlocked.some((id) => !state.seen.includes(id))
  }

  // ── POIs visitados en persona ───────────────────────────────────

  isVisitedInPerson(poiId) {
    return load().visitedInPerson.includes(poiId)
  }

  markVisitedInPerson(poiId) {
    const state = load()
    if (!state.visitedInPerson.includes(poiId)) {
      state.visitedInPerson.push(poiId)
      save(state)
    }
  }

  getVisitedCount(blockId) {
    const block = this.getBlock(blockId)
    if (!block) return 0
    const visited = new Set(load().visitedInPerson)
    return (block.pois ?? []).filter((p) => visited.has(p.id)).length
  }

  // ── Modo de desbloqueo (GPS / metros) ───────────────────────────

  getUnlockMode() {
    return load().unlockMode
  }

  setUnlockMode(mode) {
    if (mode !== null && mode !== 'gps' && mode !== 'meters') return
    const state = load()
    state.unlockMode = mode
    save(state)
  }

  // ── Contador de metros ──────────────────────────────────────────

  getUnlockDistanceCounter() {
    return load().unlockDistanceCounter
  }

  addDistance(meters) {
    if (!Number.isFinite(meters) || meters <= 0) return
    const state = load()
    state.unlockDistanceCounter = (state.unlockDistanceCounter || 0) + meters
    save(state)
  }

  resetDistanceCounter() {
    const state = load()
    state.unlockDistanceCounter = 0
    save(state)
  }

  // ── Bloque activo ───────────────────────────────────────────────

  getActiveBlockId() {
    return load().activeBlockId
  }

  setActiveBlockId(blockId) {
    const state = load()
    state.activeBlockId = blockId
    save(state)
  }

  // ── Bloques completados ─────────────────────────────────────────

  getCompletedBlocks() {
    return load().completedBlocks
  }

  isBlockCompleted(blockId) {
    return load().completedBlocks.some((b) => b.id === blockId)
  }

  getBlockCompletionMode(blockId) {
    const entry = load().completedBlocks.find((b) => b.id === blockId)
    return entry ? entry.mode : null
  }

  markBlockCompleted(blockId, mode) {
    if (mode !== 'gps' && mode !== 'meters') return
    if (this.isBlockCompleted(blockId)) return
    const state = load()
    state.completedBlocks.push({
      id: blockId,
      mode,
      completedAt: new Date().toISOString(),
    })
    save(state)
  }

  // Un bloque está desbloqueado si es el primero, o si el anterior ya
  // está completado.
  isBlockUnlocked(blockId) {
    const block = this.getBlock(blockId)
    if (!block) return false
    if (block.order === 0) return true
    const prev = this.getBlocks().find((b) => b.order === block.order - 1)
    return !!prev && this.isBlockCompleted(prev.id)
  }

  // ¿Están visitados en persona TODOS los POIs del bloque?
  isBlockFullyVisited(blockId) {
    const block = this.getBlock(blockId)
    if (!block || !block.pois || block.pois.length === 0) return false
    const visited = new Set(load().visitedInPerson)
    return block.pois.every((p) => visited.has(p.id))
  }

  // Si el bloque está totalmente visitado y aún no marcado como
  // completado, lo cierra con `mode` y avanza el bloque activo al
  // siguiente. Devuelve el bloque siguiente que se acaba de
  // desbloquear (o null si no ha completado nada, o si no había más).
  checkAndCompleteBlock(blockId, mode = 'gps') {
    if (this.isBlockCompleted(blockId)) return null
    if (!this.isBlockFullyVisited(blockId)) return null
    this.markBlockCompleted(blockId, mode)
    const next = this.getNextBlock(blockId)
    if (next) this.setActiveBlockId(next.id)
    return next
  }

  // ── Tutorial del mapa ───────────────────────────────────────────

  hasSeenMapTutorial() {
    return load().mapTutorialSeen === true
  }

  markMapTutorialSeen() {
    const state = load()
    state.mapTutorialSeen = true
    save(state)
  }
}

export const mapService = new MapService()
