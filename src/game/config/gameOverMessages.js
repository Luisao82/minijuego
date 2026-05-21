// Mensajes del game-over según el porcentaje de palo recorrido antes de caer.
// Cada entrada cubre el rango [threshold, anterior_threshold).
// El array debe estar ordenado de MAYOR a MENOR threshold.
// Para cambiar los textos, umbrales o colores, edita solo este archivo.

export const GAME_OVER_MESSAGES = [
  {
    threshold:  90,           // distPercent > 90
    expression: '¡¡ Casiiiiii !!',
    phrase:     'Que cerquita has estado, mi arma',
    color:      '#00cc44',
  },
  {
    threshold:  50,           // distPercent >= 50
    expression: '¡¡ Bueno… bueno… !!',
    phrase:     'Con un poco más de arte, llegas',
    color:      '#ffd700',
  },
  {
    threshold:  10,           // distPercent >= 10
    expression: '¡¡ Ooohhh !!',
    phrase:     'Hay que practicar más eehh??',
    color:      '#ff8800',
  },
  {
    threshold:   0,           // distPercent < 10
    expression: '¡¡ Mare mía !!',
    phrase:     'Móntate en "las calesitas del Tardón" anda',
    color:      '#ff4422',
  },
]

/**
 * Devuelve la entrada de mensaje correspondiente al porcentaje de palo recorrido.
 * @param {number} distPercent  — 0-100, entero
 * @returns {{ expression: string, phrase: string, color: string }}
 */
export function getGameOverMessage(distPercent) {
  for (const entry of GAME_OVER_MESSAGES) {
    if (distPercent > entry.threshold) return entry
  }
  return GAME_OVER_MESSAGES[GAME_OVER_MESSAGES.length - 1]
}
