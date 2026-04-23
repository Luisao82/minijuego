// MapService — gestiona el estado del mapa de Sevilla
// Persistencia en localStorage. Arquitectura Clean: depende del adaptador,
// no toca localStorage directamente. Listo para sustituir por API futura.

const STORAGE_KEY = 'cucana_map'

const ALL_PIECES = []
for (let r = 0; r < 5; r++)
  for (let c = 0; c < 3; c++)
    ALL_PIECES.push(`piece-${r}-${c}`)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { unlocked: [], seen: [] }
}

function save(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (_) {}
}

class MapService {
  getUnlocked() {
    return load().unlocked
  }

  isUnlocked(pieceId) {
    return load().unlocked.includes(pieceId)
  }

  // Desbloquea un trozo aleatorio de los aún no conseguidos.
  // Devuelve el ID del trozo nuevo, o null si ya están todos.
  unlockRandom() {
    const state    = load()
    const pending  = ALL_PIECES.filter(id => !state.unlocked.includes(id))
    if (pending.length === 0) return null

    const newPiece = pending[Math.floor(Math.random() * pending.length)]
    state.unlocked.push(newPiece)
    save(state)
    return newPiece
  }

  // Marca una pieza como vista (elimina el marco amarillo)
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
    return state.unlocked.some(id => !state.seen.includes(id))
  }
}

export const mapService = new MapService()
