import { BaseScene } from './BaseScene'
import { SCENES, COLORS } from '../config/gameConfig'

export class BootScene extends BaseScene {

  constructor() {
    super(SCENES.BOOT)
  }

  preload() {
    // Precarga solo la imagen del narrador tutorial para que PreloadScene
    // pueda mostrarla desde el primer frame de la pantalla de carga.
    this.load.setPath('assets')
    this.load.image('img-preload', 'ui/imgPreload.jpg')
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK)
    // Esperar a que las fuentes web estén cargadas antes de arrancar.
    // document.fonts.ready resuelve siempre (éxito o fallo de red), así que
    // no hay riesgo de bloqueo indefinido.
    document.fonts.ready.then(() => {
      this.scene.launch(SCENES.CRT)
      this.scene.bringToTop(SCENES.CRT)
      this.scene.start(SCENES.PRELOAD)
    })
  }
}
