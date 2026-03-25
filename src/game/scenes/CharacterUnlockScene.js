import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'
import { makeNavButton } from '../components/NavButton'

// Dimensiones del panel de ficha
const PANEL_W = 560
const PANEL_H = 680
const PANEL_X = Math.round((GAME_WIDTH - PANEL_W) / 2)
const PANEL_Y = Math.round((GAME_HEIGHT - PANEL_H) / 2)
const CENTER_X = GAME_WIDTH / 2

const SPRITE_SIZE  = 260
const STAT_COLORS  = { peso: 0xe74c3c, equilibrio: 0x3498db, altura: 0x2ecc71, edad: 0xf39c12 }
const STAT_NAMES   = { peso: 'PESO', equilibrio: 'EQUIL', altura: 'ALT', edad: 'EDAD' }
const STAT_MAX     = 10

export class CharacterUnlockScene extends Scene {

  constructor() {
    super(SCENES.CHARACTER_UNLOCK)
  }

  init(data) {
    this.unlockedCharacters = data.unlockedCharacters || []
    this.characterData      = data.character || null
    this.currentIndex       = 0
    this.canInteract        = false
  }

  create() {
    this.drawBackground()
    this.showCurrentCharacter()
  }

  // ── Fondo ────────────────────────────────────────────────────

  drawBackground() {
    this.bgImage = this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-characters')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    this.overlay = this.add.graphics()
    this.overlay.fillStyle(0x000000, 0.78)
    this.overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ── Revelación del personaje actual ──────────────────────────

  showCurrentCharacter() {
    this.canInteract = false

    // Limpiar contenido previo (excepto fondo y overlay)
    if (this.contentContainer) this.contentContainer.destroy()
    if (this.buttonContainer)  this.buttonContainer.destroy()

    this.contentContainer = this.add.container(0, 0)
    this.contentContainer.setAlpha(0)

    const charId = this.unlockedCharacters[this.currentIndex]
    const char   = CHARACTERS.find(c => c.id === charId)
    if (!char) {
      this.proceedOrFinish()
      return
    }

    this.drawPanel()
    this.drawBanner()
    this.drawCharacterSprite(char)
    this.drawCharacterInfo(char)
    this.drawButtons()

    // Entrada: fade del panel + tween del sprite
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

    // Sombra
    g.fillStyle(0x000000, 0.5)
    g.fillRect(PANEL_X + 6, PANEL_Y + 6, PANEL_W, PANEL_H)

    // Fondo
    g.fillStyle(COLORS.DARK_BG, 1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    // Borde dorado
    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    // Cabecera
    g.fillStyle(COLORS.GOLD, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, 56)

    this.contentContainer.add(g)
  }

  drawBanner() {
    this.contentContainer.add(
      this.add.text(CENTER_X, PANEL_Y + 30, '¡NUEVO PERSONAJE!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '16px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5),
    )
  }

  drawCharacterSprite(char) {
    const spriteY = PANEL_Y + 80 + SPRITE_SIZE / 2

    // Marco del sprite
    const frameG = this.add.graphics()
    frameG.lineStyle(2, COLORS.UI_BORDER, 1)
    frameG.strokeRect(CENTER_X - SPRITE_SIZE / 2, PANEL_Y + 80, SPRITE_SIZE, SPRITE_SIZE)
    this.contentContainer.add(frameG)

    // Sprite del personaje (empieza con scale 0 para el tween)
    const hasSprite = this.textures.exists(char.sprite) &&
      this.textures.get(char.sprite).key !== '__MISSING'

    if (hasSprite) {
      this.charSprite = this.add.image(CENTER_X, spriteY, char.sprite)
        .setDisplaySize(SPRITE_SIZE, SPRITE_SIZE)
        .setOrigin(0.5)
        .setScale(0)
    } else {
      const placeholderG = this.add.graphics()
      placeholderG.fillStyle(0x2a2a4a, 1)
      placeholderG.fillRect(CENTER_X - SPRITE_SIZE / 2, PANEL_Y + 80, SPRITE_SIZE, SPRITE_SIZE)
      this.contentContainer.add(placeholderG)

      this.charSprite = this.add.text(CENTER_X, spriteY, '?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '80px',
        color:      '#ffd700',
      }).setOrigin(0.5).setScale(0)
    }

    this.contentContainer.add(this.charSprite)
    this.drawStars(CENTER_X, spriteY)
  }

  drawStars(cx, cy) {
    const radius = SPRITE_SIZE / 2 + 16
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

  drawCharacterInfo(char) {
    const infoY = PANEL_Y + 80 + SPRITE_SIZE + 16

    // Nombre
    this.contentContainer.add(
      this.add.text(CENTER_X, infoY, char.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '14px',
        color:      '#ffd700',
        stroke:     '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5),
    )

    // Descripción
    this.contentContainer.add(
      this.add.text(CENTER_X, infoY + 30, char.description, {
        fontFamily: 'monospace',
        fontSize:   '11px',
        color:      '#bbbbbb',
        align:      'center',
        lineSpacing: 4,
        wordWrap:   { width: PANEL_W - 60 },
      }).setOrigin(0.5),
    )

    // Stats
    this._drawStats(char.stats, infoY + 68)
  }

  _drawStats(stats, startY) {
    const barW    = 200
    const barH    = 10
    const labelW  = 52
    const rowH    = 20
    const totalW  = labelW + 8 + barW
    const startX  = CENTER_X - totalW / 2

    Object.entries(stats).forEach(([key, value], i) => {
      const sy    = startY + i * rowH
      const color = STAT_COLORS[key] ?? 0xffffff

      this.contentContainer.add(
        this.add.text(startX, sy, STAT_NAMES[key] ?? key, {
          fontFamily: 'monospace',
          fontSize:   '9px',
          color:      '#999999',
        }),
      )

      const barG = this.add.graphics()
      const bx   = startX + labelW + 8

      barG.fillStyle(0x0a0a1e, 1)
      barG.fillRect(bx, sy + 1, barW, barH)
      barG.fillStyle(color, 1)
      barG.fillRect(bx, sy + 1, (value / STAT_MAX) * barW, barH)
      barG.lineStyle(1, 0x3a3a5a, 1)
      barG.strokeRect(bx, sy + 1, barW, barH)

      this.contentContainer.add(barG)
    })
  }

  // ── Botones ──────────────────────────────────────────────────

  drawButtons() {
    const isLast   = this.currentIndex >= this.unlockedCharacters.length - 1
    const btnH     = 52
    const btnY     = PANEL_Y + PANEL_H - btnH - 16

    this.buttonContainer = this.add.container(0, 0)
    this.buttonContainer.setAlpha(0)

    if (isLast) {
      // Último (o único) desbloqueo: mostrar opciones finales
      const btnW = 220
      const gap  = 16

      makeNavButton(
        this,
        CENTER_X - btnW - gap / 2,
        btnY, btnW, btnH,
        'ELEGIR PERSONAJE',
        () => { if (this.canInteract) this.goToCharacterSelect() },
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
      // Hay más personajes por revelar
      makeNavButton(
        this,
        CENTER_X - 120,
        btnY, 240, btnH,
        'SIGUIENTE ▶',
        () => { if (this.canInteract) this.nextCharacter() },
        { depth: 6 },
      )
    }
  }

  // ── Animación del sprite ─────────────────────────────────────

  animateSprite() {
    this.tweens.add({
      targets:  this.charSprite,
      scaleX:   1,
      scaleY:   1,
      duration: 450,
      ease:     'Back.easeOut',
      onComplete: () => {
        // Mostrar botones con fade tras la animación del sprite
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

  // ── Navegación ───────────────────────────────────────────────

  nextCharacter() {
    this.currentIndex++
    this.showCurrentCharacter()
  }

  proceedOrFinish() {
    this.scene.start(SCENES.CHARACTER_SELECT)
  }

  goToCharacterSelect() {
    this.scene.start(SCENES.CHARACTER_SELECT)
  }

  playAgain() {
    this.scene.start(SCENES.GAME, { character: this.characterData })
  }
}
