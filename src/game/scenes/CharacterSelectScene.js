import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'

const STAT_COLORS = {
  peso: 0xe74c3c,
  equilibrio: 0x3498db,
  altura: 0x2ecc71,
  edad: 0xf39c12,
}

const STAT_MAX = 10

// Card dimensions
const CARD_WIDTH = 240
const CARD_HEIGHT = 360
const CARD_GAP = 40
const CARD_STEP = CARD_WIDTH + CARD_GAP
const CARDS_Y = 150
const CARD_PADDING = 6

// Imagen ocupa la parte superior de la card
const IMG_X = CARD_PADDING
const IMG_Y = CARD_PADDING
const IMG_W = CARD_WIDTH - CARD_PADDING * 2
const IMG_H = 230

// Stats en la parte inferior
const STATS_Y = IMG_Y + IMG_H + 8
const STATS_X = CARD_PADDING + 4
const BAR_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 44
const BAR_HEIGHT = 10
const STAT_ROW_H = 20

const VISIBLE_AREA_LEFT = 60
const VISIBLE_AREA_RIGHT = GAME_WIDTH - 60

// Franja oscura — más abajo para mostrar más fondo
const BAND_Y = 120
const BAND_H = 440

export class CharacterSelectScene extends Scene {

  constructor() {
    super(SCENES.CHARACTER_SELECT)
  }

  create() {
    this.selectedIndex = 0
    this.isScrolling = false

    this.drawBackground()
    this.drawHeader()
    this.createCarousel()
    this.drawSelectedDetail()
    this.drawNavigation()
    this.drawPlayButton()
    this.setupInput()
  }

  drawBackground() {
    // Imagen de fondo
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-characters')
    const scaleX = GAME_WIDTH / bg.width
    const scaleY = GAME_HEIGHT / bg.height
    const scale = Math.max(scaleX, scaleY)
    bg.setScale(scale)

    // Overlay más suave arriba para que se vea el fondo, más denso abajo
    const overlay = this.add.graphics()
    // Parte superior: overlay ligero para que se vea la imagen
    overlay.fillStyle(0x0a0a1e, 0.35)
    overlay.fillRect(0, 0, GAME_WIDTH, BAND_Y)
    // Parte inferior bajo la franja
    overlay.fillStyle(0x0a0a1e, 0.55)
    overlay.fillRect(0, BAND_Y + BAND_H, GAME_WIDTH, GAME_HEIGHT - BAND_Y - BAND_H)

    // Franja central oscura (zona de fichas)
    const band = this.add.graphics()
    // Degradado simulado: borde superior difuso
    band.fillStyle(0x0a0a1e, 0.25)
    band.fillRect(0, BAND_Y - 30, GAME_WIDTH, 15)
    band.fillStyle(0x0a0a1e, 0.45)
    band.fillRect(0, BAND_Y - 15, GAME_WIDTH, 15)
    // Cuerpo principal de la franja
    band.fillStyle(0x0d0d24, 0.82)
    band.fillRect(0, BAND_Y, GAME_WIDTH, BAND_H)
    // Degradado simulado: borde inferior difuso
    band.fillStyle(0x0a0a1e, 0.45)
    band.fillRect(0, BAND_Y + BAND_H, GAME_WIDTH, 15)
    band.fillStyle(0x0a0a1e, 0.25)
    band.fillRect(0, BAND_Y + BAND_H + 15, GAME_WIDTH, 15)

    // Líneas decorativas en los bordes de la franja
    const lines = this.add.graphics()
    lines.lineStyle(2, COLORS.GOLD, 0.4)
    lines.lineBetween(0, BAND_Y, GAME_WIDTH, BAND_Y)
    lines.lineBetween(0, BAND_Y + BAND_H, GAME_WIDTH, BAND_Y + BAND_H)
    lines.lineStyle(1, COLORS.GOLD, 0.15)
    lines.lineBetween(0, BAND_Y + 3, GAME_WIDTH, BAND_Y + 3)
    lines.lineBetween(0, BAND_Y + BAND_H - 3, GAME_WIDTH, BAND_Y + BAND_H - 3)
  }

  drawHeader() {
    const cx = GAME_WIDTH / 2
    const headerY = 55

    // Fondo decorativo del título — flotando sobre el fondo visible
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0x0a0a1e, 0.6)
    headerBg.fillRect(cx - 280, headerY - 25, 560, 50)
    headerBg.lineStyle(1, COLORS.GOLD, 0.3)
    headerBg.strokeRect(cx - 280, headerY - 25, 560, 50)

    // Esquinas decorativas retro
    const corners = this.add.graphics()
    corners.lineStyle(2, COLORS.GOLD, 0.8)
    const cLen = 12
    const left = cx - 276
    const right = cx + 276
    const top = headerY - 21
    const bottom = headerY + 21
    corners.lineBetween(left, top, left + cLen, top)
    corners.lineBetween(left, top, left, top + cLen)
    corners.lineBetween(right, top, right - cLen, top)
    corners.lineBetween(right, top, right, top + cLen)
    corners.lineBetween(left, bottom, left + cLen, bottom)
    corners.lineBetween(left, bottom, left, bottom - cLen)
    corners.lineBetween(right, bottom, right - cLen, bottom)
    corners.lineBetween(right, bottom, right, bottom - cLen)

    // Texto principal con Jersey 10
    this.add.text(cx, headerY, 'ELIGE TU PERSONAJE', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#1a0a00',
      strokeThickness: 6,
      letterSpacing: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 0,
        fill: true,
      },
    }).setOrigin(0.5)

    // Línea decorativa debajo — doble con diamante central
    const lineG = this.add.graphics()
    const lineY = headerY + 28
    lineG.fillStyle(COLORS.GOLD, 0.6)
    lineG.fillRect(cx - 200, lineY, 400, 1)
    const dSize = 4
    lineG.fillStyle(COLORS.GOLD, 0.9)
    lineG.fillRect(cx - dSize, lineY - dSize + 1, dSize * 2, dSize * 2)
    lineG.fillStyle(COLORS.GOLD, 0.35)
    lineG.fillRect(cx - 160, lineY + 4, 320, 1)
  }

  createCarousel() {
    this.carouselContainer = this.add.container(0, 0)
    this.cardContainers = []

    this.buildCards()

    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(VISIBLE_AREA_LEFT, CARDS_Y - 10, VISIBLE_AREA_RIGHT - VISIBLE_AREA_LEFT, CARD_HEIGHT + 20)
    const mask = maskShape.createGeometryMask()
    this.carouselContainer.setMask(mask)
  }

  buildCards() {
    this.cardContainers.forEach(c => c.destroy())
    this.cardContainers = []

    CHARACTERS.forEach((char, i) => {
      const container = this.createCard(char, i)
      this.carouselContainer.add(container)
      this.cardContainers.push(container)
    })

    this.updateCarouselPositions(false)
  }

  createCard(char, index) {
    const container = this.add.container(0, CARDS_Y)
    const isSelected = index === this.selectedIndex

    const g = this.add.graphics()

    // Sombra de la card (solo la seleccionada)
    if (isSelected && char.available) {
      g.fillStyle(COLORS.GOLD, 0.12)
      g.fillRect(-4, -4, CARD_WIDTH + 8, CARD_HEIGHT + 8)
    }

    // Fondo de la card
    g.fillStyle(COLORS.UI_BG, char.available ? 1 : 0.5)
    g.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Borde
    if (isSelected && char.available) {
      g.lineStyle(3, COLORS.GOLD, 1)
    } else {
      g.lineStyle(2, COLORS.UI_BORDER, 0.8)
    }
    g.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Borde interior (doble marco)
    if (isSelected && char.available) {
      g.lineStyle(1, COLORS.GOLD, 0.4)
      g.strokeRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6)
    }

    container.add(g)

    // --- IMAGEN DEL PERSONAJE ---
    const hasSprite = this.textures.exists(char.sprite) &&
      this.textures.get(char.sprite).key !== '__MISSING'

    if (hasSprite) {
      const sprite = this.add.image(
        IMG_X + IMG_W / 2,
        IMG_Y + IMG_H / 2,
        char.sprite,
      )
      const scaleX = IMG_W / sprite.width
      const scaleY = IMG_H / sprite.height
      const scale = Math.max(scaleX, scaleY)
      sprite.setScale(scale)

      const cropX = (sprite.displayWidth - IMG_W) / 2
      const cropY = (sprite.displayHeight - IMG_H) / 2
      sprite.setCrop(
        cropX / scale,
        cropY / scale,
        IMG_W / scale,
        IMG_H / scale,
      )

      container.add(sprite)

      // Degradado oscuro en la parte inferior de la imagen
      const imgGrad = this.add.graphics()
      imgGrad.fillStyle(0x000000, 0.3)
      imgGrad.fillRect(IMG_X, IMG_Y + IMG_H - 50, IMG_W, 20)
      imgGrad.fillStyle(0x000000, 0.55)
      imgGrad.fillRect(IMG_X, IMG_Y + IMG_H - 30, IMG_W, 30)
      container.add(imgGrad)

      // Borde de la imagen
      const imgBorder = this.add.graphics()
      imgBorder.lineStyle(2, COLORS.UI_BORDER, 1)
      imgBorder.strokeRect(IMG_X, IMG_Y, IMG_W, IMG_H)
      container.add(imgBorder)
    } else {
      const spriteG = this.add.graphics()
      spriteG.fillStyle(0x2a2a4a, 1)
      spriteG.fillRect(IMG_X, IMG_Y, IMG_W, IMG_H)
      spriteG.lineStyle(2, COLORS.UI_BORDER, 1)
      spriteG.strokeRect(IMG_X, IMG_Y, IMG_W, IMG_H)
      this.drawCharacterSilhouette(spriteG, IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2, char.available)
      container.add(spriteG)
    }

    // --- NOMBRE superpuesto sobre la imagen (parte inferior) ---
    const nameColor = char.available ? '#ffd700' : '#555555'
    const nameText = this.add.text(CARD_WIDTH / 2, IMG_Y + IMG_H - 10, char.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5, 1)
    container.add(nameText)

    // --- STATS en la parte inferior ---
    if (char.available) {
      this.drawStats(container, char.stats)
    } else {
      const lockText = this.add.text(CARD_WIDTH / 2, STATS_Y + 30, '???', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#444444',
      }).setOrigin(0.5)
      container.add(lockText)

      const lockedText = this.add.text(CARD_WIDTH / 2, STATS_Y + 60, 'BLOQUEADO', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#444444',
      }).setOrigin(0.5)
      container.add(lockedText)
    }

    return container
  }

  drawStats(container, stats) {
    const statNames = { peso: 'PES', equilibrio: 'EQU', altura: 'ALT', edad: 'EDA' }
    const entries = Object.entries(stats)

    entries.forEach(([key, value], i) => {
      const sy = STATS_Y + i * STAT_ROW_H

      const label = this.add.text(STATS_X, sy + 1, statNames[key], {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#999999',
      })
      container.add(label)

      const barG = this.add.graphics()
      const barX = STATS_X + 38

      barG.fillStyle(0x0a0a1e, 1)
      barG.fillRect(barX, sy + 2, BAR_WIDTH, BAR_HEIGHT)

      const fillWidth = (value / STAT_MAX) * BAR_WIDTH
      barG.fillStyle(STAT_COLORS[key], 1)
      barG.fillRect(barX, sy + 2, fillWidth, BAR_HEIGHT)

      barG.lineStyle(1, 0x3a3a5a, 1)
      barG.strokeRect(barX, sy + 2, BAR_WIDTH, BAR_HEIGHT)

      container.add(barG)
    })
  }

  drawCharacterSilhouette(graphics, cx, cy, available) {
    const color = available ? 0x88aadd : 0x444466
    graphics.fillStyle(color, 1)
    graphics.fillRect(cx - 10, cy - 36, 20, 18)
    graphics.fillRect(cx - 14, cy - 18, 28, 28)
    graphics.fillRect(cx - 12, cy + 10, 10, 18)
    graphics.fillRect(cx + 2, cy + 10, 10, 18)
    graphics.fillRect(cx - 22, cy - 14, 8, 20)
    graphics.fillRect(cx + 14, cy - 14, 8, 20)
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
            if (i === this.selectedIndex) {
              this.isScrolling = false
            }
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

  drawSelectedDetail() {
    if (this.detailContainer) {
      this.detailContainer.destroy()
    }

    const char = CHARACTERS[this.selectedIndex]
    if (!char.available) return

    this.detailContainer = this.add.container(0, 0)

    const panelY = CARDS_Y + CARD_HEIGHT + 10
    const panelH = 46
    const panelW = 460
    const px = GAME_WIDTH / 2 - panelW / 2

    const g = this.add.graphics()
    g.fillStyle(0x0d0d24, 0.9)
    g.fillRect(px, panelY, panelW, panelH)
    g.lineStyle(1, COLORS.UI_BORDER, 0.6)
    g.strokeRect(px, panelY, panelW, panelH)
    this.detailContainer.add(g)

    const desc = this.add.text(GAME_WIDTH / 2, panelY + panelH / 2, char.description, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#bbbbbb',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5)
    this.detailContainer.add(desc)
  }

  drawNavigation() {
    const arrowY = CARDS_Y + CARD_HEIGHT / 2

    // Flechas con estilo retro
    this.leftArrow = this.add.text(30, arrowY, '\u25C0', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.text(GAME_WIDTH - 30, arrowY, '\u25B6', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Indicador de posición (puntos)
    this.dotsContainer = this.add.container(GAME_WIDTH / 2, CARDS_Y + CARD_HEIGHT + 66)
    this.updateDots()

    // Instrucciones en la parte inferior
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, '\u25C0 \u25B6  ELEGIR     ESPACIO  JUGAR', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#555577',
    }).setOrigin(0.5)
  }

  drawPlayButton() {
    // Posición: justo debajo de la franja, centrado
    const btnY = BAND_Y + BAND_H + 40

    // Banderas blancas pixel art dibujadas con graphics
    const flagSize = 18
    const flagSpacing = 160

    const flagsG = this.add.graphics()

    // Bandera izquierda
    const lfx = GAME_WIDTH / 2 - flagSpacing
    flagsG.fillStyle(0x888888, 1)
    flagsG.fillRect(lfx, btnY - flagSize + 2, 3, flagSize + 6)
    flagsG.fillStyle(0xffffff, 0.9)
    flagsG.fillRect(lfx + 3, btnY - flagSize + 2, 14, 10)
    flagsG.lineStyle(1, 0xcccccc, 0.8)
    flagsG.strokeRect(lfx + 3, btnY - flagSize + 2, 14, 10)

    // Bandera derecha (espejada)
    const rfx = GAME_WIDTH / 2 + flagSpacing
    flagsG.fillStyle(0x888888, 1)
    flagsG.fillRect(rfx - 2, btnY - flagSize + 2, 3, flagSize + 6)
    flagsG.fillStyle(0xffffff, 0.9)
    flagsG.fillRect(rfx - 17, btnY - flagSize + 2, 14, 10)
    flagsG.lineStyle(1, 0xcccccc, 0.8)
    flagsG.strokeRect(rfx - 17, btnY - flagSize + 2, 14, 10)

    // Texto JUGAR — solo letras, grande y llamativo
    this.playText = this.add.text(GAME_WIDTH / 2, btnY, 'JUGAR', {
      fontFamily: '"Jersey 10", cursive',
      fontSize: '52px',
      color: '#ffd700',
      stroke: '#1a0800',
      strokeThickness: 8,
      letterSpacing: 12,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 0,
        fill: true,
      },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.playText.on('pointerdown', () => this.startGame())

    // Efecto pulsante: respiración suave de escala + brillo
    this.tweens.add({
      targets: this.playText,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Texto secundario parpadeante debajo
    const hintText = this.add.text(GAME_WIDTH / 2, btnY + 38, 'PULSA PARA COMENZAR', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: hintText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  updateDots() {
    this.dotsContainer.removeAll(true)
    const dotSpacing = 16
    const totalW = (CHARACTERS.length - 1) * dotSpacing
    const startX = -totalW / 2

    CHARACTERS.forEach((_, i) => {
      const isActive = i === this.selectedIndex
      const dot = this.add.graphics()
      dot.fillStyle(isActive ? COLORS.GOLD : 0x444466, 1)
      const size = isActive ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - size / 2, -size / 2, size, size)
      this.dotsContainer.add(dot)
    })
  }

  setupInput() {
    this.leftArrow.on('pointerdown', () => this.navigate(-1))
    this.rightArrow.on('pointerdown', () => this.navigate(1))

    this.input.keyboard.on('keydown-LEFT', () => this.navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1))
    this.input.keyboard.on('keydown-SPACE', () => this.startGame())
    this.input.keyboard.on('keydown-ENTER', () => this.startGame())

    this.input.on('pointerdown', (pointer) => {
      this.swipeStartX = pointer.x
    })

    this.input.on('pointerup', (pointer) => {
      if (this.swipeStartX === undefined) return
      const diff = pointer.x - this.swipeStartX
      if (Math.abs(diff) > 50) {
        this.navigate(diff < 0 ? 1 : -1)
      }
      this.swipeStartX = undefined
    })
  }

  navigate(direction) {
    if (this.isScrolling) return

    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      CHARACTERS.length,
    )

    this.buildCards()
    this.drawSelectedDetail()
    this.updateDots()
  }

  startGame() {
    const char = CHARACTERS[this.selectedIndex]
    if (!char.available) return

    this.scene.start(SCENES.GAME, {
      character: char,
    })
  }
}
