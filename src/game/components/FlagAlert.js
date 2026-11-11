// Aviso de la bandera física: "¡COGE LA BANDERA!" parpadeando, marco rojo
// alrededor de la pantalla y una barra con el tiempo que queda.
// Se anima con el tiempo real que le pasa la escena, no con tweens: el resto
// del juego va a cámara lenta mientras se muestra.
//
// Uso:
//   const alert = new FlagAlert(scene)
//   alert.update(deltaMs, remainingRatio)   → cada frame
//   alert.destroy()

import { GAME_WIDTH, COLORS, CONTROL_PANEL } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle } from '../config/textStyles'

const DEPTH = 60
const BLINK_MS = 140
const FRAME_WIDTH = 8
const BAR = { WIDTH: 360, HEIGHT: 16, BORDER: 4 }
const TEXT_Y = 150

export class FlagAlert {
  constructor(scene) {
    this.scene = scene
    this.elapsed = 0

    this.frame = scene.add.graphics().setDepth(DEPTH)
    this.frame.lineStyle(FRAME_WIDTH, COLORS.RED, 1)
    this.frame.strokeRect(
      FRAME_WIDTH / 2,
      FRAME_WIDTH / 2,
      GAME_WIDTH - FRAME_WIDTH,
      CONTROL_PANEL.Y - FRAME_WIDTH
    )

    this.text = scene.add
      .text(GAME_WIDTH / 2, TEXT_Y, '¡COGE LA BANDERA!', headingStyle(64, COLOR_GOLD, 6))
      .setOrigin(0.5)
      .setDepth(DEPTH)

    this.bar = scene.add.graphics().setDepth(DEPTH)
    this.update(0, 1)
  }

  update(deltaMs, remainingRatio) {
    this.elapsed += deltaMs
    const on = Math.floor(this.elapsed / BLINK_MS) % 2 === 0
    this.text.setVisible(on)
    this.frame.setVisible(on)

    const x = (GAME_WIDTH - BAR.WIDTH) / 2
    const y = TEXT_Y + 50
    const inner = BAR.WIDTH - 2 * BAR.BORDER
    this.bar.clear()
    this.bar.fillStyle(COLORS.BLACK, 1)
    this.bar.fillRect(x, y, BAR.WIDTH, BAR.HEIGHT)
    this.bar.fillStyle(COLORS.GOLD, 1)
    this.bar.fillRect(
      x + BAR.BORDER,
      y + BAR.BORDER,
      Math.round(inner * remainingRatio),
      BAR.HEIGHT - 2 * BAR.BORDER
    )
  }

  destroy() {
    this.frame.destroy()
    this.text.destroy()
    this.bar.destroy()
  }
}
