// BoatFlag — sprite estático de una bandera colocada sobre el barco.
// La lógica de qué bandera va en qué slot la resuelve BoatFlagsService;
// esta entidad solo dibuja, aplica el pre-flip en Sevilla (para que el
// contenido de la bandera no salga espejado cuando se flipe el gameWorld)
// y expone un click opcional.
//
// Convención de origen (0.5, 0.5):
//   - El servicio ya me pasa la posición del CENTRO de la bandera en
//     coordenadas de mundo. Origen central hace que un setFlipX no
//     desplace la bandera — el flip pivota sobre su propio centro.
//   - Así, en Sevilla el gameWorld se flipa y la bandera pre-flipada
//     hace doble flip → texto legible, posición idéntica.

export class BoatFlag {
  constructor(scene, { textureKey, x, y, scale, perspectiveFlipped, parent, onClick, meta }) {
    this.scene = scene
    this.meta = meta

    this.sprite = scene.add
      .sprite(x, y, textureKey)
      .setOrigin(0.5, 0.5)
      .setScale(scale)
      .setFlipX(!!perspectiveFlipped)

    if (parent) parent.add(this.sprite)

    if (onClick) {
      this.sprite.setInteractive({ useHandCursor: true })
      this.sprite.on('pointerdown', (_pointer, _lx, _ly, event) => {
        event?.stopPropagation?.()
        onClick(meta)
      })
    }
  }

  destroy() {
    this.sprite?.destroy()
    this.sprite = null
  }
}
