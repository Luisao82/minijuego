// Perspectiva de vista — helpers de persistencia.
//
// La configuración completa de cada perspectiva (escala, offset, fondo, etc.)
// vive ahora en public/assets/perspectives.json y se gestiona mediante
// PerspectiveUnlockService, de forma análoga a personajes y premios.

const STORAGE_KEY = 'cucana_perspective'

export const DEFAULT_PERSPECTIVE = 'triana'

export const getStoredPerspective = () => {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PERSPECTIVE
}

export const storePerspective = (id) => {
  localStorage.setItem(STORAGE_KEY, id)
}
