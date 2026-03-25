import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

// Escena overlay CRT — se ejecuta en paralelo por encima de todas las demás.
// Dibuja scanlines estáticas una sola vez simulando un monitor de tubo.
// Se lanza desde BootScene y nunca se detiene.

export class CRTScene extends Scene {

  constructor() {
    super({ key: SCENES.CRT, active: false })
  }

  create() {
    const g = this.add.graphics()
    g.fillStyle(0x000000, 0.35)
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      g.fillRect(0, y, GAME_WIDTH, 1)
    }
  }
}
