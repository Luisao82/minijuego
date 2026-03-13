// Componente indicador de grasa — gota pixel art con relleno proporcional
// El relleno sube desde la base según el % de grasa: 100% = llena, 0% = vacía
// Uso: const ind = createOilIndicator(scene, x, y)
//      ind.update(75)   → actualiza el relleno y el texto
//      ind.destroy()    → limpia todos los objetos

// Escala: cada "píxel" del pixel art ocupa PIXEL × PIXEL px en pantalla
const PIXEL = 3

// Forma de la gota (teardrop): [colStart, width] por fila, de punta (arriba) a base (abajo)
const SHAPE = [
  [3, 2],   // fila 0 — punta superior
  [2, 4],   // fila 1
  [1, 6],   // fila 2
  [0, 8],   // fila 3
  [0, 8],   // fila 4 — zona más ancha
  [0, 8],   // fila 5
  [1, 6],   // fila 6
  [2, 4],   // fila 7
  [3, 2],   // fila 8 — base
]

const DROP_W  = 8 * PIXEL   // 24 px
const DROP_H  = SHAPE.length * PIXEL  // 27 px
const CENTER_X = DROP_W / 2

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gStatic = scene.add.graphics()   // borde y fondo (estático, se dibuja una vez)
  const gFill   = scene.add.graphics()   // relleno dinámico

  _drawStatic(gStatic)

  // Etiqueta con el porcentaje, centrada bajo la gota
  const label = scene.add.text(CENTER_X, DROP_H + 5, '100%', {
    fontFamily:      'monospace',
    fontSize:        '11px',
    color:           '#cc4400',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gStatic, gFill, label])

  return {
    update(percentage) { _update(gFill, label, percentage) },
    destroy()          { container.destroy() },
  }
}

// ─── helpers privados ────────────────────────────────────────────────────────

function _drawStatic(g) {
  // 1. Borde negro: silueta expandida 1 px real en cada lado
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(col * PIXEL - 1, row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // 2. Fondo interior oscuro
  g.fillStyle(0x111111, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(col * PIXEL, row * PIXEL, w * PIXEL, PIXEL)
  })
}

function _update(gFill, label, percentage) {
  gFill.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const rows       = SHAPE.length
  const filledRows = Math.round((pct / 100) * rows)
  const fillColor  = _fillColor(pct)

  // Relleno de abajo hacia arriba
  for (let i = 0; i < filledRows; i++) {
    const row    = rows - 1 - i
    const [col, w] = SHAPE[row]

    gFill.fillStyle(fillColor, 1)
    gFill.fillRect(col * PIXEL, row * PIXEL, w * PIXEL, PIXEL)

    // Brillo: línea semi-transparente en el borde superior del relleno
    if (i === filledRows - 1 && w >= 4) {
      gFill.fillStyle(0xffffff, 0.25)
      gFill.fillRect((col + 1) * PIXEL, row * PIXEL, (w - 2) * PIXEL, 1)
    }
  }

  // Texto y color del porcentaje
  const color = pct > 60 ? '#cc4400' : pct > 30 ? '#cc8800' : '#448800'
  label.setText(`${Math.round(pct)}%`)
  label.setStyle({ color })
}

function _fillColor(pct) {
  if (pct > 60) return 0x6B0000   // rojo oscuro — mucha grasa
  if (pct > 30) return 0x8B4500   // marrón — grasa media
  return 0x2d6b00                  // verde oscuro — poca grasa
}
