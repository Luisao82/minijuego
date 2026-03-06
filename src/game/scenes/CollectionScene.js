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

// --- Colores del confeti ---
const CONFETTI_COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xff69b4, 0xffeaa7, 0xc0392b]

export class CollectionScene extends Scene {

  constructor() {
    super(SCENES.COLLECTION)
  }

  init(data) {
    this.characterData = data?.character || null
    this.pageStart = 0
    this.scrolling = false
    this.detailOpen = false
  }

  create() {
    this.rewards = this.cache.json.get('rewards') || []
    this.counts = rewardStorage.getAll()
    this.maxPageStart = Math.max(0, this.rewards.length - VISIBLE_COUNT)

    this.drawBackground()
    this.drawHeader()
    this.createCarousel()
    this.drawNavigation()
    this.drawButtons()
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

    // --- Nombre (parte superior) — oculto con "???" si no se ha ganado ---
    const displayName = earned ? reward.nombre : '???'
    container.add(this.add.text(CARD_W / 2, 14, displayName, {
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

    // --- Área interactiva para premios conseguidos (pulsar para ampliar) ---
    if (earned) {
      const hit = this.add.graphics()
      hit.fillStyle(0xffffff, 0.001)
      hit.fillRect(0, 0, CARD_W, CARD_H)
      hit.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, CARD_W, CARD_H),
        Phaser.Geom.Rectangle.Contains,
      )
      hit.on('pointerover', () => {
        g.clear()
        g.fillStyle(COLORS.GOLD, 0.15)
        g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
        g.fillStyle(COLORS.UI_BG, 1)
        g.fillRect(0, 0, CARD_W, CARD_H)
        g.lineStyle(2, COLORS.GOLD, 1)
        g.strokeRect(0, 0, CARD_W, CARD_H)
        g.lineStyle(1, COLORS.GOLD, 0.5)
        g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
      })
      hit.on('pointerout', () => {
        g.clear()
        g.fillStyle(COLORS.GOLD, 0.08)
        g.fillRect(-4, -4, CARD_W + 8, CARD_H + 8)
        g.fillStyle(COLORS.UI_BG, 1)
        g.fillRect(0, 0, CARD_W, CARD_H)
        g.lineStyle(2, COLORS.GOLD, 1)
        g.strokeRect(0, 0, CARD_W, CARD_H)
        g.lineStyle(1, COLORS.GOLD, 0.3)
        g.strokeRect(3, 3, CARD_W - 6, CARD_H - 6)
      })
      hit.on('pointerdown', () => {
        if (!this.detailOpen) this.showRewardDetail(reward, count)
      })
      container.add(hit)
    }

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
    const arrowY = CARDS_Y + CARD_H / 2  // centro vertical de las fichas

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
    if (this.scrolling || this.detailOpen) return
    const next = this.pageStart + dir
    if (next < 0 || next > this.maxPageStart) return
    this.pageStart = next
    this.updateCarouselPositions(true)
    this.updateDots()
  }

  // ========================================
  // BOTONES (dos botones inferiores)
  // ========================================

  drawButtons() {
    const btnH = 38
    const btnW = 220
    const gap = 16
    const btnY = BAND_Y + BAND_H + 22
    const totalW = btnW * 2 + gap
    const startX = Math.round(GAME_WIDTH / 2 - totalW / 2)

    this.makeButton(startX, btnY, btnW, btnH, 'VOLVER AL MENÚ', () => {
      this.scene.start(SCENES.MENU)
    })

    this.makeButton(startX + btnW + gap, btnY, btnW, btnH, 'VOLVER A JUGAR', () => {
      this.scene.start(SCENES.GAME, { character: this.characterData })
    })
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

  // ========================================
  // VISTA AMPLIADA AL PULSAR UN PREMIO
  // ========================================

  showRewardDetail(reward, count) {
    this.detailOpen = true

    const PW = 520
    const PH = 660
    const PX = Math.round((GAME_WIDTH - PW) / 2)
    const PY = Math.round((GAME_HEIGHT - PH) / 2)
    const CX = GAME_WIDTH / 2
    const IMG_BIG = 220
    const toDestroy = []

    // --- Overlay oscuro bloqueante ---
    const overlay = this.add.graphics().setDepth(10)
    overlay.fillStyle(0x000000, 0.88)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains,
    )
    toDestroy.push(overlay)

    // --- Panel ---
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

    // --- Título con nombre del premio ---
    const title = this.add.text(CX, PY + 27, reward.nombre, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: PW - 40 },
    }).setOrigin(0.5).setDepth(12)
    toDestroy.push(title)

    // --- Separador ---
    const sep = this.add.graphics().setDepth(12)
    sep.lineStyle(1, COLORS.GOLD, 0.4)
    sep.strokeRect(PX + 24, PY + 52, PW - 48, 1)
    toDestroy.push(sep)

    // --- Imagen grande ---
    const imgCY = PY + 62 + IMG_BIG / 2 + 10   // PY+182
    if (this.textures.exists(reward.id) && this.textures.get(reward.id).key !== '__MISSING') {
      const img = this.add.image(CX, imgCY, reward.id)
        .setDisplaySize(IMG_BIG, IMG_BIG)
        .setOrigin(0.5)
        .setDepth(12)
      toDestroy.push(img)
    } else {
      const imgG = this.add.graphics().setDepth(12)
      imgG.fillStyle(0x2a2a4a, 1)
      imgG.fillRect(CX - IMG_BIG / 2, PY + 62, IMG_BIG, IMG_BIG)
      imgG.lineStyle(2, COLORS.GOLD, 0.8)
      imgG.strokeRect(CX - IMG_BIG / 2, PY + 62, IMG_BIG, IMG_BIG)
      toDestroy.push(imgG)
      const qMark = this.add.text(CX, imgCY, '?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '64px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(12)
      toDestroy.push(qMark)
    }

    // --- Contador de veces conseguido ---
    const countY = imgCY + IMG_BIG / 2 + 30
    const countText = this.add.text(CX, countY, `x${count} conseguido${count !== 1 ? 's' : ''}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12)
    toDestroy.push(countText)

    // --- Estrellas decorativas ---
    const starPositions = [
      { x: CX - IMG_BIG / 2 - 22, y: imgCY - IMG_BIG / 2 - 12 },
      { x: CX + IMG_BIG / 2 + 22, y: imgCY - IMG_BIG / 2 - 12 },
      { x: CX - IMG_BIG / 2 - 16, y: imgCY + IMG_BIG / 2 + 16 },
      { x: CX + IMG_BIG / 2 + 16, y: imgCY + IMG_BIG / 2 + 16 },
    ]
    starPositions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffd700',
      }).setOrigin(0.5).setAlpha(0).setDepth(12)
      toDestroy.push(star)
      this.tweens.add({
        targets: star,
        alpha: 1,
        scaleX: { from: 0.4, to: 1 },
        scaleY: { from: 0.4, to: 1 },
        delay: 200 + i * 100,
        duration: 300,
        ease: 'Back.easeOut',
      })
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.3 },
        delay: 600 + i * 100,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })

    // --- Hint "Toca para cerrar" ---
    const hint = this.add.text(CX, PY + PH - 22, 'Toca para cerrar', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888899',
    }).setOrigin(0.5).setDepth(12)
    toDestroy.push(hint)

    // --- Función de cierre ---
    const close = () => {
      this.detailOpen = false
      toDestroy.forEach(o => { if (o && o.active) o.destroy() })
      this.input.keyboard.off('keydown-ESC', close)
      // Destruir también los tweens de estrella que son repeat:-1
      this.tweens.killAll()
      // Pequeña pausa antes de que el scroll vuelva a estar activo
    }

    overlay.on('pointerdown', close)
    this.input.keyboard.on('keydown-ESC', close)
  }

  // ========================================
  // CONFETI
  // ========================================

  spawnConfetti(areaX, areaY, areaW, areaH, count = 55) {
    const pieces = []
    for (let i = 0; i < count; i++) {
      const color = Phaser.Utils.Array.GetRandom(CONFETTI_COLORS)
      const size = Phaser.Math.Between(4, 9)
      const startX = Phaser.Math.Between(areaX + 10, areaX + areaW - 10)
      const endX = startX + Phaser.Math.Between(-90, 90)
      const delay = Phaser.Math.Between(0, 1000)
      const duration = Phaser.Math.Between(1100, 2600)

      const g = this.add.graphics().setDepth(13)
      g.fillStyle(color, 1)
      g.fillRect(-size / 2, -size / 2, size, size)
      g.x = startX
      g.y = areaY - 5
      pieces.push(g)

      this.tweens.add({
        targets: g,
        x: endX,
        y: areaY + areaH + 10,
        angle: Phaser.Math.Between(-540, 540),
        alpha: { from: 1, to: 0.15 },
        delay,
        duration,
        ease: 'Quad.easeIn',
      })
    }
    return pieces
  }

  // ========================================
  // INPUT
  // ========================================

  setupInput() {
    this.input.keyboard.on('keydown-LEFT', () => this.scroll(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.scroll(1))
    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.detailOpen) this.scene.start(SCENES.MENU)
    })

    // Soporte swipe táctil
    this.input.on('pointerdown', (p) => { this.swipeX = p.x })
    this.input.on('pointerup', (p) => {
      if (this.swipeX === undefined) return
      const diff = p.x - this.swipeX
      if (Math.abs(diff) > 60 && !this.detailOpen) this.scroll(diff < 0 ? 1 : -1)
      this.swipeX = undefined
    })
  }
}
