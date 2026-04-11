// GameStatsService — persiste el historial de partidas jugadas.
//
// Cada registro representa una partida completa (éxito o derrota).
// Diseñado para migración futura a BD: basta con implementar un nuevo
// adaptador con load() / save() y pasarlo a createGameStatsService().
//
// Clave localStorage: 'cucana_game_stats'
// Estructura: array de objetos { timestamp, characterId, skinKey, ... }
//
// Uso:
//   import { gameStatsService } from '../services/GameStatsService'
//   gameStatsService.addRecord({ timestamp, characterId, ... })
//   const records = gameStatsService.getAll()

const STORAGE_KEY = 'cucana_game_stats'

// ---------------------------------------------------------------------------
// Adaptador 1 — localStorage (v1 actual)
// ---------------------------------------------------------------------------

function createLocalStorageAdapter() {
  return {
    load() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
      } catch {
        return []
      }
    },
    save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // Ignorar errores de cuota o privacidad
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Fábrica pública — acepta cualquier adaptador que implemente load/save
// ---------------------------------------------------------------------------

export function createGameStatsService(adapter = createLocalStorageAdapter()) {
  return {
    // Añade un nuevo registro al historial de partidas
    addRecord(data) {
      const records = adapter.load()
      records.push(data)
      adapter.save(records)
    },

    // Devuelve todos los registros de partidas jugadas
    getAll() {
      return adapter.load()
    },

    // Elimina todos los registros (útil para testing o reset)
    clear() {
      adapter.save([])
    },
  }
}

// Instancia singleton por defecto (localStorage)
export const gameStatsService = createGameStatsService()
