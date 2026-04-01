// Servicio de gestión de skins por personaje.
//
// Cada personaje tiene un skin activo y un array de skins desbloqueados,
// ambos persistidos en localStorage bajo la clave STORAGE_KEY.
//
// Estructura en localStorage:
//   {
//     "trianero": { "unlocked": ["trianero"], "active": "trianero" },
//     "flamenca":  { "unlocked": ["flamenca", "flamenca_02"], "active": "flamenca_02" }
//   }
//
// Si un personaje no tiene entrada guardada, se usa el primer skin de su
// array skins[] en characters.js (siempre desbloqueado por defecto).
//
// Uso:
//   import { skinService } from '../services/SkinService'
//   const active = skinService.getActiveSkin(character)
//   skinService.unlockSkin(characterId, spritesheetId)
//   skinService.setActiveSkin(characterId, spritesheetId)

const STORAGE_KEY = 'cucana_skins'

const _load = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
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

export function createSkinService() {
  return {
    // Devuelve el spritesheet ID del skin activo para un personaje.
    // Si no hay nada guardado, devuelve el primer skin del array (el clásico).
    getActiveSkin(character) {
      const data = _load()
      const entry = data[character.id]
      if (entry?.active) return entry.active
      return character.skins[0].spritesheet
    },

    // Devuelve los IDs de spritesheets desbloqueados para un personaje.
    // Siempre incluye el skin por defecto (primero del array).
    getUnlockedSkins(character) {
      const data = _load()
      const entry = data[character.id]
      const defaultSkin = character.skins[0].spritesheet
      if (!entry?.unlocked?.length) return [defaultSkin]
      return [...new Set([defaultSkin, ...entry.unlocked])]
    },

    // Devuelve true si el skin (por spritesheetId) está desbloqueado.
    isSkinUnlocked(character, spritesheetId) {
      return this.getUnlockedSkins(character).includes(spritesheetId)
    },

    // Desbloquea un skin para un personaje y lo persiste.
    unlockSkin(characterId, spritesheetId) {
      const data = _load()
      const entry = data[characterId] ?? { unlocked: [], active: null }
      if (!entry.unlocked.includes(spritesheetId)) {
        entry.unlocked.push(spritesheetId)
      }
      data[characterId] = entry
      _save(data)
    },

    // Establece el skin activo para un personaje y lo persiste.
    setActiveSkin(characterId, spritesheetId) {
      const data = _load()
      const entry = data[characterId] ?? { unlocked: [], active: null }
      entry.active = spritesheetId
      data[characterId] = entry
      _save(data)
    },

    // Elimina todos los datos de skins (útil para testing o reset).
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
export const skinService = createSkinService()
