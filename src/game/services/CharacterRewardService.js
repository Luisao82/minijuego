// Servicio de seguimiento de premios obtenidos por personaje.
//
// Independiente de RewardStorageService, que trackea premios globalmente.
// Este servicio lleva DOS contadores por personaje:
//
// - "victorias" (STORAGE_KEY): total histórico de premios, nunca se topa.
//   Es el dato que alimenta estadísticas y podium.
// - "skin progress" (STORAGE_KEY_SKIN): contador usado solo para desbloquear
//   skins. Se topa en el umbral (flags) del último skin configurado para
//   ese personaje — si el jugador sigue jugando tras desbloquear todo,
//   este contador no sube más. Si en una futura actualización se añade un
//   skin nuevo con un umbral mayor, el contador retoma la subida desde el
//   tope anterior, exigiendo solo las banderas nuevas desde ese momento
//   (no las banderas históricas ya "gastadas" en topes anteriores).
//
// Estructura en localStorage:
//   cucana_character_rewards:      { "trianero": 5, "flamenca": 12, ... }
//   cucana_character_skin_progress: { "trianero": 5, "flamenca": 12, ... }
//
// Uso:
//   import { characterRewardService } from '../services/CharacterRewardService'
//   characterRewardService.addReward('trianero')
//   const count = characterRewardService.getCount('trianero')
//   characterRewardService.incrementSkinProgress('trianero', maxFlags)
//   const progress = characterRewardService.getSkinProgress('trianero', maxFlags)

const STORAGE_KEY = 'cucana_character_rewards'
const STORAGE_KEY_SKIN = 'cucana_character_skin_progress'

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

const _loadSkin = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_SKIN)) || {}
  } catch {
    return {}
  }
}

const _saveSkin = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_SKIN, JSON.stringify(data))
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

    // Devuelve el contador de progreso de skins de un personaje, topado a maxFlags.
    // Si no existe entrada (jugador previo a este sistema), migra desde el
    // contador histórico de victorias, capado igualmente a maxFlags, y la
    // persiste de inmediato — así el valor migrado queda fijo y no se
    // recalcula con un maxFlags distinto en una llamada posterior.
    getSkinProgress(characterId, maxFlags) {
      const data = _loadSkin()
      if (data[characterId] === undefined) {
        const migrated = Math.min(this.getCount(characterId), maxFlags)
        data[characterId] = migrated
        _saveSkin(data)
        return migrated
      }
      return Math.min(data[characterId], maxFlags)
    },

    // Incrementa el progreso de skins de un personaje, sin pasar de maxFlags.
    // maxFlags es el umbral del skin más caro configurado actualmente para
    // ese personaje (recalcularlo en cada llamada permite que, al añadir un
    // skin nuevo más adelante, el contador retome la subida automáticamente).
    incrementSkinProgress(characterId, maxFlags) {
      const data = _loadSkin()
      const current = this.getSkinProgress(characterId, maxFlags)
      data[characterId] = Math.min(current + 1, maxFlags)
      _saveSkin(data)
      return data[characterId]
    },

    // Elimina todos los datos (útil para testing o reset)
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_KEY_SKIN)
      } catch {
        // ignore
      }
    },
  }
}

// Instancia singleton por defecto
export const characterRewardService = createCharacterRewardService()
