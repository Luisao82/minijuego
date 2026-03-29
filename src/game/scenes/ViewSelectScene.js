import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { getStoredPerspective, storePerspective } from '../config/perspectiveConfig'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'

const CARD_W   = 280
const CARD_H   = 370
const CARD_GAP = 60
const CARDS_Y  = GAME_HEIGHT / 2 - CARD_H / 2 + 10
const IMG_H    = 250
const LABEL_H  = CARD_H - IMG_H

const BAND_Y = 90
const BAND_H = GAME_HEIGHT - 90 - 60

export class ViewSelectScene extends Scene {

  constructor() {
    super(SCENES.VIEW_SELECT)
  }

  create() {
    this.selectedId = getStoredPerspective()

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 50, 'ELIGE TU VISTA', 240)

    this._buildCards()
    this._drawHint()
    this._setupInput()
  }

  // ── Fichas ────────────────────────────────────────────────────

  _buildCards() {
    if (this.cardGroup) this.cardGroup.destroy(true)
    this.cardGroup = this.add.container(0, 0)

    const all = perspectiveUnlockService.getAll()

    // Centrar dinámicamente según cuántas perspectivas haya
    const totalW = all.length * CARD_W + (all.length - 1) * CARD_GAP
    const startCX = GAME_WIDTH / 2 - totalW / 2 + CARD_W / 2

    all.forEach((cfg, i) => {
      const cx       = startCX + i * (CARD_W + CARD_GAP)
      const cy       = CARDS_Y + CARD_H / 2
      const selected = cfg.id === this.selectedId
      const locked   = !perspectiveUnlockService.isUnlocked(cfg.id)
      const card     = this._makeCard(cx, cy, cfg, selected, locked)
      this.cardGroup.add(card)
    })
  }

  _makeCard(cx, cy, cfg, selected, locked) {
    const container = this.add.container(cx, cy)
    const x0 = -CARD_W / 2
    const y0 = -CARD_H / 2

    // Sombra
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.4)
    shadow.fillRect(x0 + 6, y0 + 6, CARD_W, CARD_H)
    container.add(shadow)

    // Fondo de la ficha
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a1e, 0.92)
    bg.fillRect(x0, y0, CARD_W, CARD_H)
    container.add(bg)

    // Thumbnail del fondo
    const thumb = this.add.image(0, y0 + IMG_H / 2, cfg.backgroundKey)
    const scaleX = CARD_W / thumb.width
    const scaleY = IMG_H / thumb.height
    thumb.setScale(Math.max(scaleX, scaleY))
    thumb.setOrigin(0.5)
    if (locked) thumb.setTint(0x555566)
    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(cx + x0, cy + y0, CARD_W, IMG_H)
    thumb.setMask(maskGfx.createGeometryMask())
    container.add(thumb)

    // Icono de candado y pista (solo fichas bloqueadas)
    if (locked) {
      const lockBg = this.add.graphics()
      lockBg.fillStyle(0x000000, 0.55)
      lockBg.fillRect(x0, y0, CARD_W, IMG_H)
      container.add(lockBg)

      const lockIcon = this.add.text(0, y0 + IMG_H / 2 - 32, '🔒', {
        fontSize: '48px',
      }).setOrigin(0.5)
      container.add(lockIcon)

      const hint = perspectiveUnlockService.getHint(cfg.id) ?? 'Bloqueado'
      const hintText = this.add.text(0, y0 + IMG_H / 2 + 30, hint, {
        fontFamily: '"Jersey 10", cursive',
        fontSize:   '22px',
        color:      '#ccccee',
        stroke:     '#000000',
        strokeThickness: 3,
        align:      'center',
        wordWrap:   { width: CARD_W - 24 },
      }).setOrigin(0.5)
      container.add(hintText)
    }

    // Separador
    const sep = this.add.graphics()
    sep.lineStyle(1, locked ? 0x333355 : COLORS.GOLD, 0.3)
    sep.lineBetween(x0, y0 + IMG_H, x0 + CARD_W, y0 + IMG_H)
    container.add(sep)

    // Área de label (fondo inferior)
    const labelBg = this.add.graphics()
    labelBg.fillStyle(0x0d0d24, 0.95)
    labelBg.fillRect(x0, y0 + IMG_H, CARD_W, LABEL_H)
    container.add(labelBg)

    // Nombre de la perspectiva
    const labelColor = locked ? '#555577' : (selected ? '#ffd700' : '#cccccc')
    const label = this.add.text(0, y0 + IMG_H + LABEL_H / 2, cfg.label, {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '38px',
      color:      labelColor,
      stroke:     '#1a0a00',
      strokeThickness: 5,
      letterSpacing:   4,
    }).setOrigin(0.5)
    container.add(label)

    // Borde exterior
    const border = this.add.graphics()
    if (selected && !locked) {
      border.lineStyle(3, COLORS.GOLD, 1.0)
    } else if (locked) {
      border.lineStyle(2, 0x333355, 0.5)
    } else {
      border.lineStyle(2, 0x444466, 0.6)
    }
    border.strokeRect(x0, y0, CARD_W, CARD_H)
    container.add(border)

    // Checkmark si está seleccionada y desbloqueada
    if (selected && !locked) {
      const check = this.add.text(CARD_W / 2 - 16, y0 + IMG_H + 4, '✓', {
        fontFamily: '"Jersey 10", cursive',
        fontSize:   '22px',
        color:      '#ffd700',
      }).setOrigin(0.5, 0)
      container.add(check)
    }

    // Interactividad — solo fichas desbloqueadas
    container.setSize(CARD_W, CARD_H)
    if (!locked) {
      container.setInteractive({ useHandCursor: true })

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Quad.easeOut' })
      })
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Quad.easeOut' })
      })
      container.on('pointerdown', () => {
        this.selectedId = cfg.id
        storePerspective(cfg.id)
        this._buildCards()
        this._goToCharacterSelect()
      })
    }

    return container
  }

  // ── Pista inferior ────────────────────────────────────────────

  _drawHint() {
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'Pulsa una ficha para elegir', {
      fontFamily: '"Jersey 10", cursive',
      fontSize:   '20px',
      color:      '#888899',
    }).setOrigin(0.5)

    this.tweens.add({
      targets:  hint,
      alpha:    0.3,
      duration: 700,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
  }

  // ── Input ─────────────────────────────────────────────────────

  _setupInput() {
    this.input.keyboard.on('keydown-LEFT',  () => this._selectDelta(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this._selectDelta(1))
    this.input.keyboard.on('keydown-ENTER', () => this._goToCharacterSelect())
    this.input.keyboard.on('keydown-SPACE', () => this._goToCharacterSelect())
  }

  _selectDelta(dir) {
    const all = perspectiveUnlockService.getAll()
    const unlocked = all.filter(p => perspectiveUnlockService.isUnlocked(p.id))
    if (!unlocked.length) return
    const idx  = unlocked.findIndex(p => p.id === this.selectedId)
    const next = Phaser.Math.Wrap(idx + dir, 0, unlocked.length)
    this.selectedId = unlocked[next].id
    storePerspective(this.selectedId)
    this._buildCards()
  }

  // ── Transición ────────────────────────────────────────────────

  _goToCharacterSelect() {
    const perspective = perspectiveUnlockService.getById(this.selectedId)
    if (!perspective || !perspectiveUnlockService.isUnlocked(this.selectedId)) return
    this.scene.start(SCENES.CHARACTER_SELECT, { perspective })
  }
}
