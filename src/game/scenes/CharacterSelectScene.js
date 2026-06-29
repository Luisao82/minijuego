import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle, mutedStyle, titleStyle } from '../config/textStyles'
import { CHARACTERS } from '../config/characters'
import { createCharacterCard } from '../components/CharacterCard'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'
import { unlockService } from '../services/UnlockService'
import { rewardStorage } from '../services/RewardStorageService'
import { makeNavButton } from '../components/NavButton'

// ── Dimensiones de las fichas ────────────────────────────────
const CARD_WIDTH = 240
const CARD_HEIGHT = 360
const CARD_GAP = 40
const CARD_STEP = CARD_WIDTH + CARD_GAP
const CARDS_Y = 150
const CARD_PADDING = 6

const IMG_W = CARD_WIDTH - CARD_PADDING * 2
const IMG_H = 230

const STATS_Y = CARD_PADDING + IMG_H + 14 // = IMG_Y + IMG_H + 8
const STATS_X = CARD_PADDING + 4
const BAR_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 56 // reducido para acomodar etiquetas más grandes
const BAR_HEIGHT = 8
const STAT_ROW_H = 26

// Layout enviado a CharacterCard
const CARD_LAYOUT = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  cardPadding: CARD_PADDING,
  imgW: IMG_W,
  imgH: IMG_H,
  statsY: STATS_Y,
  statsX: STATS_X,
  barWidth: BAR_WIDTH,
  barHeight: BAR_HEIGHT,
  statRowH: STAT_ROW_H,
}

const VISIBLE_AREA_LEFT = 60
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
    this.selectedIndex = data?.selectedIndex ?? 0
    // Reset del estado del swipe: Phaser reusa la instancia de la escena entre
    // navegaciones, así que sin esto un valor antiguo de `swipeStartX` podía
    // colarse desde la sesión anterior (cuando el usuario pulsaba 'SELECCIONAR'
    // y la transición ocurría antes del pointerup global). Al volver desde
    // SkinSelectScene, el pointerup del botón 'VOLVER' calculaba un diff con
    // ese valor obsoleto y disparaba una navegación fantasma del carrusel.
    this.swipeStartX = undefined
  }

  create() {
    this.characters = CHARACTERS.filter((c) => !c.hidden)
    this.isScrolling = false

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, 'ELIGE TU PERSONAJE', 280)
    this.createCarousel()
    this.drawSelectedDetail()
    this.drawNavigation()
    this.drawPlayButton()
    this.drawBackButton()
    this.setupInput()
  }

  // ── Botón CAMBIAR VISTA ──────────────────────────────────────
  // Etiqueta y destino fijos (no "VOLVER"): esta escena se entra tanto desde
  // ViewSelectScene como desde "CAMBIAR PERSONAJE" en el game over, así que
  // un botón que dependiera del origen resultaría ambiguo.

  drawBackButton() {
    makeNavButton(
      this,
      12,
      12,
      170,
      44,
      'CAMBIAR VISTA',
      () => this.scene.start(SCENES.VIEW_SELECT),
      { depth: 5, fontSize: '17px' }
    )
  }

  // ── Carrusel ─────────────────────────────────────────────────

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardContainers = []

    this.buildCards()

    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(
      VISIBLE_AREA_LEFT,
      CARDS_Y - 10,
      VISIBLE_AREA_RIGHT - VISIBLE_AREA_LEFT,
      CARD_HEIGHT + 20
    )
    this.carouselContainer.setMask(maskShape.createGeometryMask())
  }

  buildCards() {
    this.cardContainers.forEach((c) => c.destroy())
    this.cardContainers = []

    this.characters.forEach((char, i) => {
      const isSelected = i === this.selectedIndex
      const isLocked = !unlockService.isUnlocked(char.id)
      // Hint dinámico: "Te faltan X premios" para total_rewards, hint estático
      // del JSON para specific_reward (ej. "Consigue la Vajilla de La Cartuja").
      const hint = isLocked ? unlockService.getProgressHint(char.id, rewardStorage) : null
      const container = createCharacterCard(this, char, isSelected, CARD_LAYOUT, isLocked, hint)
      container.y = CARDS_Y
      this.carouselContainer.add(container)
      this.cardContainers.push(container)
    })

    this.updateCarouselPositions(false)
  }

  updateCarouselPositions(animate = true) {
    const centerX = GAME_WIDTH / 2 - CARD_WIDTH / 2
    const targetOffset = centerX - this.selectedIndex * CARD_STEP

    if (animate && !this.isScrolling) {
      this.isScrolling = true
      this.cardContainers.forEach((container, i) => {
        const targetX = targetOffset + i * CARD_STEP
        this.tweens.add({
          targets: container,
          x: targetX,
          duration: 250,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (i === this.selectedIndex) this.isScrolling = false
          },
        })
      })
    } else {
      this.cardContainers.forEach((container, i) => {
        container.x = targetOffset + i * CARD_STEP
      })
    }

    this.cardContainers.forEach((container, i) => {
      const isSelected = i === this.selectedIndex
      const distance = Math.abs(i - this.selectedIndex)
      const targetAlpha = isSelected ? 1 : Math.max(0.4, 1 - distance * 0.25)
      const targetScale = isSelected ? 1 : Math.max(0.85, 1 - distance * 0.06)

      if (animate) {
        this.tweens.add({
          targets: container,
          alpha: targetAlpha,
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 250,
          ease: 'Cubic.easeOut',
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
    const text = isLocked
      ? (unlockService.getProgressHint(char.id, rewardStorage) ?? 'Personaje bloqueado')
      : char.description
    const color = isLocked ? '#555577' : '#ffd700'

    this.detailContainer = this.add.container(0, 0)

    const panelW = Math.round(GAME_WIDTH * 0.9)
    const panelH = 90
    const panelX = Math.round((GAME_WIDTH - panelW) / 2)
    const panelY = 640 // justo debajo del botón SELECCIONAR (centro Y=600)

    const g = this.add.graphics()
    g.fillStyle(0x0d0d24, 0.82)
    g.fillRect(panelX, panelY, panelW, panelH)
    g.lineStyle(1, COLORS.GOLD, 0.4)
    g.strokeRect(panelX, panelY, panelW, panelH)
    this.detailContainer.add(g)

    // Override de stroke '#000000' por contraste con el panel oscuro.
    this.detailContainer.add(
      this.add
        .text(GAME_WIDTH / 2, panelY + panelH / 2, text, {
          ...headingStyle(22, color, 4),
          stroke: '#000000',
          align: 'center',
          wordWrap: { width: panelW - 48 },
        })
        .setOrigin(0.5)
    )
  }

  // ── Navegación ───────────────────────────────────────────────

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_HEIGHT / 2

    this.leftArrow = this.add
      .image(40, arrowY, 'btn-nav-left')
      .setOrigin(0.5)
      .setScale(2)
      .setInteractive({ useHandCursor: true })

    this.rightArrow = this.add
      .image(GAME_WIDTH - 40, arrowY, 'btn-nav-right')
      .setOrigin(0.5)
      .setScale(2)
      .setInteractive({ useHandCursor: true })

    this.dotsContainer = this.add.container(GAME_WIDTH / 2, CARDS_Y + CARD_HEIGHT + 66)
    this.updateDots()

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 15,
        '◀ ▶  ELEGIR     ESPACIO  SELECCIONAR',
        mutedStyle(10, '#555577')
      )
      .setOrigin(0.5)
  }

  updateDots() {
    this.dotsContainer.removeAll(true)
    const dotSpacing = 16
    const totalW = (this.characters.length - 1) * dotSpacing
    const startX = -totalW / 2

    this.characters.forEach((_, i) => {
      const isActive = i === this.selectedIndex
      const dot = this.add.graphics()
      dot.fillStyle(isActive ? COLORS.GOLD : 0x444466, 1)
      const size = isActive ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - size / 2, -size / 2, size, size)
      this.dotsContainer.add(dot)
    })
  }

  // ── Botón JUGAR ──────────────────────────────────────────────

  drawPlayButton() {
    const btnY = BAND_Y + BAND_H + 40
    const flagSize = 18
    const flagSpacing = 160
    const flagsG = this.add.graphics()

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

    // Override de stroke '#1a0800' (marrón ligeramente más cálido que el de marca).
    this.playText = this.add
      .text(GAME_WIDTH / 2, btnY, 'SELECCIONAR', {
        ...titleStyle(52, COLOR_GOLD, 8),
        stroke: '#1a0800',
        letterSpacing: 12,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    this.playText.on('pointerdown', () => this.startGame())

    this.tweens.add({
      targets: this.playText,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ── Input ────────────────────────────────────────────────────

  setupInput() {
    this.leftArrow.on('pointerdown', () => {
      this.leftArrow.setTexture('btn-nav-left-press')
      this.navigate(-1)
    })
    this.leftArrow.on('pointerup', () => this.leftArrow.setTexture('btn-nav-left'))
    this.leftArrow.on('pointerout', () => this.leftArrow.setTexture('btn-nav-left'))
    this.rightArrow.on('pointerdown', () => {
      this.rightArrow.setTexture('btn-nav-right-press')
      this.navigate(1)
    })
    this.rightArrow.on('pointerup', () => this.rightArrow.setTexture('btn-nav-right'))
    this.rightArrow.on('pointerout', () => this.rightArrow.setTexture('btn-nav-right'))

    this.input.keyboard.on('keydown-LEFT', () => this.navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1))
    this.input.keyboard.on('keydown-SPACE', () => this.startGame())
    this.input.keyboard.on('keydown-ENTER', () => this.startGame())

    // Swipe horizontal — acotado a la banda vertical del carrusel.
    // Sin la cota Y, el pointerdown del botón 'SELECCIONAR' (debajo del carrusel)
    // se cuela como inicio de swipe y, combinado con la transición de escena,
    // puede provocar una navegación fantasma al volver desde SkinSelectScene.
    const swipeYMin = CARDS_Y
    const swipeYMax = CARDS_Y + CARD_HEIGHT
    const isInSwipeBand = (pointer) => pointer.y >= swipeYMin && pointer.y <= swipeYMax

    this.input.on('pointerdown', (pointer) => {
      if (!isInSwipeBand(pointer)) return
      this.swipeStartX = pointer.x
    })
    this.input.on('pointerup', (pointer) => {
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
    this.scene.start(SCENES.SKIN_SELECT, {
      character: char,
      perspective: this.perspective,
      selectedIndex: this.selectedIndex,
    })
  }
}
