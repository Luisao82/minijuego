// Componente indicador de grasa — recuadro HUD con gota pixel art
// La gota se llena desde abajo según el % de grasa total del palo
//
// Uso:
//   const ind = createOilIndicator(scene, x, y)
//   ind.update(75)   → actualiza relleno y texto
//   ind.destroy()    → elimina todos los objetos

// ─── Configuración ───────────────────────────────────────────────────────────

const PIXEL = 5   // px reales por "píxel" del pixel art

// Forma de la gota (💧): punta de 1 px, apertura rápida, cuerpo amplio.
// Con PIXEL=5 la punta es de 5px reales → se ve claramente como pico.
// [colStart, width] por fila, de arriba (punta) a abajo (base)
const SHAPE = [
  [4, 1],  // fila 0  — PUNTA: 1 solo píxel de ancho
  [3, 3],  // fila 1  — se abre a 3px
  [1, 7],  // fila 2  — salta a 7px (apertura brusca → forma gota)
  [0, 9],  // fila 3  — ancho máximo, empieza el cuerpo
  [0, 9],  // fila 4
  [0, 9],  // fila 5
  [0, 9],  // fila 6
  [0, 9],  // fila 7
  [0, 9],  // fila 8
  [1, 7],  // fila 9  — se cierra
  [3, 3],  // fila 10
  [4, 1],  // fila 11 — base redondeada
]

const DROP_W = 9 * PIXEL            // 45 px
const DROP_H = SHAPE.length * PIXEL // 60 px

// Recuadro HUD: mitad de la altura del panel de game over (222 px)
const BOX = 111
const PAD = 6

// Fuente pixel art del proyecto
const FONT_PX = '"Jersey 10", cursive'

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createOilIndicator(scene, x, y) {
  const container = scene.add.container(x, y)

  const gBox      = scene.add.graphics()   // recuadro (estático)
  const gDropBg   = scene.add.graphics()   // borde + fondo de la gota (estático)
  const gDropFill = scene.add.graphics()   // relleno dinámico

  // Gota centrada horizontalmente en el recuadro
  const dropX = Math.floor((BOX - DROP_W) / 2)
  const dropY = PAD + 20 + 3   // debajo de la etiqueta "GRASA"

  _drawBox(gBox)
  _drawDropBg(gDropBg, dropX, dropY)

  // Etiqueta fija "GRASA"
  const labelTitle = scene.add.text(BOX / 2, PAD, 'GRASA', {
    fontFamily:      FONT_PX,
    fontSize:        '16px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  // Porcentaje dinámico
  const labelPct = scene.add.text(BOX / 2, dropY + DROP_H + 4, '100%', {
    fontFamily:      FONT_PX,
    fontSize:        '18px',
    color:           '#ffd700',
    stroke:          '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0)

  container.add([gBox, gDropBg, gDropFill, labelTitle, labelPct])

  return {
    update(percentage) {
      _drawDropFill(gDropFill, dropX, dropY, percentage)
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

  g.lineStyle(2, 0xffd700, 0.9)
  g.strokeRect(0, 0, BOX, BOX)

  g.lineStyle(1, 0xffd700, 0.25)
  g.strokeRect(3, 3, BOX - 6, BOX - 6)
}

function _drawDropBg(g, ox, oy) {
  // Silueta negra: borde de 1px real alrededor de cada fila
  g.fillStyle(0x000000, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL - 1, oy + row * PIXEL - 1, w * PIXEL + 2, PIXEL + 2)
  })

  // Fondo interior oscuro (cavidad vacía)
  g.fillStyle(0x0d0a06, 1)
  SHAPE.forEach(([col, w], row) => {
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)
  })
}

function _drawDropFill(g, ox, oy, percentage) {
  g.clear()

  const pct        = Math.max(0, Math.min(100, percentage))
  const rows       = SHAPE.length
  const filledRows = Math.round((pct / 100) * rows)

  // Amarillo dorado (grasa) → naranja → rojo según nivel
  const fillColor = pct > 60 ? 0xd4a017 : pct > 30 ? 0xb87000 : 0x8b4500

  for (let i = 0; i < filledRows; i++) {
    const row      = rows - 1 - i
    const [col, w] = SHAPE[row]

    g.fillStyle(fillColor, 1)
    g.fillRect(ox + col * PIXEL, oy + row * PIXEL, w * PIXEL, PIXEL)

    // Brillo en el borde superior del relleno (simula superficie líquida)
    if (i === filledRows - 1 && w >= 4) {
      g.fillStyle(0xffee88, 0.4)
      g.fillRect(ox + (col + 1) * PIXEL, oy + row * PIXEL, (w - 2) * PIXEL, 2)
    }
  }
}
