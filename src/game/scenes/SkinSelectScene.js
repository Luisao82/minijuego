import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'
import { makeNavButton } from '../components/NavButton'
import { skinService } from '../services/SkinService'
import { characterRewardService } from '../services/CharacterRewardService'

// ── Constantes de layout ────────────────────────────────────────
// Mismos valores que CharacterSelectScene para coherencia visual
const BAND_Y          = 120   // igual que CharacterSelectScene
const BAND_H          = 440   // igual que CharacterSelectScene
const SKIN_NAME_Y     = 185
const SPRITE_CENTER_Y = 330
const LOCK_ICON_Y     = 290
const COMO_TEXT_Y     = 445
const BTN_W           = 200
const BTN_H           = 56
// CharacterSelectScene coloca 'SELECCIONAR' centrado en Y=600 (BAND_Y+BAND_H+40).
// makeNavButton recibe la esquina superior izquierda, así que el centro queda en BTN_TOP + BTN_H/2.
// Para que el centro coincida con Y=600: BTN_TOP = 600 - 56/2 = 572.
const BTN_TOP         = 572
const FRAME_INTERVAL  = 400   // ms entre frame STAND y WALK

const SPRITE_PATH = 'sprites/characters/spritesheet/'

export class SkinSelectScene extends BaseScene {

  constructor() {
    super(SCENES.SKIN_SELECT)
  }

  init(data) {
    super.init(data)
    this.character    = data.character
    this.perspective  = data.perspective ?? null
    this.skinIndex    = 0
    this._frameTimer  = null
    this.justUnlocked = data.justUnlocked ?? []   // spritesheets recién desbloqueados
  }

  preload() {
    this.load.setPath('assets')
    // Carga todos los spritesheets de los skins del personaje
    for (const skin of this.character.skins) {
      const key = `skin-${skin.spritesheet}`
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, `${SPRITE_PATH}${skin.spritesheet}.png`, {
          frameWidth:  SPRITE_CONFIG.frameWidth,
          frameHeight: SPRITE_CONFIG.frameHeight,
        })
      }
    }
  }

  create() {
    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, `${this.character.name}`, 280)

    this.skinDisplay = this.add.container(0, 0)
    this.drawCurrentSkin()
    this.drawNavArrows()
    this.drawActionButtons()
  }

  // ── Renderizado del skin actual ─────────────────────────────

  drawCurrentSkin() {
    this.skinDisplay.removeAll(true)
    if (this._frameTimer) {
      this._frameTimer.remove()
      this._frameTimer = null
    }

    const skin       = this.character.skins[this.skinIndex]
    const isUnlocked = skinService.isSkinUnlocked(this.character, skin.spritesheet)
      || skin.flags === null  // el skin por defecto siempre desbloqueado

    if (isUnlocked) {
      this._drawUnlockedSkin(skin)
    } else {
      this._drawLockedSkin(skin)
    }
  }

  _drawUnlockedSkin(skin) {
    // Nombre del skin
    this.skinDisplay.add(
      this.add.text(GAME_WIDTH / 2, SKIN_NAME_Y, skin.nombre, {
        fontFamily: '"Jersey 10", cursive',
        fontSize:   '36px',
        color:      '#ffd700',
        stroke:     '#1a0800',
        strokeThickness: 6,
      }).setOrigin(0.5),
    )

    // Sprite grande
    const key    = `skin-${skin.spritesheet}`
    const sprite = this.add.image(
      GAME_WIDTH / 2,
      SPRITE_CENTER_Y,
      key,
      SPRITE_FRAMES.STAND,
    )
    sprite.setScale(SPRITE_CONFIG.scalePreview)
    sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
    this.skinDisplay.add(sprite)

    // Animación: alterna entre STAND y WALK
    let showStand = true
    this._frameTimer = this.time.addEvent({
      delay:    FRAME_INTERVAL,
      loop:     true,
      callback: () => {
        showStand = !showStand
        sprite.setFrame(showStand ? SPRITE_FRAMES.STAND : SPRITE_FRAMES.WALK)
      },
    })

    // Badge ¡NUEVO! si este skin se acaba de desbloquear
    if (this.justUnlocked.includes(skin.spritesheet)) {
      const spriteW   = SPRITE_CONFIG.frameWidth  * SPRITE_CONFIG.scalePreview
      const badgeText = this.add.text(
        GAME_WIDTH / 2 + spriteW / 2 + 8,
        SPRITE_CENTER_Y - SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scalePreview / 2,
        '¡NUEVO!',
        {
          fontFamily:      '"Jersey 10", cursive',
          fontSize:        '26px',
          color:           '#00ff88',
          stroke:          '#003322',
          strokeThickness: 5,
        },
      ).setOrigin(0, 0)
      this.skinDisplay.add(badgeText)
      this.tweens.add({
        targets:  badgeText,
        alpha:    0.2,
        duration: 500,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    }

    // Indicador de posición (puntos)
    this._drawDots()
  }

  _drawLockedSkin(skin) {
    // Fondo oscuro donde iría el sprite
    const spriteW = SPRITE_CONFIG.frameWidth  * SPRITE_CONFIG.scalePreview
    const spriteH = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scalePreview
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.55)
    bg.fillRect(GAME_WIDTH / 2 - spriteW / 2, SPRITE_CENTER_Y - spriteH / 2, spriteW, spriteH)
    bg.lineStyle(2, COLORS.UI_BORDER, 0.6)
    bg.strokeRect(GAME_WIDTH / 2 - spriteW / 2, SPRITE_CENTER_Y - spriteH / 2, spriteW, spriteH)
    this.skinDisplay.add(bg)

    // Nombre del skin — oculto hasta que se desbloquee
    this.skinDisplay.add(
      this.add.text(GAME_WIDTH / 2, SKIN_NAME_Y, '???', {
        fontFamily:      '"Jersey 10", cursive',
        fontSize:        '36px',
        color:           '#444466',
        stroke:          '#1a0800',
        strokeThickness: 6,
      }).setOrigin(0.5),
    )

    // Icono candado
    this.skinDisplay.add(
      this.add.text(GAME_WIDTH / 2, LOCK_ICON_Y, '🔒', {
        fontSize: '48px',
      }).setOrigin(0.5),
    )

    // Progreso de banderas
    this._drawFlagProgress(skin)

    // Indicador de posición (puntos)
    this._drawDots()
  }

  // Dibuja los iconos de bandera del tramo entre el skin anterior y este.
  // Solo muestra las banderas que hacen falta para pasar del umbral anterior al actual.
  _drawFlagProgress(skin) {
    const required = skin.flags ?? 0
    if (required <= 0) return

    // Umbral del skin anterior con flags (o 0 si es el primero bloqueado)
    let prevThreshold = 0
    for (let i = this.skinIndex - 1; i >= 0; i--) {
      const s = this.character.skins[i]
      if (s.flags !== null && s.flags !== undefined) {
        prevThreshold = s.flags
        break
      }
    }

    const stepRequired = required - prevThreshold
    const currentTotal = characterRewardService.getCount(this.character.id)
    const currentStep  = Math.max(0, Math.min(currentTotal - prevThreshold, stepRequired))

    const POLE_W = 3
    const POLE_H = 26
    const FLAG_W = 16
    const FLAG_H = 11
    const GAP    = 14
    const UNIT   = POLE_W + FLAG_W + GAP
    const totalW = stepRequired * UNIT - GAP
    const startX = Math.round(GAME_WIDTH / 2 - totalW / 2)
    const baseY  = COMO_TEXT_Y + 18   // ligeramente más abajo

    const g = this.add.graphics()

    for (let i = 0; i < stepRequired; i++) {
      const x      = startX + i * UNIT
      const filled = i < currentStep

      // Palo
      g.fillStyle(filled ? 0xdddddd : 0x2a2a44, 1)
      g.fillRect(x, baseY, POLE_W, POLE_H)

      // Tela — blanca si conseguida
      g.fillStyle(filled ? 0xffffff : 0x1e1e38, 1)
      g.fillRect(x + POLE_W, baseY + 1, FLAG_W, FLAG_H)

      // Borde sutil en las rellenas
      if (filled) {
        g.lineStyle(1, 0xaaaaaa, 0.5)
        g.strokeRect(x + POLE_W, baseY + 1, FLAG_W, FLAG_H)
      }
    }

    this.skinDisplay.add(g)

    // Contador "X / Y" debajo
    const counterColor = currentStep >= stepRequired ? '#ffd700' : '#aaaacc'
    this.skinDisplay.add(
      this.add.text(GAME_WIDTH / 2, baseY + POLE_H + 10, `${currentStep} / ${stepRequired} banderas`, {
        fontFamily: 'monospace',
        fontSize:   '12px',
        color:      counterColor,
      }).setOrigin(0.5),
    )
  }

  _drawDots() {
    const skins    = this.character.skins
    if (skins.length <= 1) return

    const dotSpacing = 16
    const totalW     = (skins.length - 1) * dotSpacing
    const startX     = GAME_WIDTH / 2 - totalW / 2
    const dotsY      = SPRITE_CENTER_Y + SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scalePreview / 2 + 20

    skins.forEach((_, i) => {
      const isActive = i === this.skinIndex
      const dot      = this.add.graphics()
      dot.fillStyle(isActive ? COLORS.GOLD : 0x444466, 1)
      const size = isActive ? 5 : 3
      dot.fillRect(startX + i * dotSpacing - size / 2, dotsY - size / 2, size, size)
      this.skinDisplay.add(dot)
    })
  }

  // ── Botones de navegación ◀ ▶ ─────────────────────────────

  drawNavArrows() {
    if (this.character.skins.length <= 1) return

    this.leftArrow = this.add.image(40, SPRITE_CENTER_Y, 'btn-nav-left')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.rightArrow = this.add.image(GAME_WIDTH - 40, SPRITE_CENTER_Y, 'btn-nav-right')
      .setOrigin(0.5).setScale(2).setInteractive({ useHandCursor: true })

    this.leftArrow.on('pointerdown',  () => { this.leftArrow.setTexture('btn-nav-left-press'); this.navigate(-1) })
    this.leftArrow.on('pointerup',    () => this.leftArrow.setTexture('btn-nav-left'))
    this.leftArrow.on('pointerout',   () => this.leftArrow.setTexture('btn-nav-left'))
    this.rightArrow.on('pointerdown', () => { this.rightArrow.setTexture('btn-nav-right-press'); this.navigate(1) })
    this.rightArrow.on('pointerup',   () => this.rightArrow.setTexture('btn-nav-right'))
    this.rightArrow.on('pointerout',  () => this.rightArrow.setTexture('btn-nav-right'))

    this.input.keyboard.on('keydown-LEFT',  () => this.navigate(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1))
  }

  navigate(direction) {
    this.skinIndex = Phaser.Math.Wrap(
      this.skinIndex + direction,
      0,
      this.character.skins.length,
    )
    this.drawCurrentSkin()
  }

  // ── Botones de acción ────────────────────────────────────────

  drawActionButtons() {
    const centerX  = GAME_WIDTH / 2
    const gap      = 20
    const totalW   = BTN_W * 2 + gap
    const leftBtnX = centerX - totalW / 2
    const rightBtnX = leftBtnX + BTN_W + gap

    makeNavButton(
      this,
      leftBtnX, BTN_TOP,
      BTN_W, BTN_H,
      'VOLVER',
      () => this.scene.start(SCENES.CHARACTER_SELECT, { perspective: this.perspective }),
    )

    makeNavButton(
      this,
      rightBtnX, BTN_TOP,
      BTN_W, BTN_H,
      'JUGAR',
      () => this.startGame(),
    )

    this.input.keyboard.on('keydown-SPACE', () => this.startGame())
    this.input.keyboard.on('keydown-ENTER', () => this.startGame())
    this.input.keyboard.on('keydown-ESC',   () => {
      this.scene.start(SCENES.CHARACTER_SELECT, { perspective: this.perspective })
    })
  }

  // ── Iniciar partida ─────────────────────────────────────────

  startGame() {
    const skin = this.character.skins[this.skinIndex]

    // Solo se puede jugar con un skin desbloqueado
    if (skin.flags !== null && !skinService.isSkinUnlocked(this.character, skin.spritesheet)) return

    // Guardar el skin activo seleccionado
    skinService.setActiveSkin(this.character.id, skin.spritesheet)

    this.scene.start(SCENES.GAME, {
      character:   this.character,
      perspective: this.perspective,
      skin:        skin.spritesheet,
    })
  }
}
