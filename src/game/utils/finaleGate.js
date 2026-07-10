// Puerta de la escena final: todas las navegaciones que CIERRAN la cadena
// post-partida (premio → desbloqueos → destino) deben pasar por aquí en vez
// de hacer scene.start() directamente. Si el jugador acaba de alcanzar el
// 100 % de completado y aún no ha visto el final para el contenido actual,
// se intercala FinaleScene antes del destino original.

import { SCENES } from '../config/gameConfig'
import { getCompletion } from '../services/CompletionService'
import { finaleService } from '../services/FinaleService'
import { startGame } from './startGame'

export function startWithFinaleCheck(scene, targetScene, data = {}) {
  const rewardsCount = (scene.cache.json.get('rewards') || []).length
  const completion = getCompletion(rewardsCount)

  if (finaleService.shouldAutoShow(completion)) {
    scene.scene.start(SCENES.FINALE, { returnTo: targetScene, returnData: data })
    return
  }

  if (targetScene === SCENES.GAME) {
    startGame(scene, data)
  } else {
    scene.scene.start(targetScene, data)
  }
}
