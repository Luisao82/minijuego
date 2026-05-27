// Toma el icono master 1024×1024 y le superpone una bandera blanca centrada
// con el texto "La Cucaña" en rojo. Después regenera toda la batería de
// tamaños iOS / Android / PWA / favicon.
//
// Uso:  node scripts/add-flag-text.mjs <input1024.png>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync, deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// ─── Decoder/Encoder PNG (mismos que upscale-icon.mjs) ───────────────────
function decodePNG(buffer) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) if (buffer[i] !== sig[i]) throw new Error('No es PNG')
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    offset += 8 + len + 4
  }
  if (bitDepth !== 8 || colorType !== 6) throw new Error(`PNG no soportado: ${bitDepth}/${colorType}`)
  const bpp = 4, stride = width * bpp
  const inflated = inflateSync(Buffer.concat(idat))
  const pixels = Buffer.alloc(width * height * bpp)
  for (let y = 0; y < height; y++) {
    const inOff = y * (1 + stride), outOff = y * stride
    const filter = inflated[inOff]
    for (let x = 0; x < stride; x++) {
      const f = inflated[inOff + 1 + x]
      const a = x >= bpp ? pixels[outOff + x - bpp] : 0
      const b = y > 0 ? pixels[outOff - stride + x] : 0
      const c = (x >= bpp && y > 0) ? pixels[outOff - stride + x - bpp] : 0
      let recon
      switch (filter) {
        case 0: recon = f; break
        case 1: recon = (f + a) & 0xff; break
        case 2: recon = (f + b) & 0xff; break
        case 3: recon = (f + ((a + b) >> 1)) & 0xff; break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          const pred = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
          recon = (f + pred) & 0xff
          break
        }
        default: throw new Error(`Filtro: ${filter}`)
      }
      pixels[outOff + x] = recon
    }
  }
  return { width, height, pixels }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()
const crc32 = (b) => {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, c])
}
function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc(height * (1 + stride))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + stride)] = 0
    rgba.copy(raw, y * (1 + stride) + 1, y * stride, (y + 1) * stride)
  }
  const z = deflateSync(raw, { level: 9 })
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', z), chunk('IEND', Buffer.alloc(0))])
}

// ─── Bitmap font 5×7 (solo las letras necesarias) ────────────────────────
const FONT = {
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'a': ['.....', '.....', '####.', '....#', '.####', '#...#', '.####'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  'u': ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####'],
  'c': ['.....', '.....', '.####', '#....', '#....', '#....', '.####'],
  'ñ': ['.###.', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
}
const FONT_W = 5, FONT_H = 7

// ─── Helpers de pintura ──────────────────────────────────────────────────
function makeCanvas(width, height, src) {
  const pixels = Buffer.from(src.pixels)
  const setPx = (x, y, rgba) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const o = (y * width + x) * 4
    pixels[o] = rgba[0]; pixels[o + 1] = rgba[1]; pixels[o + 2] = rgba[2]; pixels[o + 3] = rgba[3]
  }
  const fillRect = (x, y, w, h, rgba) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPx(xx, yy, rgba)
  }
  const drawBorder = (x, y, w, h, thick, rgba) => {
    fillRect(x, y, w, thick, rgba)
    fillRect(x, y + h - thick, w, thick, rgba)
    fillRect(x, y, thick, h, rgba)
    fillRect(x + w - thick, y, thick, h, rgba)
  }
  const drawText = (text, cx, cy, scale, rgba) => {
    const charW = (FONT_W + 1) * scale       // 5 + 1 espaciado
    const totalW = text.length * charW - scale
    const totalH = FONT_H * scale
    const startX = Math.round(cx - totalW / 2)
    const startY = Math.round(cy - totalH / 2)
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const glyph = FONT[ch]
      if (!glyph) continue
      for (let gy = 0; gy < FONT_H; gy++) {
        for (let gx = 0; gx < FONT_W; gx++) {
          if (glyph[gy][gx] !== '#') continue
          const px = startX + i * charW + gx * scale
          const py = startY + gy * scale
          fillRect(px, py, scale, scale, rgba)
        }
      }
    }
  }
  return { pixels, setPx, fillRect, drawBorder, drawText }
}

// ─── Main: superponer texto al lado de la bandera ya existente ───────────
const inputPath = process.argv[2] || resolve(PROJECT_ROOT, 'public/assets/store/icon-1024.png')
const src = decodePNG(readFileSync(inputPath))
console.log(`Cargado ${inputPath}: ${src.width}×${src.height}`)

const W = src.width, H = src.height
const canvas = makeCanvas(W, H, src)

const RED     = [200, 40,  35, 255]
const RED_DK  = [120, 20,  15, 255]
const OUTLINE = [20,  20,  30, 255]

// Texto "La Cucaña" — a la derecha de la bandera, en el cielo
const TEXT = 'La Cucaña'
// La bandera está aprox en x=70..310, y=80..200. Centramos el texto
// a la derecha del centro vertical de la bandera.
const TEXT_CX = 660            // centro horizontal a la derecha de la bandera
const TEXT_CY = 145            // alineado vertical con la bandera

// Escala: caben hasta (W - margenes) / (chars × 6). Quiero algo legible
// pero que no domine. Pruebo 12 (chars de 60×84 px).
const scale = 12

// Outline negro (8 direcciones) + relleno rojo
const offsets = [
  [-scale, 0], [scale, 0], [0, -scale], [0, scale],
  [-scale, -scale], [scale, -scale], [-scale, scale], [scale, scale],
]
for (const [dx, dy] of offsets) {
  canvas.drawText(TEXT, TEXT_CX + dx, TEXT_CY + dy, scale, OUTLINE)
}
canvas.drawText(TEXT, TEXT_CX, TEXT_CY, scale, RED)
// Sombra interna leve para dar volumen
canvas.drawText(TEXT, TEXT_CX + Math.floor(scale / 3), TEXT_CY + Math.floor(scale / 3), scale, RED_DK)
canvas.drawText(TEXT, TEXT_CX, TEXT_CY, scale, RED)

console.log(`Texto escala = ${scale}, centro = (${TEXT_CX}, ${TEXT_CY})`)

// Guardar el nuevo master
const outDir = resolve(PROJECT_ROOT, 'public/assets/store')
mkdirSync(outDir, { recursive: true })
const masterPath = resolve(outDir, 'icon-1024.png')
writeFileSync(masterPath, encodePNG(W, H, canvas.pixels))
console.log(`Master actualizado: ${masterPath}`)

// ─── Regenerar batería de derivados con sips ─────────────────────────────
const targets = {
  ios:     [1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20],
  android: [512, 192, 144, 96, 72, 48, 36],
  pwa:     [512, 384, 192, 180, 152, 144, 128, 96],
  favicon: [32, 16],
}
for (const [platform, sizes] of Object.entries(targets)) {
  const dir = resolve(outDir, 'icons', platform)
  mkdirSync(dir, { recursive: true })
  for (const sz of sizes) {
    const prefix = platform === 'favicon' ? 'favicon' : 'icon'
    const out = resolve(dir, `${prefix}-${sz}.png`)
    execSync(`sips -Z ${sz} "${masterPath}" --out "${out}"`, { stdio: 'pipe' })
  }
  console.log(`  ${platform}: ${sizes.length} archivos`)
}
console.log('Listo.')
