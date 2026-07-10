// Servicio de completado global del juego.
//
// Reúne el estado de todos los servicios de progresión (personajes, skins,
// premios, mapa, perspectivas) y lo pasa al calculador puro
// `CompletionCalculator`. Punto único para preguntar "¿cuánto lleva
// completado el jugador?" desde cualquier escena, sin duplicar el cableado.
//
// Uso:
//   const rewardsCount = (scene.cache.json.get('rewards') || []).length
//   const completion = getCompletion(rewardsCount)
//   if (isGameComplete(completion)) { ... }

import { CHARACTERS } from '../config/characters'
import { computeCompletion } from '../systems/CompletionCalculator'
import { rewardStorage } from './RewardStorageService'
import { unlockService } from './UnlockService'
import { skinService } from './SkinService'
import { perspectiveUnlockService } from './PerspectiveUnlockService'
import { mapService, ALL_PIECES } from './MapService'

// Devuelve { totals, obtained, percent } con el estado actual del jugador
export function getCompletion(rewardsCount) {
  const unlockedSkinsPerCharacter = {}
  for (const c of CHARACTERS) {
    unlockedSkinsPerCharacter[c.id] = skinService.getUnlockedSkins(c)
  }

  return computeCompletion({
    characters: CHARACTERS,
    rewardsCount,
    mapPiecesCount: ALL_PIECES.length,
    unlockedCharacterIds: unlockService.getUnlocked(),
    unlockedSkinsPerCharacter,
    ownedRewardIds: Object.keys(rewardStorage.getAll()),
    unlockedMapPieceIds: mapService.getUnlocked(),
    sevillaUnlocked: perspectiveUnlockService.isUnlocked('sevilla'),
  })
}

// true solo con el 100 % real. Comparación exacta de totales: `percent` se
// redondea (un 99,6 % se muestra como 100 %) y no sirve para decidir
// desbloqueos ni el final del juego.
export function isGameComplete(completion) {
  return completion.totals.total > 0 && completion.obtained.total === completion.totals.total
}
