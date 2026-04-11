// math — funciones matemáticas auxiliares puras (sin Phaser)

/**
 * Selecciona un elemento de un array usando pesos ponderados.
 * Cada elemento debe tener una propiedad numérica indicada por `weightKey`.
 *
 * Ejemplo:
 *   const items = [{ id: 'a', prob: 0.7 }, { id: 'b', prob: 0.3 }]
 *   weightedRandom(items, 'prob')  // → 'a' el 70% de las veces
 *
 * Si el array está vacío o ningún peso es válido, devuelve null.
 */
export function weightedRandom(items, weightKey = 'probabilidad') {
  if (!items || !items.length) return null

  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 0), 0)

  // Fallback a selección uniforme si no hay pesos válidos
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)]
  }

  let roll = Math.random() * totalWeight

  for (const item of items) {
    roll -= (item[weightKey] || 0)
    if (roll <= 0) return item
  }

  // Seguridad: devolver el último (redondeo de coma flotante)
  return items[items.length - 1]
}
