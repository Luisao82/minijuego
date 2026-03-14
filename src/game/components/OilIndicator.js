// Componente indicador de grasa — recuadro HUD con gota pixel art
// La gota se llena desde abajo según el % de grasa total del palo
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// ─── Configuración ───────────────────────────────────────────────────────────

const PIXEL = 4   // px reales por "píxel" del pixel art

// Forma de la gota (💧): punta estrecha arriba, cuerpo ancho abajo.
// Clave: la punta ocupa solo 2 filas antes de saltar al ancho máximo
// → eso crea la transición brusca que hace reconocible la forma de gota.
// [colStart, width] por fila, de arriba (punta) a abajo (base)
const SHAPE = [
  [3, 2],  // fila 0  — punta 2 px
  [1, 6],  // fila 1  — salta a 6px de golpe (transición brusca)
  [0, 8],  // fila 2  — ancho máximo, empieza el cuerpo
  [0, 8],  // fila 3
  [0, 8],  // fila 4
  [0, 8],  // fila 5
  [0, 8],  // fila 6
  [0, 8],  // fila 7
  [0, 8],  // fila 8
  [1, 6],  // fila 9  — se cierra
  [2, 4],  // fila 10
  [3, 2],  // fila 11 — base redondeada
]

const DROP_W = 8 * PIXEL          // 32 px
const DROP_H = SHAPE.length * PIXEL  // 48 px

// Recuadro HUD: mitad de la altura del panel de game over (222 px)
const BOX = 111
const PAD = 8

// Fuente pixel art del proyecto
const FONT_PX = '"Jersey 10", cursive'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox      = scene.add.graphics()   // recuadro (estático)
  const gDropBg   = scene.add.graphics()   // borde + fondo de la gota (estático)
  const gDropFill = scene.add.graphics()   // relleno dinámico

  // Gota centrada horizontalmente
  const dropX = Math.floor((BOX - DROP_W) / 2)
  const dropY = PAD + 18 + 4   // debajo de la etiqueta "GRASA"

  _drawBox(gBox)
  _drawDropBg(gDropBg, dropX, dropY)

  // Etiqueta fija "GRASA"
  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily: FONT_PX,
    fontSize:   '16px',
    color:      '#ffd700',
    stroke:     '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  // Porcentaje dinámico
  const labelPct = scene.add.text(BOX / 2, dropY + DROP_H + 5, '100%', {
    fontFamily: FONT_PX,
    fontSize:   '20px',
    color:      '#ff6644',
    stroke:     '#000000',
    strokeThickness: 4,
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

// ─── Helpers privados ────────────────────────────────────────────────────────

function _drawBox(g) {
  // Fondo oscuro semitransparente (igual que panel game over)
  g.fillStyle(0x0a0510, 0.88)
  g.fillRect(0, 0, BOX, BOX)

  // Borde dorado exterior
  g.lineStyle(2, 0xffd700, 0.9)
  g.strokeRect(0, 0, BOX, BOX)

  // Borde interior fino (doble línea estilo feria)
  g.lineStyle(1, 0xffd700, 0.25)
  g.strokeRect(3, 3, BOX - 6, BOX - 6)
}

function _drawDropBg(g, ox, oy) {
  // Silueta negra expandida 1 px alrededor de cada fila
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // Fondo interior oscuro (interior vacío de la gota)
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

  // Negro-marrón oscuro: simula grasa de palo
  const fillColor = pct > 60 ? 0x1a0800 : pct > 30 ? 0x3d1800 : 0x5c3300

  for (let i = 0; i < filledRows; i++) {
    const row      = rows - 1 - i
    const [col, w] = SHAPE[row]

    g.fillStyle(fillColor, 1)
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)

    // Brillo en el borde superior del relleno
    if (i === filledRows - 1 && w >= 4) {
      g.fillStyle(0xffffff, 0.12)
      g.fillRect(ox + (col + 1) * PIXEL, oy + row * PIXEL, (w - 2) * PIXEL, 1)
    }
  }
}
