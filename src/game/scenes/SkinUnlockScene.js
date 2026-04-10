import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'
import { makeNavButton } from '../components/NavButton'

// Dimensiones del panel — igual que CharacterUnlockScene
const PANEL_W  = 560
const PANEL_H  = 580
const PANEL_X  = Math.round((GAME_WIDTH - PANEL_W) / 2)
const PANEL_Y  = Math.round((GAME_HEIGHT - PANEL_H) / 2)
const CENTER_X = GAME_WIDTH / 2

// Tamaño del sprite en pantalla: usa scalePreview de config
const SPRITE_DISPLAY_W = SPRITE_CONFIG.frameWidth  * SPRITE_CONFIG.scalePreview
const SPRITE_DISPLAY_H = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scalePreview

export class SkinUnlockScene extends Scene {

  constructor() {
    super(SCENES.SKIN_UNLOCK)
  }

  init(data) {
    // newSkins: array de objetos skin { spritesheet, nombre, como, condicion }
    this.newSkins      = data.newSkins     || []
    this.character     = data.character    || null
    this.currentIndex  = 0
    this.canInteract   = false
  }

  preload() {
    this.load.setPath('assets')
    // Precarga todos los spritesheets de los nuevos skins
    for (const skin of this.newSkins) {
      const key = `skin-${skin.spritesheet}`
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, `sprites/characters/spritesheet/${skin.spritesheet}.png`, {
          frameWidth:  SPRITE_CONFIG.frameWidth,
          frameHeight: SPRITE_CONFIG.frameHeight,
        })
      }
    }
  }

  create() {
    this.drawBackground()
    this.showCurrentSkin()
  }

  // ── Fondo ─────────────────────────────────────────────────────

  drawBackground() {
    this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-characters')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.78)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ── Revelación del skin actual ────────────────────────────────

  showCurrentSkin() {
    this.canInteract = false

    if (this.contentContainer) this.contentContainer.destroy()
    if (this.buttonContainer)  this.buttonContainer.destroy()

    this.contentContainer = this.add.container(0, 0)
    this.contentContainer.setAlpha(0)

    const skin = this.newSkins[this.currentIndex]
    if (!skin) {
      this.goToSkinSelect()
      return
    }

    this.drawPanel()
    this.drawBanner()
    this.drawSkinSprite(skin)
    this.drawSkinInfo(skin)
    this.drawButtons()

    this.tweens.add({
      targets:  this.contentContainer,
      alpha:    1,
      duration: 300,
      ease:     'Quad.easeOut',
      onComplete: () => this.animateSprite(),
    })
  }

  drawPanel() {
    const g = this.add.graphics()

    g.fillStyle(0x000000, 0.5)
    g.fillRect(PANEL_X + 6, PANEL_Y + 6, PANEL_W, PANEL_H)

    g.fillStyle(COLORS.DARK_BG, 1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    g.fillStyle(COLORS.GOLD, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, 56)

    this.contentContainer.add(g)
  }

  drawBanner() {
    this.contentContainer.add(
      this.add.text(CENTER_X, PANEL_Y + 30, '¡NUEVO SKIN!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '16px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5),
    )
  }

  drawSkinSprite(skin) {
    const spriteAreaY = PANEL_Y + 80
    const spriteAreaH = SPRITE_DISPLAY_H + 16
    const spriteCY    = spriteAreaY + spriteAreaH / 2

    // Marco
    const frameG = this.add.graphics()
    frameG.lineStyle(2, COLORS.UI_BORDER, 1)
    frameG.fillStyle(0x0a0a1e, 1)
    frameG.fillRect(CENTER_X - SPRITE_DISPLAY_W / 2 - 8, spriteAreaY, SPRITE_DISPLAY_W + 16, spriteAreaH)
    frameG.strokeRect(CENTER_X - SPRITE_DISPLAY_W / 2 - 8, spriteAreaY, SPRITE_DISPLAY_W + 16, spriteAreaH)
    this.contentContainer.add(frameG)

    // Sprite — frame 0 (STAND), estático
    const key      = `skin-${skin.spritesheet}`
    const hasSprite = this.textures.exists(key) && this.textures.get(key).key !== '__MISSING'

    if (hasSprite) {
      this.skinSprite = this.add.image(CENTER_X, spriteCY, key, SPRITE_FRAMES.STAND)
        .setScale(0)
        .setOrigin(0.5)
      this.skinSprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
    } else {
      this.skinSprite = this.add.text(CENTER_X, spriteCY, '?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '60px',
        color:      '#ffd700',
      }).setOrigin(0.5).setScale(0)
    }

    this.contentContainer.add(this.skinSprite)
    this._spriteTargetScale = SPRITE_CONFIG.scalePreview

    this.drawStars(CENTER_X, spriteCY)
  }

  drawStars(cx, cy) {
    const radius = SPRITE_DISPLAY_H / 2 + 20
    const positions = [
      { x: cx - radius, y: cy - radius + 10 },
      { x: cx + radius, y: cy - radius + 10 },
      { x: cx - radius, y: cy + radius - 10 },
      { x: cx + radius, y: cy + radius - 10 },
      { x: cx,          y: cy - radius - 10 },
    ]

    positions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize:   '18px',
        color:      '#ffd700',
      }).setOrigin(0.5).setAlpha(0)

      this.contentContainer.add(star)

      this.tweens.add({
        targets:  star,
        alpha:    1,
        scaleX:   { from: 0.3, to: 1 },
        scaleY:   { from: 0.3, to: 1 },
        delay:    500 + i * 80,
        duration: 300,
        ease:     'Back.easeOut',
      })
      this.tweens.add({
        targets:  star,
        alpha:    { from: 1, to: 0.3 },
        delay:    900 + i * 80,
        duration: 700,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    })
  }

  drawSkinInfo(skin) {
    const spriteAreaH = SPRITE_DISPLAY_H + 16
    const nameY       = PANEL_Y + 80 + spriteAreaH + 20

    // Nombre del personaje (contexto)
    if (this.character) {
      this.contentContainer.add(
        this.add.text(CENTER_X, nameY, this.character.name, {
          fontFamily: 'monospace',
          fontSize:   '11px',
          color:      '#888888',
        }).setOrigin(0.5),
      )
    }

    // Nombre del skin
    this.contentContainer.add(
      this.add.text(CENTER_X, nameY + 20, skin.nombre, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '14px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5),
    )
  }

  // ── Botones ───────────────────────────────────────────────────

  drawButtons() {
    const isLast = this.currentIndex >= this.newSkins.length - 1
    const btnH   = 52
    const btnY   = PANEL_Y + PANEL_H - btnH - 16

    this.buttonContainer = this.add.container(0, 0)
    this.buttonContainer.setAlpha(0)

    if (isLast) {
      const btnW = 220
      const gap  = 16

      makeNavButton(
        this,
        CENTER_X - btnW - gap / 2,
        btnY, btnW, btnH,
        'ELEGIR SKIN',
        () => { if (this.canInteract) this.goToSkinSelect() },
        { depth: 6 },
      )
      makeNavButton(
        this,
        CENTER_X + gap / 2,
        btnY, btnW, btnH,
        'VOLVER A JUGAR',
        () => { if (this.canInteract) this.playAgain() },
        { depth: 6 },
      )
    } else {
      makeNavButton(
        this,
        CENTER_X - 120,
        btnY, 240, btnH,
        'SIGUIENTE ▶',
        () => { if (this.canInteract) this.nextSkin() },
        { depth: 6 },
      )
    }
  }

  // ── Animación de entrada del sprite ──────────────────────────

  animateSprite() {
    this.tweens.add({
      targets:  this.skinSprite,
      scaleX:   this._spriteTargetScale,
      scaleY:   this._spriteTargetScale,
      duration: 450,
      ease:     'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets:  this.buttonContainer,
          alpha:    1,
          duration: 250,
          ease:     'Quad.easeOut',
          onComplete: () => { this.canInteract = true },
        })
      },
    })
  }

  // ── Navegación ────────────────────────────────────────────────

  nextSkin() {
    this.currentIndex++
    this.showCurrentSkin()
  }

  goToSkinSelect() {
    this.scene.start(SCENES.SKIN_SELECT, {
      character:    this.character,
      justUnlocked: this.newSkins.map(s => s.spritesheet),
    })
  }

  playAgain() {
    this.scene.start(SCENES.GAME, { character: this.character })
  }
}
