// Componente indicador de grasa — recuadro HUD con icono de lata de aceite pixel art
// El relleno dorado baja de nivel según disminuye el % de grasa
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// ─── Configuración ───────────────────────────────────────────────────────────

const PIXEL = 4   // px reales por "píxel" del pixel art

// Silueta completa de la lata de aceite, fila por fila: [colStart, width]
// Grid de 12 columnas × 13 filas
//
//  ..XXXX......   T-bar horizontal (tapa)
//  ...XX.......   T-bar shaft
//  .XXXXXXXXXX.   cuerpo superior      ← relleno empieza aquí (FILL_START)
//  XXXXXXXXXXXX   cuerpo + asa
//  XXXXXXXXXXXX   cuerpo + asa
//  .XXXXXXXXXX.   cuerpo
//  .XXXXXXXXX..   cuerpo / pitorro empieza
//  ..XXXXXXXX..   pitorro
//  ...XXXXXX...   pitorro se estrecha
//  ....XXXX....   punta del pitorro    ← relleno termina aquí (FILL_END)
//  .....XX.....   gota (decoración)
//  .....XX.....   gota
//  ......X.....   punta de la gota
//
const SHAPE = [
  [2, 4],   // fila 0  — T-bar horizontal
  [3, 2],   // fila 1  — T-bar shaft
  [1, 10],  // fila 2  — cuerpo superior    ← FILL_START
  [0, 12],  // fila 3  — cuerpo + asa
  [0, 12],  // fila 4  — cuerpo + asa
  [1, 10],  // fila 5  — cuerpo
  [1, 9],   // fila 6  — pitorro empieza
  [2, 8],   // fila 7  — pitorro
  [3, 6],   // fila 8  — pitorro se estrecha
  [4, 4],   // fila 9  — punta pitorro     ← FILL_END
  [5, 2],   // fila 10 — gota (decoración)
  [5, 2],   // fila 11 — gota
  [6, 1],   // fila 12 — punta de gota
]

const FILL_START = 2   // primera fila rellenable (índice en SHAPE)
const FILL_END   = 9   // última fila rellenable
const FILL_COUNT = FILL_END - FILL_START + 1   // 8 filas rellenables

const SHAPE_W = 12 * PIXEL             // 48 px
const SHAPE_H = SHAPE.length * PIXEL   // 52 px

// Recuadro HUD: mitad de la altura del panel de game over (222 px)
const BOX = 111
const PAD = 6

// Fuente pixel art del proyecto
const FONT_PX = '"Jersey 10", cursive'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox      = scene.add.graphics()   // recuadro (estático)
  const gSilhouet = scene.add.graphics()   // silueta de la lata (estático)
  const gFill     = scene.add.graphics()   // relleno dinámico

  // Icono centrado horizontalmente en el recuadro
  const iconX = Math.floor((BOX - SHAPE_W) / 2)
  const iconY = PAD + 20 + 4

  _drawBox(gBox)
  _drawSilhouette(gSilhouet, iconX, iconY)

  // Etiqueta fija "GRASA"
  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily:      FONT_PX,
    fontSize:        '16px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  // Porcentaje dinámico
  const labelPct = scene.add.text(BOX / 2, iconY + SHAPE_H + 4, '100%', {
    fontFamily:      FONT_PX,
    fontSize:        '18px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gBox, gSilhouet, gFill, labelTitle, labelPct])

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
  // Fondo oscuro semitransparente
  g.fillStyle(0x0a0510, 0.88)
  g.fillRect(0, 0, BOX, BOX)

  // Borde dorado exterior (mismo estilo que fichas y panel game over)
  g.lineStyle(2, 0xffd700, 0.9)
  g.strokeRect(0, 0, BOX, BOX)

  // Borde interior fino
  g.lineStyle(1, 0xffd700, 0.25)
  g.strokeRect(3, 3, BOX - 6, BOX - 6)
}

function _drawSilhouette(g, ox, oy) {
  // Borde negro: silueta expandida 1 px real alrededor de cada fila
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // Interior oscuro (cavidad vacía por defecto)
  g.fillStyle(0x1a1208, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)
  })
}

function _drawFill(g, ox, oy, percentage) {
  g.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const filledRows = Math.round((pct / 100) * FILL_COUNT)

  if (filledRows === 0) return

  // Color del relleno según nivel
  const fillColor  = pct > 60 ? 0xd4a017 : pct > 30 ? 0xb87000 : 0x8b4500
  const shineColor = 0xffee88

  for (let i = 0; i < filledRows; i++) {
    const row      = FILL_END - i          // rellena de abajo a arriba
    const [col, w] = SHAPE[row]

    g.fillStyle(fillColor, 1)
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)

    // Brillo en la fila superior del relleno (simula superficie del líquido)
    if (i === filledRows - 1 && w >= 3) {
      g.fillStyle(shineColor, 0.45)
      g.fillRect(ox + (col + 1) * PIXEL, oy + row * PIXEL, (w - 2) * PIXEL, 2)
    }
  }
}
