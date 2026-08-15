import { HISTORY_BLOCKS, HISTORY_END_TEXT } from './historyContent'
import { ANDANA_BLOCKS, ANDANA_END_TEXT } from './andanaContent'
import { NAO_VICTORIA_BLOCKS, NAO_VICTORIA_END_TEXT } from './naoVictoriaContent'

// Catálogo de historias narradas. Cada entrada tiene el contenido, los
// assets (narrador y fondo) y las acciones de los botones expresadas
// como VERBOS — StoryScene los traduce en scene.start(...) al vuelo.
//
// Verbos soportados en `action`:
//   { type: 'goto', scene: <SCENES.X> }
//     → scene.start(SCENES.X)
//   { type: 'goto-with-passthrough', scene: <SCENES.X>, fallback?: <SCENES.Y> }
//     → scene.start(SCENES.X, initData) — si initData falta, cae a fallback
//     (útil para historias que se pueden abrir desde varios contextos)
//
// Para añadir una historia nueva:
//   1. Crear el fichero de contenido en config/*Content.js
//   2. Importarlo aquí
//   3. Añadir entrada al objeto STORIES
//   4. (Opcional) Añadir la imagen/spritesheet del narrador en
//      public/assets/sprites/narrators/ y las imágenes de bloques.
//      StoryScene las cargará bajo demanda al abrir la escena.

import { SCENES } from './gameConfig'

export const STORIES = {
  'la-cucana': {
    blocks: HISTORY_BLOCKS,
    endText: HISTORY_END_TEXT,
    narrator: {
      key: 'narrator-history',
      file: 'sprites/narrators/narrator_history.png',
    },
    backgroundKey: 'bg-history',
    backButton: {
      label: 'MENÚ',
      action: { type: 'goto', scene: SCENES.MENU },
    },
    endButton: {
      label: '¡A JUGAR!',
      action: { type: 'goto', scene: SCENES.CHARACTER_SELECT },
    },
  },

  andana: {
    blocks: ANDANA_BLOCKS,
    endText: ANDANA_END_TEXT,
    narrator: {
      key: 'narrator-andana',
      file: 'sprites/narrators/narrator_andana.png',
    },
    backgroundKey: 'bg-history',
    backButton: {
      label: 'SALTAR',
      action: { type: 'goto-with-passthrough', scene: SCENES.GAME, fallback: SCENES.MENU },
    },
    endButton: {
      label: '¡A JUGAR!',
      action: { type: 'goto-with-passthrough', scene: SCENES.GAME, fallback: SCENES.MENU },
    },
  },

  'nao-victoria': {
    blocks: NAO_VICTORIA_BLOCKS,
    endText: NAO_VICTORIA_END_TEXT,
    narrator: {
      key: 'narrator-magallanes',
      file: 'sprites/narrators/narrator_magallanes.png',
    },
    backgroundKey: 'bg-history',
    backButton: {
      label: 'SALTAR',
      action: { type: 'goto-with-passthrough', scene: SCENES.GAME, fallback: SCENES.MENU },
    },
    endButton: {
      label: 'SEGUIR',
      action: { type: 'goto-with-passthrough', scene: SCENES.GAME, fallback: SCENES.MENU },
    },
  },
}
