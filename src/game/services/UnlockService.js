// Servicio de desbloqueo de personajes.
//
// Gestiona qué personajes están disponibles según las condiciones definidas
// en public/assets/characters-unlock.json.
//
// Tipos de condición:
//   - specific_reward: se desbloquea al obtener por primera vez un premio concreto
//   - total_rewards:   se desbloquea al acumular N premios en total (de cualquier tipo)
//
// Migración de datos:
//   Al arrancar, si la versión guardada en localStorage es inferior a RESET_BELOW_VERSION,
//   se borran los premios y desbloqueos del jugador. Así los datos existentes no
//   interfieren con el nuevo sistema. Para forzar un reset en el futuro, basta con
//   actualizar RESET_BELOW_VERSION a la nueva versión del juego.
//
// Uso:
//   import { unlockService } from '../services/UnlockService'
//   unlockService.setConditions(cache.json.get('characters-unlock'))
//   const isUnlocked = unlockService.isUnlocked('abuela')
//   const newUnlocks = unlockService.checkNewUnlocks(rewardStorage)
//   unlockService.saveUnlocks(newUnlocks)

import { version } from '../../../package.json'

const STORAGE_KEY              = 'cucana_unlocked_characters'
const REWARDS_KEY              = 'cucana_rewards'
const VERSION_KEY              = 'cucana_version'
const PERSPECTIVES_STORAGE_KEY = 'cucana_unlocked_perspectives'
const DEFAULT_UNLOCKED         = ['trianero', 'flamenca']
const RESET_BELOW_VERSION      = '0.4.0'

// Devuelve true si la versión a es estrictamente menor que b (semver)
const semverLt = (a, b) => {
  const pa = (a || '0.0.0').split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true
    if (pa[i] > pb[i]) return false
  }
  return false
}

// Migración: borra datos de jugadores con versión anterior al sistema de desbloqueos
const _migrate = () => {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY)
    if (semverLt(storedVersion, RESET_BELOW_VERSION)) {
      localStorage.removeItem(REWARDS_KEY)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(PERSPECTIVES_STORAGE_KEY)
    }
    localStorage.setItem(VERSION_KEY, version)
  } catch {
    // Ignorar errores de cuota o privacidad
  }
}

_migrate()

export function createUnlockService() {
  let conditions = []

  return {
    // Carga las condiciones desde el JSON precargado en PreloadScene
    setConditions(data) {
      conditions = Array.isArray(data) ? data : []
    },

    // Devuelve los IDs de personajes desbloqueados (incluye siempre los defaults)
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

    // Devuelve true si el personaje está desbloqueado
    isUnlocked(characterId) {
      return this.getUnlocked().includes(characterId)
    },

    // Calcula la suma total de todos los premios obtenidos
    getTotalRewards(rewardStorage) {
      const all = rewardStorage.getAll()
      return Object.values(all).reduce((sum, count) => sum + count, 0)
    },

    // Devuelve los IDs de personajes que deben desbloquearse ahora (no persistidos aún).
    // Llamar DESPUÉS de que rewardStorage haya registrado el nuevo premio.
    checkNewUnlocks(rewardStorage) {
      const currentlyUnlocked = this.getUnlocked()
      const totalRewards = this.getTotalRewards(rewardStorage)
      const newUnlocks = []

      for (const entry of conditions) {
        const { characterId, condition: cond } = entry

        // Ya desbloqueado → skip
        if (currentlyUnlocked.includes(characterId)) continue

        let shouldUnlock = false

        if (cond.type === 'specific_reward') {
          shouldUnlock = rewardStorage.getCount(cond.rewardId) > 0
        } else if (cond.type === 'total_rewards') {
          shouldUnlock = totalRewards >= cond.count
        }

        if (shouldUnlock) newUnlocks.push(characterId)
      }

      return newUnlocks
    },

    // Persiste los nuevos desbloqueos en localStorage
    saveUnlocks(characterIds) {
      if (!characterIds.length) return
      const updated = [...new Set([...this.getUnlocked(), ...characterIds])]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignorar errores de cuota o privacidad
      }
    },

    // Devuelve el hint de desbloqueo de un personaje (o null si no tiene condición)
    getHint(characterId) {
      const entry = conditions.find(e => e.characterId === characterId)
      return entry?.condition?.hint ?? null
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
export const unlockService = createUnlockService()
