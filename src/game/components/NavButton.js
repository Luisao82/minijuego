// ============================================================
// NavButton — Cartelón de Feria
// Fondo dorado sólido + texto oscuro = máximo contraste en móvil
// ============================================================

const FILL_NORMAL = 0xd4a520   // dorado ámbar sólido
const FILL_HOVER  = 0xffcc00   // dorado más vivo al hover/tap
const BORDER_DARK = 0x5c2d00   // borde marrón oscuro para definición
const HIGHLIGHT   = 0xffe580   // línea de brillo superior (efecto 3D)
const SHADOW_LINE = 0x9a7000   // línea de sombra inferior (efecto 3D)

/**
 * Crea un botón de navegación estilo "Cartelón de Feria":
 * fondo dorado sólido, texto oscuro, borde marrón, efecto 3D.
 * Máximo contraste para lectura en móvil.
 *
 * @param {Phaser.Scene} scene
 * @param {number}  x       - Esquina superior izquierda
 * @param {number}  y       - Esquina superior izquierda
 * @param {number}  w       - Ancho
 * @param {number}  h       - Alto
 * @param {string}  label   - Texto del botón
 * @param {Function} onPress
 * @param {{ depth?: number, fontSize?: string }} [opts]
 * @returns {Phaser.Geom.Rectangle} Bounds (útil para excluir eventos de input)
 */
export function makeNavButton(scene, x, y, w, h, label, onPress, opts = {}) {
  const depth    = opts.depth    ?? 5
  const fontSize = opts.fontSize ?? '26px'

  const g = scene.add.graphics().setDepth(depth)

  const drawNormal = () => {
    g.clear()
    // Sombra exterior desplazada (da profundidad pixel art)
    g.fillStyle(0x000000, 0.30)
    g.fillRect(x + 3, y + 3, w, h)
    // Relleno dorado sólido
    g.fillStyle(FILL_NORMAL, 1)
    g.fillRect(x, y, w, h)
    // Línea de brillo superior (borde superior más claro = efecto 3D)
    g.lineStyle(2, HIGHLIGHT, 0.75)
    g.lineBetween(x + 2, y + 2, x + w - 2, y + 2)
    // Línea de sombra inferior
    g.lineStyle(2, SHADOW_LINE, 0.55)
    g.lineBetween(x + 2, y + h - 2, x + w - 2, y + h - 2)
    // Borde exterior marrón oscuro
    g.lineStyle(3, BORDER_DARK, 1)
    g.strokeRect(x, y, w, h)
  }

  const drawHover = () => {
    g.clear()
    // Sombra más corta (parece que el botón "sube" al pulsar)
    g.fillStyle(0x000000, 0.18)
    g.fillRect(x + 2, y + 2, w, h)
    // Relleno dorado brillante
    g.fillStyle(FILL_HOVER, 1)
    g.fillRect(x, y, w, h)
    // Brillo más pronunciado
    g.lineStyle(2, 0xffffc0, 0.9)
    g.lineBetween(x + 2, y + 2, x + w - 2, y + 2)
    g.lineStyle(2, SHADOW_LINE, 0.55)
    g.lineBetween(x + 2, y + h - 2, x + w - 2, y + h - 2)
    // Borde
    g.lineStyle(3, BORDER_DARK, 1)
    g.strokeRect(x, y, w, h)
  }

  drawNormal()

  // Texto negro sobre dorado: contraste WCAG AAA (ratio ~7:1)
  scene.add.text(x + w / 2, y + h / 2, label, {
    fontFamily: '"Jersey 10", cursive',
    fontSize,
    color: '#1a0800',
    stroke: '#000000',
    strokeThickness: 1,
  }).setOrigin(0.5).setDepth(depth + 1)

  const bounds = new Phaser.Geom.Rectangle(x, y, w, h)
  g.setInteractive(bounds, Phaser.Geom.Rectangle.Contains)
  g.on('pointerover', drawHover)
  g.on('pointerout', drawNormal)
  g.on('pointerdown', onPress)

  return bounds
}
