import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { makeNavButton } from '../components/NavButton'
import { createSkinMarquee } from '../components/SkinMarquee'
import { CHARACTERS } from '../config/characters'
import { unlockService } from '../services/UnlockService'
import { skinService } from '../services/SkinService'
import { SPRITE_CONFIG } from '../config/spriteConfig'
import { version } from '../../../package.json'

const AMBER     = 0xd4a520
const PANEL_BG  = 0x0d0600
const PANEL_DIM = 0x000000

const M       = 16
const PANEL_X = M
const PANEL_Y = 112
const PANEL_W = GAME_WIDTH - M * 2
const PANEL_H = GAME_HEIGHT - PANEL_Y - M

const MARQUEE_SCALE    = 2
const MARQUEE_DEPTH    = 2

// Layout vertical (calculado top-down):
const MARQUEE_TOP_Y    = PANEL_Y + 60          // sprite con origin (0.5, 1) ocupa 12-60 desde el top del panel

// Banner "LUISAO_DEV" — texto Phaser en amarillo dorado para mantener
// la paleta del resto del juego.
const BANNER_TEXT      = 'LUISAO_DEV'
const BANNER_HEIGHT    = 56
const BANNER_GAP_TOP   = 28
const BANNER_Y         = MARQUEE_TOP_Y + BANNER_GAP_TOP + BANNER_HEIGHT / 2  // centro vertical

// Cara del desarrollador: retrato 35×35 del narrador del tutorial,
// con frames 0 (base) y 3 (ojos cerrados) para el blink.
const FACE_TEXTURE_KEY = 'narrator-tutorial'
const FACE_FRAME_BASE  = 0
const FACE_FRAME_BLINK = 3
const FACE_SCALE       = 6
const FACE_HEIGHT      = 35 * FACE_SCALE                                  // 210
const FACE_GAP_TOP     = 14
const FACE_CENTER_Y    = BANNER_Y + BANNER_HEIGHT / 2 + FACE_GAP_TOP + FACE_HEIGHT / 2

// Texto motivacional: debajo de la cara, mayor tamaño para legibilidad en móvil.
const MESSAGE_TOP_Y    = FACE_CENTER_Y + FACE_HEIGHT / 2 + 12
const MESSAGE_FONT     = '30px'
const MESSAGE_LINE_GAP = 0

const MARQUEE_BOTTOM_Y = PANEL_Y + PANEL_H - 70

const MESSAGE_LINES = [
  'Juego desarrollado con todo el amor y respeto',
  'que le tengo a mi ciudad y a sus tradiciones.',
  'Todos los personajes han sido tratados',
  'con mucho cariño y arte. Espero haberlo expresado así.',
]

export class CreditsScene extends BaseScene {

  constructor() {
    super(SCENES.CREDITS)
  }

  // Pre-calcular qué skins necesitamos para que preload() sepa qué cargar.
  init() {
    super.init()
    this._skinKeys = this._collectUnlockedSkinKeys()
  }

  // Cargar spritesheets de skins que aún no estén en cache (PreloadScene solo
  // carga los del easter_egg; los del resto se cargan bajo demanda).
  preload() {
    this.load.setPath('assets')
    this._skinKeys.forEach((skinKey) => {
      if (this.textures.exists(skinKey)) return
      const name = skinKey.replace('sprite-', '')
      this.load.spritesheet(skinKey, `sprites/characters/spritesheet/${name}.png`, {
        frameWidth:  SPRITE_CONFIG.frameWidth,
        frameHeight: SPRITE_CONFIG.frameHeight,
      })
      this.load.once(`filecomplete-spritesheet-${skinKey}`, () => {
        const tex = this.textures.get(skinKey)
        if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST)
      })
    })

  }

  create() {
    this.drawBackground()
    this.drawHeader()
    this.drawPanel()
    this.drawMarquees()
    this.drawBanner()
    this.drawDeveloperFace()
    this.drawMessage()
    this.drawFooter()
    this.drawBackButton()
    this.drawDetailsButton()
    this.setupInput()
  }

  // ── Fondo ────────────────────────────────────────────────

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
      .fillStyle(0x000000, 0.30)
      .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ── Cabecera ─────────────────────────────────────────────

  drawHeader() {
    this.add.text(GAME_WIDTH / 2, 24, 'La Cucaña Trianera', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '40px',
      color:           '#ff6b35',
      stroke:          '#1a0a00',
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(3)

    this.add.text(GAME_WIDTH / 2, 72, 'CRÉDITOS', {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '18px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 4,
      letterSpacing:   4,
    }).setOrigin(0.5, 0).setDepth(3)
  }

  // ── Panel con marco "Cartelón de Feria" ──────────────────

  drawPanel() {
    const g = this.add.graphics().setDepth(1)

    g.fillStyle(PANEL_DIM, 0.5)
    g.fillRect(PANEL_X + 4, PANEL_Y + 4, PANEL_W, PANEL_H)

    g.fillStyle(PANEL_BG, 0.25)
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

  // ── Marquees superior e inferior ─────────────────────────

  drawMarquees() {
    const skinKeys = (this._skinKeys || []).filter(k => this.textures.exists(k))
    if (skinKeys.length === 0) return

    // Mask del panel: los sprites se siguen moviendo por toda la pantalla,
    // pero solo se renderizan dentro del marco oscuro → "aparecen" en un
    // borde del panel y "desaparecen" en el otro, sin asomar por fuera.
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false })
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    const panelMask = maskShape.createGeometryMask()

    this._topMarquee = createSkinMarquee(this, {
      y:         MARQUEE_TOP_Y,
      direction: 1,                 // izquierda → derecha
      speed:     32,
      skinKeys,
      scale:     MARQUEE_SCALE,
      depth:     MARQUEE_DEPTH,
      mask:      panelMask,
    })

    this._bottomMarquee = createSkinMarquee(this, {
      y:         MARQUEE_BOTTOM_Y,
      direction: -1,                // derecha → izquierda
      speed:     30,
      skinKeys,
      scale:     MARQUEE_SCALE,
      depth:     MARQUEE_DEPTH,
      mask:      panelMask,
    })
  }

  // Recolecta los texture keys de los skins desbloqueados de cada
  // personaje también desbloqueado, excluyendo personajes ocultos
  // (el easter_egg se excluye porque su skin "developer" se usa como
  //  cara central; mostrarlo en los marquees rompería el sentido).
  //
  // Importante: aquí NO filtramos por textures.exists() porque init()
  // se ejecuta antes que preload(); preload() es el que carga los que
  // faltan. El filtrado por existencia se hace al construir el marquee.
  _collectUnlockedSkinKeys() {
    const keys = new Set()
    for (const char of CHARACTERS) {
      if (char.hidden) continue
      if (!unlockService.isUnlocked(char.id)) continue
      const unlocked = skinService.getUnlockedSkins(char)
      for (const spritesheet of unlocked) {
        keys.add(`sprite-${spritesheet}`)
      }
    }
    return Array.from(keys)
  }

  // ── Banner "LUISAO_DEV" encima de la cara (texto neón) ───

  drawBanner() {
    this.add.text(GAME_WIDTH / 2, BANNER_Y, BANNER_TEXT, {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '38px',
      color:           '#ffd700',
      stroke:          '#1a0a00',
      strokeThickness: 5,
      letterSpacing:   4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color:   '#000000',
        blur:    0,
        fill:    true,
      },
    }).setOrigin(0.5, 0.5).setDepth(3)
  }

  // ── Cara del desarrollador (retrato narrador-tutorial) ──

  drawDeveloperFace() {
    const cx = GAME_WIDTH / 2
    const cy = FACE_CENTER_Y

    if (!this.textures.exists(FACE_TEXTURE_KEY)) return

    const face = this.add.sprite(cx, cy, FACE_TEXTURE_KEY, FACE_FRAME_BASE)
      .setOrigin(0.5, 0.5)
      .setScale(FACE_SCALE)
      .setDepth(3)

    // Parpadeo cada ~3,2 s: frame 3 (ojos cerrados) durante 140 ms.
    this.time.addEvent({
      delay:    3200,
      loop:     true,
      callback: () => {
        face.setFrame(FACE_FRAME_BLINK)
        this.time.delayedCall(140, () => face.setFrame(FACE_FRAME_BASE))
      },
    })
  }

  // ── Texto motivacional ───────────────────────────────────

  drawMessage() {
    const cx = GAME_WIDTH / 2

    const style = {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        MESSAGE_FONT,
      color:           '#ffd647',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
    }

    this.add.text(cx, MESSAGE_TOP_Y, MESSAGE_LINES.join('\n'), {
      ...style,
      lineSpacing: MESSAGE_LINE_GAP,
    }).setOrigin(0.5, 0).setDepth(3)
  }

  // ── Footer con copyright y URL portfolio ─────────────────

  drawFooter() {
    const footerY = PANEL_Y + PANEL_H - 56

    this.add.text(GAME_WIDTH / 2, footerY, `© 2026 Luisao  ·  v${version}  ·  Todos los derechos reservados`, {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '10px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(3)

    const url = this.add.text(GAME_WIDTH / 2, footerY + 24, 'https://luisao82.vercel.app', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '22px',
      color:           '#ffd647',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(3).setInteractive({ useHandCursor: true })

    url.on('pointerover', () => url.setColor('#ffffff'))
    url.on('pointerout',  () => url.setColor('#ffd647'))
    url.on('pointerup',   () => {
      this.sound.play('sfx-click', { volume: 0.6 })
      window.open('https://luisao82.vercel.app/', '_blank', 'noopener')
    })
  }

  // ── Botones ──────────────────────────────────────────────

  drawBackButton() {
    makeNavButton(
      this, 12, 12, 170, 58,
      'MENÚ',
      () => this.scene.start(SCENES.MENU),
      { depth: 5 },
    )
  }

  drawDetailsButton() {
    const btnW = 240
    const btnH = 58
    const btnX = GAME_WIDTH - btnW - 12
    const btnY = 12

    makeNavButton(
      this, btnX, btnY, btnW, btnH,
      'FICHA TÉCNICA',
      () => this.scene.start(SCENES.LICENSES),
      { depth: 5, fontSize: '22px' },
    )
  }

  setupInput() {
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU))
  }

  _onShutdown() {
    this._topMarquee?.destroy()
    this._bottomMarquee?.destroy()
  }
}
