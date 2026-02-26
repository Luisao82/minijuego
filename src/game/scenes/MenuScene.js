import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'

export class MenuScene extends Scene {

  constructor() {
    super(SCENES.MENU)
  }

  create() {
    this.drawBackground()
    this.drawTitle()
    this.drawStartPrompt()
    this.setupInput()
  }

  drawBackground() {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu')

    const scaleX = GAME_WIDTH / bg.width
    const scaleY = GAME_HEIGHT / bg.height
    const scale = Math.max(scaleX, scaleY)
    bg.setScale(scale)
  }

  drawTitle() {
    const frameX = GAME_WIDTH / 2 - 280
    const frameY = 440
    const frameW = 560
    const frameH = 120

    const g = this.add.graphics()
    g.fillStyle(COLORS.DARK_BG, 0.85)
    g.fillRect(frameX, frameY, frameW, frameH)
    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(frameX, frameY, frameW, frameH)
    g.lineStyle(1, COLORS.GOLD, 0.5)
    g.strokeRect(frameX + 6, frameY + 6, frameW - 12, frameH - 12)

    this.add.text(GAME_WIDTH / 2, frameY + 35, 'LA CUCAÑA', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
      letterSpacing: 8,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, frameY + 80, 'TRIANERA', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      letterSpacing: 12,
    }).setOrigin(0.5)
  }

  drawStartPrompt() {
    this.startText = this.add.text(GAME_WIDTH / 2, 620, 'PULSA PARA EMPEZAR', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.startText.visible = !this.startText.visible
      },
    })

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'VELÁ DE SANTA ANA · TRIANA · SEVILLA', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#4a90d9',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5)
  }

  setupInput() {
    this.input.once('pointerdown', () => {
      this.scene.start(SCENES.CHARACTER_SELECT)
    })

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start(SCENES.CHARACTER_SELECT)
    })
  }
}
