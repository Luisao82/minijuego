// Procesa las capturas del juego en /Users/luisao/Desktop/pantallazos/
// y las reformatea con letterbox negro centrado para cada formato de tienda:
//   • iPhone 6.7" landscape (App Store) — 2796×1290
//   • iPad Pro 13" landscape (App Store) — 2752×2064
//   • Google Play / PWA 16:9 — 1920×1080
//
// Uso:  node scripts/build-screenshots.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync, deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

const INPUT_DIR  = '/Users/luisao/Desktop/pantallazos'
const OUTPUT_BASE = resolve(PROJECT_ROOT, 'public/assets/store/screenshots')
const TMP_DIR     = '/tmp/cucana-shots-tmp'

const TARGETS = [
  { name: 'iphone-6.7', width: 2796, height: 1290, desc: 'iPhone 6.7" landscape (App Store, REQUIRED)' },
  { name: 'ipad-13',    width: 2752, height: 2064, desc: 'iPad Pro 13" landscape (App Store)' },
  { name: 'play-pwa',   width: 1920, height: 1080, desc: 'Google Play 16:9 + PWA wide' },
]

// Orden recomendado para tiendas (primero el hook visual)
const ORDER = ['intro', 'juego', 'seleccion', 'premio', 'tutorial']

// ─── PNG decoder/encoder (mismo que upscale-icon.mjs) ────────────────────
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
        default: throw new Error(`Filtro desconocido: ${filter}`)
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

// ─── Composite ───────────────────────────────────────────────────────────
function blackCanvas(w, h) {
  const buf = Buffer.alloc(w * h * 4)
  for (let i = 3; i < buf.length; i += 4) buf[i] = 255
  return buf
}

function pasteCenter(dst, dW, dH, src, sW, sH) {
  const offX = Math.floor((dW - sW) / 2)
  const offY = Math.floor((dH - sH) / 2)
  for (let y = 0; y < sH; y++) {
    const dRow = (offY + y) * dW * 4 + offX * 4
    const sRow = y * sW * 4
    src.copy(dst, dRow, sRow, sRow + sW * 4)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────
mkdirSync(TMP_DIR, { recursive: true })

const screens = readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.png'))
console.log(`Capturas encontradas: ${screens.length}`)
console.log(`  ${screens.join(', ')}`)

// Aplicar orden recomendado
const orderedNames = ORDER.map(n => `${n}.png`).filter(f => screens.includes(f))
const remaining = screens.filter(f => !orderedNames.includes(f))
const finalOrder = [...orderedNames, ...remaining]

let totalGenerated = 0
for (const target of TARGETS) {
  const outDir = resolve(OUTPUT_BASE, target.name)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n→ ${target.desc}`)

  finalOrder.forEach((file, i) => {
    const inPath = resolve(INPUT_DIR, file)
    const baseName = file.replace(/\.png$/i, '')

    // Obtener dimensiones de la fuente
    const dims = execSync(`sips -g pixelWidth -g pixelHeight "${inPath}"`).toString()
    const sW = parseInt(dims.match(/pixelWidth: (\d+)/)[1])
    const sH = parseInt(dims.match(/pixelHeight: (\d+)/)[1])

    // Calcular dimensiones de ajuste manteniendo aspect ratio
    const targetRatio = target.width / target.height
    const sourceRatio = sW / sH
    let fitW, fitH, bars
    if (sourceRatio > targetRatio) {
      fitW = target.width
      fitH = Math.round(target.width / sourceRatio)
      bars = 'arriba/abajo'
    } else {
      fitH = target.height
      fitW = Math.round(target.height * sourceRatio)
      bars = 'izda/dcha'
    }

    // Redimensionar con sips (bilinear de buena calidad)
    const tmpPath = resolve(TMP_DIR, `${target.name}-${file}`)
    execSync(`sips -z ${fitH} ${fitW} "${inPath}" --out "${tmpPath}"`, { stdio: 'pipe' })

    // Componer sobre lienzo negro centrado
    const resized = decodePNG(readFileSync(tmpPath))
    const canvas = blackCanvas(target.width, target.height)
    pasteCenter(canvas, target.width, target.height, resized.pixels, resized.width, resized.height)

    const n = String(i + 1).padStart(2, '0')
    const outPath = resolve(outDir, `${n}-${baseName}.png`)
    writeFileSync(outPath, encodePNG(target.width, target.height, canvas))
    totalGenerated++

    const barInfo = (sourceRatio === targetRatio) ? 'sin bandas' : `bandas ${bars}`
    console.log(`  ${n}-${baseName}.png  → ${fitW}×${fitH} en ${target.width}×${target.height} (${barInfo})`)
  })
}

console.log(`\nListo. ${totalGenerated} archivos generados en ${OUTPUT_BASE}`)
