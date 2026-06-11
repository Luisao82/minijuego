import {
  FONT_BRAND,
  FONT_UI,
  FONT_SYS,
  PIXEL_STROKE_DARK,
  PIXEL_SHADOW,
  COLOR_GOLD,
  COLOR_MUTED,
} from './fonts'

// Helpers para crear los blobs de estilo de `scene.add.text()`.
//
// Diseño en dos capas:
//   1. `fonts.js` — decisiones de marca (familia, sombra, paleta).
//   2. Este archivo — recetas reutilizables agrupadas por rol semántico.
//
// Patrón de uso recomendado:
//   this.add.text(x, y, 'Texto', uiLabelStyle(16))
//   this.add.text(x, y, 'Otro',  { ...titleStyle(80, '#fff'), letterSpacing: 4 })
//
// El spread + override permite afinar matices puntuales (letterSpacing,
// align, lineSpacing...) sin perder la receta base.
//
// `fontSize` admite tanto número (se convierte a "Npx") como string con la
// unidad ya incluida ('26px') — mismo comportamiento que el `fontSize` de
// Phaser TextStyle.

const px = (size) => (typeof size === 'number' ? `${size}px` : size)

// Título de marca: Jersey 10 + stroke grueso + sombra dura pixel.
// Para títulos principales / pantalla.
export const titleStyle = (fontSize, color, strokeThickness = 8) => ({
  fontFamily: FONT_BRAND,
  fontSize: px(fontSize),
  color,
  stroke: PIXEL_STROKE_DARK,
  strokeThickness,
  shadow: PIXEL_SHADOW,
})

// Heading / subtítulo: Jersey 10 + stroke fino, sin sombra.
// Para títulos secundarios o headers de sección.
export const headingStyle = (fontSize, color, strokeThickness = 2) => ({
  fontFamily: FONT_BRAND,
  fontSize: px(fontSize),
  color,
  stroke: PIXEL_STROKE_DARK,
  strokeThickness,
})

// Label de UI dorada: Press Start 2P + stroke fino.
// Color dorado por defecto. Para premios, stats, badges, achievements.
export const uiLabelStyle = (fontSize, color = COLOR_GOLD, strokeThickness = 4) => ({
  fontFamily: FONT_UI,
  fontSize: px(fontSize),
  color,
  stroke: PIXEL_STROKE_DARK,
  strokeThickness,
})

// Label de UI sin stroke: Press Start 2P plano.
// Para texto de UI limpio (sin tratamiento retro fuerte).
export const uiLabelLight = (fontSize, color = '#ffffff') => ({
  fontFamily: FONT_UI,
  fontSize: px(fontSize),
  color,
})

// Texto secundario / muted: monospace, gris claro.
// Para descripciones, hints, copyright.
export const mutedStyle = (fontSize, color = COLOR_MUTED) => ({
  fontFamily: FONT_SYS,
  fontSize: px(fontSize),
  color,
})

// Aviso / warning: Press Start 2P + stroke medio.
// Para advertencias visibles (ej. música pendiente de autorización).
export const warningStyle = (fontSize, color = COLOR_GOLD) => ({
  fontFamily: FONT_UI,
  fontSize: px(fontSize),
  color,
  stroke: PIXEL_STROKE_DARK,
  strokeThickness: 4,
})
