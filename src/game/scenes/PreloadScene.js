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

    // Narrador — Historia (sprites en raíz de sprites/)
    this.load.image('narrator',        'sprites/narrator.png')
    this.load.image('narrator-m-open', 'sprites/narrator_m_open.png')
    this.load.image('narrator-open',   'sprites/narrator_open.png')
    this.load.image('narrator-eyes',   'sprites/narrator_eyes.png')

    // Narrador — Tutorial (sprites en sprites/narrator/)
    this.load.image('tutor-narrator',        'sprites/narrator/narrator.png')
    this.load.image('tutor-narrator-m-open', 'sprites/narrator/narrator_m_open.png')
    this.load.image('tutor-narrator-open',   'sprites/narrator/narrator_open.png')
    this.load.image('tutor-narrator-eyes',   'sprites/narrator/narrator_eyes.png')

    // Imágenes del tutorial — una por bloque
    this.load.image('tut-01', 'tutorial/01-bienvenido.png')
    this.load.image('tut-02', 'tutorial/02-impulso.png')
    this.load.image('tut-03', 'tutorial/03-zonas.png')
    this.load.image('tut-04', 'tutorial/04-equilibrio.png')
    this.load.image('tut-05', 'tutorial/05-salto.png')
    this.load.image('tut-06', 'tutorial/06-listo.png')

    // Imágenes históricas — una por bloque de texto
    this.load.image('hist-intro',     'backgrounds/hist-intro.png')
    this.load.image('hist-sabio',     'backgrounds/hist-sabio.png')
    this.load.image('hist-picaresca', 'backgrounds/hist-picaresca.png')
    this.load.image('hist-leyenda',   'backgrounds/hist-leyenda.png')
    this.load.image('hist-mision',    'backgrounds/hist-mision.png')

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
