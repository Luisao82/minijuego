// AmbientBoat — sprite visual de un barco ambiental que cruza el río.
// No sabe nada de spawns, RNG ni del catálogo global: recibe su entrada
// (catalogEntry), la capa (layerConfig) y una posición inicial, y expone
// setPosition() para que el servicio lo mueva cada frame. El servicio es
// dueño de la lógica; la entidad solo dibuja.

export class AmbientBoat {
  constructor(scene, { catalogEntry, layerConfig, finalScale, x, y, direction, parent, onClick }) {
    this.scene = scene
    this.catalogEntry = catalogEntry
    this.direction = direction

    const scale = finalScale ?? 1
    const alpha = layerConfig.alpha ?? 1
    // Depth compuesto: z de capa × 10000 + Y. Así far < mid < near siempre,
    // y dentro de una misma capa gana el barco con Y mayor (más cerca del
    // observador). Evita el "montaje" de sprites que compartían depth y
    // dependían del orden de inserción.
    const depth = (layerConfig.z ?? 1) * 10000 + y

    const hasAnim = !!catalogEntry.animation
    const initialFrame = hasAnim ? catalogEntry.animation.frames[0] : 0

    // Origen bottom-center: la Y del catálogo es la línea de flotación del
    // barco. Cambia la escala sin que se despeguen o hundan del agua.
    this.sprite = scene.add
      .sprite(x, y, catalogEntry.textureKey, initialFrame)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setAlpha(alpha)
      .setDepth(depth)

    const faces = catalogEntry.spriteFacesRight !== false
    this.sprite.setFlipX(direction > 0 !== faces)

    if (parent) {
      parent.add(this.sprite)
      // Dentro de un Container el setDepth no reordena por sí solo — hay
      // que pedir sort explícito para que near quede sobre mid y mid sobre far.
      parent.sort?.('depth')
    }

    if (hasAnim) {
      const animKey = `${catalogEntry.textureKey}-anim`
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: catalogEntry.animation.frames.map((frame) => ({
            key: catalogEntry.textureKey,
            frame,
          })),
          frameRate: catalogEntry.animation.frameRate,
          repeat: catalogEntry.animation.repeat ?? -1,
        })
      }
      this.sprite.play(animKey)
    }

    const clickable = onClick && catalogEntry.click?.enabled
    if (clickable) {
      this.sprite.setInteractive({ useHandCursor: true })
      this.sprite.on('pointerdown', (_pointer, _lx, _ly, event) => {
        event?.stopPropagation?.()
        onClick(catalogEntry)
      })
    }
  }

  setPosition(x, y) {
    this.sprite.x = x
    this.sprite.y = y
  }

  destroy() {
    this.sprite?.destroy()
    this.sprite = null
  }
}
