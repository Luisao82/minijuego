// FlagDeliveryService — marca cuándo toca reproducir la cinemática del
// barquito que "trae la bandera" al inicio de una partida.
//
// Se activa cuando el jugador captura la bandera y se consume la primera
// vez que arranca una partida posterior. Persiste en localStorage para que
// el efecto sobreviva a cerrar la app.
//
// Clave localStorage: 'cucana_flag_delivery_pending'
// Estructura: '1' cuando hay entrega pendiente, ausente en caso contrario.

const STORAGE_KEY = 'cucana_flag_delivery_pending'

function createLocalStorageAdapter() {
  return {
    load() {
      try {
        return localStorage.getItem(STORAGE_KEY) === '1'
      } catch {
        return false
      }
    },
    save(value) {
      try {
        if (value) localStorage.setItem(STORAGE_KEY, '1')
        else localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignorar errores de cuota o privacidad
      }
    },
  }
}

export function createFlagDeliveryService(adapter = createLocalStorageAdapter()) {
  return {
    isPending() {
      return adapter.load()
    },
    set() {
      adapter.save(true)
    },
    consume() {
      const wasPending = adapter.load()
      adapter.save(false)
      return wasPending
    },
  }
}

export const flagDeliveryService = createFlagDeliveryService()
