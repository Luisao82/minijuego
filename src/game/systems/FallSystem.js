import Phaser from 'phaser'
import { MOVEMENT, COLORS } from '../config/gameConfig'

// Sistema de caída al agua — animación de caída y partículas de splash
// Recibe callbacks de GameScene para notificar cuándo termina la animación.

export class FallSystem {

  constructor(scene, gameWorld) {
    this._scene     = scene
    this._gameWorld = gameWorld
  }

  // Inicia la animación de caída del jugador hasta el agua.
  // onComplete se llama cuando el personaje llega al agua (tras el splash).
  fall(player, waterY, onComplete) {
    const pos = { y: player.y }
    player.setFalling()

    this._scene.tweens.add({
      targets:  pos,
      y:        waterY + 40,
      duration: MOVEMENT.FALL_DURATION,
      ease:     'Quad.easeIn',
      onUpdate: () => {
        player.y = pos.y
        player.redraw()
      },
      onComplete: () => {
        player.setVisible(false)
        this.splash(player.x, waterY)
        onComplete?.()
      },
    })
  }

  // Crea el splash de agua al impacto — se puede llamar directamente (ej: desde el salto)
  splash(playerX, waterY) {
    this._scene.sound.play('sfx-chapuzon', { volume: 0.9 })

    for (let i = 0; i < 10; i++) {
      const dropG   = this._scene.add.graphics()
      this._gameWorld.add(dropG)
      const offsetX = Phaser.Math.Between(-15, 15)
      const size    = Phaser.Math.Between(2, 5)

      dropG.fillStyle(COLORS.WHITE, 0.9)
      dropG.fillRect(playerX + offsetX, waterY, size, size)

      this._scene.tweens.add({
        targets:  dropG,
        y:        -Phaser.Math.Between(20, 50),
        alpha:    0,
        duration: Phaser.Math.Between(300, 600),
        ease:     'Quad.easeOut',
        onComplete: () => dropG.destroy(),
      })
    }
  }
}
