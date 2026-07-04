import { GAME_WIDTH, COLORS, CONTROL_PANEL } from '../config/gameConfig'
import { headingStyle } from '../config/textStyles'
import { getGameOverMessage } from '../config/gameOverMessages'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'

// Panel de game over compartido por las escenas de juego (2D y 3D):
// expresión + frase según el porcentaje recorrido, texto parpadeante de
// reintento y botones CAMBIAR PERSONAJE / VER PREMIOS.
// onReady se llama (tras la pausa dramática) con los bounds de los botones,
// para que la escena habilite el reintento por tap fuera de ellos.

const PANEL_W = 620
const PANEL_H = 260
const DEPTH = 45
const BUTTONS_DELAY_MS = 1000

export function createGameOverPanel(
  scene,
  { distPercent, onChangeCharacter, onCollection, onReady }
) {
  const { expression, phrase, color: exprColor } = getGameOverMessage(distPercent)

  const centerX = GAME_WIDTH / 2
  const centerY = CONTROL_PANEL.Y / 2

  const g = scene.add.graphics().setDepth(DEPTH)
  g.fillStyle(COLORS.DARK_BG, 0.88)
  g.fillRect(centerX - PANEL_W / 2, centerY - PANEL_H / 2, PANEL_W, PANEL_H)
  g.lineStyle(2, COLORS.GOLD, 0.8)
  g.strokeRect(centerX - PANEL_W / 2, centerY - PANEL_H / 2, PANEL_W, PANEL_H)
  g.lineStyle(1, COLORS.GOLD, 0.2)
  g.strokeRect(centerX - PANEL_W / 2 + 3, centerY - PANEL_H / 2 + 3, PANEL_W - 6, PANEL_H - 6)

  // Expresión grande (tipografía redonda Jersey 10) — override de stroke '#000000'.
  scene.add
    .text(centerX, centerY - 85, expression, {
      ...headingStyle(44, exprColor, 5),
      stroke: '#000000',
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(DEPTH + 1)

  scene.add
    .text(centerX, centerY - 22, phrase, {
      ...headingStyle(28, exprColor, 3),
      stroke: '#000000',
      align: 'center',
      wordWrap: { width: PANEL_W - 50 },
    })
    .setOrigin(0.5)
    .setDepth(DEPTH + 1)

  scene.time.delayedCall(BUTTONS_DELAY_MS, () => {
    const restartText = scene.add
      .text(centerX, centerY + 32, 'PULSA PARA REINTENTAR', {
        ...headingStyle(22, '#ffffff', 3),
        stroke: '#000000',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 1)
    scene.tweens.add({ targets: restartText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 })

    const gap = 14
    const btnOpts = { fontSize: '22px', depth: DEPTH + 1 }
    const sizeChange = measureNavButtonSize(scene, 'CAMBIAR PERSONAJE', btnOpts)
    const sizeCollection = measureNavButtonSize(scene, 'VER PREMIOS', btnOpts)
    const btnH = Math.max(sizeChange.h, sizeCollection.h)
    const totalW = sizeChange.w + sizeCollection.w + gap
    const startX = centerX - totalW / 2
    const btnY = centerY + 58

    const changeCharacterBounds = makeNavButton(
      scene,
      startX,
      btnY,
      sizeChange.w,
      btnH,
      'CAMBIAR PERSONAJE',
      onChangeCharacter,
      btnOpts
    )

    const collectionBounds = makeNavButton(
      scene,
      startX + sizeChange.w + gap,
      btnY,
      sizeCollection.w,
      btnH,
      'VER PREMIOS',
      onCollection,
      btnOpts
    )

    onReady({ changeCharacterBounds, collectionBounds })
  })
}
