// Toma un master 1024×1024 y genera la batería completa de derivados
// (iOS, Android, PWA, favicon) usando sips. NO modifica el contenido.
// Pensado para cuando ya tienes el icono diseñado y compuesto.
//
// Uso:  node scripts/build-icon-sizes.mjs <input1024.png>
//       node scripts/build-icon-sizes.mjs               (usa el master actual)

import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const STORE_DIR = resolve(PROJECT_ROOT, 'public/assets/store')
const MASTER_PATH = resolve(STORE_DIR, 'icon-1024.png')

const inputPath = process.argv[2]

// Si el usuario pasa un fichero externo, lo copiamos como nuevo master
if (inputPath) {
  if (!existsSync(inputPath)) {
    console.error(`No existe: ${inputPath}`)
    process.exit(1)
  }
  mkdirSync(STORE_DIR, { recursive: true })
  copyFileSync(inputPath, MASTER_PATH)
  console.log(`Master actualizado desde ${inputPath}`)
}

if (!existsSync(MASTER_PATH)) {
  console.error(`No hay master en ${MASTER_PATH}. Pásalo como argumento.`)
  process.exit(1)
}

// Verificar dimensiones del master
const dims = execSync(`sips -g pixelWidth -g pixelHeight "${MASTER_PATH}"`).toString()
const mW = parseInt(dims.match(/pixelWidth: (\d+)/)[1])
const mH = parseInt(dims.match(/pixelHeight: (\d+)/)[1])
if (mW !== 1024 || mH !== 1024) {
  console.warn(`⚠ Master es ${mW}×${mH}, esperado 1024×1024 — sigo de todos modos.`)
}

// Batería de derivados
const targets = {
  ios:     [1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20],
  android: [512, 192, 144, 96, 72, 48, 36],
  pwa:     [512, 384, 192, 180, 152, 144, 128, 96],
  favicon: [32, 16],
}

let total = 0
for (const [platform, sizes] of Object.entries(targets)) {
  const dir = resolve(STORE_DIR, 'icons', platform)
  mkdirSync(dir, { recursive: true })
  for (const sz of sizes) {
    const prefix = platform === 'favicon' ? 'favicon' : 'icon'
    const out = resolve(dir, `${prefix}-${sz}.png`)
    execSync(`sips -Z ${sz} "${MASTER_PATH}" --out "${out}"`, { stdio: 'pipe' })
    total++
  }
  console.log(`  ${platform.padEnd(8)} ${sizes.length} tamaños`)
}

// Sustituir el favicon.png raíz por la versión 32×32
copyFileSync(resolve(STORE_DIR, 'icons/favicon/favicon-32.png'),
             resolve(PROJECT_ROOT, 'public/favicon.png'))
console.log(`\nFavicon raíz actualizado (public/favicon.png ← favicon-32.png)`)
console.log(`Total: ${total} archivos generados.`)
