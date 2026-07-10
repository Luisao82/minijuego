import { SCENES } from '../config/gameConfig'
import { getStoredPerspective } from '../config/perspectiveConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'

// Punto único de entrada a la partida: la vista 3D tiene escena propia,
// así que se elige la escena según la perspectiva guardada. Todas las
// pantallas que lanzan una partida deben pasar por aquí en vez de hacer
// scene.start(SCENES.GAME) directamente.
//
// Si la perspectiva guardada es '3d' pero está bloqueada (ej. jugador que la
// tenía seleccionada antes de que pasara a desbloquearse con el 100 % de
// completado), se cae a la partida 2D con la vista por defecto.
export function startGame(scene, data = {}) {
  const wants3d = getStoredPerspective() === '3d'
  const sceneKey =
    wants3d && perspectiveUnlockService.isUnlocked('3d') ? SCENES.GAME_3D : SCENES.GAME
  scene.scene.start(sceneKey, data)
}
