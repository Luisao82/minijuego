// ============================================================
// NavButton — Cartelón de Feria
// Fondo dorado sólido + texto oscuro = máximo contraste en móvil
// ============================================================

import { headingStyle } from '../config/textStyles'
import { hapticTap } from '../utils/haptics'

const FILL_NORMAL = 0xd4a520 // dorado ámbar sólido
const FILL_HOVER = 0xffcc00 // dorado más vivo al hover/tap
const BORDER_DARK = 0x5c2d00 // borde marrón oscuro para definición
const HIGHLIGHT = 0xffe580 // línea de brillo superior (efecto 3D)
const SHADOW_LINE = 0x9a7000 // línea de sombra inferior (efecto 3D)

const DEFAULT_PADDING_X = 28
const DEFAULT_PADDING_Y = 16
const MIN_TAP_HEIGHT = 44 // mínimo recomendado para objetivos táctiles
const LETTER_SPACING = 2 // separación entre letras — mejora la lectura del texto en los botones

/**
 * Calcula el tamaño que ocupará un NavButton para una etiqueta dada, sin
 * dibujarlo. Útil para auto-size (w/h null) y para posicionar varios
 * botones (ej. centrar un par) conociendo su ancho antes de crearlos.
 *
 * @param {Phaser.Scene} scene
 * @param {string} label
 * @param {{ fontSize?: string, paddingX?: number, paddingY?: number }} [opts]
 * @returns {{ w: number, h: number }}
 */
export function measureNavButtonSize(scene, label, opts = {}) {
  const fontSize = opts.fontSize ?? '26px'
  const paddingX = opts.paddingX ?? DEFAULT_PADDING_X
  const paddingY = opts.paddingY ?? DEFAULT_PADDING_Y

  const probe = scene.add.text(0, 0, label, {
    ...headingStyle(fontSize, '#1a0800', 1),
    letterSpacing: LETTER_SPACING,
  })
  const w = Math.ceil(probe.width + paddingX * 2)
  const h = Math.max(Math.ceil(probe.height + paddingY * 2), MIN_TAP_HEIGHT)
  probe.destroy()

  return { w, h }
}

/**
 * Crea un botón de navegación estilo "Cartelón de Feria":
 * fondo dorado sólido, texto oscuro, borde marrón, efecto 3D.
 * Máximo contraste para lectura en móvil.
 *
 * @param {Phaser.Scene} scene
 * @param {number}  x       - Esquina superior izquierda
 * @param {number|null} w   - Ancho. Si es null, se calcula a partir del texto (auto-size).
 * @param {number|null} h   - Alto. Si es null, se calcula a partir del texto (auto-size).
 * @param {string}  label   - Texto del botón
 * @param {Function} onPress
 * @param {{ depth?: number, fontSize?: string, paddingX?: number, paddingY?: number }} [opts]
 * @returns {Phaser.Geom.Rectangle} Bounds (útil para excluir eventos de input)
 */
export function makeNavButton(scene, x, y, w, h, label, onPress, opts = {}) {
  const depth = opts.depth ?? 5
  const fontSize = opts.fontSize ?? '26px'

  if (w === null || w === undefined || h === null || h === undefined) {
    const size = measureNavButtonSize(scene, label, opts)
    w = w ?? size.w
    h = h ?? size.h
  }

  const g = scene.add.graphics().setDepth(depth)

  const drawNormal = () => {
    g.clear()
    // Sombra exterior desplazada (da profundidad pixel art)
    g.fillStyle(0x000000, 0.3)
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

  // Texto negro sobre dorado: contraste WCAG AAA (ratio ~7:1).
  // Override de stroke '#000000' en lugar de PIXEL_STROKE_DARK
  // — efecto deliberadamente más nítido sobre el fondo dorado vivo.
  scene.add
    .text(x + w / 2, y + h / 2, label, {
      ...headingStyle(fontSize, '#1a0800', 1),
      stroke: '#000000',
      letterSpacing: LETTER_SPACING,
    })
    .setOrigin(0.5)
    .setDepth(depth + 1)

  const bounds = new Phaser.Geom.Rectangle(x, y, w, h)
  g.setInteractive(bounds, Phaser.Geom.Rectangle.Contains)
  let isPressed = false

  g.on('pointerover', drawHover)
  g.on('pointerout', () => {
    isPressed = false
    drawNormal()
  })
  g.on('pointerdown', () => {
    isPressed = true
  })
  g.on('pointerup', () => {
    if (!isPressed) return
    isPressed = false
    scene.sound.play('sfx-click', { volume: 0.6 })
    hapticTap()
    onPress()
  })

  return bounds
}
