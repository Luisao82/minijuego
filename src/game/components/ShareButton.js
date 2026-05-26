// ShareButton — versión cuadrada compacta del Cartelón de Feria con icono
// pixel art de compartir. Pensado para esquinas (no compite con los botones
// principales de navegación).

const FILL_NORMAL = 0xd4a520
const FILL_HOVER  = 0xffcc00
const BORDER_DARK = 0x5c2d00
const HIGHLIGHT   = 0xffe580
const SHADOW_LINE = 0x9a7000
const ICON_COLOR  = 0x1a0800

// Dibuja un icono pixel art de "compartir" (caja abierta + flecha hacia arriba)
// dentro de un cuadrado [x..x+size, y..y+size].
function drawShareIcon(g, x, y, size) {
  // Grid lógico 16×16 → escala = size/16
  const u = size / 16
  const px = (gx, gy, gw, gh) => g.fillRect(
    Math.round(x + gx * u),
    Math.round(y + gy * u),
    Math.round(gw * u),
    Math.round(gh * u),
  )

  g.fillStyle(ICON_COLOR, 1)

  // Caja inferior (abierta por arriba): contorno de 2 unidades de grosor
  // Pared izquierda
  px(2, 8, 2, 7)
  // Pared derecha
  px(12, 8, 2, 7)
  // Base
  px(2, 13, 12, 2)
  // Topes superiores cortos (dejan hueco para la flecha)
  px(2, 8, 4, 2)
  px(10, 8, 4, 2)

  // Flecha vertical
  px(7, 4, 2, 8)

  // Punta de flecha (triángulo)
  px(7, 1, 2, 1)
  px(6, 2, 4, 1)
  px(5, 3, 6, 1)
}

/**
 * Crea un botón cuadrado de compartir con icono pixel art.
 *
 * @param {Phaser.Scene} scene
 * @param {number}  x       - Esquina superior izquierda
 * @param {number}  y       - Esquina superior izquierda
 * @param {Function} onPress
 * @param {{ size?: number, depth?: number }} [opts]
 * @returns {Phaser.Geom.Rectangle} Bounds (útil para excluir eventos de input)
 */
export function makeShareButton(scene, x, y, onPress, opts = {}) {
  const size  = opts.size  ?? 48
  const depth = opts.depth ?? 5

  const g = scene.add.graphics().setDepth(depth)

  const iconPad  = Math.round(size * 0.18)
  const iconSize = size - iconPad * 2

  const drawNormal = () => {
    g.clear()
    g.fillStyle(0x000000, 0.30)
    g.fillRect(x + 3, y + 3, size, size)
    g.fillStyle(FILL_NORMAL, 1)
    g.fillRect(x, y, size, size)
    g.lineStyle(2, HIGHLIGHT, 0.75)
    g.lineBetween(x + 2, y + 2, x + size - 2, y + 2)
    g.lineStyle(2, SHADOW_LINE, 0.55)
    g.lineBetween(x + 2, y + size - 2, x + size - 2, y + size - 2)
    g.lineStyle(3, BORDER_DARK, 1)
    g.strokeRect(x, y, size, size)
    drawShareIcon(g, x + iconPad, y + iconPad, iconSize)
  }

  const drawHover = () => {
    g.clear()
    g.fillStyle(0x000000, 0.18)
    g.fillRect(x + 2, y + 2, size, size)
    g.fillStyle(FILL_HOVER, 1)
    g.fillRect(x, y, size, size)
    g.lineStyle(2, 0xffffc0, 0.9)
    g.lineBetween(x + 2, y + 2, x + size - 2, y + 2)
    g.lineStyle(2, SHADOW_LINE, 0.55)
    g.lineBetween(x + 2, y + size - 2, x + size - 2, y + size - 2)
    g.lineStyle(3, BORDER_DARK, 1)
    g.strokeRect(x, y, size, size)
    drawShareIcon(g, x + iconPad, y + iconPad, iconSize)
  }

  drawNormal()

  const bounds = new Phaser.Geom.Rectangle(x, y, size, size)
  g.setInteractive(bounds, Phaser.Geom.Rectangle.Contains)
  let isPressed = false

  g.on('pointerover',  drawHover)
  g.on('pointerout',   () => { isPressed = false; drawNormal() })
  g.on('pointerdown',  () => { isPressed = true })
  g.on('pointerup',    () => {
    if (!isPressed) return
    isPressed = false
    if (scene.sound && scene.cache.audio.exists('sfx-click')) {
      scene.sound.play('sfx-click', { volume: 0.6 })
    }
    onPress()
  })

  return { bounds, graphics: g }
}
