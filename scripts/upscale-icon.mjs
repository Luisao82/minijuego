// Lee un PNG (8-bit RGBA) y lo escala con nearest-neighbor a los tamaños
// objetivo. Útil para previsualizar un diseño pixel art a 1024×1024 antes
// de generar la batería completa de tiendas.
//
// Uso:  node scripts/upscale-icon.mjs <input.png>
// Salida: public/assets/store/preview-{1024,512,256,180,60}.png

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync, deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// ─── Decoder PNG mínimo (8-bit RGBA, colorType 6) ────────────────────────
function decodePNG(buffer) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== sig[i]) throw new Error('No es un PNG')
  }

  let offset = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0
  const idatChunks = []

  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + len)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 8 + len + 4
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`PNG no soportado: bitDepth=${bitDepth}, colorType=${colorType}. Esperado: 8-bit RGBA.`)
  }

  const bpp = 4
  const stride = width * bpp
  const inflated = inflateSync(Buffer.concat(idatChunks))
  const pixels = Buffer.alloc(width * height * bpp)

  for (let y = 0; y < height; y++) {
    const inOff = y * (1 + stride)
    const outOff = y * stride
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
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          const pred = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
          recon = (f + pred) & 0xff
          break
        }
        default: throw new Error(`Filtro desconocido: ${filter}`)
      }
      pixels[outOff + x] = recon
    }
  }
  return { width, height, pixels }
}

// ─── Nearest-neighbor scale (cualquier ratio) ────────────────────────────
function scaleRGBA(src, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4)
  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.floor(dy * srcH / dstH)
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.floor(dx * srcW / dstW)
      const sOff = (sy * srcW + sx) * 4
      const dOff = (dy * dstW + dx) * 4
      dst[dOff] = src[sOff]
      dst[dOff + 1] = src[sOff + 1]
      dst[dOff + 2] = src[sOff + 2]
      dst[dOff + 3] = src[sOff + 3]
    }
  }
  return dst
}

// ─── Encoder PNG ─────────────────────────────────────────────────────────
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
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
function encodePNG(width, height, rgba) {
  const rowBytes = width * 4
  const raw = Buffer.alloc(height * (1 + rowBytes))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + rowBytes)] = 0
    rgba.copy(raw, y * (1 + rowBytes) + 1, y * rowBytes, (y + 1) * rowBytes)
  }
  const compressed = deflateSync(raw, { level: 9 })
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// ─── Main ────────────────────────────────────────────────────────────────
const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Uso: node scripts/upscale-icon.mjs <input.png>')
  process.exit(1)
}

const input = readFileSync(inputPath)
const src = decodePNG(input)
console.log(`Cargado ${inputPath}: ${src.width}×${src.height}`)

const outDir = resolve(PROJECT_ROOT, 'public/assets/store')
mkdirSync(outDir, { recursive: true })

const targets = [1024, 512, 256, 180, 60]
for (const sz of targets) {
  const scaled = scaleRGBA(src.pixels, src.width, src.height, sz, sz)
  const outPath = resolve(outDir, `preview-${sz}.png`)
  writeFileSync(outPath, encodePNG(sz, sz, scaled))
  const mult = sz / src.width
  const clean = Number.isInteger(mult) ? `×${mult} (limpio)` : `×${mult.toFixed(2)} (irregular)`
  console.log(`  preview-${sz}.png  ${clean}`)
}
