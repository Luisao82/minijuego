// Devuelve true si el usuario tiene activado "Reducir movimiento" en su SO.
// Útil para omitir animaciones puramente decorativas (parpadeos, marquees,
// partículas) en escenas con mucho movimiento.
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
