// Generador del icono de la app — pixel art 64x64 escalado a todos los tamaños
// requeridos por App Store, Play Store y PWA. Sin dependencias.
//
// Uso:  node scripts/build-icon.mjs
// Salida: public/assets/store/

import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// ─── Paleta ──────────────────────────────────────────────────────────────
const PAL = [
  [0,   0,   0,   0],     // 0  TRANSPARENT
  [74,  144, 217, 255],   // 1  SKY        (#4a90d9)
  [120, 175, 235, 255],   // 2  SKY_HI
  [255, 255, 255, 255],   // 3  FLAG
  [225, 220, 200, 255],   // 4  FLAG_SH
  [139, 105, 20,  255],   // 5  WOOD_L     (mástil)
  [92,  74,  30,  255],   // 6  WOOD_D
  [225, 145, 85,  255],   // 7  STONE_L    (puente, piedra cálida)
  [180, 100, 55,  255],   // 8  STONE_M
  [130, 70,  40,  255],   // 9  STONE_D
  [55,  55,  65,  255],   // 10 RAIL       (barandilla de hierro)
  [70,  140, 185, 255],   // 11 WATER_L
  [40,  100, 155, 255],   // 12 WATER_M
  [25,  70,  115, 255],   // 13 WATER_D
  [20,  20,  30,  255],   // 14 OUTLINE
]

const I = {
  TR: 0, SKY: 1, SKY_HI: 2,
  FLAG: 3, FLAG_SH: 4,
  WOOD_L: 5, WOOD_D: 6,
  STONE_L: 7, STONE_M: 8, STONE_D: 9,
  RAIL: 10,
  WATER_L: 11, WATER_M: 12, WATER_D: 13,
  OL: 14,
}

// ─── Canvas 64×64 ────────────────────────────────────────────────────────
const W = 64, H = 64
const buf = new Uint8Array(W * H)

const setPx = (x, y, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  buf[y * W + x] = id
}
const fill = (x, y, w, h, id) => {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, id)
}

// ─── Composición ─────────────────────────────────────────────────────────

// 1. Cielo
fill(0, 0, W, H, I.SKY)
fill(0, 0, W, 8, I.SKY_HI)

// 2. Agua (parte inferior del icono)
const WATER_TOP = 46
fill(0, WATER_TOP,     W, 2, I.WATER_M)
fill(0, WATER_TOP + 2, W, H - WATER_TOP - 2, I.WATER_D)
// Ondas/brillos en el agua
for (let y = WATER_TOP + 3; y < H; y += 3) {
  for (let x = 1; x < W; x += 5) {
    setPx(x, y, I.WATER_L)
    setPx(x + 1, y, I.WATER_L)
  }
}
// Reflejo central de los arcos del puente
for (let y = WATER_TOP + 1; y < WATER_TOP + 4; y++) {
  for (let x = 18; x < 46; x += 2) setPx(x, y, I.WATER_M)
}

// 3. Puente — 3 arcos icónicos (Puente de Isabel II)
const BRIDGE_X0 = 4, BRIDGE_X1 = 60     // x=4..59 (56 wide)
const DECK_Y = 28                        // arriba de la barandilla
const BASE_Y = 46                        // donde el puente toca el agua

// Cuerpo del puente (piedra cálida)
fill(BRIDGE_X0, DECK_Y + 2, BRIDGE_X1 - BRIDGE_X0, BASE_Y - DECK_Y - 2, I.STONE_L)
// Sombra inferior (banda oscura justo encima del agua)
fill(BRIDGE_X0, BASE_Y - 2, BRIDGE_X1 - BRIDGE_X0, 2, I.STONE_M)
// Línea más oscura tocando el agua
for (let x = BRIDGE_X0; x < BRIDGE_X1; x++) setPx(x, BASE_Y - 1, I.STONE_D)

// Barandilla / deck del puente (hierro oscuro)
fill(BRIDGE_X0, DECK_Y,     BRIDGE_X1 - BRIDGE_X0, 1, I.OL)
fill(BRIDGE_X0, DECK_Y + 1, BRIDGE_X1 - BRIDGE_X0, 1, I.RAIL)
// Pequeñas verticales de la barandilla (postes)
for (let x = BRIDGE_X0 + 2; x < BRIDGE_X1; x += 4) {
  setPx(x, DECK_Y - 1, I.RAIL)
}

// 3 arcos cortados en el cuerpo del puente
// Distribución: pillar(5) - arco(12) - pillar(5) - arco(12) - pillar(5) - arco(12) - pillar(5) = 56
// x: 4..8 | 9..20 | 21..25 | 26..37 | 38..42 | 43..54 | 55..59
const archXs = [9, 26, 43]
const ARCH_W = 12
const ARCH_TOP = 32         // donde empieza la curva superior del arco
const ARCH_BOTTOM = BASE_Y - 2  // 44

// Cortar arco: semicírculo arriba + rectángulo debajo (revela cielo)
function cutArch(x0) {
  // Semicírculo (4 filas estrechándose hacia arriba)
  const widths = [6, 8, 10, 12]
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i]
    const offset = (ARCH_W - w) / 2
    for (let x = x0 + offset; x < x0 + offset + w; x++) {
      setPx(x, ARCH_TOP + i, I.SKY)
    }
  }
  // Cuerpo vertical del arco
  for (let y = ARCH_TOP + widths.length; y <= ARCH_BOTTOM; y++) {
    for (let x = x0; x < x0 + ARCH_W; x++) {
      setPx(x, y, I.SKY)
    }
  }
  // Outline del arco (borde negro alrededor de la curva)
  // Curva superior
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i]
    const offset = (ARCH_W - w) / 2
    setPx(x0 + offset - 1, ARCH_TOP + i, I.OL)
    setPx(x0 + offset + w, ARCH_TOP + i, I.OL)
  }
  // Top de la curva
  for (let x = x0 + (ARCH_W - widths[0]) / 2; x < x0 + (ARCH_W - widths[0]) / 2 + widths[0]; x++) {
    setPx(x, ARCH_TOP - 1, I.OL)
  }
  // Laterales del arco (verticales)
  for (let y = ARCH_TOP + widths.length; y <= ARCH_BOTTOM; y++) {
    setPx(x0 - 1, y, I.OL)
    setPx(x0 + ARCH_W, y, I.OL)
  }
  // Sombra suave dentro del arco (justo bajo la curva, lado izquierdo)
  for (let i = 1; i < 3; i++) {
    setPx(x0 + ((ARCH_W - widths[i]) / 2), ARCH_TOP + i + 1, I.STONE_M)
  }
}
archXs.forEach(cutArch)

// 4. Pequeños círculos decorativos en los pilares (icónicos del puente real)
// Pilares en x: 4..8, 21..25, 38..42, 55..59 — centros en 6, 23, 40, 57
function ornament(cx) {
  const cy = 37
  // Círculo 3×3
  setPx(cx, cy - 1, I.OL)
  setPx(cx - 1, cy, I.OL)
  setPx(cx + 1, cy, I.OL)
  setPx(cx, cy + 1, I.OL)
  setPx(cx, cy, I.SKY)  // hueco que deja ver el cielo
}
ornament(23)
ornament(40)

// 5. Mástil de la bandera — centrado en el deck del puente, vertical
const POLE_X = 31
for (let y = 7; y < DECK_Y; y++) {
  setPx(POLE_X,     y, I.WOOD_L)
  setPx(POLE_X + 1, y, I.WOOD_D)
}
// Outline del mástil
for (let y = 6; y < DECK_Y; y++) {
  setPx(POLE_X - 1, y, I.OL)
  setPx(POLE_X + 2, y, I.OL)
}
setPx(POLE_X,     6, I.OL)
setPx(POLE_X + 1, 6, I.OL)

// 6. Bandera blanca rectangular ondeando a la derecha
const FLAG_LEFT = POLE_X + 2  // 33
const FLAG_TOP = 8
const flagRows = [
  { dy: 0, w: 13 },
  { dy: 1, w: 14 },
  { dy: 2, w: 15 },
  { dy: 3, w: 14 },
  { dy: 4, w: 15 },
  { dy: 5, w: 14 },
  { dy: 6, w: 13 },
  { dy: 7, w: 12 },
]
for (const r of flagRows) {
  for (let x = FLAG_LEFT; x < FLAG_LEFT + r.w; x++) {
    if (x >= W) break
    setPx(x, FLAG_TOP + r.dy, I.FLAG)
  }
  setPx(FLAG_LEFT + r.w, FLAG_TOP + r.dy, I.OL)
}
// Bordes superior e inferior
for (let x = FLAG_LEFT; x < FLAG_LEFT + 13; x++) setPx(x, FLAG_TOP - 1, I.OL)
for (let x = FLAG_LEFT; x < FLAG_LEFT + 12; x++) setPx(x, FLAG_TOP + 8, I.OL)
// Pliegue / sombra interior
for (let x = FLAG_LEFT; x < FLAG_LEFT + 11; x++) setPx(x, FLAG_TOP + 7, I.FLAG_SH)
for (let x = FLAG_LEFT + 6; x < FLAG_LEFT + 13; x++) setPx(x, FLAG_TOP + 4, I.FLAG_SH)

// ─── CRC32 ───────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()
const crc32 = (bytes) => {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// ─── Encoder PNG ─────────────────────────────────────────────────────────
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const encodePNG = (width, height, indices, palette) => {
  const rowBytes = width * 4
  const raw = Buffer.alloc(height * (1 + rowBytes))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + rowBytes)] = 0
    for (let x = 0; x < width; x++) {
      const c = palette[indices[y * width + x]]
      const off = y * (1 + rowBytes) + 1 + x * 4
      raw[off] = c[0]; raw[off + 1] = c[1]; raw[off + 2] = c[2]; raw[off + 3] = c[3]
    }
  }
  const compressed = deflateSync(raw, { level: 9 })

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// ─── Upscale nearest-neighbor ────────────────────────────────────────────
const upscaleNearest = (src, srcW, srcH, dstW, dstH) => {
  const dst = new Uint8Array(dstW * dstH)
  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.floor(dy * srcH / dstH)
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.floor(dx * srcW / dstW)
      dst[dy * dstW + dx] = src[sy * srcW + sx]
    }
  }
  return dst
}

// ─── Output ──────────────────────────────────────────────────────────────
const outDir = resolve(PROJECT_ROOT, 'public/assets/store')
mkdirSync(outDir, { recursive: true })

const draftSizes = [1024, 256, 180, 64, 60]
for (const size of draftSizes) {
  const scaled = upscaleNearest(buf, W, H, size, size)
  writeFileSync(resolve(outDir, `draft-${size}.png`), encodePNG(size, size, scaled, PAL))
}

console.log(`OK — ${draftSizes.length} borradores en ${outDir}`)
