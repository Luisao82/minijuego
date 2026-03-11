// RewardCard — factory que crea una ficha de premio para CollectionScene
// Recibe los datos del premio y devuelve un Container listo para usar en el carrusel.
// Toda la lógica visual (imagen, nombre, contador, hover, interacción) está aquí.

import { COLORS } from '../config/gameConfig'

/**
 * Crea una ficha de premio y la devuelve como Container.
 *
 * @param {Phaser.Scene} scene
 * @param {object} reward  - Datos del premio (id, nombre, ...)
 * @param {number} count   - Cuántas veces se ha ganado (0 = no ganado)
 * @param {{
 *   width:    number,
 *   height:   number,
 *   imgSize:  number,
 *   imgYLocal: number,
 *   onPress?: (reward: object, count: number) => void
 * }} layout
 * @returns {Phaser.GameObjects.Container}
 */
export function createRewardCard(scene, reward, count, layout) {
  const { width: CARD_W, height: CARD_H, imgSize: IMG_SIZE, imgYLocal: IMG_Y_LOCAL, onPress } = layout
  const earned = count > 0

  const container = scene.add.container(0, 0)

  // ── Fondo y borde ─────────────────────────────────────────────
  const g = scene.add.graphics()

  if (earned) {
    g.fillStyle(COLORS.GOLD, 0.08)
    g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
  }

  g.fillStyle(COLORS.UI_BG, earned ? 1 : 0.55)
  g.fillRect(0, 0, CARD_W, CARD_H)

  g.lineStyle(earned ? 2 : 1, earned ? COLORS.GOLD : COLORS.UI_BORDER, earned ? 1 : 0.5)
  g.strokeRect(0, 0, CARD_W, CARD_H)

  if (earned) {
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
  }
  container.add(g)

  // ── Nombre (oculto con ??? si no se ha ganado) ────────────────
  const displayName = earned ? reward.nombre : '???'
  container.add(
    scene.add.text(CARD_W / 2, 14, displayName, {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      earned ? '#ffd700' : '#444455',
      stroke:     '#000000',
      strokeThickness: earned ? 2 : 1,
      align: 'center',
      wordWrap: { width: CARD_W - 16 },
    }).setOrigin(0.5, 0),
  )

  // ── Imagen (centro de la ficha) ───────────────────────────────
  const imgCX = CARD_W / 2
  const imgCY = IMG_Y_LOCAL + IMG_SIZE / 2

  if (earned && scene.textures.exists(reward.id) &&
      scene.textures.get(reward.id).key !== '__MISSING') {
    container.add(
      scene.add.image(imgCX, imgCY, reward.id)
        .setDisplaySize(IMG_SIZE, IMG_SIZE)
        .setOrigin(0.5),
    )
  } else {
    const imgG = scene.add.graphics()
    imgG.fillStyle(earned ? 0x2a2a4a : 0x141420, 1)
    imgG.fillRect(imgCX - IMG_SIZE / 2, IMG_Y_LOCAL, IMG_SIZE, IMG_SIZE)
    imgG.lineStyle(1, earned ? COLORS.GOLD : COLORS.UI_BORDER, 0.5)
    imgG.strokeRect(imgCX - IMG_SIZE / 2, IMG_Y_LOCAL, IMG_SIZE, IMG_SIZE)
    container.add(imgG)

    container.add(
      scene.add.text(imgCX, imgCY, '?', {
        fontFamily: 'monospace',
        fontSize:   '36px',
        color:      earned ? '#ffd700' : '#2a2a3a',
      }).setOrigin(0.5),
    )
  }

  // ── Separador ─────────────────────────────────────────────────
  const sep = scene.add.graphics()
  sep.lineStyle(1, earned ? COLORS.GOLD : COLORS.UI_BORDER, 0.3)
  sep.lineBetween(10, CARD_H - 44, CARD_W - 10, CARD_H - 44)
  container.add(sep)

  // ── Contador (parte inferior) ─────────────────────────────────
  container.add(
    scene.add.text(CARD_W / 2, CARD_H - 22, `x${count}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '13px',
      color:      earned ? '#ffd700' : '#2a2a3a',
      stroke:     '#000000',
      strokeThickness: earned ? 3 : 1,
    }).setOrigin(0.5),
  )

  // ── Interacción (solo premios ganados) ───────────────────────
  if (earned && onPress) {
    const hit = scene.add.graphics()
    hit.fillStyle(0xffffff, 0.001)
    hit.fillRect(0, 0, CARD_W, CARD_H)
    hit.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains,
    )

    const drawNormal = () => {
      g.clear()
      g.fillStyle(COLORS.GOLD, 0.08)
      g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
      g.fillStyle(COLORS.UI_BG, 1)
      g.fillRect(0, 0, CARD_W, CARD_H)
      g.lineStyle(2, COLORS.GOLD, 1)
      g.strokeRect(0, 0, CARD_W, CARD_H)
      g.lineStyle(1, COLORS.GOLD, 0.3)
      g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
    }

    const drawHover = () => {
      g.clear()
      g.fillStyle(COLORS.GOLD, 0.15)
      g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
      g.fillStyle(COLORS.UI_BG, 1)
      g.fillRect(0, 0, CARD_W, CARD_H)
      g.lineStyle(2, COLORS.GOLD, 1)
      g.strokeRect(0, 0, CARD_W, CARD_H)
      g.lineStyle(1, COLORS.GOLD, 0.5)
      g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
    }

    hit.on('pointerover',  drawHover)
    hit.on('pointerout',   drawNormal)
    hit.on('pointerdown',  () => onPress(reward, count))
    container.add(hit)
  }

  return container
}
