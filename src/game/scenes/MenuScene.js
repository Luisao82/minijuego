import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'

const AMBER = 0xd4a520

const CENTER_X = GAME_WIDTH / 2
const TITLE_Y = GAME_HEIGHT / 2 - 40
const SUB_Y = TITLE_Y + 80

export class MenuScene extends Scene {

  constructor() {
    super(SCENES.MENU)
  }

  create() {
    this.drawBackground()
    this.animateTitle()
  }

  drawBackground() {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu')

    const scaleX = GAME_WIDTH / bg.width
    const scaleY = GAME_HEIGHT / bg.height
    const scale = Math.max(scaleX, scaleY)
    bg.setScale(scale)
  }

  animateTitle() {
    // "La Cucaña" — empieza fuera de pantalla arriba
    this.titleText = this.add.text(CENTER_X, -120, 'La Cucaña', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '110px',
      color: '#ff6b35',
      stroke: '#1a0a00',
      strokeThickness: 10,
      letterSpacing: 4,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 0,
        fill: true,
      },
    }).setOrigin(0.5).setAlpha(0)

    // "de Triana" — empieza muy pequeño (viene desde el fondo)
    this.subText = this.add.text(CENTER_X, SUB_Y, 'de Triana', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '58px',
      color: '#ffd647',
      stroke: '#1a0a00',
      strokeThickness: 7,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 0,
        fill: true,
      },
    }).setOrigin(0.5).setScale(0).setAlpha(0)

    // Fondo oscuro — empieza fuera a la izquierda
    this.titleBg = this.add.graphics()
    this.titleBg.fillStyle(0x0a0a1e, 0.6)
    this.titleBg.fillRoundedRect(-340, -75, 680, 210, 10)
    this.titleBg.setPosition(CENTER_X, TITLE_Y + 30)
    this.titleBg.setAlpha(0)
    this.titleBg.x = -400

    // Los textos deben estar por encima del fondo
    this.titleText.setDepth(2)
    this.subText.setDepth(2)
    this.titleBg.setDepth(1)

    // === SECUENCIA DE ANIMACIÓN ===

    // 1. "La Cucaña" cae desde arriba, desacelera al llegar
    this.titleText.setAlpha(1)
    this.tweens.add({
      targets: this.titleText,
      y: TITLE_Y,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 2. "de Triana" aparece desde el fondo (escala 0 → 1) de golpe
        this.subText.setAlpha(1)
        this.tweens.add({
          targets: this.subText,
          scale: 1,
          duration: 350,
          ease: 'Back.easeOut',
          onComplete: () => {
            // 3. Fondo oscuro se desliza desde la izquierda
            this.titleBg.setAlpha(1)
            this.tweens.add({
              targets: this.titleBg,
              x: CENTER_X,
              duration: 400,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                // 4. Oscilación suave permanente en "La Cucaña"
                this.startIdleAnimation()
                // 5. Mostrar botones
                this.drawStartPrompt()
                this.setupInput()
              },
            })
          },
        })
      },
    })
  }

  startIdleAnimation() {
    // Balanceo muy suave (±0.8 grados)
    this.tweens.add({
      targets: this.titleText,
      rotation: Phaser.Math.DegToRad(0.8),
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Contra-balanceo desde el otro lado
    this.titleText.setRotation(Phaser.Math.DegToRad(-0.8))
  }

  drawStartPrompt() {
    this.startText = this.add.text(GAME_WIDTH / 2, SUB_Y + 100, 'PULSA PARA EMPEZAR', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(2)

    // Fade in del texto
    this.tweens.add({
      targets: this.startText,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        // Parpadeo
        this.time.addEvent({
          delay: 500,
          loop: true,
          callback: () => {
            this.startText.visible = !this.startText.visible
          },
        })
      },
    })

    // Botón HISTORIA
    this.drawHistoriaButton()

    // Créditos abajo
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'VELÁ DE SANTA ANA · TRIANA · SEVILLA', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '13px',
      color: '#ffcc44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2)
  }

  drawHistoriaButton() {
    const btnW = 190
    const btnH = 50
    const btnX = 16
    const btnY = GAME_HEIGHT - 84   // anclado en esquina inferior izquierda, sobre créditos
    const cL   = 9                  // longitud de las líneas de esquina decorativas

    this.historiaBounds = new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH)

    const g = this.add.graphics().setDepth(2)

    const corners = (alpha) => {
      g.lineStyle(2, AMBER, alpha)
      // superior izquierda
      g.lineBetween(btnX + 2,         btnY + 2,         btnX + 2 + cL, btnY + 2)
      g.lineBetween(btnX + 2,         btnY + 2,         btnX + 2,      btnY + 2 + cL)
      // superior derecha
      g.lineBetween(btnX + btnW - 2,  btnY + 2,         btnX + btnW - 2 - cL, btnY + 2)
      g.lineBetween(btnX + btnW - 2,  btnY + 2,         btnX + btnW - 2,      btnY + 2 + cL)
      // inferior izquierda
      g.lineBetween(btnX + 2,         btnY + btnH - 2,  btnX + 2 + cL, btnY + btnH - 2)
      g.lineBetween(btnX + 2,         btnY + btnH - 2,  btnX + 2,      btnY + btnH - 2 - cL)
      // inferior derecha
      g.lineBetween(btnX + btnW - 2,  btnY + btnH - 2,  btnX + btnW - 2 - cL, btnY + btnH - 2)
      g.lineBetween(btnX + btnW - 2,  btnY + btnH - 2,  btnX + btnW - 2,      btnY + btnH - 2 - cL)
    }

    const drawNormal = () => {
      g.clear()
      g.fillStyle(0x0d0600, 0.88)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(1, AMBER, 0.5)
      g.strokeRect(btnX, btnY, btnW, btnH)
      corners(0.85)
    }
    const drawHover = () => {
      g.clear()
      g.fillStyle(0x3d1800, 0.97)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, AMBER, 1)
      g.strokeRect(btnX, btnY, btnW, btnH)
      corners(1)
    }
    drawNormal()

    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '📜  HISTORIA', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '22px',
      color: '#d4a520',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3)

    g.setInteractive(this.historiaBounds, Phaser.Geom.Rectangle.Contains)
    g.on('pointerover', drawHover)
    g.on('pointerout', drawNormal)
    g.on('pointerdown', () => this.scene.start(SCENES.HISTORY))
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (!this.historiaBounds || !Phaser.Geom.Rectangle.Contains(this.historiaBounds, pointer.x, pointer.y)) {
        this.scene.start(SCENES.CHARACTER_SELECT)
      }
    })

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start(SCENES.CHARACTER_SELECT)
    })
  }
}
