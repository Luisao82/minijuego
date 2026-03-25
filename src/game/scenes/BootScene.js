import { Scene } from 'phaser'
import { SCENES, COLORS } from '../config/gameConfig'

export class BootScene extends Scene {

  constructor() {
    super(SCENES.BOOT)
  }

  preload() {
    // Precarga solo la imagen del narrador tutorial para que PreloadScene
    // pueda mostrarla desde el primer frame de la pantalla de carga.
    this.load.setPath('assets')
    this.load.image('tutor-narrator',  'sprites/narrator/narrator.png')
    this.load.image('luisaoDev-logo', 'ui/luisaoDev-logo.png')
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK)
    // Lanzar overlay CRT en paralelo — permanece activo durante todo el juego
    this.scene.launch(SCENES.CRT)
    this.scene.bringToTop(SCENES.CRT)
    this.scene.start(SCENES.PRELOAD)
  }
}
