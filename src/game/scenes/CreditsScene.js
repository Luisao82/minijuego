import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { makeNavButton } from '../components/NavButton'
import { version } from '../../../package.json'

const AMBER     = 0xd4a520
const PANEL_BG  = 0x0d0600
const PANEL_DIM = 0x000000

const M       = 16
const PANEL_X = M
const PANEL_Y = 92
const PANEL_W = GAME_WIDTH - M * 2
const PANEL_H = GAME_HEIGHT - PANEL_Y - M

const COL_LEFT_X  = PANEL_X + 36
const COL_RIGHT_X = PANEL_X + Math.round(PANEL_W / 2) + 18

const SECTION_HEADER = {
  fontFamily:      '"Press Start 2P", monospace',
  fontSize:        '14px',
  color:           '#ffd700',
  stroke:          '#000000',
  strokeThickness: 3,
}

const ENTRY_LINE = {
  fontFamily:      '"Jersey 10", cursive',
  fontSize:        '24px',
  color:           '#f0d99a',
  stroke:          '#000000',
  strokeThickness: 2,
  lineSpacing:     2,
}

const ENTRY_MUTED = {
  ...ENTRY_LINE,
  color: '#c0b89a',
}

const ENTRY_WARNING = {
  ...ENTRY_LINE,
  color: '#ff9b6b',
}

export class CreditsScene extends BaseScene {

  constructor() {
    super(SCENES.CREDITS)
  }

  create() {
    this.drawBackground()
    this.drawHeader()
    this.drawPanel()
    this.drawColumns()
    this.drawFooter()
    this.drawBackButton()
    this.setupInput()
  }

  drawBackground() {
    if (this.textures.exists('bg-menu') &&
        this.textures.get('bg-menu').key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu')
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics()
        .fillStyle(0x0a0800, 1)
        .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }
    this.add.graphics()
      .fillStyle(0x000000, 0.55)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  drawHeader() {
    this.add.text(GAME_WIDTH / 2, 32, 'La Cucaña Trianera', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '40px',
      color:           '#ff6b35',
      stroke:          '#1a0a00',
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(3)

    this.add.text(GAME_WIDTH / 2, 70, 'CRÉDITOS', {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '18px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 4,
      letterSpacing:   4,
    }).setOrigin(0.5, 0).setDepth(3)
  }

  drawPanel() {
    const g = this.add.graphics().setDepth(1)

    g.fillStyle(PANEL_DIM, 0.5)
    g.fillRect(PANEL_X + 4, PANEL_Y + 4, PANEL_W, PANEL_H)

    g.fillStyle(PANEL_BG, 0.82)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(3, AMBER, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(1, AMBER, 0.22)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    const cLen    = 14
    const corners = [
      [PANEL_X + 3,           PANEL_Y + 3,           1,  1],
      [PANEL_X + PANEL_W - 3, PANEL_Y + 3,          -1,  1],
      [PANEL_X + 3,           PANEL_Y + PANEL_H - 3, 1, -1],
      [PANEL_X + PANEL_W - 3, PANEL_Y + PANEL_H - 3,-1, -1],
    ]
    g.lineStyle(2, AMBER, 0.95)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  drawColumns() {
    this.drawLeftColumn()
    this.drawRightColumn()
  }

  drawLeftColumn() {
    let y = PANEL_Y + 28

    y = this._section(COL_LEFT_X, y, 'AUTOR')
    y = this._entry(COL_LEFT_X, y, 'Luisao')
    y = this._muted(COL_LEFT_X, y, 'Diseño, código, arte y dirección')
    y += 18

    y = this._section(COL_LEFT_X, y, 'MOTOR Y LIBRERÍAS')
    y = this._entry(COL_LEFT_X, y, 'Phaser 3   ·   MIT')
    y = this._entry(COL_LEFT_X, y, 'Vite   ·   MIT')
    y = this._entry(COL_LEFT_X, y, 'Capacitor   ·   MIT')
    y = this._entry(COL_LEFT_X, y, 'Sentry SDK   ·   MIT')
    y += 18

    y = this._section(COL_LEFT_X, y, 'TIPOGRAFÍAS (SIL OFL 1.1)')
    y = this._entry(COL_LEFT_X, y, 'Jersey 10')
    y = this._muted(COL_LEFT_X, y, 'Sarah Cadigan-Fried')
    y = this._entry(COL_LEFT_X, y, 'Press Start 2P')
    y = this._muted(COL_LEFT_X, y, 'Codeman38 (Cody Boisclair)')
  }

  drawRightColumn() {
    let y = PANEL_Y + 28

    y = this._section(COL_RIGHT_X, y, 'EFECTOS DE SONIDO')
    y = this._entry(COL_RIGHT_X, y, 'Creados con jsfxr  (CC0)')
    y = this._muted(COL_RIGHT_X, y, 'Composición original — Luisao')
    y += 18

    y = this._section(COL_RIGHT_X, y, 'MÚSICA DEL MENÚ')
    y = this._entry(COL_RIGHT_X, y, 'Adaptación BeepBox de sevillana')
    y = this._muted(COL_RIGHT_X, y, 'popular interpretada por')
    y = this._muted(COL_RIGHT_X, y, 'Cantores de Híspalis.')
    y = this._warning(COL_RIGHT_X, y, '⚠ Uso pendiente de autorización')
    y = this._warning(COL_RIGHT_X, y, '   de los titulares.')
    y += 18

    y = this._section(COL_RIGHT_X, y, 'ARTE Y SPRITES')
    y = this._entry(COL_RIGHT_X, y, 'Pixel art original — Luisao')
    y += 18

    y = this._section(COL_RIGHT_X, y, 'INSPIRACIÓN')
    y = this._entry(COL_RIGHT_X, y, 'La Velá de Santa Ana,')
    y = this._entry(COL_RIGHT_X, y, 'Triana — Sevilla')
  }

  _section(x, y, label) {
    this.add.text(x, y, label, SECTION_HEADER).setDepth(3)
    return y + 26
  }

  _entry(x, y, label) {
    this.add.text(x, y, label, ENTRY_LINE).setDepth(3)
    return y + 24
  }

  _muted(x, y, label) {
    this.add.text(x, y, label, ENTRY_MUTED).setDepth(3)
    return y + 22
  }

  _warning(x, y, label) {
    this.add.text(x, y, label, ENTRY_WARNING).setDepth(3)
    return y + 22
  }

  drawFooter() {
    const footerY = PANEL_Y + PANEL_H - 38

    this.add.text(GAME_WIDTH / 2, footerY, `© 2026 Luisao  ·  v${version}  ·  Todos los derechos reservados`, {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '10px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(3)

    this.add.text(GAME_WIDTH / 2, footerY + 18, 'luisaodeben@gmail.com', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '20px',
      color:           '#c0b89a',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(3)
  }

  drawBackButton() {
    makeNavButton(
      this, 12, 12, 170, 58,
      'MENÚ',
      () => this.scene.start(SCENES.MENU),
      { depth: 5 },
    )
  }

  setupInput() {
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU))
  }
}
