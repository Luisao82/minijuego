import { BaseScene } from './BaseScene'
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
// Imagen del premio: ocupa casi todo el alto disponible entre cabecera y botones
const IMG_SIZE = 380

// Colores del confeti
const CONFETTI_COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xff69b4, 0xffeaa7, 0xc0392b]

export class RewardScene extends BaseScene {

  constructor() {
    super(SCENES.REWARD)
  }

  init(data) {
    super.init(data)
    this.reward        = data.reward || null
    this.characterData = data.character || null
    this.newMapPiece   = data.newMapPiece || null
    this.canPlay       = false

    // Detectar si es la primera vez antes de guardar
    const previousCount = this.reward?.id ? rewardStorage.getCount(this.reward.id) : 1
    this.isFirstWin = previousCount === 0

    // Persistir el premio obtenido
    if (this.reward?.id) {
      rewardStorage.addReward(this.reward.id)
    }

    // Trackear el premio con el personaje y detectar skins nuevos
    if (this.characterData?.id) {
      characterRewardService.addReward(this.characterData.id)
      this.newSkinUnlocks = this._checkSkinUnlocks()
    } else {
      this.newSkinUnlocks = []
    }

    // Comprobar si algún personaje se desbloquea con este premio
    const newUnlocks = unlockService.checkNewUnlocks(rewardStorage)
    if (newUnlocks.length > 0) unlockService.saveUnlocks(newUnlocks)
    this.newUnlocks = newUnlocks

    // Comprobar si alguna perspectiva se desbloquea con este premio
    const newPerspUnlocks = perspectiveUnlockService.checkNewUnlocks(rewardStorage)
    if (newPerspUnlocks.length > 0) perspectiveUnlockService.saveUnlocks(newPerspUnlocks)
    this.newPerspUnlocks = newPerspUnlocks
  }

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

  // ── Helpers de captura de objetos por fase ─────────────────────
  // makeNavButton y add.* añaden objetos directamente a la escena.
  // Capturamos los objetos de cada fase para controlar su visibilidad.

  _beginCapture() {
    this._captureIdx = this.children.list.length
  }

  _endCapture() {
    return [...this.children.list.slice(this._captureIdx)]
  }

  // ── Ciclo de vida ──────────────────────────────────────────────

  create() {
    // Fondo: siempre visible, no forma parte de ninguna fase
    this._drawBackground()

    if (this.newMapPiece) {
      // Fase 1 — Trozo de mapa
      this._beginCapture()
      this._buildMapPanel()
      this._phase1Objs = this._endCapture()

      // Fase 2 — Premio (construida pero oculta)
      this._beginCapture()
      this._buildPrizePanel()
      this._phase2Objs = this._endCapture()
      this._setObjsAlpha(this._phase2Objs, 0)

      // Entrada: solo animar fase 1
      this._playEntrance(this._phase1Objs, () => { this.canPlay = true })

    } else {
      // Sin trozo de mapa: ir directo al premio
      this._beginCapture()
      this._buildPrizePanel()
      this._phase2Objs = this._endCapture()

      if (this.isFirstWin) this.spawnConfetti()
      this._playEntrance(this._phase2Objs, () => { this.canPlay = true })
    }

    this.setupInput()
  }

  _setObjsAlpha(objs, alpha) {
    objs.forEach(o => { if (o.setAlpha) o.setAlpha(alpha) })
  }

  // ── Fondo ──────────────────────────────────────────────────────

  _drawBackground() {
    this.add.image(CENTER_X, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.72)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  // ── Fase 1 — Trozo de mapa ─────────────────────────────────────

  _buildMapPanel() {
    // Fondo del panel — borde verde lima
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.5)
    bg.fillRect(PANEL_X + 6, PANEL_Y + 6, PANEL_W, PANEL_H)
    bg.fillStyle(COLORS.DARK_BG, 1)
    bg.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    bg.lineStyle(3, 0x88ff00, 1)
    bg.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    bg.lineStyle(1, 0x88ff00, 0.3)
    bg.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)
    bg.fillStyle(0x88ff00, 0.12)
    bg.fillRect(PANEL_X, PANEL_Y, PANEL_W, 56)

    // Título
    this.add.text(CENTER_X, PANEL_Y + 30, '¡TROZO DEL MAPA!', {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '18px',
      color:           '#aaff00',
      stroke:          '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Subtítulo
    this.add.text(CENTER_X, PANEL_Y + 78, '¡Has desbloqueado una pieza\ndel mapa de Sevilla!', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '28px',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 2,
      align:           'center',
    }).setOrigin(0.5)

    // Separador
    const sep = this.add.graphics()
    sep.lineStyle(1, 0x88ff00, 0.4)
    sep.strokeRect(PANEL_X + 24, PANEL_Y + 114, PANEL_W - 48, 1)

    // Imagen del trozo de mapa
    const MAP_IMG_SIZE = 360
    const imgCY = PANEL_Y + 134 + MAP_IMG_SIZE / 2
    this._drawMapPieceImage(CENTER_X, imgCY, MAP_IMG_SIZE)

    // Progreso
    const unlocked = this._getMapUnlockedCount()
    this.add.text(CENTER_X, imgCY + MAP_IMG_SIZE / 2 + 26, `Piezas conseguidas: ${unlocked} / 15`, {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '28px',
      color:           '#aaff00',
      stroke:          '#000000',
      strokeThickness: 2,
      align:           'center',
    }).setOrigin(0.5)

    this.add.text(CENTER_X, imgCY + MAP_IMG_SIZE / 2 + 58, '¡Descúbrela en el mapa de Sevilla!', {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#88cc00',
      align:      'center',
    }).setOrigin(0.5)

    // Botón OK centrado
    const btnH = 58
    const btnW = 300
    const btnY = PANEL_Y + PANEL_H - btnH - 20
    makeNavButton(
      this,
      CENTER_X - btnW / 2,
      btnY, btnW, btnH,
      '¡A VER EL PREMIO!',
      () => { if (this.canPlay) this._showPrizePhase() },
      { depth: 6 },
    )
  }

  _drawMapPieceImage(cx, cy, size) {
    const half = size / 2
    // newMapPiece = "piece-{row}-{col}" → textura "map-piece-{row}-{col}"
    const textureKey = `map-${this.newMapPiece}`

    if (this.textures.exists(textureKey) &&
        this.textures.get(textureKey).key !== '__MISSING') {
      this.add.image(cx, cy, textureKey)
        .setDisplaySize(size, size)
        .setOrigin(0.5)
    } else {
      // Fallback gráfico
      const g = this.add.graphics()
      g.fillStyle(0x1a3a1a, 1)
      g.fillRect(cx - half, cy - half, size, size)
      g.lineStyle(3, 0x88ff00, 1)
      g.strokeRect(cx - half, cy - half, size, size)
      this.add.text(cx, cy, '?', {
        fontFamily:      '"Press Start 2P", monospace',
        fontSize:        '60px',
        color:           '#aaff00',
        stroke:          '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
    }

    // Marco decorativo verde lima alrededor de la imagen
    const frame = this.add.graphics()
    frame.lineStyle(4, 0xaaff00, 1)
    frame.strokeRect(cx - half - 6, cy - half - 6, size + 12, size + 12)
    frame.lineStyle(2, 0x446600, 0.8)
    frame.strokeRect(cx - half - 12, cy - half - 12, size + 24, size + 24)
  }

  _getMapUnlockedCount() {
    try {
      const raw   = localStorage.getItem('cucana_map')
      const state = raw ? JSON.parse(raw) : { unlocked: [] }
      return state.unlocked.length
    } catch (_) {
      return 1
    }
  }

  // ── Fase 2 — Premio ────────────────────────────────────────────

  _buildPrizePanel() {
    // Fondo del panel — borde dorado
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

    // Título principal
    this.add.text(CENTER_X, PANEL_Y + 30, '¡ENHORABUENA!', {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '22px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Subtítulo
    this.add.text(CENTER_X, PANEL_Y + 88, 'has conseguido...', {
      fontFamily:      '"Jersey 10", cursive',
      fontSize:        '28px',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Separador
    const sepG = this.add.graphics()
    sepG.lineStyle(1, COLORS.GOLD, 0.4)
    sepG.strokeRect(PANEL_X + 24, PANEL_Y + 104, PANEL_W - 48, 1)

    // Imagen del premio
    const imgCY = PANEL_Y + 153 + IMG_SIZE / 2
    this._drawRewardImage(CENTER_X, imgCY)

    // Nombre del premio
    const nombre = this.reward?.nombre || '¡Premio misterioso!'
    this.add.text(CENTER_X, imgCY + IMG_SIZE / 2 + 22, nombre, {
      fontFamily:      '"Press Start 2P", monospace',
      fontSize:        '16px',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
      wordWrap:        { width: PANEL_W - 60 },
    }).setOrigin(0.5)

    // Descripción opcional
    if (this.reward?.descripcion) {
      this.add.text(CENTER_X, imgCY + IMG_SIZE / 2 + 48, this.reward.descripcion, {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#cccccc',
        align:      'center',
        wordWrap:   { width: PANEL_W - 80 },
      }).setOrigin(0.5)
    }

    // Botones
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

  _drawRewardImage(cx, cy) {
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
      g.lineStyle(1, COLORS.GOLD, 0.12)
      for (let i = 0; i < IMG_SIZE; i += 20) {
        g.strokeRect(cx - half + i / 2, cy - half + i / 2, IMG_SIZE - i, IMG_SIZE - i)
      }
      this.add.text(cx, cy, '?', {
        fontFamily:      '"Press Start 2P", monospace',
        fontSize:        '60px',
        color:           '#ffd700',
        stroke:          '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
    }

    this._drawStars(cx, cy, half)
  }

  _drawStars(cx, cy, radius) {
    const positions = [
      { x: cx - radius - 24, y: cy - radius - 12 },
      { x: cx + radius + 24, y: cy - radius - 12 },
      { x: cx - radius - 18, y: cy + radius + 18 },
      { x: cx + radius + 18, y: cy + radius + 18 },
    ]

    // En flujo de dos fases, las estrellas empiezan invisibles y sus tweens
    // se añaden solo cuando la fase del premio se hace visible (_activateStars).
    // En flujo de una fase, se añaden los tweens de entrada inmediatamente.
    this._starRefs = []

    positions.forEach((pos, i) => {
      const star = this.add.text(pos.x, pos.y, '★', {
        fontFamily: 'monospace',
        fontSize:   '16px',
        color:      '#ffd700',
      }).setOrigin(0.5).setAlpha(0)

      this._starRefs.push({ star, i })

      if (!this.newMapPiece) {
        // Flujo de una fase: animar entrada + pulso
        this.tweens.add({
          targets:  star,
          alpha:    1,
          scaleX:   { from: 0.5, to: 1 },
          scaleY:   { from: 0.5, to: 1 },
          delay:    400 + i * 120,
          duration: 300,
          ease:     'Back.easeOut',
        })
        this.tweens.add({
          targets:  star,
          alpha:    { from: 1, to: 0.4 },
          delay:    800 + i * 120,
          duration: 700,
          yoyo:     true,
          repeat:   -1,
          ease:     'Sine.easeInOut',
        })
      }
    })
  }

  // Activa los tweens de las estrellas al revelar la fase del premio.
  _activateStars() {
    if (!this._starRefs) return
    this._starRefs.forEach(({ star, i }) => {
      this.tweens.add({
        targets:  star,
        alpha:    1,
        scaleX:   { from: 0.5, to: 1 },
        scaleY:   { from: 0.5, to: 1 },
        delay:    i * 100,
        duration: 280,
        ease:     'Back.easeOut',
      })
      this.tweens.add({
        targets:  star,
        alpha:    { from: 1, to: 0.4 },
        delay:    300 + i * 100,
        duration: 700,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      })
    })
  }

  // ── Transición entre fases ─────────────────────────────────────

  _showPrizePhase() {
    this.canPlay = false

    this.tweens.add({
      targets:  this._phase1Objs,
      alpha:    0,
      duration: 250,
      ease:     'Quad.easeIn',
      onComplete: () => {
        this._phase1Objs.forEach(o => o.setVisible && o.setVisible(false))

        // Separar estrellas del resto para animarlas independientemente
        const starSet  = new Set((this._starRefs ?? []).map(r => r.star))
        const nonStars = this._phase2Objs.filter(o => !starSet.has(o))

        this.tweens.add({
          targets:  nonStars,
          alpha:    1,
          duration: 300,
          ease:     'Quad.easeOut',
          onComplete: () => {
            this._activateStars()
            if (this.isFirstWin) this.spawnConfetti()
            this.canPlay = true
          },
        })
      },
    })
  }

  // ── Confeti ────────────────────────────────────────────────────

  spawnConfetti() {
    const count = 70
    for (let i = 0; i < count; i++) {
      const color    = Phaser.Utils.Array.GetRandom(CONFETTI_COLORS)
      const size     = Phaser.Math.Between(4, 10)
      const startX   = Phaser.Math.Between(PANEL_X + 10, PANEL_X + PANEL_W - 10)
      const endX     = startX + Phaser.Math.Between(-100, 100)
      const delay    = Phaser.Math.Between(0, 1200)
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

  // ── Input y navegación ─────────────────────────────────────────

  setupInput() {
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.canPlay) this.playAgain()
    })
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.canPlay) this.scene.start(SCENES.MENU)
    })
  }

  _playEntrance(objs, onDone) {
    // Resetear alpha de los objetos de la fase y animar entrada
    objs.forEach(o => { if (o.setAlpha) o.setAlpha(0) })
    this.tweens.add({
      targets:  objs,
      alpha:    1,
      duration: 380,
      ease:     'Quad.easeOut',
      onComplete: onDone,
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
