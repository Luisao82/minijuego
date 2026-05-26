// ShareableCard — genera una imagen 1080×1080 lista para compartir.
//
// Compone off-screen sobre un <canvas> 2D:
//   ┌──────────────────────────────────────┐
//   │   LA CUCAÑA TRIANERA   (título)     │
//   │   ¡NUEVO PREMIO!       (subtítulo)  │
//   ├──────────────────────────────────────┤
//   │                                      │
//   │     [imagen grande del premio]       │
//   │              NOMBRE                  │
//   │              x3                      │  (solo premios)
//   │                                      │
//   ├──────────────────────────────────────┤
//   │       https://cucanatrianera.com     │  (solo si GAME_URL no vacío)
//   └──────────────────────────────────────┘

import { GAME_URL, SHARE_BRANDING, SHARE_IMAGE_SIZE } from '../config/shareConfig'

const SIZE = SHARE_IMAGE_SIZE
const PAD  = 60

const COLORS = {
  bg:        '#1a1a2e',
  panel:     '#16213e',
  gold:      '#ffd700',
  goldSoft:  'rgba(255, 215, 0, 0.3)',
  text:      '#ffd700',
  textSoft:  '#fff8dc',
  shadow:    '#000000',
}

// Espera a que las fuentes web estén cargadas (Press Start 2P / Jersey 10).
async function ensureFontsReady() {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch { /* ignore */ }
  }
}

// Obtiene la imagen fuente de una textura de Phaser. Funciona tanto para
// imágenes simples como para spritesheets (devuelve la imagen completa y
// las coordenadas del frame para recortar).
function getSourceImage(scene, textureKey, frameIndex = 0) {
  if (!scene.textures.exists(textureKey)) return null
  const tex = scene.textures.get(textureKey)
  if (tex.key === '__MISSING') return null

  const frame = tex.frames[frameIndex] || tex.get(frameIndex) || tex.get('__BASE')
  if (!frame) return null

  return {
    image: frame.source.image,
    sx: frame.cutX,
    sy: frame.cutY,
    sw: frame.cutWidth,
    sh: frame.cutHeight,
  }
}

function drawHeader(ctx, subtitleKey) {
  const title    = SHARE_BRANDING.TITLE
  const subtitle = SHARE_BRANDING.SUBTITLE[subtitleKey] ?? ''

  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 52px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.shadowColor = COLORS.shadow
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 4
  ctx.shadowOffsetY = 4
  ctx.fillText(title, SIZE / 2, PAD + 10)

  ctx.font = 'bold 36px "Press Start 2P", monospace'
  ctx.fillStyle = COLORS.textSoft
  ctx.fillText(subtitle, SIZE / 2, PAD + 90)

  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Línea separadora dorada
  const lineY = PAD + 165
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(PAD, lineY, SIZE - PAD * 2, 4)
}

function drawFooter(ctx) {
  if (!GAME_URL) return
  const y = SIZE - PAD - 30

  ctx.fillStyle = COLORS.gold
  ctx.fillRect(PAD, y - 30, SIZE - PAD * 2, 4)

  ctx.font = 'bold 28px "Press Start 2P", monospace'
  ctx.fillStyle = COLORS.textSoft
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(GAME_URL, SIZE / 2, y)
}

function drawCardBody(ctx, { name, count, source }) {
  const cardX = PAD
  const cardW = SIZE - PAD * 2
  const cardY = PAD + 200
  const cardH = SIZE - cardY - PAD - (GAME_URL ? 80 : 0)

  // Panel interno con marco dorado
  ctx.fillStyle = COLORS.panel
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.lineWidth = 6
  ctx.strokeStyle = COLORS.gold
  ctx.strokeRect(cardX, cardY, cardW, cardH)
  ctx.lineWidth = 2
  ctx.strokeStyle = COLORS.goldSoft
  ctx.strokeRect(cardX + 10, cardY + 10, cardW - 20, cardH - 20)

  // Imagen grande centrada (respeta aspect ratio del sprite/imagen original)
  const imgBox = Math.min(cardW - 120, cardH - 200)
  const imgY = cardY + 50

  if (source) {
    const aspect = source.sw / source.sh
    let drawW, drawH
    if (aspect >= 1) {
      drawW = imgBox
      drawH = Math.round(imgBox / aspect)
    } else {
      drawH = imgBox
      drawW = Math.round(imgBox * aspect)
    }
    const drawX = Math.round(SIZE / 2 - drawW / 2)
    const drawY = Math.round(imgY + (imgBox - drawH) / 2)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(source.image, source.sx, source.sy, source.sw, source.sh, drawX, drawY, drawW, drawH)
  } else {
    const imgX = Math.round(SIZE / 2 - imgBox / 2)
    ctx.fillStyle = '#2a2a4a'
    ctx.fillRect(imgX, imgY, imgBox, imgBox)
    ctx.fillStyle = COLORS.gold
    ctx.font = 'bold 200px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', SIZE / 2, imgY + imgBox / 2)
  }

  // Nombre debajo
  ctx.shadowColor = COLORS.shadow
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3
  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 42px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const nameY = imgY + imgBox + 30
  ctx.fillText(name, SIZE / 2, nameY)

  // Contador (solo si aplica)
  if (typeof count === 'number' && count > 0) {
    ctx.font = 'bold 34px "Press Start 2P", monospace'
    ctx.fillStyle = COLORS.textSoft
    ctx.fillText(`x${count}`, SIZE / 2, nameY + 70)
  }

  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/**
 * Genera un Blob PNG con la imagen compartible.
 *
 * @param {Phaser.Scene} scene
 * @param {{
 *   name: string,
 *   textureKey: string,
 *   frame?: number,
 *   count?: number|null,
 *   subtitleKey: string,    // clave de SHARE_BRANDING.SUBTITLE
 * }} options
 * @returns {Promise<Blob>}
 */
export async function generateShareImage(scene, options) {
  const { name, textureKey, frame = 0, count = null, subtitleKey } = options

  await ensureFontsReady()

  const canvas = document.createElement('canvas')
  canvas.width  = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // Fondo
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  drawHeader(ctx, subtitleKey)
  drawCardBody(ctx, {
    name,
    count,
    source: getSourceImage(scene, textureKey, frame),
  })
  drawFooter(ctx)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('toBlob returned null')),
      'image/png',
    )
  })
}
