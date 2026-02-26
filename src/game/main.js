import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MenuScene } from './scenes/MenuScene'
import { CharacterSelectScene } from './scenes/CharacterSelectScene'
import { GameScene } from './scenes/GameScene'
import { AUTO, Scale, Game } from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './config/gameConfig'

const config = {
  type: AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    CharacterSelectScene,
    GameScene,
  ],
}

const StartGame = (parent) => {
  return new Game({ ...config, parent })
}

export default StartGame
