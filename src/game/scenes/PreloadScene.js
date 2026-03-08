import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'

export class PreloadScene extends Scene {

  constructor() {
    super(SCENES.PRELOAD)
  }

  preload() {
    // Barra de carga pixel art
    const barWidth = 300
    const barHeight = 20
    const x = (GAME_WIDTH - barWidth) / 2
    const y = GAME_HEIGHT / 2

    const borderBox = this.add.graphics()
    borderBox.lineStyle(2, COLORS.WHITE, 1)
    borderBox.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4)

    const progressBar = this.add.graphics()

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(COLORS.GOLD, 1)
      progressBar.fillRect(x, y, barWidth * value, barHeight)
    })

    const loadingText = this.add.text(GAME_WIDTH / 2, y - 30, 'CARGANDO...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.load.on('complete', () => {
      progressBar.destroy()
      borderBox.destroy()
      loadingText.destroy()
    })

    // Carga de assets (NEAREST para mantener pixel art nítido en sprites)
    this.load.setPath('assets')
    this.load.image('bg-menu', 'backgrounds/fondoIntro.png')
    this.load.image('bg-characters', 'backgrounds/fondoPersonajes.png')
    this.load.image('bg-game', 'backgrounds/fondo_a.png')
    this.load.image('bg-history', 'backgrounds/fondoHistory.png')
    this.load.image('boat', 'sprites/barco.png')

    // Sprites de personajes
    CHARACTERS.forEach((char) => {
      this.load.image(char.sprite, `sprites/characters/${char.id}.png`)
    })

    // Premios: carga el JSON y luego las imágenes de cada premio
    this.load.json('rewards', 'rewards.json')
    this.load.on('filecomplete-json-rewards', () => {
      const rewards = this.cache.json.get('rewards')
      if (rewards && Array.isArray(rewards)) {
        rewards.forEach(reward => {
          this.load.image(reward.id, reward.imagen)
        })
      }
    })

    // Aplicar filtro NEAREST a texturas pixel art tras la carga
    this.load.on('filecomplete', (key) => {
      const texture = this.textures.get(key)
      if (texture && texture.source.length > 0) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
      }
    })
  }

  create() {
    this.scene.start(SCENES.MENU)
  }
}
