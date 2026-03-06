// Capa de abstracción para persistencia de premios obtenidos.
//
// Diseño intencionadamente desacoplado: el almacenamiento concreto se inyecta
// como un "adaptador" con dos métodos: load() → object  y  save(data) → void.
//
// Para cambiar el backend en el futuro (API REST, base de datos, fichero JSON, etc.)
// basta con implementar un nuevo adaptador y pasarlo a createRewardStorage().
// El resto del juego no necesita ningún cambio.
//
// Adaptadores disponibles actualmente:
//   - createLocalStorageAdapter()  →  persiste en localStorage del navegador (v1)
//
// Uso:
//   import { rewardStorage } from '../services/RewardStorageService'
//   rewardStorage.addReward('reward_turron')
//   const counts = rewardStorage.getAll()  // { reward_turron: 3, ... }

const STORAGE_KEY = 'cucana_rewards'

// ---------------------------------------------------------------------------
// Adaptador 1 — localStorage (v1 actual)
// ---------------------------------------------------------------------------

function createLocalStorageAdapter() {
  return {
    load() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
      } catch {
        return {}
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

export function createRewardStorage(adapter = createLocalStorageAdapter()) {
  return {
    // Devuelve un mapa { [rewardId]: count } con todos los premios registrados
    getAll() {
      return adapter.load()
    },

    // Registra un premio: incrementa el contador si ya existe, o lo crea con 1
    addReward(rewardId) {
      const data = adapter.load()
      data[rewardId] = (data[rewardId] || 0) + 1
      adapter.save(data)
    },

    // Devuelve el número de veces obtenido un premio concreto (0 si nunca)
    getCount(rewardId) {
      return adapter.load()[rewardId] || 0
    },

    // Elimina todos los premios (útil para testing o reset de partida)
    clear() {
      adapter.save({})
    },
  }
}

// Instancia singleton por defecto (localStorage)
export const rewardStorage = createRewardStorage()
