// Identidad tipográfica de "La Cucaña Trianera".
//
// Cualquier cambio en familia de fuente, sombra pixel art, color de
// stroke o paleta semántica de marca se hace AQUÍ y se propaga al
// juego entero. No introducir literales 'Jersey 10' / 'Press Start 2P'
// fuera de este módulo: usar las constantes exportadas o, mejor aún,
// los helpers de `textStyles.js`.

// ── Familias ──────────────────────────────────────────────────────
export const FONT_BRAND = '"Jersey 10", cursive'
export const FONT_UI = '"Press Start 2P", monospace'
export const FONT_SYS = 'monospace'

// ── Receta pixel art (stroke + shadow) ────────────────────────────
export const PIXEL_STROKE_DARK = '#1a0a00'

// Sombra dura desplazada — sin blur, con fill. Replicada literalmente
// en decenas de títulos antes del refactor. Congelada para evitar
// mutaciones accidentales desde escenas que la "tunean" en sitio.
export const PIXEL_SHADOW = Object.freeze({
  offsetX: 4,
  offsetY: 4,
  color: '#000000',
  blur: 0,
  fill: true,
})

// ── Colores semánticos de marca ───────────────────────────────────
// Son los colores que se repetían en varias escenas / componentes.
// Colores de un solo uso siguen viviendo inline donde corresponda.
export const COLOR_GOLD = '#ffd700' // Dorado UI (premios, stats, badges)
export const COLOR_GOLD_LIGHT = '#ffd647' // Subtítulos / variante clara
export const COLOR_ORANGE = '#ff6b35' // Naranja del título principal
export const COLOR_REWARD = '#aaff00' // Lima de RewardScene
export const COLOR_MUTED = '#aaaaaa' // Gris secundario / hints
