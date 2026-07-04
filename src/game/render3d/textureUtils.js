// Utilidades de manipulación de imágenes para las texturas del mundo 3D.
// Funciones puras sobre canvas — sin Phaser ni three.js.

export function hexToRgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]
}

// Sustituye un color plano de la imagen por otro (con tolerancia por canal).
// Se usa para unificar los cielos de los fondos 2D en un único azul común
// antes de subirlos como texturas 3D. Devuelve un canvas con el resultado.
export function replaceColor(img, fromHex, toHex, tolerance = 14) {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const p = data.data
  for (let i = 0; i < p.length; i += 4) {
    if (
      Math.abs(p[i] - from[0]) <= tolerance &&
      Math.abs(p[i + 1] - from[1]) <= tolerance &&
      Math.abs(p[i + 2] - from[2]) <= tolerance
    ) {
      p[i] = to[0]
      p[i + 1] = to[1]
      p[i + 2] = to[2]
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

// Clona una región del propio canvas en otra posición (misma y).
// Se usa para estampar copias de los pilares del puente en los extremos.
export function stampRegion(canvas, { X, Y, W, H }, dstX) {
  const ctx = canvas.getContext('2d')
  ctx.drawImage(canvas, X, Y, W, H, dstX, Y, W, H)
}

// Dibuja un remate escalonado sobre el tope de la torre: bloques centrados
// apilados de abajo arriba, con el lado izquierdo en sombra (como el fuste).
export function drawTowerCap(canvas, { Y, BLOCKS, FILL, SHADE }) {
  const ctx = canvas.getContext('2d')
  let y = Y
  for (const [x0, x1, h] of BLOCKS) {
    y -= h
    const mid = Math.round((x0 + x1) / 2)
    ctx.fillStyle = SHADE
    ctx.fillRect(x0, y, mid - x0, h)
    ctx.fillStyle = FILL
    ctx.fillRect(mid, y, x1 - mid, h)
  }
}
