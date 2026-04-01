import { BootScene } from './scenes/BootScene'
import { CRTScene } from './scenes/CRTScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MenuScene } from './scenes/MenuScene'
import { HistoryScene } from './scenes/HistoryScene'
import { TutorialScene } from './scenes/TutorialScene'
import { ViewSelectScene } from './scenes/ViewSelectScene'
import { CharacterSelectScene } from './scenes/CharacterSelectScene'
import { SkinSelectScene } from './scenes/SkinSelectScene'
import { GameScene } from './scenes/GameScene'
import { RewardScene } from './scenes/RewardScene'
import { CharacterUnlockScene } from './scenes/CharacterUnlockScene'
import { PerspectiveUnlockScene } from './scenes/PerspectiveUnlockScene'
import { SkinUnlockScene } from './scenes/SkinUnlockScene'
import { CollectionScene } from './scenes/CollectionScene'
import { AUTO, Scale, Game } from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './config/gameConfig'

const config = {
  type: AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: false,   // filtrado NEAREST — imprescindible para sprites escalados
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    CRTScene,
    MenuScene,
    HistoryScene,
    TutorialScene,
    ViewSelectScene,
    CharacterSelectScene,
    SkinSelectScene,
    GameScene,
    RewardScene,
    CharacterUnlockScene,
    PerspectiveUnlockScene,
    SkinUnlockScene,
    CollectionScene,
  ],
}

const StartGame = (parent) => {
  const game = new Game({ ...config, parent })
  // Exponer instancia para testing (eliminar en producción)
  if (import.meta.env.DEV) {
    window.__GAME__ = game
  }
  return game
}

export default StartGame
