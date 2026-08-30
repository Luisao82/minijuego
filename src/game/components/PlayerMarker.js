// PlayerMarker — círculo pulsante que representa la posición del jugador
// en el mapa. Se usa tanto en la vista global (tamaño pequeño) como en
// la vista de zoom (tamaño mayor).

const OUTER_COLOR = 0x2a7dff
const INNER_COLOR = 0xa8ccff
const BORDER_COLOR = 0xffffff

export class PlayerMarker {
  constructor(scene, { radius = 8, depth = 6 } = {}) {
    this._scene = scene
    this._radius = radius

    // Halo exterior (pulso)
    this._halo = scene.add
      .graphics()
      .setDepth(depth)
      .fillStyle(OUTER_COLOR, 0.35)
      .fillCircle(0, 0, radius * 2)
    this._halo.setVisible(false)

    // Círculo principal
    this._dot = scene.add.graphics().setDepth(depth + 1)
    this._dot.fillStyle(OUTER_COLOR, 1).fillCircle(0, 0, radius)
    this._dot.lineStyle(2, BORDER_COLOR, 1).strokeCircle(0, 0, radius)
    this._dot.fillStyle(INNER_COLOR, 1).fillCircle(0, 0, Math.max(1, radius / 2.5))
    this._dot.setVisible(false)

    this._pulse = scene.tweens.add({
      targets: this._halo,
      scale: 1.5,
      alpha: 0.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  setPosition(x, y) {
    this._halo.setPosition(x, y).setVisible(true)
    this._dot.setPosition(x, y).setVisible(true)
  }

  hide() {
    this._halo.setVisible(false)
    this._dot.setVisible(false)
  }

  destroy() {
    if (this._pulse) this._pulse.remove()
    this._halo.destroy()
    this._dot.destroy()
  }
}
