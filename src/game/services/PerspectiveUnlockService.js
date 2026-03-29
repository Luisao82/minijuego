// Servicio de desbloqueo de perspectivas de vista.
//
// Gestiona qué perspectivas están disponibles según las condiciones definidas
// en public/assets/perspectives.json.
//
// Las perspectivas sin campo "condition" están siempre desbloqueadas.
// Tipos de condición soportados (idénticos a UnlockService):
//   - specific_reward: se desbloquea al obtener por primera vez un premio concreto
//   - total_rewards:   se desbloquea al acumular N premios en total (de cualquier tipo)
//
// Uso:
//   import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
//   perspectiveUnlockService.setData(cache.json.get('perspectives'))
//   const isUnlocked = perspectiveUnlockService.isUnlocked('sevilla')
//   const newUnlocks = perspectiveUnlockService.checkNewUnlocks(rewardStorage)
//   perspectiveUnlockService.saveUnlocks(newUnlocks)

const STORAGE_KEY      = 'cucana_unlocked_perspectives'
const DEFAULT_UNLOCKED = ['triana']

export function createPerspectiveUnlockService() {
  let perspectives = []

  return {
    // Carga los datos desde el JSON precargado en PreloadScene
    setData(data) {
      perspectives = Array.isArray(data) ? data : []
    },

    // Devuelve todas las perspectivas definidas en el JSON
    getAll() {
      return perspectives
    },

    // Devuelve la perspectiva por id, o null si no existe.
    // Normaliza el campo "direction" a "flipX" (booleano) para uso interno.
    //   direction "ltr" (izq→der, espejado)  → flipX: true
    //   direction "rtl" (der→izq, normal)    → flipX: false
    getById(id) {
      const p = perspectives.find(p => p.id === id) ?? null
      if (!p) return null
      return { ...p, flipX: p.direction === 'ltr' }
    },

    // Devuelve los IDs de perspectivas desbloqueadas (incluye siempre los defaults)
    getUnlocked() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const parsed = stored ? JSON.parse(stored) : null
        if (!Array.isArray(parsed)) return [...DEFAULT_UNLOCKED]
        return [...new Set([...DEFAULT_UNLOCKED, ...parsed])]
      } catch {
        return [...DEFAULT_UNLOCKED]
      }
    },

    // Devuelve true si la perspectiva está desbloqueada
    isUnlocked(perspectiveId) {
      const p = this.getById(perspectiveId)
      if (!p) return false
      if (!p.condition) return true   // sin condición = siempre disponible
      return this.getUnlocked().includes(perspectiveId)
    },

    // Devuelve los IDs de perspectivas que deben desbloquearse ahora.
    // Llamar DESPUÉS de que rewardStorage haya registrado el nuevo premio.
    checkNewUnlocks(rewardStorage) {
      const currentlyUnlocked = this.getUnlocked()
      const all = rewardStorage.getAll()
      const totalRewards = Object.values(all).reduce((sum, n) => sum + n, 0)
      const newUnlocks = []

      for (const p of perspectives) {
        if (!p.condition) continue
        if (currentlyUnlocked.includes(p.id)) continue

        const { type, rewardId, count } = p.condition
        let shouldUnlock = false

        if (type === 'specific_reward') {
          shouldUnlock = rewardStorage.getCount(rewardId) > 0
        } else if (type === 'total_rewards') {
          shouldUnlock = totalRewards >= count
        }

        if (shouldUnlock) newUnlocks.push(p.id)
      }

      return newUnlocks
    },

    // Persiste los nuevos desbloqueos en localStorage
    saveUnlocks(ids) {
      if (!ids.length) return
      const updated = [...new Set([...this.getUnlocked(), ...ids])]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignorar errores de cuota o privacidad
      }
    },

    // Devuelve el hint de desbloqueo de una perspectiva (o null si no tiene condición)
    getHint(perspectiveId) {
      const p = this.getById(perspectiveId)
      return p?.condition?.hint ?? null
    },

    // Elimina todos los desbloqueos (útil para testing o reset)
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
export const perspectiveUnlockService = createPerspectiveUnlockService()
