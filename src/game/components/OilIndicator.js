// Componente indicador de grasa — recuadro HUD con lata de aceite pixel art
// El relleno dorado baja de nivel conforme disminuye el % de grasa
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// ─── Configuración ───────────────────────────────────────────────────────────

const PIXEL = 4   // px de pantalla por cada "píxel" del pixel art

// Silueta de la lata de aceite — grid 14 cols × 13 filas
// Cada entrada: [colStart, width]
//
//  Col:  0123456789ABCD
//  r00:  ...XXXXX......   T-bar horizontal de la tapa
//  r01:  ....XX........   shaft de la tapa
//  r02:  .XXXXXXXXXXXX.   cuerpo superior        ← FILL_START
//  r03:  XXXXXXXXXXXXXX   cuerpo + asa izquierda
//  r04:  XXXXXXXXXXXXXX   cuerpo + asa izquierda
//  r05:  XXXXXXXXXXXXXX   cuerpo
//  r06:  XXXXXXXXXXXXXX   cuerpo
//  r07:  .XXXXXXXXXXXX.   cuerpo inferior        ← FILL_END
//  r08:  ..XXXXXXXXXX..   pitorro — escalón 1
//  r09:  ....XXXXXXXX..   pitorro — escalón 2
//  r10:  ......XXXXX...   pitorro — escalón 3 (punta)
//  r11:  .......XXX....   gota — cuerpo
//  r12:  ........X.....   gota — punta
//
const SHAPE = [
  [3,  5],   // r00 — T-bar horizontal
  [4,  2],   // r01 — shaft
  [1, 12],   // r02 — cuerpo superior   ← FILL_START
  [0, 14],   // r03 — cuerpo + asa
  [0, 14],   // r04 — cuerpo + asa
  [0, 14],   // r05 — cuerpo
  [0, 14],   // r06 — cuerpo
  [1, 12],   // r07 — cuerpo inferior   ← FILL_END
  [2, 10],   // r08 — pitorro escalón 1
  [4,  8],   // r09 — pitorro escalón 2
  [6,  5],   // r10 — pitorro punta
  [7,  3],   // r11 — gota cuerpo
  [8,  1],   // r12 — gota punta
]

const FILL_START = 2    // primera fila del cuerpo (rellenable)
const FILL_END   = 7    // última fila del cuerpo (rellenable)
const FILL_COUNT = FILL_END - FILL_START + 1   // 6 filas

const SHAPE_W = 14 * PIXEL   // 56 px
const SHAPE_H = SHAPE.length * PIXEL   // 52 px

// Caja HUD: mitad de la altura del panel de game over (222 px)
const BOX = 111
const PAD = 6

const FONT_PX = '"Jersey 10", cursive'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox    = scene.add.graphics()
  const gShape  = scene.add.graphics()
  const gFill   = scene.add.graphics()

  const iconX = Math.floor((BOX - SHAPE_W) / 2)
  const iconY = PAD + 22

  _drawBox(gBox)
  _drawShape(gShape, iconX, iconY)

  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily:      FONT_PX,
    fontSize:        '16px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  const labelPct = scene.add.text(BOX / 2, iconY + SHAPE_H + 4, '100%', {
    fontFamily:      FONT_PX,
    fontSize:        '18px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gBox, gShape, gFill, labelTitle, labelPct])

  return {
    update(percentage) {
      _drawFill(gFill, iconX, iconY, percentage)
      const pct   = Math.round(Math.max(0, Math.min(100, percentage)))
      const color = pct > 60 ? '#ffd700' : pct > 30 ? '#ffaa00' : '#ff6644'
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
  // 1. Borde negro: cada fila expandida 1 px en todas las direcciones
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // 2. Interior oscuro (aceite vacío)
  g.fillStyle(0x12100a, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)
  })
}

function _drawFill(g, ox, oy, percentage) {
  g.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const filledRows = Math.round((pct / 100) * FILL_COUNT)

  if (filledRows === 0) return

  const fillColor = pct > 60 ? 0xd4a017 : pct > 30 ? 0xb87000 : 0x8b4500

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
