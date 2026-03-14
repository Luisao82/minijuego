// Componente indicador de grasa — recuadro HUD con gota pixel art
// Muestra el % total de grasa del palo con una gota 💧 que se llena/vacía
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// Escala: cada "píxel" del pixel art ocupa PIXEL × PIXEL px reales
const PIXEL = 5

// Forma de la gota (💧): punta arriba, cuerpo ancho en la parte inferior
// [colStart, width] por fila, de arriba (punta) a abajo (base)
// Grid de 9 columnas × 10 filas → punta única, zona ancha prolongada, base redondeada
const SHAPE = [
  [4, 1],  // fila 0 — punta de 1 px
  [3, 3],  // fila 1
  [1, 7],  // fila 2 — se abre rápido
  [0, 9],  // fila 3 — zona ancha
  [0, 9],  // fila 4
  [0, 9],  // fila 5
  [0, 9],  // fila 6
  [1, 7],  // fila 7 — se cierra
  [2, 5],  // fila 8
  [3, 3],  // fila 9 — base redondeada
]

const DROP_W = 9 * PIXEL     // 45 px
const DROP_H = SHAPE.length * PIXEL  // 50 px

// Tamaño del recuadro HUD = mitad de la altura del cartel de game over (222 px)
const BOX  = 111
const PAD  = 8

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox       = scene.add.graphics()
  const gDropBg    = scene.add.graphics()   // borde + fondo de la gota (estático)
  const gDropFill  = scene.add.graphics()   // relleno dinámico

  // Posición de la gota centrada horizontalmente dentro del recuadro
  const dropX = Math.floor((BOX - DROP_W) / 2)
  const dropY = PAD + 14 + 5   // debajo de la etiqueta "GRASA"

  _drawBox(gBox)
  _drawDropBg(gDropBg, dropX, dropY)

  // Etiqueta fija
  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily:      'monospace',
    fontSize:        '11px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 2,
  }).setOrigin(0.5, 0)

  // Porcentaje dinámico
  const labelPct = scene.add.text(BOX / 2, dropY + DROP_H + 5, '100%', {
    fontFamily:      'monospace',
    fontSize:        '14px',
    color:           '#ff6644',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gBox, gDropBg, gDropFill, labelTitle, labelPct])

  return {
    update(percentage) {
      _drawDropFill(gDropFill, dropX, dropY, percentage)
      const pct   = Math.round(Math.max(0, Math.min(100, percentage)))
      const color = pct > 60 ? '#ff6644' : pct > 30 ? '#ffaa00' : '#44bb44'
      labelPct.setText(`${pct}%`)
      labelPct.setStyle({ color })
    },
    destroy() { container.destroy() },
  }
}

// ─── helpers privados ────────────────────────────────────────────────────────

function _drawBox(g) {
  // Fondo oscuro semitransparente (igual que el panel de game over)
  g.fillStyle(0x0a0510, 0.88)
  g.fillRect(0, 0, BOX, BOX)

  // Borde dorado exterior (igual que fichas y panel de game over)
  g.lineStyle(2, 0xffd700, 0.9)
  g.strokeRect(0, 0, BOX, BOX)

  // Borde dorado interior fino (doble línea estilo feria)
  g.lineStyle(1, 0xffd700, 0.25)
  g.strokeRect(3, 3, BOX - 6, BOX - 6)
}

function _drawDropBg(g, ox, oy) {
  // Silueta negra (borde): expandida 1 px real alrededor de cada fila
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // Fondo interior oscuro (vacío de la gota)
  g.fillStyle(0x100c08, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)
  })
}

function _drawDropFill(g, ox, oy, percentage) {
  g.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const rows       = SHAPE.length
  const filledRows = Math.round((pct / 100) * rows)

  // Color del relleno: negro-marrón (grasa de palo) según nivel
  const fillColor = pct > 60 ? 0x1a0800 : pct > 30 ? 0x3d1800 : 0x5c3300

  for (let i = 0; i < filledRows; i++) {
    const row      = rows - 1 - i
    const [col, w] = SHAPE[row]

    g.fillStyle(fillColor, 1)
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)

    // Brillo semitransparente en el borde superior del relleno
    if (i === filledRows - 1 && w >= 4) {
      g.fillStyle(0xffffff, 0.12)
      g.fillRect(ox + (col + 1) * PIXEL, oy + row * PIXEL, (w - 2) * PIXEL, 1)
    }
  }
}
