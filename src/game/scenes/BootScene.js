import { Scene } from 'phaser'
import { SCENES, COLORS } from '../config/gameConfig'

export class BootScene extends Scene {

  constructor() {
    super(SCENES.BOOT)
  }

  create() {
    // Fondo negro mientras carga
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    this.scene.start(SCENES.PRELOAD)
  }
}
