import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'
import { createCharacterCard } from '../components/CharacterCard'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'
import { unlockService } from '../services/UnlockService'

// ── Dimensiones de las fichas ────────────────────────────────
const CARD_WIDTH   = 240
const CARD_HEIGHT  = 360
const CARD_GAP     = 40
const CARD_STEP    = CARD_WIDTH + CARD_GAP
const CARDS_Y      = 150
const CARD_PADDING = 6

const IMG_W = CARD_WIDTH - CARD_PADDING * 2
const IMG_H = 230

const STATS_Y    = CARD_PADDING + IMG_H + 14    // = IMG_Y + IMG_H + 8
const STATS_X    = CARD_PADDING + 4
const BAR_WIDTH  = CARD_WIDTH - CARD_PADDING * 2 - 44
const BAR_HEIGHT = 10
const STAT_ROW_H = 20

// Layout enviado a CharacterCard
const CARD_LAYOUT = {
  width:       CARD_WIDTH,
  height:      CARD_HEIGHT,
  cardPadding: CARD_PADDING,
  imgW:        IMG_W,
  imgH:        IMG_H,
  statsY:      STATS_Y,
  statsX:      STATS_X,
  barWidth:    BAR_WIDTH,
  barHeight:   BAR_HEIGHT,
  statRowH:    STAT_ROW_H,
}

const VISIBLE_AREA_LEFT  = 60
const VISIBLE_AREA_RIGHT = GAME_WIDTH - 60

const BAND_Y = 120
const BAND_H = 440

export class CharacterSelectScene extends BaseScene {

  constructor() {
    super(SCENES.CHARACTER_SELECT)
  }

  init(data) {
    super.init(data)
    this.perspective = data?.perspective ?? null
  }

  create() {
    this.characters    = CHARACTERS.filter(c => !c.hidden)
    this.selectedIndex = 0
    this.isScrolling   = false

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, 'ELIGE TU PERSONAJE', 280)
    this.createCarousel()
    this.drawSelectedDetail()
    this.drawNavigation()
    this.drawPlayButton()
    this.setupInput()
  }

  // ── Carrusel ─────────────────────────────────────────────────

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardContainers    = []

    this.buildCards()

    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(VISIBLE_AREA_LEFT, CARDS_Y - 10, VISIBLE_AREA_RIGHT - VISIBLE_AREA_LEFT, CARD_HEIGHT + 20)
    this.carouselContainer.setMask(maskShape.createGeometryMask())
  }

  buildCards() {
    this.cardContainers.forEach(c => c.destroy())
    this.cardContainers = []

    this.characters.forEach((char, i) => {
      const isSelected = i === this.selectedIndex
      const isLocked   = !unlockService.isUnlocked(char.id)
      const hint       = isLocked ? unlockService.getHint(char.id) : null
      const container  = createCharacterCard(this, char, isSelected, CARD_LAYOUT, isLocked, hint)
      container.y = CARDS_Y
      this.carouselContainer.add(container)
      this.cardContainers.push(container)
    })

    this.updateCarouselPositions(false)
  }

  updateCarouselPositions(animate = true) {
    const centerX      = GAME_WIDTH / 2 - CARD_WIDTH / 2
    const targetOffset = centerX - this.selectedIndex * CARD_STEP

    if (animate && !this.isScrolling) {
      this.isScrolling = true
      this.cardContainers.forEach((container, i) => {
        const targetX = targetOffset + i * CARD_STEP
        this.tweens.add({
          targets:  container,
          x:        targetX,
          duration: 250,
          ease:     'Cubic.easeOut',
          onComplete: () => { if (i === this.selectedIndex) this.isScrolling = false },
        })
      })
    } else {
      this.cardContainers.forEach((container, i) => {
        container.x = targetOffset + i * CARD_STEP
      })
    }

    this.cardContainers.forEach((container, i) => {
      const isSelected  = i === this.selectedIndex
      const distance    = Math.abs(i - this.selectedIndex)
      const targetAlpha = isSelected ? 1 : Math.max(0.4, 1 - distance * 0.25)
      const targetScale = isSelected ? 1 : Math.max(0.85, 1 - distance * 0.06)

      if (animate) {
        this.tweens.add({
          targets:  container,
          alpha:    targetAlpha,
          scaleX:   targetScale,
          scaleY:   targetScale,
          duration: 250,
          ease:     'Cubic.easeOut',
        })
      } else {
        container.setAlpha(targetAlpha)
        container.setScale(targetScale)
      }
    })
  }

  // ── Detalle del personaje seleccionado ───────────────────────
  // Panel ancho debajo del botón SELECCIONAR

  drawSelectedDetail() {
    if (this.detailContainer) this.detailContainer.destroy()

    const char = this.characters[this.selectedIndex]
    if (!char) return

    const isLocked = !unlockService.isUnlocked(char.id)
    const text     = isLocked
      ? (unlockService.getHint(char.id) ?? 'Personaje bloqueado')
      : char.description
    const color    = isLocked ? '#555577' : '#ffd700'

    this.detailContainer = this.add.container(0, 0)

    const panelW = Math.round(GAME_WIDTH * 0.9)
    const panelH = 76
    const panelX = Math.round((GAME_WIDTH - panelW) / 2)
    const panelY = 640   // justo debajo del botón SELECCIONAR (centro Y=600)

    const g = this.add.graphics()
    g.fillStyle(0x0d0d24, 0.82)
    g.fillRect(panelX, panelY, panelW, panelH)
    g.lineStyle(1, COLORS.GOLD, 0.4)
    g.strokeRect(panelX, panelY, panelW, panelH)
    this.detailContainer.add(g)

    this.detailContainer.add(
      this.add.text(GAME_WIDTH / 2, panelY + panelH / 2, text, {
        fontFamily:      'monospace',
        fontSize:        '16px',
        color,
        stroke:          '#000000',
        strokeThickness: 5,
        align:           'center',
        wordWrap:        { width: panelW - 48 },
      }).setOrigin(0.5),
    )
  }

  // ── Navegación ───────────────────────────────────────────────

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_HEIGHT / 2

    this.leftArrow = this.add.image(40, arrowY, 'btn-nav-left')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.image(GAME_WIDTH - 40, arrowY, 'btn-nav-right')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.dotsContainer = this.add.container(GAME_WIDTH / 2, CARDS_Y + CARD_HEIGHT + 66)
    this.updateDots()

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, '◀ ▶  ELEGIR     ESPACIO  SELECCIONAR', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#555577',
    }).setOrigin(0.5)
  }

  updateDots() {
    this.dotsContainer.removeAll(true)
    const dotSpacing = 16
    const totalW     = (this.characters.length - 1) * dotSpacing
    const startX     = -totalW / 2

    this.characters.forEach((_, i) => {
      const isActive = i === this.selectedIndex
      const dot      = this.add.graphics()
      dot.fillStyle(isActive ? COLORS.GOLD : 0x444466, 1)
      const size = isActive ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - size / 2, -size / 2, size, size)
      this.dotsContainer.add(dot)
    })
  }

  // ── Botón JUGAR ──────────────────────────────────────────────

  drawPlayButton() {
    const btnY      = BAND_Y + BAND_H + 40
    const flagSize  = 18
    const flagSpacing = 160
    const flagsG    = this.add.graphics()

    const lfx = GAME_WIDTH / 2 - flagSpacing
    flagsG.fillStyle(0x888888, 1)
    flagsG.fillRect(lfx, btnY - flagSize + 2, 3, flagSize + 6)
    flagsG.fillStyle(0xffffff, 0.9)
    flagsG.fillRect(lfx + 3, btnY - flagSize + 2, 14, 10)
    flagsG.lineStyle(1, 0xcccccc, 0.8)
    flagsG.strokeRect(lfx + 3, btnY - flagSize + 2, 14, 10)

    const rfx = GAME_WIDTH / 2 + flagSpacing
    flagsG.fillStyle(0x888888, 1)
    flagsG.fillRect(rfx - 2, btnY - flagSize + 2, 3, flagSize + 6)
    flagsG.fillStyle(0xffffff, 0.9)
    flagsG.fillRect(rfx - 17, btnY - flagSize + 2, 14, 10)
    flagsG.lineStyle(1, 0xcccccc, 0.8)
    flagsG.strokeRect(rfx - 17, btnY - flagSize + 2, 14, 10)

    this.playText = this.add.text(GAME_WIDTH / 2, btnY, 'SELECCIONAR', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '52px',
      color:      '#ffd700',
      stroke:     '#1a0800',
      strokeThickness: 8,
      letterSpacing:   12,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.playText.on('pointerdown', () => this.startGame())

    this.tweens.add({
      targets:  this.playText,
      scaleX:   1.08,
      scaleY:   1.08,
      duration: 800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })

  }

  // ── Input ────────────────────────────────────────────────────

  setupInput() {
    this.leftArrow.on('pointerdown',  () => { this.leftArrow.setTexture('btn-nav-left-press'); this.navigate(-1) })
    this.leftArrow.on('pointerup',    () => this.leftArrow.setTexture('btn-nav-left'))
    this.leftArrow.on('pointerout',   () => this.leftArrow.setTexture('btn-nav-left'))
    this.rightArrow.on('pointerdown', () => { this.rightArrow.setTexture('btn-nav-right-press'); this.navigate(1) })
    this.rightArrow.on('pointerup',   () => this.rightArrow.setTexture('btn-nav-right'))
    this.rightArrow.on('pointerout',  () => this.rightArrow.setTexture('btn-nav-right'))

    this.input.keyboard.on('keydown-LEFT',  () => this.navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1))
    this.input.keyboard.on('keydown-SPACE', () => this.startGame())
    this.input.keyboard.on('keydown-ENTER', () => this.startGame())

    this.input.on('pointerdown', (pointer) => { this.swipeStartX = pointer.x })
    this.input.on('pointerup',   (pointer) => {
      if (this.swipeStartX === undefined) return
      const diff = pointer.x - this.swipeStartX
      if (Math.abs(diff) > 50) this.navigate(diff < 0 ? 1 : -1)
      this.swipeStartX = undefined
    })
  }

  navigate(direction) {
    if (this.isScrolling) return
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.characters.length)
    this.buildCards()
    this.drawSelectedDetail()
    this.updateDots()
  }

  startGame() {
    const char = this.characters[this.selectedIndex]
    if (!unlockService.isUnlocked(char.id)) return
    this.scene.start(SCENES.SKIN_SELECT, { character: char, perspective: this.perspective })
  }
}
