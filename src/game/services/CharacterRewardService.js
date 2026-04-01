// Servicio de seguimiento de premios obtenidos por personaje.
//
// Independiente de RewardStorageService, que trackea premios globalmente.
// Este servicio registra cuántos premios ha conseguido cada personaje,
// dato necesario para desbloquear skins.
//
// Estructura en localStorage:
//   {
//     "trianero": 5,
//     "flamenca": 12,
//     ...
//   }
//
// Uso:
//   import { characterRewardService } from '../services/CharacterRewardService'
//   characterRewardService.addReward('trianero')
//   const count = characterRewardService.getCount('trianero')

const STORAGE_KEY = 'cucana_character_rewards'

const _load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const _save = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignorar errores de cuota o privacidad
  }
}

export function createCharacterRewardService() {
  return {
    // Registra un premio obtenido con un personaje concreto
    addReward(characterId) {
      const data = _load()
      data[characterId] = (data[characterId] || 0) + 1
      _save(data)
    },

    // Devuelve el total de premios obtenidos con ese personaje (0 si ninguno)
    getCount(characterId) {
      return _load()[characterId] || 0
    },

    // Devuelve el mapa completo { [characterId]: count }
    getAll() {
      return _load()
    },

    // Comprueba si un personaje cumple la condición de desbloqueo de un skin.
    // condicion: { tipo: 'premios_personaje', cantidad: N }
    meetsCondition(characterId, condicion) {
      if (!condicion) return false
      if (condicion.tipo === 'premios_personaje') {
        return this.getCount(characterId) >= condicion.cantidad
      }
      return false
    },

    // Elimina todos los datos (útil para testing o reset)
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    },
  }
}

// Instancia singleton por defecto
export const characterRewardService = createCharacterRewardService()
