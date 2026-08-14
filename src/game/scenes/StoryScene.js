import { BaseNarratedScene } from './BaseNarratedScene'
import { SCENES } from '../config/gameConfig'
import { STORIES } from '../config/stories'

// Escena narrada genérica y data-driven. Reemplaza a HistoryScene y
// AndanaScene: se registra una única vez (SCENES.STORY) y quien la
// abre le pasa `storyId` en init(). El catálogo (config/stories.js)
// tiene todo lo demás — bloques, narrador, fondo, botones.
//
// Assets cargados bajo demanda: el spritesheet del narrador y las
// imágenes de bloques se piden en preload() solo si no están ya en
// caché. Esto mantiene la carga inicial del juego pequeña y hace que
// añadir una historia nueva no requiera tocar PreloadScene.
//
// Uso:
//   this.scene.start(SCENES.STORY, {
//     storyId: 'nao-victoria',
//     passThrough: { character, perspective },  // opcional
//   })

const NARRATOR_FRAME_W = 35
const NARRATOR_FRAME_H = 35

export class StoryScene extends BaseNarratedScene {
  constructor() {
    super(SCENES.STORY)
  }

  init(data) {
    super.init(data)
    this._storyId = data?.storyId ?? null
    this._story = this._storyId ? (STORIES[this._storyId] ?? null) : null
    this._passThrough = data?.passThrough ?? null

    if (!this._story) {
      console.warn(`[StoryScene] storyId desconocido: ${this._storyId}`)
    }
  }

  preload() {
    if (!this._story) return
    this.load.setPath('assets')

    // Narrador — solo si el spritesheet aún no está en caché.
    const narrator = this._story.narrator
    if (narrator?.key && narrator?.file && !this.textures.exists(narrator.key)) {
      this.load.spritesheet(narrator.key, narrator.file, {
        frameWidth: NARRATOR_FRAME_W,
        frameHeight: NARRATOR_FRAME_H,
      })
      this.load.once(`filecomplete-spritesheet-${narrator.key}`, () => {
        const t = this.textures.get(narrator.key)
        if (t?.source.length > 0) t.setFilter(Phaser.Textures.FilterMode.NEAREST)
      })
    }

    // Imágenes de bloques — cada bloque puede declarar { image: 'key',
    // imageFile: 'path/to/file.webp' }. Si solo hay 'image' y no está en
    // caché, ya cargada previamente en PreloadScene o no es problema
    // nuestro (probablemente asset roto en catálogo).
    this._story.blocks?.forEach((block) => {
      if (!block?.image) return
      if (this.textures.exists(block.image)) return
      if (!block.imageFile) return
      this.load.image(block.image, block.imageFile)
    })
  }

  // ── hooks del BaseNarratedScene ────────────────────────────

  getBlocks() {
    return this._story?.blocks ?? []
  }

  getEndText() {
    return this._story?.endText ?? ''
  }

  getNarratorSpritesheet() {
    return this._story?.narrator?.key ?? null
  }

  getBackgroundKey() {
    return this._story?.backgroundKey ?? null
  }

  getBackButtonConfig() {
    const btn = this._story?.backButton
    if (!btn) return { label: 'MENÚ', onClick: () => this.scene.start(SCENES.MENU) }
    return { label: btn.label, onClick: () => this._runAction(btn.action) }
  }

  getEndButtonConfig() {
    const btn = this._story?.endButton
    if (!btn) return { label: 'SEGUIR', onClick: () => this.scene.start(SCENES.MENU) }
    return { label: btn.label, onClick: () => this._runAction(btn.action) }
  }

  // ── traducción verbo→scene.start ───────────────────────────

  _runAction(action) {
    if (!action) return this.scene.start(SCENES.MENU)

    switch (action.type) {
      case 'goto':
        this.scene.start(action.scene)
        return

      case 'goto-with-passthrough': {
        if (this._passThrough) {
          this.scene.start(action.scene, this._passThrough)
        } else {
          this.scene.start(action.fallback ?? action.scene)
        }
        return
      }

      default:
        console.warn(`[StoryScene] acción desconocida: ${action.type}`)
        this.scene.start(SCENES.MENU)
    }
  }
}
