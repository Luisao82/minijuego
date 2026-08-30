import { BaseNarratedScene } from './BaseNarratedScene'
import { SCENES } from '../config/gameConfig'
import { mapService } from '../services/MapService'
import { MAP_TUTORIAL_BLOCKS, MAP_TUTORIAL_END_TEXT } from '../config/mapTutorialContent'

// Tutorial del reto del mapa. Reutiliza BaseNarratedScene (narrador +
// diálogo con máquina de escribir + navegación por bloques) y solo
// aporta el contenido, la paleta y el par de botones "MODO GPS" /
// "MODO METROS" al final — al pulsar uno se persiste el modo, se
// marca el tutorial como visto y se vuelve al mapa.

// Paleta cian/azul, coherente con el TutorialScene del juego.
const PALETTE = {
  accent: 0x00ccff,
  dlgDark: 0x0a1628,
  dlgFace: 0x0d2040,
  bgFallback: 0x00080f,
  bgTint: 0x001a2e,
  bgTintAlpha: 0.58,
  textColor: '#e8f4ff',
  placeholderColor: '#3a5a7a',
}

export class MapTutorialScene extends BaseNarratedScene {
  constructor() {
    super(SCENES.MAP_TUTORIAL)
  }

  init(data) {
    super.init(data)
    this.characterData = data?.character || null
  }

  // ── Hooks de BaseNarratedScene ─────────────────────────────

  getBlocks() {
    return MAP_TUTORIAL_BLOCKS
  }

  getEndText() {
    return MAP_TUTORIAL_END_TEXT
  }

  getNarratorSpritesheet() {
    return 'narrator-tutorial'
  }

  getBackgroundKey() {
    return 'bg-characters'
  }

  getPalette() {
    return PALETTE
  }

  getBackButtonConfig() {
    // Vuelve al mapa sin marcar el tutorial visto. Si el usuario aún no
    // ha elegido modo, el mapa lo relanzará; si ya lo tenía elegido, no.
    return {
      label: 'VOLVER',
      onClick: () => this.scene.start(SCENES.MAP, { character: this.characterData }),
    }
  }

  // Requerido por el contrato base, aunque getEndButtons() lo sobrescribe.
  getEndButtonConfig() {
    return { label: '', onClick: () => {} }
  }

  getEndButtons() {
    return [
      { label: 'MODO GPS', onClick: () => this._pickMode('gps') },
      { label: 'MODO METROS', onClick: () => this._pickMode('meters') },
    ]
  }

  _pickMode(mode) {
    mapService.setUnlockMode(mode)
    mapService.markMapTutorialSeen()
    this.scene.start(SCENES.MAP, { character: this.characterData })
  }
}
