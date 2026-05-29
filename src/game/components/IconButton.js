// ============================================================
// IconButton — Botón cuadrado pixel art para iconos (©, ♪, etc.)
// Mismo lenguaje visual que NavButton (Cartelón de Feria) pero
// cuadrado y con hit area amplia para uso táctil cómodo.
// ============================================================

const FILL_NORMAL = 0xd4a520
const FILL_HOVER  = 0xffcc00
const BORDER_DARK = 0x5c2d00
const HIGHLIGHT   = 0xffe580
const SHADOW_LINE = 0x9a7000

/**
 * Crea un botón cuadrado tipo cartelón con un icono centrado.
 *
 * @param {Phaser.Scene} scene
 * @param {number}  x       - Esquina superior izquierda
 * @param {number}  y       - Esquina superior izquierda
 * @param {number}  size    - Lado del cuadrado (px)
 * @param {string}  icon    - Carácter/texto a mostrar (©, ♪, etc.)
 * @param {Function} onPress
 * @param {{
 *   depth?: number,
 *   fontSize?: string,
 *   color?: string,
 *   stroke?: string,
 *   playSfx?: boolean,
 * }} [opts]
 * @returns {{ bounds: Phaser.Geom.Rectangle, text: Phaser.GameObjects.Text, redraw: Function, setIconColor: Function }}
 */
export function makeIconButton(scene, x, y, size, icon, onPress, opts = {}) {
  const depth      = opts.depth      ?? 10
  const fontFamily = opts.fontFamily ?? '"Jersey 10", cursive'
  const fontSize   = opts.fontSize   ?? `${Math.round(size * 0.75)}px`
  const color      = opts.color      ?? '#1a0800'
  const stroke     = opts.stroke     ?? '#000000'
  const strokeW    = opts.strokeThickness ?? 4
  const playSfx    = opts.playSfx    ?? true

  const g = scene.add.graphics().setDepth(depth)

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
  }

  drawNormal()

  const text = scene.add.text(x + size / 2, y + size / 2, icon, {
    fontFamily,
    fontSize,
    color,
    stroke,
    strokeThickness: strokeW,
  }).setOrigin(0.5).setDepth(depth + 1)

  const bounds = new Phaser.Geom.Rectangle(x, y, size, size)
  g.setInteractive(bounds, Phaser.Geom.Rectangle.Contains)

  let isPressed = false

  g.on('pointerover', drawHover)
  g.on('pointerout',  () => { isPressed = false; drawNormal() })
  g.on('pointerdown', () => { isPressed = true })
  g.on('pointerup',   () => {
    if (!isPressed) return
    isPressed = false
    if (playSfx) scene.sound.play('sfx-click', { volume: 0.6 })
    onPress()
  })

  return {
    bounds,
    text,
    redraw: drawNormal,
    setIconColor: (newColor) => text.setColor(newColor),
  }
}
