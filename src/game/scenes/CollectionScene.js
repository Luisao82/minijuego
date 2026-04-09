import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { rewardStorage } from '../services/RewardStorageService'
import { makeNavButton } from '../components/NavButton'
import { createRewardCard } from '../components/RewardCard'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'

// ── Dimensiones de las fichas ────────────────────────────────
const CARD_W   = 200
const CARD_H   = 260
const CARD_GAP = 24
const CARD_STEP = CARD_W + CARD_GAP

const VISIBLE_COUNT = 3
const AREA_LEFT     = Math.round((GAME_WIDTH - (VISIBLE_COUNT * CARD_W + (VISIBLE_COUNT - 1) * CARD_GAP)) / 2)
const AREA_RIGHT    = AREA_LEFT + VISIBLE_COUNT * CARD_W + (VISIBLE_COUNT - 1) * CARD_GAP
// CARDS_Y = 200 → centro de cards en Y=330, igual que las flechas de CharacterSelectScene
const CARDS_Y       = 200

const IMG_SIZE    = 120
const IMG_Y_LOCAL = Math.round((CARD_H - IMG_SIZE) / 2)

// Layout enviado a RewardCard
const CARD_LAYOUT = { width: CARD_W, height: CARD_H, imgSize: IMG_SIZE, imgYLocal: IMG_Y_LOCAL }

// Mismos valores que CharacterSelectScene y SkinSelectScene
const BAND_Y = 120
const BAND_H = 440

const CONFETTI_COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xff69b4, 0xffeaa7, 0xc0392b]

export class CollectionScene extends Scene {

  constructor() {
    super(SCENES.COLLECTION)
  }

  init(data) {
    this.characterData = data?.character || null
    this.pageStart     = 0
    this.scrolling     = false
    this.detailOpen    = false
  }

  create() {
    this.rewards      = this.cache.json.get('rewards') || []
    this.counts       = rewardStorage.getAll()
    this.maxPageStart = Math.max(0, this.rewards.length - VISIBLE_COUNT)

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, 'PREMIOS', 200)
    this.createCarousel()
    this.drawNavigation()
    this.drawButtons()
    this.setupInput()
  }

  // ── Carrusel de fichas ────────────────────────────────────────

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardObjects       = []

    if (this.rewards.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Sin premios disponibles', {
        fontFamily: 'monospace',
        fontSize:   '14px',
        color:      '#888888',
      }).setOrigin(0.5)
      return
    }

    this.rewards.forEach((reward, i) => {
      const count = this.counts[reward.id] || 0
      const card  = createRewardCard(this, reward, count, {
        ...CARD_LAYOUT,
        onPress: (r, c) => { if (!this.detailOpen) this.showRewardDetail(r, c) },
      })
      card.x = AREA_LEFT + i * CARD_STEP
      card.y = CARDS_Y
      this.carouselContainer.add(card)
      this.cardObjects.push(card)
    })

    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(AREA_LEFT - 4, CARDS_Y - 10, AREA_RIGHT - AREA_LEFT + 8, CARD_H + 20)
    this.carouselContainer.setMask(maskShape.createGeometryMask())

    this.updateCarouselPositions(false)
  }

  updateCarouselPositions(animate) {
    if (animate) this.scrolling = true
    let done  = 0
    const total = this.cardObjects.length

    this.cardObjects.forEach((card, i) => {
      const targetX     = AREA_LEFT + (i - this.pageStart) * CARD_STEP
      const inView      = i >= this.pageStart && i < this.pageStart + VISIBLE_COUNT
      const targetAlpha = inView ? 1 : 0

      if (animate) {
        this.tweens.add({
          targets:  card,
          x:        targetX,
          alpha:    targetAlpha,
          duration: 260,
          ease:     'Cubic.easeOut',
          onComplete: () => { done++; if (done >= total) this.scrolling = false },
        })
      } else {
        card.x = targetX
        card.setAlpha(targetAlpha)
      }
    })

    if (!animate) this.scrolling = false
    this.updateNavButtons()
  }

  // ── Navegación ───────────────────────────────────────────────

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_H / 2

    this.leftArrow = this.add.image(40, arrowY, 'btn-nav-left')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.image(GAME_WIDTH - 40, arrowY, 'btn-nav-right')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.leftArrow.on('pointerdown',  () => { this.leftArrow.setTexture('btn-nav-left-press'); this.scroll(-1) })
    this.leftArrow.on('pointerup',    () => this.leftArrow.setTexture('btn-nav-left'))
    this.leftArrow.on('pointerout',   () => this.leftArrow.setTexture('btn-nav-left'))
    this.rightArrow.on('pointerdown', () => { this.rightArrow.setTexture('btn-nav-right-press'); this.scroll(1) })
    this.rightArrow.on('pointerup',   () => this.rightArrow.setTexture('btn-nav-right'))
    this.rightArrow.on('pointerout',  () => this.rightArrow.setTexture('btn-nav-right'))

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
    const startX     = -((total - 1) * dotSpacing) / 2
    for (let i = 0; i < total; i++) {
      const active = i === this.pageStart
      const dot    = this.add.graphics()
      dot.fillStyle(active ? COLORS.GOLD : 0x444466, 1)
      const s = active ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - s / 2, -s / 2, s, s)
      this.dotsContainer.add(dot)
    }
  }

  scroll(dir) {
    if (this.scrolling || this.detailOpen) return
    const next = this.pageStart + dir
    if (next < 0 || next > this.maxPageStart) return
    this.pageStart = next
    this.updateCarouselPositions(true)
    this.updateDots()
  }

  // ── Botones inferiores ───────────────────────────────────────

  drawButtons() {
    const btnH   = 58
    const btnW   = 240
    const gap    = 20
    // top del botón para que su centro quede en Y=600, igual que CharacterSelectScene
    const btnY   = BAND_Y + BAND_H + 40 - btnH / 2
    const totalW = btnW * 2 + gap
    const startX = Math.round(GAME_WIDTH / 2 - totalW / 2)

    makeNavButton(this, startX, btnY, btnW, btnH, 'VOLVER AL MENÚ', () => {
      this.scene.start(SCENES.MENU)
    }, { depth: 3 })

    makeNavButton(this, startX + btnW + gap, btnY, btnW, btnH, 'VOLVER A JUGAR', () => {
      this.scene.start(SCENES.GAME, { character: this.characterData })
    }, { depth: 3 })
  }

  // ── Vista ampliada del premio ─────────────────────────────────

  showRewardDetail(reward, count) {
    this.detailOpen = true

    const PW      = 560
    const PH      = 700
    const PX      = Math.round((GAME_WIDTH - PW) / 2)
    const PY      = Math.round((GAME_HEIGHT - PH) / 2)
    const CX      = GAME_WIDTH / 2
    const IMG_BIG = 380
    const toDestroy = []

    const overlay = this.add.graphics().setDepth(10)
    overlay.fillStyle(0x000000, 0.88)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    )
    toDestroy.push(overlay)

    const panel = this.add.graphics().setDepth(11)
    panel.fillStyle(0x000000, 0.5)
    panel.fillRect(PX + 5, PY + 5, PW, PH)
    panel.fillStyle(COLORS.DARK_BG, 1)
    panel.fillRect(PX, PY, PW, PH)
    panel.lineStyle(3, COLORS.GOLD, 1)
    panel.strokeRect(PX, PY, PW, PH)
    panel.lineStyle(1, COLORS.GOLD, 0.3)
    panel.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10)
    panel.fillStyle(COLORS.GOLD, 0.1)
    panel.fillRect(PX, PY, PW, 52)
    toDestroy.push(panel)

    toDestroy.push(
      this.add.text(CX, PY + 27, reward.nombre, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '16px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 4,
        align:      'center',
        wordWrap:   { width: PW - 40 },
      }).setOrigin(0.5).setDepth(12),
    )

    const sep = this.add.graphics().setDepth(12)
    sep.lineStyle(1, COLORS.GOLD, 0.4)
    sep.strokeRect(PX + 24, PY + 52, PW - 48, 1)
    toDestroy.push(sep)

    const imgCY = PY + 154 + IMG_BIG / 2
    if (this.textures.exists(reward.id) && this.textures.get(reward.id).key !== '__MISSING') {
      toDestroy.push(
        this.add.image(CX, imgCY, reward.id)
          .setDisplaySize(IMG_BIG, IMG_BIG)
          .setOrigin(0.5)
          .setDepth(12),
      )
    } else {
      const imgG = this.add.graphics().setDepth(12)
      imgG.fillStyle(0x2a2a4a, 1)
      imgG.fillRect(CX - IMG_BIG / 2, PY + 62, IMG_BIG, IMG_BIG)
      imgG.lineStyle(2, COLORS.GOLD, 0.8)
      imgG.strokeRect(CX - IMG_BIG / 2, PY + 62, IMG_BIG, IMG_BIG)
      toDestroy.push(imgG)
      toDestroy.push(
        this.add.text(CX, imgCY, '?', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize:   '64px',
          color:      '#ffd700',
          stroke:     '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(12),
      )
    }

    toDestroy.push(
      this.add.text(CX, imgCY + IMG_BIG / 2 + 30, `x${count} conseguido${count !== 1 ? 's' : ''}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '16px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(12),
    )

    // Descripción del premio (opcional)
    if (reward.descripcion) {
      toDestroy.push(
        this.add.text(CX, imgCY + IMG_BIG / 2 + 56, reward.descripcion, {
          fontFamily: 'monospace',
          fontSize:   '10px',
          color:      '#cccccc',
          align:      'center',
          wordWrap:   { width: PW - 80 },
        }).setOrigin(0.5).setDepth(12),
      )
    }

    const starPositions = [
      { x: CX - IMG_BIG / 2 - 22, y: imgCY - IMG_BIG / 2 - 12 },
      { x: CX + IMG_BIG / 2 + 22, y: imgCY - IMG_BIG / 2 - 12 },
      { x: CX - IMG_BIG / 2 - 16, y: imgCY + IMG_BIG / 2 + 16 },
      { x: CX + IMG_BIG / 2 + 16, y: imgCY + IMG_BIG / 2 + 16 },
    ]
    starPositions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize:   '16px',
        color:      '#ffd700',
      }).setOrigin(0.5).setAlpha(0).setDepth(12)
      toDestroy.push(star)
      this.tweens.add({
        targets:  star,
        alpha:    1,
        scaleX:   { from: 0.4, to: 1 },
        scaleY:   { from: 0.4, to: 1 },
        delay:    200 + i * 100,
        duration: 300,
        ease:     'Back.easeOut',
      })
      this.tweens.add({
        targets:  star,
        alpha:    { from: 1, to: 0.3 },
        delay:    600 + i * 100,
        duration: 800,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    })

    toDestroy.push(
      this.add.text(CX, PY + PH - 22, 'Toca para cerrar', {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#888899',
      }).setOrigin(0.5).setDepth(12),
    )

    const close = () => {
      this.detailOpen = false
      toDestroy.forEach(o => { if (o?.active) o.destroy() })
      this.input.keyboard.off('keydown-ESC', close)
      this.tweens.killAll()
    }

    overlay.on('pointerdown', close)
    this.input.keyboard.on('keydown-ESC', close)
  }

  // ── Confeti ──────────────────────────────────────────────────

  spawnConfetti(areaX, areaY, areaW, areaH, count = 55) {
    const pieces = []
    for (let i = 0; i < count; i++) {
      const color    = Phaser.Utils.Array.GetRandom(CONFETTI_COLORS)
      const size     = Phaser.Math.Between(4, 9)
      const startX   = Phaser.Math.Between(areaX + 10, areaX + areaW - 10)
      const endX     = startX + Phaser.Math.Between(-90, 90)
      const delay    = Phaser.Math.Between(0, 1000)
      const duration = Phaser.Math.Between(1100, 2600)

      const g = this.add.graphics().setDepth(13)
      g.fillStyle(color, 1)
      g.fillRect(-size / 2, -size / 2, size, size)
      g.x = startX
      g.y = areaY - 5
      pieces.push(g)

      this.tweens.add({
        targets:  g,
        x:        endX,
        y:        areaY + areaH + 10,
        angle:    Phaser.Math.Between(-540, 540),
        alpha:    { from: 1, to: 0.15 },
        delay,
        duration,
        ease:     'Quad.easeIn',
      })
    }
    return pieces
  }

  // ── Input ────────────────────────────────────────────────────

  setupInput() {
    this.input.keyboard.on('keydown-LEFT',  () => this.scroll(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.scroll(1))
    this.input.keyboard.on('keydown-ESC',   () => {
      if (!this.detailOpen) this.scene.start(SCENES.MENU)
    })

    this.input.on('pointerdown', (p) => { this.swipeX = p.x })
    this.input.on('pointerup',   (p) => {
      if (this.swipeX === undefined) return
      const diff = p.x - this.swipeX
      if (Math.abs(diff) > 60 && !this.detailOpen) this.scroll(diff < 0 ? 1 : -1)
      this.swipeX = undefined
    })
  }
}
