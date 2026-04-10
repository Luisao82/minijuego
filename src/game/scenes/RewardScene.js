import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { rewardStorage } from '../services/RewardStorageService'
import { unlockService } from '../services/UnlockService'
import { perspectiveUnlockService } from '../services/PerspectiveUnlockService'
import { characterRewardService } from '../services/CharacterRewardService'
import { skinService } from '../services/SkinService'
import { makeNavButton } from '../components/NavButton'

// Panel casi a pantalla completa en altura
const PANEL_W = 560
const PANEL_H = 700
const PANEL_X = Math.round((GAME_WIDTH - PANEL_W) / 2)   // 232
const PANEL_Y = Math.round((GAME_HEIGHT - PANEL_H) / 2)  // 34
const CENTER_X = GAME_WIDTH / 2
// Imagen grande: ocupa casi todo el alto disponible entre cabecera y botones
const IMG_SIZE = 380

// Colores del confeti
const CONFETTI_COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xff69b4, 0xffeaa7, 0xc0392b]

export class RewardScene extends Scene {

  constructor() {
    super(SCENES.REWARD)
  }

  init(data) {
    this.reward = data.reward || null
    this.characterData = data.character || null
    this.canPlay = false

    // Detectar si es la primera vez antes de guardar
    // Los confetis solo se muestran en la primera obtención del premio
    const previousCount = this.reward?.id ? rewardStorage.getCount(this.reward.id) : 1
    this.isFirstWin = previousCount === 0

    // Persistir el premio obtenido en cuanto se recibe (antes de renderizar)
    if (this.reward?.id) {
      rewardStorage.addReward(this.reward.id)
    }

    // Trackear el premio con el personaje que lo ha conseguido y detectar skins nuevos
    if (this.characterData?.id) {
      characterRewardService.addReward(this.characterData.id)
      this.newSkinUnlocks = this._checkSkinUnlocks()
    } else {
      this.newSkinUnlocks = []
    }

    // Comprobar si algún personaje se desbloquea con este premio
    const newUnlocks = unlockService.checkNewUnlocks(rewardStorage)
    if (newUnlocks.length > 0) {
      unlockService.saveUnlocks(newUnlocks)
    }
    this.newUnlocks = newUnlocks

    // Comprobar si alguna perspectiva se desbloquea con este premio
    const newPerspUnlocks = perspectiveUnlockService.checkNewUnlocks(rewardStorage)
    if (newPerspUnlocks.length > 0) {
      perspectiveUnlockService.saveUnlocks(newPerspUnlocks)
    }
    this.newPerspUnlocks = newPerspUnlocks
  }

  // Desbloquea los skins del personaje cuya condición se cumple ahora.
  // Devuelve el array de objetos skin recién desbloqueados (puede ser vacío).
  _checkSkinUnlocks() {
    const char     = this.characterData
    const skins    = char.skins ?? []
    const newSkins = []
    for (const skin of skins) {
      if (skin.flags === null || skin.flags === undefined) continue
      if (skinService.isSkinUnlocked(char, skin.spritesheet)) continue
      if (characterRewardService.getCount(char.id) >= skin.flags) {
        skinService.unlockSkin(char.id, skin.spritesheet)
        newSkins.push(skin)
      }
    }
    return newSkins
  }

  create() {
    this.drawBackground()
    this.drawPanel()
    this.drawContent()
    this.drawButtons()
    this.setupInput()
    // Confeti solo en la primera obtención del premio
    if (this.isFirstWin) this.spawnConfetti()
    this.playEntrance()
  }

  drawBackground() {
    this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.72)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  drawPanel() {
    const g = this.add.graphics()

    // Sombra
    g.fillStyle(0x000000, 0.5)
    g.fillRect(PANEL_X + 6, PANEL_Y + 6, PANEL_W, PANEL_H)

    // Fondo del panel
    g.fillStyle(COLORS.DARK_BG, 1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    // Borde exterior dorado
    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)

    // Borde interior sutil
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    // Cabecera coloreada
    g.fillStyle(COLORS.GOLD, 0.1)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, 56)
  }

  drawContent() {
    const topY = PANEL_Y

    // Título principal
    this.add.text(CENTER_X, topY + 30, '¡ENHORABUENA!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Subtítulo
    this.add.text(CENTER_X, topY + 84, 'has conseguido...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Separador
    const sepG = this.add.graphics()
    sepG.lineStyle(1, COLORS.GOLD, 0.4)
    sepG.strokeRect(PANEL_X + 24, topY + 104, PANEL_W - 48, 1)

    // Imagen del premio — centrada verticalmente en el espacio disponible
    const imgCY = topY + 153 + IMG_SIZE / 2
    this.drawRewardImage(CENTER_X, imgCY)

    // Nombre del premio
    const nombre = this.reward?.nombre || '¡Premio misterioso!'
    this.add.text(CENTER_X, imgCY + IMG_SIZE / 2 + 22, nombre, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: PANEL_W - 60 },
    }).setOrigin(0.5)

    // Descripción del premio (opcional)
    if (this.reward?.descripcion) {
      this.add.text(CENTER_X, imgCY + IMG_SIZE / 2 + 48, this.reward.descripcion, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: PANEL_W - 80 },
      }).setOrigin(0.5)
    }
  }

  drawRewardImage(cx, cy) {
    const half = IMG_SIZE / 2

    if (this.reward && this.textures.exists(this.reward.id) &&
        this.textures.get(this.reward.id).key !== '__MISSING') {
      this.add.image(cx, cy, this.reward.id)
        .setDisplaySize(IMG_SIZE, IMG_SIZE)
        .setOrigin(0.5)
    } else {
      const g = this.add.graphics()
      g.fillStyle(0x2a2a4a, 1)
      g.fillRect(cx - half, cy - half, IMG_SIZE, IMG_SIZE)
      g.lineStyle(2, COLORS.GOLD, 0.8)
      g.strokeRect(cx - half, cy - half, IMG_SIZE, IMG_SIZE)
      // Cuadrícula decorativa pixel art
      g.lineStyle(1, COLORS.GOLD, 0.12)
      for (let i = 0; i < IMG_SIZE; i += 20) {
        g.strokeRect(cx - half + i / 2, cy - half + i / 2, IMG_SIZE - i, IMG_SIZE - i)
      }
      this.add.text(cx, cy, '?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '60px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
    }

    this.drawStars(cx, cy, half)
  }

  drawStars(cx, cy, radius) {
    const positions = [
      { x: cx - radius - 24, y: cy - radius - 12 },
      { x: cx + radius + 24, y: cy - radius - 12 },
      { x: cx - radius - 18, y: cy + radius + 18 },
      { x: cx + radius + 18, y: cy + radius + 18 },
    ]

    positions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffd700',
      }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: star,
        alpha: 1,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        delay: 400 + i * 120,
        duration: 300,
        ease: 'Back.easeOut',
      })

      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.4 },
        delay: 800 + i * 120,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  // Dos botones lado a lado dentro del panel
  drawButtons() {
    const btnH = 58
    const btnW = 240
    const gap  = 16
    const btnY = PANEL_Y + PANEL_H - btnH - 20

    makeNavButton(
      this,
      CENTER_X - btnW - gap / 2,
      btnY, btnW, btnH,
      'VOLVER A JUGAR',
      () => { if (this.canPlay) this.playAgain() },
      { depth: 6 },
    )

    makeNavButton(
      this,
      CENTER_X + gap / 2,
      btnY, btnW, btnH,
      'VER PREMIOS',
      () => { if (this.canPlay) this.viewCollection() },
      { depth: 6 },
    )
  }

  // ========================================
  // CONFETI
  // ========================================

  spawnConfetti() {
    const count = 70
    // Confeti cae sobre todo el panel
    for (let i = 0; i < count; i++) {
      const color = Phaser.Utils.Array.GetRandom(CONFETTI_COLORS)
      const size = Phaser.Math.Between(4, 10)
      const startX = Phaser.Math.Between(PANEL_X + 10, PANEL_X + PANEL_W - 10)
      const endX = startX + Phaser.Math.Between(-100, 100)
      const delay = Phaser.Math.Between(0, 1200)
      const duration = Phaser.Math.Between(1200, 2800)

      const g = this.add.graphics()
      g.fillStyle(color, 1)
      g.fillRect(-size / 2, -size / 2, size, size)
      g.x = startX
      g.y = PANEL_Y - 10

      this.tweens.add({
        targets: g,
        x: endX,
        y: PANEL_Y + PANEL_H + 15,
        angle: Phaser.Math.Between(-540, 540),
        alpha: { from: 1, to: 0.1 },
        delay,
        duration,
        ease: 'Quad.easeIn',
      })
    }
  }

  setupInput() {
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.canPlay) this.playAgain()
    })
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.canPlay) this.scene.start(SCENES.MENU)
    })
  }

  playEntrance() {
    // Excluir el primer elemento (fondo) de la animación de entrada
    const allObjects = this.children.list.slice(1)
    allObjects.forEach(obj => {
      if (obj.setAlpha) obj.setAlpha(0)
    })

    this.tweens.add({
      targets: allObjects,
      alpha: 1,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => { this.canPlay = true },
    })
  }

  playAgain() {
    this._navigateWithUnlocks(SCENES.GAME)
  }

  viewCollection() {
    this._navigateWithUnlocks(SCENES.COLLECTION)
  }

  // Redirige al destino final pasando primero por las escenas de desbloqueo
  // que correspondan. Orden: vistas → personajes → skins → destino.
  _navigateWithUnlocks(finalScene) {
    if (this.newPerspUnlocks?.length > 0) {
      this.scene.start(SCENES.PERSPECTIVE_UNLOCK, {
        unlockedPerspectives: this.newPerspUnlocks,
        character:            this.characterData,
        nextUnlocks:          this.newUnlocks,
        nextScene:            finalScene,
      })
    } else if (this.newUnlocks?.length > 0) {
      this.scene.start(SCENES.CHARACTER_UNLOCK, {
        unlockedCharacters: this.newUnlocks,
        character:          this.characterData,
      })
    } else if (this.newSkinUnlocks?.length > 0) {
      this.scene.start(SCENES.SKIN_UNLOCK, {
        newSkins:  this.newSkinUnlocks,
        character: this.characterData,
      })
    } else if (finalScene === SCENES.GAME) {
      this.scene.start(SCENES.GAME, { character: this.characterData })
    } else {
      this.scene.start(finalScene, { character: this.characterData })
    }
  }
}
