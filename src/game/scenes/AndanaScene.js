import { BaseNarratedScene } from './BaseNarratedScene'
import { SCENES } from '../config/gameConfig'
import { ANDANA_BLOCKS, ANDANA_END_TEXT } from '../config/andanaContent'

// Escena narrada con la historia de la familia Andana. Se lanza al
// pulsar el barquito durante la cinemática de "entrega de la bandera"
// que abre una partida posterior a haber conseguido una bandera.
//
// Recibe en init() los datos necesarios para reanudar la partida
// (character, perspective). Al terminar (o al pulsar SALTAR) arranca
// GameScene con esos datos — como la ceremonia ya fue consumida antes
// de entrar aquí, la partida se abre normal, sin cinemática.

export class AndanaScene extends BaseNarratedScene {
  constructor() {
    super(SCENES.ANDANA)
  }

  init(data) {
    super.init(data)
    this._returnData = {
      character: data?.character ?? null,
      perspective: data?.perspective ?? null,
    }
  }

  getBlocks() {
    return ANDANA_BLOCKS
  }

  getEndText() {
    return ANDANA_END_TEXT
  }

  getNarratorSpritesheet() {
    return 'narrator-andana'
  }

  getBackgroundKey() {
    return 'bg-history'
  }

  getBackButtonConfig() {
    return {
      label: 'SALTAR',
      onClick: () => this._startGame(),
    }
  }

  getEndButtonConfig() {
    return {
      label: '¡A JUGAR!',
      onClick: () => this._startGame(),
    }
  }

  _startGame() {
    this.scene.start(SCENES.GAME, this._returnData)
  }
}
