// backgroundUtils — utilidades de fondo compartidas entre escenas
// Elimina la duplicación de drawBackground() y drawHeader() en CharacterSelectScene y CollectionScene.

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'

/**
 * Dibuja la franja oscura central + overlays + líneas doradas.
 * Idéntico a lo que antes tenían CharacterSelectScene y CollectionScene por separado.
 *
 * @param {Phaser.Scene} scene
 * @param {string} bgTexture - Clave de la textura de fondo
 * @param {number} bandY
 * @param {number} bandH
 */
export function drawBandBackground(scene, bgTexture, bandY, bandH) {
  const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgTexture)
  bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))

  // Overlays fuera de la franja
  const overlay = scene.add.graphics()
  overlay.fillStyle(0x0a0a1e, 0.35)
  overlay.fillRect(0, 0, GAME_WIDTH, bandY)
  overlay.fillStyle(0x0a0a1e, 0.55)
  overlay.fillRect(0, bandY + bandH, GAME_WIDTH, GAME_HEIGHT - bandY - bandH)

  // Franja central con bordes difusos simulados
  const band = scene.add.graphics()
  band.fillStyle(0x0a0a1e, 0.25)
  band.fillRect(0, bandY - 30, GAME_WIDTH, 15)
  band.fillStyle(0x0a0a1e, 0.45)
  band.fillRect(0, bandY - 15, GAME_WIDTH, 15)
  band.fillStyle(0x0d0d24, 0.82)
  band.fillRect(0, bandY, GAME_WIDTH, bandH)
  band.fillStyle(0x0a0a1e, 0.45)
  band.fillRect(0, bandY + bandH, GAME_WIDTH, 15)
  band.fillStyle(0x0a0a1e, 0.25)
  band.fillRect(0, bandY + bandH + 15, GAME_WIDTH, 15)

  // Líneas decorativas en los bordes
  const lines = scene.add.graphics()
  lines.lineStyle(2, COLORS.GOLD, 0.4)
  lines.lineBetween(0, bandY, GAME_WIDTH, bandY)
  lines.lineBetween(0, bandY + bandH, GAME_WIDTH, bandY + bandH)
  lines.lineStyle(1, COLORS.GOLD, 0.15)
  lines.lineBetween(0, bandY + 3, GAME_WIDTH, bandY + 3)
  lines.lineBetween(0, bandY + bandH - 3, GAME_WIDTH, bandY + bandH - 3)
}

/**
 * Dibuja la cabecera con fondo, esquinas retro y línea decorativa.
 *
 * @param {Phaser.Scene} scene
 * @param {number} cx        - Centro horizontal
 * @param {number} headerY   - Centro vertical del texto
 * @param {string} title     - Texto del título
 * @param {number} halfWidth - Mitad del ancho del panel de cabecera
 */
export function drawSceneHeader(scene, cx, headerY, title, halfWidth) {
  // Fondo semi-transparente
  const headerBg = scene.add.graphics()
  headerBg.fillStyle(0x0a0a1e, 0.6)
  headerBg.fillRect(cx - halfWidth, headerY - 25, halfWidth * 2, 50)
  headerBg.lineStyle(1, COLORS.GOLD, 0.3)
  headerBg.strokeRect(cx - halfWidth, headerY - 25, halfWidth * 2, 50)

  // Esquinas decorativas retro
  const corners = scene.add.graphics()
  corners.lineStyle(2, COLORS.GOLD, 0.8)
  const cLen  = 12
  const left  = cx - halfWidth + 4
  const right = cx + halfWidth - 4
  const top   = headerY - 21
  const bot   = headerY + 21
  corners.lineBetween(left,  top, left + cLen,  top)
  corners.lineBetween(left,  top, left,  top + cLen)
  corners.lineBetween(right, top, right - cLen, top)
  corners.lineBetween(right, top, right, top + cLen)
  corners.lineBetween(left,  bot, left + cLen,  bot)
  corners.lineBetween(left,  bot, left,  bot - cLen)
  corners.lineBetween(right, bot, right - cLen, bot)
  corners.lineBetween(right, bot, right, bot - cLen)

  // Texto del título
  scene.add.text(cx, headerY, title, {
    fontFamily: '"Jersey 10", cursive',
    fontSize:   '42px',
    color:      '#ffd700',
    stroke:     '#1a0a00',
    strokeThickness: 6,
    letterSpacing:   6,
    shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, fill: true },
  }).setOrigin(0.5)

  // Línea decorativa debajo con diamante central
  const lineY = headerY + 28
  const lineG = scene.add.graphics()
  lineG.fillStyle(COLORS.GOLD, 0.6)
  lineG.fillRect(cx - halfWidth + 40, lineY, (halfWidth - 40) * 2, 1)
  const dSize = 4
  lineG.fillStyle(COLORS.GOLD, 0.9)
  lineG.fillRect(cx - dSize, lineY - dSize + 1, dSize * 2, dSize * 2)
  lineG.fillStyle(COLORS.GOLD, 0.35)
  lineG.fillRect(cx - halfWidth + 80, lineY + 4, (halfWidth - 80) * 2, 1)
}
