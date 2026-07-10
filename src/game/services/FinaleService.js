// Servicio de la escena final (fuegos artificiales).
//
// Controla cuándo debe auto-mostrarse la escena final: solo una vez por cada
// vez que el jugador alcanza el 100 % de completado. En lugar de un booleano
// "ya visto", persiste el TOTAL de objetivos que había cuando se mostró:
//   - Conseguir más banderas estando ya al 100 % no la vuelve a disparar
//     (el total guardado coincide con el actual).
//   - Si una actualización añade contenido, el total crece, el porcentaje
//     baja de 100 y no pasa nada; al re-conquistar el 100 %, el total actual
//     ya no coincide con el guardado y la escena se auto-muestra otra vez.
//
// Uso:
//   import { finaleService } from '../services/FinaleService'
//   if (finaleService.shouldAutoShow(completion)) { ... }
//   finaleService.markShown(completion.totals.total)

const STORAGE_KEY = 'cucana_finale_seen_total'

export function createFinaleService() {
  return {
    // Total de objetivos con el que se vio el final, o null si nunca se vio
    getSeenTotal() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === null) return null
        const n = Number(stored)
        return Number.isFinite(n) ? n : null
      } catch {
        return null
      }
    },

    // true si el juego está completo al 100 % (comparación exacta de totales)
    // y el final aún no se ha mostrado para el contenido actual
    shouldAutoShow(completion) {
      const complete =
        completion.totals.total > 0 && completion.obtained.total === completion.totals.total
      return complete && this.getSeenTotal() !== completion.totals.total
    },

    // Registra que el final ya se mostró para este total de contenido
    markShown(total) {
      try {
        localStorage.setItem(STORAGE_KEY, String(total))
      } catch {
        // Ignorar errores de cuota o privacidad
      }
    },

    // Elimina el registro (útil para testing o reset)
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
export const finaleService = createFinaleService()
