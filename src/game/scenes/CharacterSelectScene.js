import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'

// Datos de personajes (MVP: solo El Trianero disponible)
const CHARACTERS = [
  {
    id: 'trianero',
    name: 'EL TRIANERO',
    description: 'Nacido y criado en Triana.\nEquilibrado en todo.',
    stats: { peso: 5, equilibrio: 5, altura: 5, edad: 5 },
    available: true,
  },
  {
    id: 'abuela',
    name: 'LA ABUELA',
    description: 'Veterana de mil velás.\nSabiduría y temple.',
    stats: { peso: 3, equilibrio: 8, altura: 4, edad: 9 },
    available: false,
  },
  {
    id: 'chaval',
    name: 'ER CHAVAL',
    description: 'Joven y ágil.\nSin miedo a nada.',
    stats: { peso: 3, equilibrio: 4, altura: 6, edad: 2 },
    available: false,
  },
]

const STAT_COLORS = {
  peso: 0xe74c3c,
  equilibrio: 0x3498db,
  altura: 0x2ecc71,
  edad: 0xf39c12,
}

const STAT_MAX = 10
const BAR_WIDTH = 120
const BAR_HEIGHT = 10

export class CharacterSelectScene extends Scene {

  constructor() {
    super(SCENES.CHARACTER_SELECT)
    this.selectedIndex = 0
  }

  create() {
    this.selectedIndex = 0
    this.cameras.main.setBackgroundColor(COLORS.DARK_BG)

    this.drawHeader()
    this.drawCharacterCards()
    this.drawSelectedDetail()
    this.drawNavigation()
    this.setupInput()
  }

  drawHeader() {
    // Título
    this.add.text(GAME_WIDTH / 2, 40, 'ELIGE TU PERSONAJE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      letterSpacing: 4,
    }).setOrigin(0.5)

    // Línea decorativa
    const g = this.add.graphics()
    g.fillStyle(COLORS.GOLD, 0.6)
    g.fillRect(GAME_WIDTH / 2 - 200, 62, 400, 2)
  }

  drawCharacterCards() {
    // Limpiamos cards anteriores si existen
    if (this.cardContainers) {
      this.cardContainers.forEach(c => c.destroy())
    }
    this.cardContainers = []

    const cardWidth = 200
    const cardHeight = 280
    const gap = 40
    const totalWidth = CHARACTERS.length * cardWidth + (CHARACTERS.length - 1) * gap
    const startX = (GAME_WIDTH - totalWidth) / 2

    CHARACTERS.forEach((char, i) => {
      const x = startX + i * (cardWidth + gap)
      const y = 100
      const isSelected = i === this.selectedIndex
      const container = this.add.container(x, y)

      const g = this.add.graphics()

      // Fondo de la card
      if (!char.available) {
        g.fillStyle(0x1a1a2e, 0.6)
      } else if (isSelected) {
        g.fillStyle(COLORS.UI_BG, 1)
      } else {
        g.fillStyle(COLORS.UI_BG, 0.7)
      }
      g.fillRect(0, 0, cardWidth, cardHeight)

      // Borde
      if (isSelected && char.available) {
        g.lineStyle(3, COLORS.GOLD, 1)
        // Esquinas decorativas
        const cornerSize = 8
        // Esquina superior izquierda
        g.fillStyle(COLORS.GOLD, 1)
        g.fillRect(-2, -2, cornerSize, 3)
        g.fillRect(-2, -2, 3, cornerSize)
        // Esquina superior derecha
        g.fillRect(cardWidth - cornerSize + 2, -2, cornerSize, 3)
        g.fillRect(cardWidth - 1, -2, 3, cornerSize)
        // Esquina inferior izquierda
        g.fillRect(-2, cardHeight - 1, cornerSize, 3)
        g.fillRect(-2, cardHeight - cornerSize + 2, 3, cornerSize)
        // Esquina inferior derecha
        g.fillRect(cardWidth - cornerSize + 2, cardHeight - 1, cornerSize, 3)
        g.fillRect(cardWidth - 1, cardHeight - cornerSize + 2, 3, cornerSize)
      } else {
        g.lineStyle(2, COLORS.UI_BORDER, 0.8)
      }
      g.strokeRect(0, 0, cardWidth, cardHeight)

      container.add(g)

      // Zona del sprite (placeholder: silueta pixel art)
      const spriteG = this.add.graphics()
      spriteG.fillStyle(0x2a2a4a, 1)
      spriteG.fillRect(50, 20, 100, 100)
      spriteG.lineStyle(1, 0x4a4a6a, 1)
      spriteG.strokeRect(50, 20, 100, 100)

      // Silueta placeholder del personaje
      this.drawCharacterSilhouette(spriteG, 100, 70, char.id, char.available)

      container.add(spriteG)

      // Nombre del personaje
      const nameColor = char.available ? '#ffffff' : '#555555'
      const nameText = this.add.text(cardWidth / 2, 135, char.name, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: nameColor,
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5)
      container.add(nameText)

      // Stats en miniatura
      if (char.available) {
        this.drawMiniStats(container, char.stats, 25, 158)
      } else {
        // Candado
        const lockText = this.add.text(cardWidth / 2, 200, '???', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#444444',
        }).setOrigin(0.5)
        container.add(lockText)

        const lockedText = this.add.text(cardWidth / 2, 235, 'BLOQUEADO', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#444444',
        }).setOrigin(0.5)
        container.add(lockedText)
      }

      this.cardContainers.push(container)
    })
  }

  drawCharacterSilhouette(graphics, cx, cy, charId, available) {
    const color = available ? 0x88aadd : 0x444466
    graphics.fillStyle(color, 1)

    // Cabeza
    graphics.fillRect(cx - 6, cy - 24, 12, 12)
    // Cuerpo
    graphics.fillRect(cx - 8, cy - 12, 16, 18)
    // Piernas
    graphics.fillRect(cx - 8, cy + 6, 6, 12)
    graphics.fillRect(cx + 2, cy + 6, 6, 12)
    // Brazos
    graphics.fillRect(cx - 14, cy - 10, 6, 14)
    graphics.fillRect(cx + 8, cy - 10, 6, 14)
  }

  drawMiniStats(container, stats, x, y) {
    const statNames = { peso: 'PES', equilibrio: 'EQU', altura: 'ALT', edad: 'EDA' }
    const entries = Object.entries(stats)

    entries.forEach(([key, value], i) => {
      const sy = y + i * 22

      // Nombre del stat
      const label = this.add.text(x, sy, statNames[key], {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#aaaaaa',
      })
      container.add(label)

      // Barra del stat
      const barG = this.add.graphics()
      // Fondo de la barra
      barG.fillStyle(0x1a1a2e, 1)
      barG.fillRect(x + 35, sy + 2, BAR_WIDTH, BAR_HEIGHT)
      // Relleno
      const fillWidth = (value / STAT_MAX) * BAR_WIDTH
      barG.fillStyle(STAT_COLORS[key], 1)
      barG.fillRect(x + 35, sy + 2, fillWidth, BAR_HEIGHT)
      // Borde
      barG.lineStyle(1, 0x4a4a6a, 1)
      barG.strokeRect(x + 35, sy + 2, BAR_WIDTH, BAR_HEIGHT)
      container.add(barG)
    })
  }

  drawSelectedDetail() {
    // Panel inferior con detalle del personaje seleccionado
    if (this.detailContainer) {
      this.detailContainer.destroy()
    }

    const char = CHARACTERS[this.selectedIndex]
    if (!char.available) return

    this.detailContainer = this.add.container(0, 0)

    const panelY = 420
    const panelH = 100
    const g = this.add.graphics()
    g.fillStyle(COLORS.UI_BG, 0.9)
    g.fillRect(GAME_WIDTH / 2 - 250, panelY, 500, panelH)
    g.lineStyle(2, COLORS.UI_BORDER, 1)
    g.strokeRect(GAME_WIDTH / 2 - 250, panelY, 500, panelH)
    this.detailContainer.add(g)

    // Descripción
    const desc = this.add.text(GAME_WIDTH / 2, panelY + panelH / 2, char.description, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5)
    this.detailContainer.add(desc)
  }

  drawNavigation() {
    // Flechas de navegación
    const arrowY = 230

    this.leftArrow = this.add.text(60, arrowY, '<', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.text(GAME_WIDTH - 60, arrowY, '>', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Botón de jugar
    const btnY = 560
    const btnG = this.add.graphics()
    btnG.fillStyle(COLORS.UI_HIGHLIGHT, 1)
    btnG.fillRect(GAME_WIDTH / 2 - 90, btnY, 180, 40)
    btnG.lineStyle(2, COLORS.WHITE, 1)
    btnG.strokeRect(GAME_WIDTH / 2 - 90, btnY, 180, 40)

    this.playBtn = this.add.text(GAME_WIDTH / 2, btnY + 20, 'JUGAR', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Zona interactiva del botón
    const btnZone = this.add.zone(GAME_WIDTH / 2, btnY + 20, 180, 40)
      .setInteractive({ useHandCursor: true })

    btnZone.on('pointerdown', () => {
      this.startGame()
    })

    // Instrucción
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '< >  ELEGIR     ESPACIO  JUGAR', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666688',
    }).setOrigin(0.5)
  }

  setupInput() {
    this.leftArrow.on('pointerdown', () => this.navigate(-1))
    this.rightArrow.on('pointerdown', () => this.navigate(1))

    this.input.keyboard.on('keydown-LEFT', () => this.navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1))
    this.input.keyboard.on('keydown-SPACE', () => this.startGame())
    this.input.keyboard.on('keydown-ENTER', () => this.startGame())
  }

  navigate(direction) {
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      CHARACTERS.length
    )
    this.refreshUI()
  }

  refreshUI() {
    this.drawCharacterCards()
    this.drawSelectedDetail()
  }

  startGame() {
    const char = CHARACTERS[this.selectedIndex]
    if (!char.available) return

    this.scene.start(SCENES.GAME, {
      character: char,
    })
  }
}
