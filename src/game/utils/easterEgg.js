import { CHARACTERS } from '../config/characters'
import { startGame } from './startGame'

const EASTER_EGG_ID = 'easter_egg'

export function launchEasterEgg(scene, skin) {
  const easterChar = CHARACTERS.find((c) => c.id === EASTER_EGG_ID)
  if (!easterChar) return

  startGame(scene, {
    character: easterChar,
    perspective: null,
    skin,
  })
}
