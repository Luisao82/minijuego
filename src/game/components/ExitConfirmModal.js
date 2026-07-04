import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle, mutedStyle } from '../config/textStyles'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'

// Modal de confirmación de salida durante la partida.
// La escena gestiona la pausa (fase) y decide qué hacer al confirmar;
// este componente solo monta la UI y devuelve { destroy } para desmontarla.

const PANEL_W = 540
const PANEL_H = 250
const DEPTH = 50

export function showExitConfirmModal(scene, { onConfirm, onResume }) {
  const PX = Math.round((GAME_WIDTH - PANEL_W) / 2)
  const PY = Math.round((GAME_HEIGHT - PANEL_H) / 2)
  const CX = GAME_WIDTH / 2

  const container = scene.add.container(0, 0)
  // makeNavButton (y add.*) dibujan directamente en la escena, no en un
  // container. Capturamos lo creado en cada paso y lo movemos al
  // container del modal para poder destruirlo todo de una vez al cerrar.
  const collect = (fn) => {
    const before = scene.children.list.length
    fn()
    scene.children.list.slice(before).forEach((o) => container.add(o))
  }

  collect(() => {
    const overlay = scene.add.graphics().setDepth(DEPTH)
    overlay.fillStyle(0x000000, 0.65)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    )

    const panel = scene.add.graphics().setDepth(DEPTH + 1)
    panel.fillStyle(0x000000, 0.45)
    panel.fillRect(PX + 5, PY + 5, PANEL_W, PANEL_H)
    panel.fillStyle(COLORS.DARK_BG, 1)
    panel.fillRect(PX, PY, PANEL_W, PANEL_H)
    panel.lineStyle(3, COLORS.GOLD, 1)
    panel.strokeRect(PX, PY, PANEL_W, PANEL_H)
    panel.lineStyle(1, COLORS.GOLD, 0.25)
    panel.strokeRect(PX + 5, PY + 5, PANEL_W - 10, PANEL_H - 10)

    scene.add
      .text(CX, PY + 58, '¿SEGURO QUE QUIERES SALIR?', {
        ...headingStyle(26, COLOR_GOLD, 3),
        stroke: '#000000',
        align: 'center',
        wordWrap: { width: PANEL_W - 40 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 2)

    scene.add
      .text(CX, PY + 104, 'Perderás la partida en curso', {
        ...mutedStyle(16, '#cccccc'),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 2)

    const gap = 16
    const btnOpts = { depth: DEPTH + 2, fontSize: '26px' }
    const sizeA = measureNavButtonSize(scene, 'SÍ, SALIR', btnOpts)
    const sizeB = measureNavButtonSize(scene, 'SEGUIR', btnOpts)
    const btnH = Math.max(sizeA.h, sizeB.h)
    const totalW = sizeA.w + sizeB.w + gap
    const startX = CX - totalW / 2
    const btnY = PY + PANEL_H - btnH - 24

    makeNavButton(scene, startX, btnY, sizeA.w, btnH, 'SÍ, SALIR', onConfirm, btnOpts)
    makeNavButton(scene, startX + sizeA.w + gap, btnY, sizeB.w, btnH, 'SEGUIR', onResume, btnOpts)
  })

  return {
    destroy: () => container.destroy(true),
  }
}
