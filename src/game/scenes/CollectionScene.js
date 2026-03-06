import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { rewardStorage } from '../services/RewardStorageService'

// --- Layout de la cuadrícula de fichas ---
const CARD_W = 200
const CARD_H = 260
const CARD_GAP = 24
const CARD_STEP = CARD_W + CARD_GAP                        // 224px entre tarjetas
const VISIBLE_COUNT = 4
// Área visible: 4 tarjetas centradas en pantalla
const AREA_LEFT = Math.round((GAME_WIDTH - (VISIBLE_COUNT * CARD_W + (VISIBLE_COUNT - 1) * CARD_GAP)) / 2)  // 76
const AREA_RIGHT = AREA_LEFT + VISIBLE_COUNT * CARD_W + (VISIBLE_COUNT - 1) * CARD_GAP  // 948
// Cards verticalmente centradas en la pantalla
const CARDS_Y = Math.round(GAME_HEIGHT / 2 - CARD_H / 2)  // 254

// --- Imagen dentro de la ficha ---
const IMG_SIZE = 120
const IMG_Y_LOCAL = Math.round((CARD_H - IMG_SIZE) / 2)   // centra imagen en la card: 70

// --- Franja central (igual que CharacterSelectScene) ---
const BAND_Y = 110
const BAND_H = 480

export class CollectionScene extends Scene {

  constructor() {
    super(SCENES.COLLECTION)
  }

  init(data) {
    this.characterData = data?.character || null
    this.pageStart = 0
    this.scrolling = false
  }

  create() {
    this.rewards = this.cache.json.get('rewards') || []
    this.counts = rewardStorage.getAll()
    this.maxPageStart = Math.max(0, this.rewards.length - VISIBLE_COUNT)

    this.drawBackground()
    this.drawHeader()
    this.createCarousel()
    this.drawNavigation()
    this.drawBackButton()
    this.setupInput()
  }

  // ========================================
  // FONDO — idéntico a CharacterSelectScene
  // ========================================

  drawBackground() {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-characters')
    const scaleX = GAME_WIDTH / bg.width
    const scaleY = GAME_HEIGHT / bg.height
    bg.setScale(Math.max(scaleX, scaleY))

    const overlay = this.add.graphics()
    overlay.fillStyle(0x0a0a1e, 0.35)
    overlay.fillRect(0, 0, GAME_WIDTH, BAND_Y)
    overlay.fillStyle(0x0a0a1e, 0.55)
    overlay.fillRect(0, BAND_Y + BAND_H, GAME_WIDTH, GAME_HEIGHT - BAND_Y - BAND_H)

    const band = this.add.graphics()
    band.fillStyle(0x0a0a1e, 0.25)
    band.fillRect(0, BAND_Y - 30, GAME_WIDTH, 15)
    band.fillStyle(0x0a0a1e, 0.45)
    band.fillRect(0, BAND_Y - 15, GAME_WIDTH, 15)
    band.fillStyle(0x0d0d24, 0.82)
    band.fillRect(0, BAND_Y, GAME_WIDTH, BAND_H)
    band.fillStyle(0x0a0a1e, 0.45)
    band.fillRect(0, BAND_Y + BAND_H, GAME_WIDTH, 15)
    band.fillStyle(0x0a0a1e, 0.25)
    band.fillRect(0, BAND_Y + BAND_H + 15, GAME_WIDTH, 15)

    const lines = this.add.graphics()
    lines.lineStyle(2, COLORS.GOLD, 0.4)
    lines.lineBetween(0, BAND_Y, GAME_WIDTH, BAND_Y)
    lines.lineBetween(0, BAND_Y + BAND_H, GAME_WIDTH, BAND_Y + BAND_H)
    lines.lineStyle(1, COLORS.GOLD, 0.15)
    lines.lineBetween(0, BAND_Y + 3, GAME_WIDTH, BAND_Y + 3)
    lines.lineBetween(0, BAND_Y + BAND_H - 3, GAME_WIDTH, BAND_Y + BAND_H - 3)
  }

  // ========================================
  // CABECERA — título "PREMIOS"
  // ========================================

  drawHeader() {
    const cx = GAME_WIDTH / 2
    const headerY = 55

    const headerBg = this.add.graphics()
    headerBg.fillStyle(0x0a0a1e, 0.6)
    headerBg.fillRect(cx - 200, headerY - 25, 400, 50)
    headerBg.lineStyle(1, COLORS.GOLD, 0.3)
    headerBg.strokeRect(cx - 200, headerY - 25, 400, 50)

    // Esquinas decorativas retro (igual que CharacterSelectScene)
    const c = this.add.graphics()
    c.lineStyle(2, COLORS.GOLD, 0.8)
    const cLen = 12
    const [l, r, t, b] = [cx - 196, cx + 196, headerY - 21, headerY + 21]
    c.lineBetween(l, t, l + cLen, t); c.lineBetween(l, t, l, t + cLen)
    c.lineBetween(r, t, r - cLen, t); c.lineBetween(r, t, r, t + cLen)
    c.lineBetween(l, b, l + cLen, b); c.lineBetween(l, b, l, b - cLen)
    c.lineBetween(r, b, r - cLen, b); c.lineBetween(r, b, r, b - cLen)

    this.add.text(cx, headerY, 'PREMIOS', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#1a0a00',
      strokeThickness: 6,
      letterSpacing: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5)

    const lineY = headerY + 28
    const lineG = this.add.graphics()
    lineG.fillStyle(COLORS.GOLD, 0.6)
    lineG.fillRect(cx - 160, lineY, 320, 1)
    lineG.fillStyle(COLORS.GOLD, 0.9)
    lineG.fillRect(cx - 4, lineY - 3, 8, 8)
    lineG.fillStyle(COLORS.GOLD, 0.35)
    lineG.fillRect(cx - 120, lineY + 4, 240, 1)
  }

  // ========================================
  // CARRUSEL DE FICHAS
  // ========================================

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardObjects = []

    if (this.rewards.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Sin premios disponibles', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5)
      return
    }

    this.rewards.forEach((reward, i) => {
      const count = this.counts[reward.id] || 0
      const card = this.createCard(reward, count, i)
      this.carouselContainer.add(card)
      this.cardObjects.push(card)
    })

    // Máscara: recorta el área visible de las fichas
    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(AREA_LEFT - 4, CARDS_Y - 10, AREA_RIGHT - AREA_LEFT + 8, CARD_H + 20)
    this.carouselContainer.setMask(maskShape.createGeometryMask())

    this.updateCarouselPositions(false)
  }

  createCard(reward, count, index) {
    const earned = count > 0
    const container = this.add.container(AREA_LEFT + index * CARD_STEP, CARDS_Y)

    // --- Fondo y borde de la ficha ---
    const g = this.add.graphics()

    if (earned) {
      g.fillStyle(COLORS.GOLD, 0.08)
      g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
    }

    g.fillStyle(COLORS.UI_BG, earned ? 1 : 0.55)
    g.fillRect(0, 0, CARD_W, CARD_H)

    g.lineStyle(earned ? 2 : 1, earned ? COLORS.GOLD : COLORS.UI_BORDER, earned ? 1 : 0.5)
    g.strokeRect(0, 0, CARD_W, CARD_H)

    if (earned) {
      g.lineStyle(1, COLORS.GOLD, 0.3)
      g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
    }
    container.add(g)

    // --- Nombre (parte superior) ---
    container.add(this.add.text(CARD_W / 2, 14, reward.nombre, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: earned ? '#ffd700' : '#444455',
      stroke: '#000000',
      strokeThickness: earned ? 2 : 1,
      align: 'center',
      wordWrap: { width: CARD_W - 16 },
    }).setOrigin(0.5, 0))

    // --- Imagen (centro exacto de la ficha) ---
    const imgCX = CARD_W / 2
    const imgCY = IMG_Y_LOCAL + IMG_SIZE / 2    // 70 + 60 = 130 = CARD_H/2 ✓

    if (earned && this.textures.exists(reward.id) &&
        this.textures.get(reward.id).key !== '__MISSING') {
      container.add(
        this.add.image(imgCX, imgCY, reward.id)
          .setDisplaySize(IMG_SIZE, IMG_SIZE)
          .setOrigin(0.5),
      )
    } else {
      // Placeholder pixel art
      const imgG = this.add.graphics()
      imgG.fillStyle(earned ? 0x2a2a4a : 0x141420, 1)
      imgG.fillRect(imgCX - IMG_SIZE / 2, IMG_Y_LOCAL, IMG_SIZE, IMG_SIZE)
      imgG.lineStyle(1, earned ? COLORS.GOLD : COLORS.UI_BORDER, 0.5)
      imgG.strokeRect(imgCX - IMG_SIZE / 2, IMG_Y_LOCAL, IMG_SIZE, IMG_SIZE)
      container.add(imgG)

      container.add(this.add.text(imgCX, imgCY, '?', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: earned ? '#ffd700' : '#2a2a3a',
      }).setOrigin(0.5))
    }

    // --- Separador ---
    const sep = this.add.graphics()
    sep.lineStyle(1, earned ? COLORS.GOLD : COLORS.UI_BORDER, 0.3)
    sep.lineBetween(10, CARD_H - 44, CARD_W - 10, CARD_H - 44)
    container.add(sep)

    // --- Contador (parte inferior) ---
    container.add(this.add.text(CARD_W / 2, CARD_H - 22, `x${count}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: earned ? '#ffd700' : '#2a2a3a',
      stroke: '#000000',
      strokeThickness: earned ? 3 : 1,
    }).setOrigin(0.5))

    return container
  }

  updateCarouselPositions(animate) {
    if (animate) this.scrolling = true
    let done = 0
    const total = this.cardObjects.length

    this.cardObjects.forEach((card, i) => {
      const targetX = AREA_LEFT + (i - this.pageStart) * CARD_STEP
      const inView = i >= this.pageStart && i < this.pageStart + VISIBLE_COUNT
      const targetAlpha = inView ? 1 : 0

      if (animate) {
        this.tweens.add({
          targets: card,
          x: targetX,
          alpha: targetAlpha,
          duration: 260,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            done++
            if (done >= total) this.scrolling = false
          },
        })
      } else {
        card.x = targetX
        card.setAlpha(targetAlpha)
      }
    })

    if (!animate) this.scrolling = false
    this.updateNavButtons()
  }

  // ========================================
  // NAVEGACIÓN (flechas + dots)
  // ========================================

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_H / 2  // centro vertical de las fichas (= centro de pantalla)

    this.leftArrow = this.add.text(28, arrowY, '◀', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.text(GAME_WIDTH - 28, arrowY, '▶', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.leftArrow.on('pointerdown', () => this.scroll(-1))
    this.rightArrow.on('pointerdown', () => this.scroll(1))

    this.dotsContainer = this.add.container(GAME_WIDTH / 2, CARDS_Y + CARD_H + 22)
    this.updateDots()
    this.updateNavButtons()
  }

  updateNavButtons() {
    if (!this.leftArrow || !this.rightArrow) return
    this.leftArrow.setAlpha(this.pageStart > 0 ? 1 : 0.2)
    this.rightArrow.setAlpha(this.pageStart < this.maxPageStart ? 1 : 0.2)
  }

  updateDots() {
    if (!this.dotsContainer) return
    this.dotsContainer.removeAll(true)
    const total = this.maxPageStart + 1
    if (total <= 1) return

    const dotSpacing = 16
    const startX = -((total - 1) * dotSpacing) / 2
    for (let i = 0; i < total; i++) {
      const active = i === this.pageStart
      const dot = this.add.graphics()
      dot.fillStyle(active ? COLORS.GOLD : 0x444466, 1)
      const s = active ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - s / 2, -s / 2, s, s)
      this.dotsContainer.add(dot)
    }
  }

  scroll(dir) {
    if (this.scrolling) return
    const next = this.pageStart + dir
    if (next < 0 || next > this.maxPageStart) return
    this.pageStart = next
    this.updateCarouselPositions(true)
    this.updateDots()
  }

  // ========================================
  // BOTÓN VOLVER
  // ========================================

  drawBackButton() {
    const btnW = 220
    const btnH = 38
    const btnX = GAME_WIDTH / 2 - btnW / 2
    const btnY = BAND_Y + BAND_H + 22

    const drawNormal = () => {
      g.clear()
      g.fillStyle(0x16213e, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, COLORS.GOLD, 0.8)
      g.strokeRect(btnX, btnY, btnW, btnH)
      g.lineStyle(1, COLORS.GOLD, 0.2)
      g.strokeRect(btnX + 3, btnY + 3, btnW - 6, btnH - 6)
    }

    const drawHover = () => {
      g.clear()
      g.fillStyle(0x2a2a6e, 1)
      g.fillRect(btnX, btnY, btnW, btnH)
      g.lineStyle(2, COLORS.GOLD, 1)
      g.strokeRect(btnX, btnY, btnW, btnH)
    }

    const g = this.add.graphics()
    drawNormal()

    this.add.text(GAME_WIDTH / 2, btnY + btnH / 2, 'VOLVER AL MENÚ', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    g.setInteractive(
      new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains,
    )
    g.on('pointerover', drawHover)
    g.on('pointerout', drawNormal)
    g.on('pointerdown', () => this.scene.start(SCENES.MENU))
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.keyboard.on('keydown-LEFT', () => this.scroll(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.scroll(1))
    this.input.keyboard.on('keydown-ESC', () => this.scene.start(SCENES.MENU))

    // Soporte swipe táctil
    this.input.on('pointerdown', (p) => { this.swipeX = p.x })
    this.input.on('pointerup', (p) => {
      if (this.swipeX === undefined) return
      const diff = p.x - this.swipeX
      if (Math.abs(diff) > 60) this.scroll(diff < 0 ? 1 : -1)
      this.swipeX = undefined
    })
  }
}
