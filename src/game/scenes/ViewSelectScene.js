import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { getStoredPerspective, storePerspective } from '../config/perspectiveConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'

// ── Dimensiones del carrusel ── igual que CharacterSelectScene ──
const CARD_W    = 280
const CARD_H    = 360
const CARD_GAP  = 40
const CARD_STEP = CARD_W + CARD_GAP
const CARDS_Y   = 150
const IMG_H     = 250
const LABEL_H   = CARD_H - IMG_H   // 110 px

// Mismos valores que el resto de pantallas de selección
const BAND_Y = 120
const BAND_H = 440

const VISIBLE_AREA_LEFT  = 60
const VISIBLE_AREA_RIGHT = GAME_WIDTH - 60

export class ViewSelectScene extends Scene {

  constructor() {
    super(SCENES.VIEW_SELECT)
  }

  create() {
    this.perspectives  = perspectiveUnlockService.getAll()
    this.selectedIndex = this._storedIndex()
    this.isScrolling   = false

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, 'ELIGE TU VISTA', 280)

    this.createCarousel()
    this.drawSelectedDetail()
    this.drawNavigation()
    this.drawConfirmButton()
    this.setupInput()
  }

  // ── Índice inicial desde localStorage ────────────────────────

  _storedIndex() {
    const storedId = getStoredPerspective()
    const idx      = this.perspectives.findIndex(p => p.id === storedId)
    return idx >= 0 ? idx : 0
  }

  // ── Carrusel ─────────────────────────────────────────────────

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardContainers    = []

    this._buildCards()

    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(
      VISIBLE_AREA_LEFT,
      CARDS_Y - 10,
      VISIBLE_AREA_RIGHT - VISIBLE_AREA_LEFT,
      CARD_H + 20,
    )
    this.carouselContainer.setMask(maskShape.createGeometryMask())
  }

  _buildCards() {
    this.cardContainers.forEach(c => c.destroy())
    this.cardContainers = []

    this.perspectives.forEach((cfg, i) => {
      const isSelected = i === this.selectedIndex
      const locked     = !perspectiveUnlockService.isUnlocked(cfg.id)
      const container  = this._makeCard(cfg, isSelected, locked)
      container.y      = CARDS_Y
      this.carouselContainer.add(container)
      this.cardContainers.push(container)
    })

    this._updateCarouselPositions(false)
  }

  _makeCard(cfg, selected, locked) {
    const container = this.add.container(0, 0)

    // Sombra exterior
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.4)
    shadow.fillRect(6, 6, CARD_W, CARD_H)
    container.add(shadow)

    // Fondo de la ficha
    const bg = this.add.graphics()
    bg.fillStyle(0x0d0d24, 0.92)
    bg.fillRect(0, 0, CARD_W, CARD_H)
    container.add(bg)

    // Thumbnail del fondo (ajustado exactamente al área de imagen)
    const thumb = this.add.image(CARD_W / 2, IMG_H / 2, cfg.backgroundKey)
    thumb.setDisplaySize(CARD_W, IMG_H)
    if (locked) thumb.setTint(0x555566)
    container.add(thumb)

    // Overlay de candado (vistas bloqueadas)
    if (locked) {
      const lockBg = this.add.graphics()
      lockBg.fillStyle(0x000000, 0.55)
      lockBg.fillRect(0, 0, CARD_W, IMG_H)
      container.add(lockBg)

      container.add(
        this.add.text(CARD_W / 2, IMG_H / 2 - 20, '🔒', {
          fontSize: '48px',
        }).setOrigin(0.5),
      )

      const hint = perspectiveUnlockService.getHint(cfg.id) ?? 'Bloqueado'
      container.add(
        this.add.text(CARD_W / 2, IMG_H / 2 + 30, hint, {
          fontFamily:      '"Jersey 10", cursive',
          fontSize:        '22px',
          color:           '#ccccee',
          stroke:          '#000000',
          strokeThickness: 3,
          align:           'center',
          wordWrap:        { width: CARD_W - 24 },
        }).setOrigin(0.5),
      )
    }

    // Separador horizontal
    const sep = this.add.graphics()
    sep.lineStyle(1, locked ? 0x333355 : COLORS.GOLD, 0.3)
    sep.lineBetween(0, IMG_H, CARD_W, IMG_H)
    container.add(sep)

    // Área de etiqueta (parte inferior de la ficha)
    const labelBg = this.add.graphics()
    labelBg.fillStyle(0x0d0d24, 0.95)
    labelBg.fillRect(0, IMG_H, CARD_W, LABEL_H)
    container.add(labelBg)

    // Nombre de la vista
    const labelColor = locked ? '#555577' : (selected ? '#ffd700' : '#cccccc')
    container.add(
      this.add.text(CARD_W / 2, IMG_H + LABEL_H / 2, cfg.label, {
        fontFamily:      '"Jersey 10", cursive',
        fontSize:        '38px',
        color:           labelColor,
        stroke:          '#1a0a00',
        strokeThickness: 5,
        letterSpacing:   4,
      }).setOrigin(0.5),
    )

    // Checkmark si está seleccionada
    if (selected && !locked) {
      container.add(
        this.add.text(CARD_W - 16, IMG_H + 6, '✓', {
          fontFamily: '"Jersey 10", cursive',
          fontSize:   '22px',
          color:      '#ffd700',
        }).setOrigin(0.5, 0),
      )
    }

    // Borde exterior
    const border = this.add.graphics()
    if (selected && !locked) {
      border.lineStyle(3, COLORS.GOLD, 1.0)
    } else if (locked) {
      border.lineStyle(2, 0x333355, 0.5)
    } else {
      border.lineStyle(2, 0x444466, 0.6)
    }
    border.strokeRect(0, 0, CARD_W, CARD_H)
    container.add(border)

    return container
  }

  _updateCarouselPositions(animate = true) {
    const centerX      = GAME_WIDTH / 2 - CARD_W / 2
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

  // ── Detalle de la vista seleccionada ─────────────────────────
  // Solo se muestra cuando la vista está bloqueada (para mostrar la pista)

  drawSelectedDetail() {
    if (this.detailContainer) this.detailContainer.destroy()

    const cfg    = this.perspectives[this.selectedIndex]
    if (!cfg) return

    const locked = !perspectiveUnlockService.isUnlocked(cfg.id)
    if (!locked) return   // vistas desbloqueadas: sin panel adicional

    const hint = perspectiveUnlockService.getHint(cfg.id) ?? 'Vista bloqueada'

    this.detailContainer = this.add.container(0, 0)

    const panelY = CARDS_Y + CARD_H + 10
    const panelH = 46
    const panelW = 460
    const px     = GAME_WIDTH / 2 - panelW / 2

    const g = this.add.graphics()
    g.fillStyle(0x0d0d24, 0.9)
    g.fillRect(px, panelY, panelW, panelH)
    g.lineStyle(1, COLORS.UI_BORDER, 0.6)
    g.strokeRect(px, panelY, panelW, panelH)
    this.detailContainer.add(g)

    this.detailContainer.add(
      this.add.text(GAME_WIDTH / 2, panelY + panelH / 2, hint, {
        fontFamily:  'monospace',
        fontSize:    '12px',
        color:       '#888888',
        align:       'center',
        lineSpacing: 6,
      }).setOrigin(0.5),
    )
  }

  // ── Navegación ◀▶ ────────────────────────────────────────────

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_H / 2  // Y=330, igual que CharacterSelectScene

    this.leftArrow = this.add.image(40, arrowY, 'btn-nav-left')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.image(GAME_WIDTH - 40, arrowY, 'btn-nav-right')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.dotsContainer = this.add.container(GAME_WIDTH / 2, CARDS_Y + CARD_H + 66)
    this._updateDots()
  }

  _updateDots() {
    this.dotsContainer.removeAll(true)
    const total = this.perspectives.length
    if (total <= 1) return

    const dotSpacing = 16
    const startX     = -((total - 1) * dotSpacing) / 2

    this.perspectives.forEach((_, i) => {
      const isActive = i === this.selectedIndex
      const dot      = this.add.graphics()
      dot.fillStyle(isActive ? COLORS.GOLD : 0x444466, 1)
      const size = isActive ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - size / 2, -size / 2, size, size)
      this.dotsContainer.add(dot)
    })
  }

  // ── Botón SELECCIONAR VISTA ───────────────────────────────────

  drawConfirmButton() {
    const btnY = BAND_Y + BAND_H + 40   // Y=600, igual que CharacterSelectScene

    this.confirmText = this.add.text(GAME_WIDTH / 2, btnY, 'SELECCIONAR VISTA', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '52px',
      color:           '#ffd700',
      stroke:          '#1a0800',
      strokeThickness: 8,
      letterSpacing:   12,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.confirmText.on('pointerdown', () => this._goToCharacterSelect())

    this.tweens.add({
      targets:  this.confirmText,
      scaleX:   1.08,
      scaleY:   1.08,
      duration: 800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })

    const hintText = this.add.text(GAME_WIDTH / 2, btnY + 38, 'ELIGE TU ESCENARIO', {
      fontFamily:      'monospace',
      fontSize:        '11px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets:  hintText,
      alpha:    0.3,
      duration: 600,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
  }

  // ── Input ─────────────────────────────────────────────────────

  setupInput() {
    this.leftArrow.on('pointerdown',  () => { this.leftArrow.setTexture('btn-nav-left-press'); this._navigate(-1) })
    this.leftArrow.on('pointerup',    () => this.leftArrow.setTexture('btn-nav-left'))
    this.leftArrow.on('pointerout',   () => this.leftArrow.setTexture('btn-nav-left'))
    this.rightArrow.on('pointerdown', () => { this.rightArrow.setTexture('btn-nav-right-press'); this._navigate(1) })
    this.rightArrow.on('pointerup',   () => this.rightArrow.setTexture('btn-nav-right'))
    this.rightArrow.on('pointerout',  () => this.rightArrow.setTexture('btn-nav-right'))

    this.input.keyboard.on('keydown-LEFT',  () => this._navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this._navigate(1))
    this.input.keyboard.on('keydown-SPACE', () => this._goToCharacterSelect())
    this.input.keyboard.on('keydown-ENTER', () => this._goToCharacterSelect())

    this.input.on('pointerdown', (pointer) => { this.swipeStartX = pointer.x })
    this.input.on('pointerup',   (pointer) => {
      if (this.swipeStartX === undefined) return
      const diff = pointer.x - this.swipeStartX
      if (Math.abs(diff) > 50) this._navigate(diff < 0 ? 1 : -1)
      this.swipeStartX = undefined
    })
  }

  _navigate(direction) {
    if (this.isScrolling) return
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      this.perspectives.length,
    )
    storePerspective(this.perspectives[this.selectedIndex].id)
    this._buildCards()
    this.drawSelectedDetail()
    this._updateDots()
  }

  // ── Transición ────────────────────────────────────────────────

  _goToCharacterSelect() {
    const cfg = this.perspectives[this.selectedIndex]
    if (!cfg || !perspectiveUnlockService.isUnlocked(cfg.id)) return
    this.scene.start(SCENES.CHARACTER_SELECT, {
      perspective: perspectiveUnlockService.getById(cfg.id),
    })
  }
}
