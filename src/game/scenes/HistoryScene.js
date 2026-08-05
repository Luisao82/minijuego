import { BaseNarratedScene } from './BaseNarratedScene'
import { SCENES } from '../config/gameConfig'
import { HISTORY_BLOCKS, HISTORY_END_TEXT } from '../config/historyContent'

// Historia de La Cucaña Trianera contada por el narrador ámbar.
// Toda la lógica (fondo, cuadro de diálogo, máquina de escribir,
// navegación por bloques, imagen ilustrativa) vive en BaseNarratedScene —
// aquí solo el contenido y los callbacks de los botones.

export class HistoryScene extends BaseNarratedScene {
  constructor() {
    super(SCENES.HISTORY)
  }

  getBlocks() {
    return HISTORY_BLOCKS
  }

  getEndText() {
    return HISTORY_END_TEXT
  }

  getNarratorSpritesheet() {
    return 'narrator-history'
  }

  getBackgroundKey() {
    return 'bg-history'
  }

  getBackButtonConfig() {
    return {
      label: 'MENÚ',
      onClick: () => this.scene.start(SCENES.MENU),
    }
  }

  getEndButtonConfig() {
    return {
      label: '¡A JUGAR!',
      onClick: () => this.scene.start(SCENES.CHARACTER_SELECT),
    }
  }
}
