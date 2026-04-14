import { CHARACTERS } from '../config/characters'
import { SCENES } from '../config/gameConfig'

const EASTER_EGG_ID = 'easter_egg'

export function launchEasterEgg(scene, skin) {
  const easterChar = CHARACTERS.find(c => c.id === EASTER_EGG_ID)
  if (!easterChar) return

  scene.scene.start(SCENES.GAME, {
    character:   easterChar,
    perspective: null,
    skin,
  })
}
