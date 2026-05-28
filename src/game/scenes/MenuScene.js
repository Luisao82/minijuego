import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { makeNavButton } from '../components/NavButton'
import { musicService } from '../services/MusicService'
import { version } from '../../../package.json'

const AMBER = 0xd4a520

const CENTER_X = GAME_WIDTH / 2
const TITLE_Y = GAME_HEIGHT / 2 - 40
const SUB_Y = TITLE_Y + 80

export class MenuScene extends BaseScene {

  constructor() {
    super(SCENES.MENU)
  }

  create() {
    this.drawBackground()
    this.animateTitle()
    this._startMusic()
    this._buildMuteButton()
    this._buildCreditsButton()

    // Parar música al salir del menú (a cualquier escena)
    this.events.once('shutdown', () => {
      if (this._music) { this._music.stop(); this._music.destroy() }
    })
  }

  // ── Música de fondo (solo en el menú) ─────────────────────────

  _startMusic() {
    this._music = this.sound.add('music-menu', {
      loop:   true,
      volume: musicService.isMuted ? 0 : 0.4,
    })
    // Phaser gestiona internamente el AudioContext suspendido (móvil/browser autoplay):
    // encola el sonido y lo reproduce en cuanto el contexto se desbloquea.
    if (!musicService.isMuted) this._music.play()
  }

  _buildCreditsButton() {
    // Símbolo © en la esquina superior izquierda — simétrico al ♪ del mute
    this._creditsBtn = this.add.text(16, 14, '©', {
      fontFamily:      'monospace',
      fontSize:        '38px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(10).setInteractive({ useHandCursor: true })

    this._creditsBtn.on('pointerover', () => this._creditsBtn.setScale(1.18))
    this._creditsBtn.on('pointerout',  () => this._creditsBtn.setScale(1))
    this._creditsBtn.on('pointerup',   () => {
      this.sound.play('sfx-click', { volume: 0.6 })
      this.scene.start(SCENES.CREDITS)
    })
  }

  _buildMuteButton() {
    // Nota musical grande sin caja — esquina superior derecha
    this._muteBtn = this.add.text(GAME_WIDTH - 16, 14, '♪', {
      fontFamily:      'monospace',
      fontSize:        '42px',
      color:           musicService.isMuted ? '#555555' : '#ffd700',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true })

    this._muteBtn.on('pointerover', () => {
      this._muteBtn.setScale(1.18)
    })
    this._muteBtn.on('pointerout', () => {
      this._muteBtn.setScale(1)
    })
    this._muteBtn.on('pointerup', () => {
      const muted = musicService.toggleMute()
      this._muteBtn.setColor(muted ? '#555555' : '#ffd700')
      if (this._music) {
        this._music.setVolume(muted ? 0 : 0.4)
        if (!muted && !this._music.isPlaying) this._music.play()
      }
    })
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

    this.tweens.add({
      targets: this.startText,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.addEvent({
          delay: 500,
          loop: true,
          callback: () => { this.startText.visible = !this.startText.visible },
        })
      },
    })

    // Botones HISTORIA (izquierda), ESTADÍSTICAS (centro) y TUTORIAL (derecha)
    this.drawHistoriaButton()
    this.drawStatsButton()
    this.drawTutorialButton()

    // Versión — se actualiza automáticamente desde package.json
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, `v${version}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2)
  }

  drawHistoriaButton() {
    const btnW = 210
    const btnH = 58
    const btnX = 16
    const btnY = GAME_HEIGHT - 104

    this.historiaBounds = makeNavButton(
      this, btnX, btnY, btnW, btnH,
      'HISTORIA',
      () => this.scene.start(SCENES.HISTORY),
      { depth: 2, fontSize: '34px' },
    )
  }

  drawStatsButton() {
    const btnW = 210
    const btnH = 58
    const btnX = GAME_WIDTH / 2 - btnW / 2
    const btnY = GAME_HEIGHT - 104

    this.statsBounds = makeNavButton(
      this, btnX, btnY, btnW, btnH,
      'RÉCORDS',
      () => this.scene.start(SCENES.STATS),
      { depth: 2, fontSize: '28px' },
    )
  }

  drawTutorialButton() {
    const btnW = 210
    const btnH = 58
    const btnX = GAME_WIDTH - 16 - btnW
    const btnY = GAME_HEIGHT - 104

    this.tutorialBounds = makeNavButton(
      this, btnX, btnY, btnW, btnH,
      'TUTORIAL',
      () => this.scene.start(SCENES.TUTORIAL),
      { depth: 2, fontSize: '34px' },
    )
  }

  setupInput() {
    // Primer toque: arrancar música si el browser la bloqueó por autoplay policy
    this.input.once('pointerdown', () => {
      if (this._music && !this._music.isPlaying && !musicService.isMuted) {
        const ctx = this.sound.context
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => this._music.play())
        } else {
          this._music.play()
        }
      }
    })

    // Phaser pasa como segundo argumento el array de objetos interactivos bajo el puntero.
    // Si el puntero está sobre el botón de mute, ignoramos la navegación por fondo.
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      const hitMuteBtn    = currentlyOver?.some(obj => obj === this._muteBtn)
      const hitCreditsBtn = currentlyOver?.some(obj => obj === this._creditsBtn)
      const inHistoria = this.historiaBounds && Phaser.Geom.Rectangle.Contains(this.historiaBounds, pointer.x, pointer.y)
      const inStats    = this.statsBounds    && Phaser.Geom.Rectangle.Contains(this.statsBounds,    pointer.x, pointer.y)
      const inTutorial = this.tutorialBounds && Phaser.Geom.Rectangle.Contains(this.tutorialBounds, pointer.x, pointer.y)
      if (!hitMuteBtn && !hitCreditsBtn && !inHistoria && !inStats && !inTutorial) {
        this.scene.start(SCENES.VIEW_SELECT)
      }
    })

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start(SCENES.CHARACTER_SELECT)
    })
  }
}
