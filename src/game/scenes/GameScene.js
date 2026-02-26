import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'

export class GameScene extends Scene {

  constructor() {
    super(SCENES.GAME)
  }

  init(data) {
    this.characterData = data.character || null
  }

  create() {
    this.drawBackground()
    this.drawHUD()
    this.drawPole()
    this.drawPlayer()
    this.drawPlaceholderMessage()
    this.setupInput()
  }

  drawBackground() {
    const g = this.add.graphics()

    // Cielo diurno (la cucaña es de día)
    const skyColors = [0x87ceeb, 0x6ab7e6, 0x4a9fd9, 0x3a8fc9]
    const bandHeight = Math.ceil(GAME_HEIGHT * 0.45 / skyColors.length)
    skyColors.forEach((color, i) => {
      g.fillStyle(color, 1)
      g.fillRect(0, i * bandHeight, GAME_WIDTH, bandHeight)
    })

    // Sol
    g.fillStyle(0xffd700, 1)
    g.fillCircle(150, 80, 30)
    g.fillStyle(0xffec8b, 0.3)
    g.fillCircle(150, 80, 45)

    // Nubes pixel art
    this.drawPixelCloud(g, 300, 60, 1)
    this.drawPixelCloud(g, 700, 40, 0.8)
    this.drawPixelCloud(g, 500, 90, 0.6)

    // Público en la orilla (siluetas)
    g.fillStyle(0x2d6b4a, 1)
    g.fillRect(0, GAME_HEIGHT * 0.38, GAME_WIDTH, 30)
    this.drawCrowd(g, GAME_HEIGHT * 0.35)

    // Río
    const riverY = GAME_HEIGHT * 0.45
    g.fillStyle(COLORS.RIVER_BLUE, 1)
    g.fillRect(0, riverY, GAME_WIDTH, GAME_HEIGHT - riverY)

    // Olas pixeladas
    g.fillStyle(COLORS.RIVER_DARK, 0.5)
    for (let i = 0; i < 30; i++) {
      const wx = Phaser.Math.Between(0, GAME_WIDTH)
      const wy = Phaser.Math.Between(riverY + 20, GAME_HEIGHT - 10)
      g.fillRect(wx, wy, Phaser.Math.Between(10, 40), 2)
    }
  }

  drawPixelCloud(graphics, x, y, scale) {
    graphics.fillStyle(0xffffff, 0.8 * scale)
    graphics.fillRect(x, y, 40, 12)
    graphics.fillRect(x + 8, y - 8, 24, 8)
    graphics.fillRect(x - 8, y + 4, 12, 8)
  }

  drawCrowd(graphics, baseY) {
    // Siluetas de público observando
    const crowdColors = [0x8B4513, 0x654321, 0x4a3520, 0x3b2a1a]
    for (let i = 0; i < 40; i++) {
      const cx = 15 + i * 25 + Phaser.Math.Between(-5, 5)
      const color = crowdColors[i % crowdColors.length]
      graphics.fillStyle(color, 1)
      // Cabeza
      graphics.fillRect(cx, baseY - 8, 8, 8)
      // Cuerpo
      graphics.fillRect(cx - 1, baseY, 10, 14)
    }
  }

  drawHUD() {
    const g = this.add.graphics()

    // Panel superior con info del personaje
    g.fillStyle(COLORS.DARK_BG, 0.8)
    g.fillRect(0, 0, GAME_WIDTH, 36)
    g.fillStyle(COLORS.GOLD, 1)
    g.fillRect(0, 36, GAME_WIDTH, 2)

    // Nombre del personaje
    const charName = this.characterData ? this.characterData.name : 'JUGADOR'
    this.add.text(16, 10, charName, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    })

    // Barra de equilibrio
    this.add.text(GAME_WIDTH / 2 - 100, 10, 'EQUILIBRIO', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    })

    // Barra de equilibrio visual
    const balBarX = GAME_WIDTH / 2
    const balBarW = 200
    g.fillStyle(0x1a1a2e, 1)
    g.fillRect(balBarX, 12, balBarW, 14)
    g.fillStyle(COLORS.GREEN, 1)
    g.fillRect(balBarX, 12, balBarW * 0.7, 14)
    g.lineStyle(1, COLORS.WHITE, 0.5)
    g.strokeRect(balBarX, 12, balBarW, 14)

    // Distancia
    this.add.text(GAME_WIDTH - 160, 10, 'DISTANCIA: 0m', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    })
  }

  drawPole() {
    const g = this.add.graphics()
    const poleY = GAME_HEIGHT * 0.42

    // Barcaza
    g.fillStyle(0x5c3a1e, 1)
    g.fillRect(20, poleY + 10, 120, 25)
    g.fillRect(30, poleY + 35, 100, 10)
    g.lineStyle(1, 0x3d2510, 1)
    g.strokeRect(20, poleY + 10, 120, 25)

    // Soporte del palo
    g.fillStyle(0x4a3520, 1)
    g.fillRect(120, poleY - 15, 20, 30)

    // El palo de la cucaña
    g.fillStyle(COLORS.WOOD_LIGHT, 1)
    g.fillRect(130, poleY - 4, 750, 10)

    // Zonas de aceite (franjas más oscuras/brillantes)
    g.fillStyle(0x9a8520, 0.4)
    g.fillRect(250, poleY - 4, 60, 10)
    g.fillRect(420, poleY - 4, 80, 10)
    g.fillRect(600, poleY - 4, 50, 10)
    g.fillRect(750, poleY - 4, 70, 10)

    // Bandera al final
    g.fillStyle(COLORS.WOOD_DARK, 1)
    g.fillRect(878, poleY - 30, 3, 36)
    g.fillStyle(COLORS.RED, 1)
    g.fillRect(881, poleY - 30, 18, 12)
    g.fillStyle(COLORS.YELLOW, 1)
    g.fillRect(881, poleY - 22, 18, 4)

    // Marcas de distancia bajo el palo
    for (let i = 1; i <= 7; i++) {
      const mx = 130 + i * 100
      g.fillStyle(COLORS.WHITE, 0.3)
      g.fillRect(mx, poleY + 10, 1, 6)
      this.add.text(mx, poleY + 18, `${i}m`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666688',
      }).setOrigin(0.5, 0)
    }
  }

  drawPlayer() {
    const g = this.add.graphics()
    const playerX = 155
    const playerY = GAME_HEIGHT * 0.42 - 4

    // Personaje placeholder pixel art (de pie sobre el palo)
    g.fillStyle(0xffcc88, 1)
    // Cabeza
    g.fillRect(playerX - 6, playerY - 36, 12, 12)
    // Pelo
    g.fillStyle(0x3d2510, 1)
    g.fillRect(playerX - 6, playerY - 38, 12, 4)
    // Cuerpo (camiseta)
    g.fillStyle(0xcc3333, 1)
    g.fillRect(playerX - 8, playerY - 24, 16, 14)
    // Pantalón
    g.fillStyle(0x2244aa, 1)
    g.fillRect(playerX - 7, playerY - 10, 6, 10)
    g.fillRect(playerX + 1, playerY - 10, 6, 10)
    // Brazos
    g.fillStyle(0xffcc88, 1)
    g.fillRect(playerX - 14, playerY - 22, 6, 12)
    g.fillRect(playerX + 8, playerY - 22, 6, 12)
  }

  drawPlaceholderMessage() {
    // Mensaje temporal indicando que es placeholder
    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.7)
    g.fillRect(GAME_WIDTH / 2 - 200, GAME_HEIGHT - 100, 400, 50)
    g.lineStyle(1, COLORS.UI_BORDER, 1)
    g.strokeRect(GAME_WIDTH / 2 - 200, GAME_HEIGHT - 100, 400, 50)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 75, 'PANTALLA DE JUEGO · EN DESARROLLO', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff9900',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Instrucción para volver
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 55, 'ESC · VOLVER AL MENU', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)
  }

  setupInput() {
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start(SCENES.MENU)
    })
  }
}
