import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { rewardStorage } from '../services/RewardStorageService'

const PANEL_W = 480
const PANEL_H = 420
const PANEL_X = (GAME_WIDTH - PANEL_W) / 2
const PANEL_Y = (GAME_HEIGHT - PANEL_H) / 2 - 10
const CENTER_X = GAME_WIDTH / 2
const IMG_SIZE = 128

export class RewardScene extends Scene {

  constructor() {
    super(SCENES.REWARD)
  }

  init(data) {
    this.reward = data.reward || null
    this.characterData = data.character || null
    this.canPlay = false

    // Persistir el premio obtenido en cuanto se recibe (antes de renderizar)
    if (this.reward?.id) {
      rewardStorage.addReward(this.reward.id)
    }
  }

  create() {
    this.drawBackground()
    this.drawPanel()
    this.drawContent()
    this.drawButtons()
    this.setupInput()
    this.playEntrance()
  }

  drawBackground() {
    this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.72)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  drawPanel() {
    const g = this.add.graphics()

    g.fillStyle(0x000000, 0.5)
    g.fillRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W, PANEL_H)

    g.fillStyle(COLORS.DARK_BG, 1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    g.fillStyle(COLORS.GOLD, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, 50)
  }

  drawContent() {
    const topY = PANEL_Y

    this.add.text(CENTER_X, topY + 26, '¡ENHORABUENA!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(CENTER_X, topY + 76, 'has conseguido...', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    const sepG = this.add.graphics()
    sepG.lineStyle(1, COLORS.GOLD, 0.4)
    sepG.strokeRect(PANEL_X + 24, topY + 94, PANEL_W - 48, 1)

    const imgY = topY + 96 + IMG_SIZE / 2 + 16
    this.drawRewardImage(CENTER_X, imgY)

    const nombre = this.reward?.nombre || '¡Premio misterioso!'
    this.add.text(CENTER_X, imgY + IMG_SIZE / 2 + 18, nombre, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
  }

  drawRewardImage(cx, cy) {
    const half = IMG_SIZE / 2

    if (this.reward && this.textures.exists(this.reward.id) &&
        this.textures.get(this.reward.id).key !== '__MISSING') {
      this.add.image(cx, cy, this.reward.id)
        .setDisplaySize(IMG_SIZE, IMG_SIZE)
        .setOrigin(0.5)
    } else {
      const g = this.add.graphics()
      g.fillStyle(0x2a2a4a, 1)
      g.fillRect(cx - half, cy - half, IMG_SIZE, IMG_SIZE)
      g.lineStyle(2, COLORS.GOLD, 0.8)
      g.strokeRect(cx - half, cy - half, IMG_SIZE, IMG_SIZE)
      g.lineStyle(1, COLORS.GOLD, 0.15)
      for (let i = 0; i < IMG_SIZE; i += 16) {
        g.strokeRect(cx - half + i / 2, cy - half + i / 2, IMG_SIZE - i, IMG_SIZE - i)
      }
      this.add.text(cx, cy, '?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '48px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
    }

    this.drawStars(cx, cy, half)
  }

  drawStars(cx, cy, radius) {
    const positions = [
      { x: cx - radius - 20, y: cy - radius - 10 },
      { x: cx + radius + 20, y: cy - radius - 10 },
      { x: cx - radius - 14, y: cy + radius + 14 },
      { x: cx + radius + 14, y: cy + radius + 14 },
    ]

    positions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffd700',
      }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: star,
        alpha: 1,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        delay: 400 + i * 120,
        duration: 300,
        ease: 'Back.easeOut',
      })

      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.4 },
        delay: 800 + i * 120,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  // Dos botones lado a lado dentro del panel
  drawButtons() {
    const btnH = 38
    const btnW = 210
    const gap = 20
    const btnY = PANEL_Y + PANEL_H - 58

    this.makeButton(
      CENTER_X - btnW - gap / 2,
      btnY, btnW, btnH,
      'VOLVER A JUGAR',
      () => { if (this.canPlay) this.playAgain() },
    )

    this.makeButton(
      CENTER_X + gap / 2,
      btnY, btnW, btnH,
      'VER PREMIOS',
      () => { if (this.canPlay) this.viewCollection() },
    )
  }

  makeButton(x, y, w, h, label, onPress) {
    const g = this.add.graphics()

    const drawNormal = () => {
      g.clear()
      g.fillStyle(0x16213e, 1)
      g.fillRect(x, y, w, h)
      g.lineStyle(2, COLORS.GOLD, 0.8)
      g.strokeRect(x, y, w, h)
      g.lineStyle(1, COLORS.GOLD, 0.2)
      g.strokeRect(x + 3, y + 3, w - 6, h - 6)
    }

    const drawHover = () => {
      g.clear()
      g.fillStyle(0x2a2a6e, 1)
      g.fillRect(x, y, w, h)
      g.lineStyle(2, COLORS.GOLD, 1)
      g.strokeRect(x, y, w, h)
    }

    drawNormal()

    this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    g.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains)
    g.on('pointerover', drawHover)
    g.on('pointerout', drawNormal)
    g.on('pointerdown', onPress)
  }

  setupInput() {
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.canPlay) this.playAgain()
    })
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.canPlay) this.scene.start(SCENES.MENU)
    })
  }

  playEntrance() {
    const allObjects = this.children.list.filter(obj => obj !== this.children.list[0])
    allObjects.forEach(obj => {
      if (obj.setAlpha) obj.setAlpha(0)
    })

    this.tweens.add({
      targets: allObjects,
      alpha: 1,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => { this.canPlay = true },
    })
  }

  playAgain() {
    this.scene.start(SCENES.GAME, { character: this.characterData })
  }

  viewCollection() {
    this.scene.start(SCENES.COLLECTION, { character: this.characterData })
  }
}
