// CharacterCard — factory que crea una ficha de personaje para CharacterSelectScene
// Recibe los datos del personaje y devuelve un Container listo para usar en el carrusel.
// Toda la lógica visual de la ficha (imagen, nombre, stats, estado seleccionado) está aquí.

import { COLORS } from '../config/gameConfig'

const STAT_COLORS = {
  peso:       0xe74c3c,
  equilibrio: 0x3498db,
  altura:     0x2ecc71,
  edad:       0xf39c12,
}
const STAT_NAMES = { peso: 'PES', equilibrio: 'EQU', altura: 'ALT', edad: 'EDA' }
const STAT_MAX   = 10

/**
 * Crea una ficha de personaje y la devuelve como Container.
 *
 * @param {Phaser.Scene} scene
 * @param {object} char  - Datos del personaje (id, name, sprite, stats, available, description)
 * @param {boolean} isSelected
 * @param {{
 *   width:      number,
 *   height:     number,
 *   cardPadding: number,
 *   imgW:       number,
 *   imgH:       number,
 *   statsY:     number,
 *   statsX:     number,
 *   barWidth:   number,
 *   barHeight:  number,
 *   statRowH:   number,
 * }} layout
 * @returns {Phaser.GameObjects.Container}
 */
export function createCharacterCard(scene, char, isSelected, layout) {
  const {
    width:      CARD_WIDTH,
    height:     CARD_HEIGHT,
    cardPadding: CARD_PADDING,
    imgW:       IMG_W,
    imgH:       IMG_H,
    statsY:     STATS_Y,
    statsX:     STATS_X,
    barWidth:   BAR_WIDTH,
    barHeight:  BAR_HEIGHT,
    statRowH:   STAT_ROW_H,
  } = layout

  const IMG_X = CARD_PADDING
  const IMG_Y = CARD_PADDING

  const container = scene.add.container(0, 0)
  const g = scene.add.graphics()

  // Sombra de la card (solo la seleccionada disponible)
  if (isSelected && char.available) {
    g.fillStyle(COLORS.GOLD, 0.12)
    g.fillRect(-4, -4, CARD_WIDTH + 8, CARD_HEIGHT + 8)
  }

  // Fondo
  g.fillStyle(COLORS.UI_BG, char.available ? 1 : 0.5)
  g.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // Borde exterior
  if (isSelected && char.available) {
    g.lineStyle(3, COLORS.GOLD, 1)
  } else {
    g.lineStyle(2, COLORS.UI_BORDER, 0.8)
  }
  g.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // Borde interior (doble marco)
  if (isSelected && char.available) {
    g.lineStyle(1, COLORS.GOLD, 0.4)
    g.strokeRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6)
  }

  container.add(g)

  // ── Imagen del personaje ──────────────────────────────────────
  const hasSprite = scene.textures.exists(char.sprite) &&
    scene.textures.get(char.sprite).key !== '__MISSING'

  if (hasSprite) {
    const sprite = scene.add.image(IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2, char.sprite)
    const scale  = Math.max(IMG_W / sprite.width, IMG_H / sprite.height)
    sprite.setScale(scale)

    const cropX = (sprite.displayWidth  - IMG_W) / 2
    const cropY = (sprite.displayHeight - IMG_H) / 2
    sprite.setCrop(cropX / scale, cropY / scale, IMG_W / scale, IMG_H / scale)
    container.add(sprite)

    // Degradado oscuro en la parte inferior de la imagen
    const imgGrad = scene.add.graphics()
    imgGrad.fillStyle(0x000000, 0.3)
    imgGrad.fillRect(IMG_X, IMG_Y + IMG_H - 50, IMG_W, 20)
    imgGrad.fillStyle(0x000000, 0.55)
    imgGrad.fillRect(IMG_X, IMG_Y + IMG_H - 30, IMG_W, 30)
    container.add(imgGrad)

    // Borde de la imagen
    const imgBorder = scene.add.graphics()
    imgBorder.lineStyle(2, COLORS.UI_BORDER, 1)
    imgBorder.strokeRect(IMG_X, IMG_Y, IMG_W, IMG_H)
    container.add(imgBorder)
  } else {
    const spriteG = scene.add.graphics()
    spriteG.fillStyle(0x2a2a4a, 1)
    spriteG.fillRect(IMG_X, IMG_Y, IMG_W, IMG_H)
    spriteG.lineStyle(2, COLORS.UI_BORDER, 1)
    spriteG.strokeRect(IMG_X, IMG_Y, IMG_W, IMG_H)
    _drawSilhouette(spriteG, IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2, char.available)
    container.add(spriteG)
  }

  // ── Nombre (superpuesto sobre la imagen) ──────────────────────
  const nameColor = char.available ? '#ffd700' : '#555555'
  container.add(
    scene.add.text(CARD_WIDTH / 2, IMG_Y + IMG_H - 10, char.name, {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      nameColor,
      stroke:     '#000000',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5, 1),
  )

  // ── Stats / bloqueado ─────────────────────────────────────────
  if (char.available) {
    _drawStats(scene, container, char.stats, { statsY: STATS_Y, statsX: STATS_X, barWidth: BAR_WIDTH, barHeight: BAR_HEIGHT, statRowH: STAT_ROW_H })
  } else {
    container.add(
      scene.add.text(CARD_WIDTH / 2, STATS_Y + 30, '???', {
        fontFamily: 'monospace',
        fontSize:   '24px',
        color:      '#444444',
      }).setOrigin(0.5),
    )
    container.add(
      scene.add.text(CARD_WIDTH / 2, STATS_Y + 60, 'BLOQUEADO', {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#444444',
      }).setOrigin(0.5),
    )
  }

  return container
}

// ── Helpers privados ──────────────────────────────────────────────

function _drawStats(scene, container, stats, { statsY, statsX, barWidth, barHeight, statRowH }) {
  Object.entries(stats).forEach(([key, value], i) => {
    const sy = statsY + i * statRowH

    container.add(
      scene.add.text(statsX, sy + 1, STAT_NAMES[key] ?? key, {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#999999',
      }),
    )

    const barG = scene.add.graphics()
    const barX = statsX + 38

    barG.fillStyle(0x0a0a1e, 1)
    barG.fillRect(barX, sy + 2, barWidth, barHeight)

    const fillW = (value / STAT_MAX) * barWidth
    barG.fillStyle(STAT_COLORS[key] ?? 0xffffff, 1)
    barG.fillRect(barX, sy + 2, fillW, barHeight)

    barG.lineStyle(1, 0x3a3a5a, 1)
    barG.strokeRect(barX, sy + 2, barWidth, barHeight)

    container.add(barG)
  })
}

function _drawSilhouette(graphics, cx, cy, available) {
  const color = available ? 0x88aadd : 0x444466
  graphics.fillStyle(color, 1)
  graphics.fillRect(cx - 10, cy - 36, 20, 18)
  graphics.fillRect(cx - 14, cy - 18, 28, 28)
  graphics.fillRect(cx - 12, cy + 10, 10, 18)
  graphics.fillRect(cx +  2, cy + 10, 10, 18)
  graphics.fillRect(cx - 22, cy - 14,  8, 20)
  graphics.fillRect(cx + 14, cy - 14,  8, 20)
}
