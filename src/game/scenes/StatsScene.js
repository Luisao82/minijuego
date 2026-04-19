import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { CHARACTERS } from '../config/characters'
import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'
import { gameStatsService } from '../services/GameStatsService'
import { StatsCalculator } from '../systems/StatsCalculator'
import { makeNavButton } from '../components/NavButton'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'

// ── Layout ───────────────────────────────────────────────────
const BAND_Y    = 120
const BAND_H    = 520
const COL_L     = 30      // margen izquierdo columna izquierda
const COL_LDIV  = 500     // posición x de los valores (alineados a la derecha)
const DIVIDER_X = 512     // línea divisoria central
const COL_R     = 530     // inicio columna derecha
const CONTENT_Y = BAND_Y + 20

// Sección TOP SKINS — pódium
const PODIUM_CX     = Math.round((COL_R + GAME_WIDTH) / 2)  // centro columna derecha (~777)
const PODIUM_SEP    = 138   // separación horizontal entre posiciones del pódium
const PODIUM_BASE_Y = 358   // y del suelo de todos los bloques del pódium
const SPRITE_W      = SPRITE_CONFIG.frameWidth  * SPRITE_CONFIG.scale  // 48px
const SPRITE_H      = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scale  // 72px
const BLOCK_W       = 108   // anchura del bloque del pódium

// Alturas de bloque y colores por posición
const PODIUM_RANKS = [
  { rank: 1, x: PODIUM_CX,           blockH: 52, color: 0xd4a520, textColor: '#1a0800' },
  { rank: 2, x: PODIUM_CX - PODIUM_SEP, blockH: 38, color: 0xa0a0a0, textColor: '#1a1a1a' },
  { rank: 3, x: PODIUM_CX + PODIUM_SEP, blockH: 26, color: 0x8b5e2a, textColor: '#f0e0c8' },
]

// Sección TOP PREMIOS — empieza debajo del pódium
const TOP_REWARDS_Y = PODIUM_BASE_Y + 28 + 14   // base del pódium + win labels + gap
const ROW_H_REWARDS = 50

// ── Tipografía pixel art ──────────────────────────────────────
const F_SECTION = {
  fontFamily:      '"Jersey 10", cursive',
  fontSize:        '32px',
  color:           '#ffd700',
  stroke:          '#000000',
  strokeThickness: 5,
}
const F_LABEL = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize:   '16px',
  color:      '#aaaaaa',
}
const F_VALUE = {
  fontFamily:      '"Jersey 10", cursive',
  fontSize:        '32px',
  color:           '#ffd700',
  stroke:          '#000000',
  strokeThickness: 4,
}

export class StatsScene extends BaseScene {

  constructor() {
    super(SCENES.STATS)
  }

  // Pre-calcular summary en init() para que preload() sepa qué spritesheets cargar
  init() {
    super.init()
    const records  = gameStatsService.getAll()
    const calc     = new StatsCalculator(records)
    this._summary  = calc.getSummary()
  }

  // Cargar los spritesheets de los skins del pódium
  preload() {
    this.load.setPath('assets')
    this._summary.topSkins.forEach(({ skinKey }) => {
      if (this.textures.exists(skinKey)) return
      const name = skinKey.replace('sprite-', '')
      this.load.spritesheet(skinKey, `sprites/characters/spritesheet/${name}.png`, {
        frameWidth:  SPRITE_CONFIG.frameWidth,
        frameHeight: SPRITE_CONFIG.frameHeight,
      })
      // Filtro NEAREST para pixel art limpio al escalar
      this.load.once(`filecomplete-spritesheet-${skinKey}`, () => {
        const tex = this.textures.get(skinKey)
        if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST)
      })
    })
  }

  create() {
    const summary = this._summary

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 65, 'ESTADÍSTICAS', 270)
    this._drawDivider()
    this._drawBackButton()

    if (summary.totalGames === 0) {
      this._drawEmpty()
      return
    }

    this._drawGeneralStats(summary)
    this._drawBestCharacter(summary.bestCharacter)
    this._drawTopSkins(summary.topSkins)
    this._drawTopRewards(summary.topRewards)
  }

  // ── Elementos estructurales ───────────────────────────────

  _drawDivider() {
    const g = this.add.graphics()
    g.lineStyle(1, COLORS.GOLD, 0.25)
    g.lineBetween(DIVIDER_X, BAND_Y + 16, DIVIDER_X, BAND_Y + BAND_H - 16)
  }

  _drawBackButton() {
    const btnW = 220
    const btnH = 58
    makeNavButton(
      this,
      GAME_WIDTH / 2 - btnW / 2,
      BAND_Y + BAND_H + 16,
      btnW, btnH,
      'VOLVER',
      () => this.scene.start(SCENES.MENU),
      { depth: 2, fontSize: '32px' },
    )
  }

  _drawEmpty() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'AÚN NO HAS JUGADO', {
      ...F_LABEL,
      fontSize: '14px',
      color:    '#666666',
    }).setOrigin(0.5)
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, 'JUEGA TU PRIMERA PARTIDA', {
      ...F_LABEL,
      fontSize: '11px',
      color:    '#444444',
    }).setOrigin(0.5)
  }

  // ── Columna izquierda ─────────────────────────────────────

  _drawGeneralStats(summary) {
    let y = CONTENT_Y + 10

    this.add.text(COL_L, y, 'GENERAL', F_SECTION).setOrigin(0, 0.5)
    y += 32

    const rows = [
      ['PARTIDAS',    `${summary.totalGames}`],
      ['VICTORIAS',   `${summary.totalWins}`],
      ['% VICT.',     `${summary.winRate}%`],
      ['REC. MEDIO',  `${summary.avgPolePercent}%`],
      ['RACHA MAX.',  `${summary.consecutiveWins}`],
    ]

    rows.forEach(([label, value]) => {
      this.add.text(COL_L + 4, y, label, F_LABEL).setOrigin(0, 0.5)
      this.add.text(COL_LDIV, y, value, F_VALUE).setOrigin(1, 0.5)
      y += 46
    })
  }

  _drawBestCharacter(best) {
    if (!best) return

    // y justo debajo de la sección GENERAL (5 filas × 46 + título 32 + gap 16)
    let y = CONTENT_Y + 10 + 32 + 5 * 46 + 16

    this.add.text(COL_L, y, 'MEJOR PERSONAJE', F_SECTION).setOrigin(0, 0.5)
    y += 32

    const imgSize = 60
    const imgX    = COL_L + imgSize / 2 + 4
    const imgY    = y + imgSize / 2
    const imgKey  = `char-${best.characterId}`

    if (this.textures.exists(imgKey)) {
      this.add.image(imgX, imgY, imgKey)
        .setDisplaySize(imgSize, imgSize)
        .setOrigin(0.5)
    }

    const textX    = imgX + imgSize / 2 + 12
    const charName = this._getCharacterName(best.characterId)
    this.add.text(textX, imgY - 14, charName, F_VALUE).setOrigin(0, 0.5)
    this.add.text(textX, imgY + 12, `${best.winRate}% VICT.`, F_LABEL).setOrigin(0, 0.5)
  }

  // ── Columna derecha — Pódium ──────────────────────────────

  _drawTopSkins(topSkins) {
    const titleY = CONTENT_Y + 10

    this.add.text(COL_R, titleY, 'TOP SKINS', F_SECTION).setOrigin(0, 0.5)

    if (!topSkins.length) {
      this.add.text(COL_R + 4, titleY + 40, 'SIN DATOS', F_LABEL).setOrigin(0, 0.5)
      return
    }

    const g = this.add.graphics()

    PODIUM_RANKS.forEach(({ rank, x, blockH, color, textColor }) => {
      const entry = topSkins[rank - 1]
      if (!entry) return

      const blockY   = PODIUM_BASE_Y - blockH
      const spriteY  = blockY              // sprite con origin (0.5, 1) → pies en blockY
      const nameY    = spriteY - SPRITE_H - 6

      // — Bloque del pódium —
      g.fillStyle(color, 1)
      g.fillRect(x - BLOCK_W / 2, blockY, BLOCK_W, blockH)
      // borde inferior oscuro (efecto 3D pixel art)
      g.fillStyle(0x000000, 0.35)
      g.fillRect(x - BLOCK_W / 2, blockY + blockH - 3, BLOCK_W, 3)
      // borde superior claro
      g.fillStyle(0xffffff, 0.25)
      g.fillRect(x - BLOCK_W / 2, blockY, BLOCK_W, 2)
      // borde izquierdo y derecho
      g.lineStyle(2, 0x000000, 0.4)
      g.strokeRect(x - BLOCK_W / 2, blockY, BLOCK_W, blockH)

      // — Número de posición dentro del bloque —
      this.add.text(x, blockY + blockH / 2, `${rank}`, {
        fontFamily:      '"Press Start 2P", monospace',
        fontSize:        '16px',
        color:           textColor,
        stroke:          '#00000055',
        strokeThickness: 1,
      }).setOrigin(0.5)

      // — Sprite del skin (frame STAND) —
      if (this.textures.exists(entry.skinKey)) {
        this.add.image(x, spriteY, entry.skinKey, SPRITE_FRAMES.STAND)
          .setDisplaySize(SPRITE_W, SPRITE_H)
          .setOrigin(0.5, 1)
      }

      // — Nombre del skin (encima del sprite, truncado) —
      const rawName  = this._getSkinName(entry.skinKey)
      const skinName = rawName.length > 11 ? rawName.slice(0, 10) + '…' : rawName
      this.add.text(x, nameY, skinName, {
        ...F_LABEL,
        fontSize: '12px',
        color:    '#ffffff',
      }).setOrigin(0.5, 1)

      // — Banderas conseguidas (debajo del bloque) —
      this.add.text(x, PODIUM_BASE_Y + 10, `${entry.wins} BAND.`, {
        ...F_LABEL,
        fontSize: '13px',
        color:    rank === 1 ? '#ffd700' : '#aaaaaa',
      }).setOrigin(0.5, 0)
    })
  }

  // ── Columna derecha — Top premios ─────────────────────────

  _drawTopRewards(topRewards) {
    let y = TOP_REWARDS_Y

    this.add.text(COL_R, y, 'TOP PREMIOS', F_SECTION).setOrigin(0, 0.5)
    y += 32

    if (!topRewards.length) {
      this.add.text(COL_R + 4, y + 20, 'SIN DATOS', F_LABEL).setOrigin(0, 0.5)
      return
    }

    const imgSize = 40

    topRewards.slice(0, 4).forEach(({ rewardId, count }, i) => {
      const rowY  = y + i * ROW_H_REWARDS
      const imgX  = COL_R + imgSize / 2
      const imgY  = rowY + ROW_H_REWARDS / 2

      if (this.textures.exists(rewardId)) {
        this.add.image(imgX, imgY, rewardId)
          .setDisplaySize(imgSize, imgSize)
          .setOrigin(0.5)
      }

      const labelX     = imgX + imgSize / 2 + 10
      const rewardName = this._getRewardName(rewardId)
      this.add.text(labelX, imgY - 9, rewardName, F_VALUE).setOrigin(0, 0.5)
      this.add.text(labelX, imgY + 10, `x${count}`, F_LABEL).setOrigin(0, 0.5)
    })
  }

  // ── Helpers de resolución de nombres ─────────────────────

  _getSkinName(skinKey) {
    const spritesheetName = skinKey.replace('sprite-', '')
    for (const char of CHARACTERS) {
      const skin = char.skins?.find(s => s.spritesheet === spritesheetName)
      if (skin) return skin.nombre
    }
    return spritesheetName
  }

  _getCharacterName(characterId) {
    const char = CHARACTERS.find(c => c.id === characterId)
    return char ? char.name : characterId
  }

  _getRewardName(rewardId) {
    const rewards = this.cache.json.get('rewards') || []
    const reward  = rewards.find(r => r.id === rewardId)
    return reward ? reward.nombre : rewardId
  }
}
