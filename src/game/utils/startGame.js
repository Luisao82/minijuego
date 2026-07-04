import { SCENES } from '../config/gameConfig'
import { getStoredPerspective } from '../config/perspectiveConfig'

// Punto único de entrada a la partida: la vista 3D tiene escena propia,
// así que se elige la escena según la perspectiva guardada. Todas las
// pantallas que lanzan una partida deben pasar por aquí en vez de hacer
// scene.start(SCENES.GAME) directamente.
export function startGame(scene, data = {}) {
  const sceneKey = getStoredPerspective() === '3d' ? SCENES.GAME_3D : SCENES.GAME
  scene.scene.start(sceneKey, data)
}
