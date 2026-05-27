// Genera la imagen de cabecera de Google Play (feature graphic, 1024×500).
// Composición: recorte panorámico de fondoIntro1024b + flamenca saltando a la
// derecha (lado izquierdo) + trianero saltando a la izquierda (lado derecho,
// sprite espejado) + texto "La Cucaña" en rojo con outline negro al centro.
//
// Uso:  node scripts/build-feature-graphic.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync, deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

const BG_PATH        = '/Users/luisao/Desktop/fondoIntro1024b.png'
const TRIANERO_PATH  = resolve(PROJECT_ROOT, 'public/assets/sprites/characters/spritesheet/feriante.png')
const FLAMENCA_PATH  = resolve(PROJECT_ROOT, 'public/assets/sprites/characters/spritesheet/flamenca.png')
const OUT_PATH       = resolve(PROJECT_ROOT, 'public/assets/store/feature-graphic-1024x500.png')

const W = 1024, H = 500
const FRAME_W = 16, FRAME_H = 24
const JUMP_FRAME = 2   // según spriteConfig.js

// ─── PNG decode/encode ───────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────
function extractFrame(sprite, frameIdx) {
  const buf = Buffer.alloc(FRAME_W * FRAME_H * 4)
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const sOff = (y * sprite.width + (frameIdx * FRAME_W + x)) * 4
      const dOff = (y * FRAME_W + x) * 4
      buf[dOff]     = sprite.pixels[sOff]
      buf[dOff + 1] = sprite.pixels[sOff + 1]
      buf[dOff + 2] = sprite.pixels[sOff + 2]
      buf[dOff + 3] = sprite.pixels[sOff + 3]
    }
  }
  return buf
}

function mirrorH(buf, w, h) {
  const out = Buffer.alloc(buf.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sOff = (y * w + x) * 4
      const dOff = (y * w + (w - 1 - x)) * 4
      out[dOff]     = buf[sOff]
      out[dOff + 1] = buf[sOff + 1]
      out[dOff + 2] = buf[sOff + 2]
      out[dOff + 3] = buf[sOff + 3]
    }
  }
  return out
}

function scaleNN(buf, w, h, scale) {
  const sw = w * scale, sh = h * scale
  const out = Buffer.alloc(sw * sh * 4)
  for (let dy = 0; dy < sh; dy++) {
    const sy = Math.floor(dy / scale)
    for (let dx = 0; dx < sw; dx++) {
      const sx = Math.floor(dx / scale)
      const sOff = (sy * w + sx) * 4
      const dOff = (dy * sw + dx) * 4
      out[dOff]     = buf[sOff]
      out[dOff + 1] = buf[sOff + 1]
      out[dOff + 2] = buf[sOff + 2]
      out[dOff + 3] = buf[sOff + 3]
    }
  }
  return { buf: out, w: sw, h: sh }
}

function composite(canvas, cW, cH, sprite, sW, sH, x, y) {
  for (let py = 0; py < sH; py++) {
    for (let px = 0; px < sW; px++) {
      const sOff = (py * sW + px) * 4
      const alpha = sprite[sOff + 3]
      if (alpha === 0) continue
      const dx = x + px, dy = y + py
      if (dx < 0 || dx >= cW || dy < 0 || dy >= cH) continue
      const cOff = (dy * cW + dx) * 4
      if (alpha === 255) {
        canvas[cOff]     = sprite[sOff]
        canvas[cOff + 1] = sprite[sOff + 1]
        canvas[cOff + 2] = sprite[sOff + 2]
        canvas[cOff + 3] = 255
      } else {
        const a = alpha / 255
        canvas[cOff]     = Math.round(sprite[sOff]     * a + canvas[cOff]     * (1 - a))
        canvas[cOff + 1] = Math.round(sprite[sOff + 1] * a + canvas[cOff + 1] * (1 - a))
        canvas[cOff + 2] = Math.round(sprite[sOff + 2] * a + canvas[cOff + 2] * (1 - a))
        canvas[cOff + 3] = 255
      }
    }
  }
}

// ─── Bitmap font 5×7 (mismo que el icono) ────────────────────────────────
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

function drawText(canvas, cW, cH, text, cx, cy, scale, rgba) {
  const charW = (FONT_W + 1) * scale
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
        // pintar bloque scale×scale
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const x = px + dx, y = py + dy
            if (x < 0 || x >= cW || y < 0 || y >= cH) continue
            const off = (y * cW + x) * 4
            canvas[off]     = rgba[0]
            canvas[off + 1] = rgba[1]
            canvas[off + 2] = rgba[2]
            canvas[off + 3] = 255
          }
        }
      }
    }
  }
}

// ─── Composición ─────────────────────────────────────────────────────────

// 1. Fondo: recorte panorámico 1024×500 del fondoIntro1024b
const bg = decodePNG(readFileSync(BG_PATH))
const CROP_Y = 80
const canvas = Buffer.alloc(W * H * 4)
for (let y = 0; y < H; y++) {
  const srcRow = (CROP_Y + y) * bg.width * 4
  bg.pixels.copy(canvas, y * W * 4, srcRow, srcRow + W * 4)
}

// 2. Sprites
const trianeroSheet = decodePNG(readFileSync(TRIANERO_PATH))
const flamencaSheet = decodePNG(readFileSync(FLAMENCA_PATH))

const SCALE = 11   // ×11 → 176×264 (cabe en 500 con margen)
const SW = FRAME_W * SCALE
const SH = FRAME_H * SCALE
const MARGIN_BOTTOM = 30

const INNER_OFFSET = 140   // distancia desde el borde lateral hacia dentro

// Flamenca a la IZQUIERDA mirando a la DERECHA (hacia el centro → sprite espejado)
const flamFrame = extractFrame(flamencaSheet, JUMP_FRAME)
const flamMirror = mirrorH(flamFrame, FRAME_W, FRAME_H)
const flam = scaleNN(flamMirror, FRAME_W, FRAME_H, SCALE)
composite(canvas, W, H, flam.buf, flam.w, flam.h, INNER_OFFSET, H - SH - MARGIN_BOTTOM)

// Feriante (trianero) a la DERECHA mirando a la IZQUIERDA (hacia el centro → sprite por defecto)
const triFrame = extractFrame(trianeroSheet, JUMP_FRAME)
const tri = scaleNN(triFrame, FRAME_W, FRAME_H, SCALE)
composite(canvas, W, H, tri.buf, tri.w, tri.h, W - SW - INNER_OFFSET, H - SH - MARGIN_BOTTOM)

// 3. Texto "La Cucaña" centrado en rojo con outline negro
const TEXT = 'La Cucaña'
const TEXT_SCALE = 11
const TEXT_CX = W / 2
const TEXT_CY = 110   // tercio superior, encima de los sprites

const RED     = [220, 40,  35]
const RED_DK  = [140, 25,  20]
const OUTLINE = [20,  20,  30]

// Outline 8 direcciones
const offsets = [
  [-TEXT_SCALE, 0], [TEXT_SCALE, 0], [0, -TEXT_SCALE], [0, TEXT_SCALE],
  [-TEXT_SCALE, -TEXT_SCALE], [TEXT_SCALE, -TEXT_SCALE],
  [-TEXT_SCALE, TEXT_SCALE], [TEXT_SCALE, TEXT_SCALE],
]
for (const [dx, dy] of offsets) {
  drawText(canvas, W, H, TEXT, TEXT_CX + dx, TEXT_CY + dy, TEXT_SCALE, OUTLINE)
}
// Sombra de profundidad
drawText(canvas, W, H, TEXT, TEXT_CX + 4, TEXT_CY + 4, TEXT_SCALE, RED_DK)
// Texto principal
drawText(canvas, W, H, TEXT, TEXT_CX, TEXT_CY, TEXT_SCALE, RED)

// ─── Output ──────────────────────────────────────────────────────────────
mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, encodePNG(W, H, canvas))
console.log(`OK — ${OUT_PATH}`)
console.log(`Sprites ×${SCALE} (${SW}×${SH}), texto escala ${TEXT_SCALE}`)
