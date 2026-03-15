// Componente indicador de grasa — recuadro HUD con lata de aceite pixel art
// El relleno dorado baja de nivel conforme disminuye el % de grasa
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// ─── Configuración ───────────────────────────────────────────────────────────

const PIXEL = 4   // px de pantalla por cada "píxel" del pixel art

const SHAPE = [
  [7, 1],
  [6, 3],
  [6, 3],
  [5, 5],
  [5, 5],
  [4, 7],
  [4, 7],
  [3, 9],
  [3, 9],
  [2, 11],
  [2, 11],
  [2, 11],
  [2, 11],
  [3, 9],
  [4, 7],
  [6, 3]
]

const FILL_START = 0                      // primera fila rellenable
const FILL_END   = SHAPE.length - 1       // última fila rellenable (14)
const FILL_COUNT = SHAPE.length           // todas las filas (15)

const SHAPE_W = 14 * PIXEL   // 56 px
const SHAPE_H = SHAPE.length * PIXEL   // 52 px

// Caja HUD: mitad de la altura del panel de game over (222 px)
const BOX = 135
const PAD = 6

const FONT_PX = '"Jersey 10", cursive'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox    = scene.add.graphics()
  const gShape  = scene.add.graphics()
  const gFill   = scene.add.graphics()

  const iconX = Math.floor((BOX - SHAPE_W) / 2)
  const iconY = PAD + 35  

  _drawBox(gBox)
  _drawShape(gShape, iconX, iconY)

  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily:      FONT_PX,
    fontSize:        '25px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  const labelPct = scene.add.text(BOX / 2, iconY + SHAPE_H + 2, '100%', {
    fontFamily:      FONT_PX,
    fontSize:        '25px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gBox, gShape, gFill, labelTitle, labelPct])

  return {
    update(percentage) {
      _drawFill(gFill, iconX, iconY, percentage)
      const pct   = Math.round(Math.max(0, Math.min(100, percentage)))
      const color = pct > 60 ? '#ff3300' : pct > 30 ? '#ffaa00' : '#33cc33'
      labelPct.setText(`${pct}%`)
      labelPct.setStyle({ color })
    },
    destroy() { container.destroy() },
  }
}

// ─── Helpers privados ────────────────────────────────────────────────────────

function _drawBox(g) {
  g.fillStyle(0x0a0510, 0.88)
  g.fillRect(0, 0, BOX, BOX)

  // Borde dorado exterior (mismo estilo que fichas del juego)
  g.lineStyle(2, 0xffd700, 0.9)
  g.strokeRect(0, 0, BOX, BOX)

  // Borde interior sutil
  g.lineStyle(1, 0xffd700, 0.2)
  g.strokeRect(3, 3, BOX - 6, BOX - 6)
}

function _drawShape(g, ox, oy) {
  // 1. Borde ámbar oscuro: visible sobre el fondo oscuro del recuadro
  g.fillStyle(0x5a3a00, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // 2. Interior apagado — silueta siempre visible aunque esté vacía
  g.fillStyle(0x221a08, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)
  })

  // 3. Reflejo inferior-derecho — trazo en L de 4 píxeles que simula
  //    luz reflejada en la superficie de la lata. Siempre visible,
  //    independientemente del nivel de relleno, para dar profundidad.
  //    Filas 11-13, pegado al borde derecho del cuerpo.
  const shine = [11, 12, 13]   // filas donde aparece el reflejo
  shine.forEach((rowIdx, i) => {
    const [col, w] = SHAPE[rowIdx]
    const rx = ox + (col + w - 1) * PIXEL   // borde derecho de esa fila
    const ry = oy + rowIdx * PIXEL
    // Trazo vertical (1 px de ancho real)
    g.fillStyle(0xffffff, i === 0 ? 0.15 : 0.22)
    g.fillRect(rx, ry, PIXEL - 1, PIXEL - 1)
  })
  // Píxel horizontal extra en la fila 13 (forma la pata de la L)
  const [col13b, w13b] = SHAPE[13]
  g.fillStyle(0xffffff, 0.15)
  g.fillRect(ox + (col13b + w13b - 2) * PIXEL, oy + 13 * PIXEL, PIXEL - 1, PIXEL - 1)
}

function _drawFill(g, ox, oy, percentage) {
  g.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const filledRows = Math.round((pct / 100) * FILL_COUNT)

  if (filledRows === 0) return

  const fillColor = 0xd4a017   // amarillo aceite, siempre igual

  // Rellena de abajo (FILL_END) hacia arriba (FILL_START) según el nivel
  for (let i = 0; i < filledRows; i++) {
    const row      = FILL_END - i
    const [col, w] = SHAPE[row]

    g.fillStyle(fillColor, 1)
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)

    // Brillo en la fila superior del nivel (simula superficie del líquido)
    if (i === filledRows - 1 && w >= 4) {
      g.fillStyle(0xffee88, 0.4)
      g.fillRect(ox + (col + 1) * PIXEL, oy + row * PIXEL, (w - 2) * PIXEL, 2)
    }
  }
}
