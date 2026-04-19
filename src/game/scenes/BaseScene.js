import { Scene } from 'phaser'
import * as Sentry from '@sentry/browser'

// Clase base para todas las escenas del juego.
// Gestiona automáticamente:
//   • Limpieza de tweens, timers e input al salir de la escena (evita memory leaks)
//   • Breadcrumb de Sentry para seguimiento de navegación en producción
//   • Helper _label() para texto pixel art con estilo consistente
//   • Hook _onShutdown() para limpieza específica de cada subclase

export class BaseScene extends Scene {

  // Las subclases que sobreescriban init() deben llamar a super.init(data)
  // al principio para garantizar el registro del shutdown y el breadcrumb.
  init(_data) {
    if (import.meta.env.PROD) {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message:  `scene: ${this.scene.key}`,
        level:    'info',
      })
    }

    this.events.once('shutdown', () => {
      this.tweens.killAll()
      this.time.removeAllEvents()
      this.input.removeAllListeners()
      this._onShutdown()
    })
  }

  // Hook de limpieza — sobreescribir en subclases para destruir
  // componentes propios (Narrator, Player, sistemas activos, etc.)
  _onShutdown() {}

  // Helper de texto con estilo pixel art por defecto.
  // opts acepta cualquier propiedad de Phaser TextStyle + originX / originY.
  _label(x, y, text, opts = {}) {
    const { originX = 0.5, originY = 0.5, ...style } = opts
    return this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize:   '13px',
      color:      '#ffffff',
      ...style,
    }).setOrigin(originX, originY)
  }
}
