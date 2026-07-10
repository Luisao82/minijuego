import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { COLOR_GOLD, COLOR_MUTED } from '../config/fonts'
import { headingStyle, uiLabelLight } from '../config/textStyles'
import { CHARACTERS } from '../config/characters'
import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'
import { gameStatsService } from '../services/GameStatsService'
import { getCompletion, isGameComplete } from '../services/CompletionService'
import { StatsCalculator } from '../systems/StatsCalculator'
import { makeNavButton, measureNavButtonSize } from '../components/NavButton'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'

// ── Layout ───────────────────────────────────────────────────
const BAND_Y = 120
const BAND_H = 520
const COL_L = 30 // margen izquierdo columna izquierda
const COL_LDIV = 500 // posición x de los valores (alineados a la derecha)
const DIVIDER_X = 512 // línea divisoria central
const COL_R = 530 // inicio columna derecha
const CONTENT_Y = BAND_Y + 20

// Sección TOP SKINS — pódium
const PODIUM_CX = Math.round((COL_R + GAME_WIDTH) / 2) // centro columna derecha (~777)
const PODIUM_SEP = 138 // separación horizontal entre posiciones del pódium
const PODIUM_BASE_Y = 330 // y del suelo de todos los bloques del pódium
const SPRITE_W = SPRITE_CONFIG.frameWidth * SPRITE_CONFIG.scale // 48px
const SPRITE_H = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.scale // 72px
const BLOCK_W = 108 // anchura del bloque del pódium

// Alturas de bloque y colores por posición
const PODIUM_RANKS = [
  { rank: 1, x: PODIUM_CX, blockH: 52, color: 0xd4a520, textColor: '#1a0800' },
  { rank: 2, x: PODIUM_CX - PODIUM_SEP, blockH: 38, color: 0xa0a0a0, textColor: '#1a1a1a' },
  { rank: 3, x: PODIUM_CX + PODIUM_SEP, blockH: 26, color: 0x8b5e2a, textColor: '#f0e0c8' },
]

// Sección TOP PREMIOS — empieza debajo del pódium
const TOP_REWARDS_Y = PODIUM_BASE_Y + 60 // base del pódium + gap generoso
const ROW_H_REWARDS = 68
const IMG_SIZE_REWARD = 60

// ── Tipografía pixel art ──────────────────────────────────────
// Estilos locales adaptados desde los helpers de `config/textStyles.js`.
// Override de stroke '#000000' (vs PIXEL_STROKE_DARK) por nitidez del HUD.
const F_SECTION = { ...headingStyle(44, COLOR_GOLD, 5), stroke: '#000000' }
const F_LABEL = uiLabelLight(16, COLOR_MUTED)
const F_VALUE = { ...headingStyle(32, COLOR_GOLD, 4), stroke: '#000000' }

export class StatsScene extends BaseScene {
  constructor() {
    super(SCENES.STATS)
  }

  // Pre-calcular summary en init() para que preload() sepa qué spritesheets cargar
  init() {
    super.init()
    const records = gameStatsService.getAll()
    const calc = new StatsCalculator(records)
    this._summary = calc.getSummary()
  }

  // Cargar los spritesheets de los skins del pódium
  preload() {
    this.load.setPath('assets')
    this._summary.topSkins.forEach(({ skinKey }) => {
      if (this.textures.exists(skinKey)) return
      const name = skinKey.replace('sprite-', '')
      this.load.spritesheet(skinKey, `sprites/characters/spritesheet/${name}.png`, {
        frameWidth: SPRITE_CONFIG.frameWidth,
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
    this._drawBestCharacter(summary.bestCharacter ?? [])
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
      btnW,
      btnH,
      'VOLVER',
      () => this.scene.start(SCENES.MENU),
      { depth: 2, fontSize: '32px' }
    )
  }

  _drawEmpty() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'AÚN NO HAS JUGADO', {
        ...F_LABEL,
        fontSize: '14px',
        color: '#666666',
      })
      .setOrigin(0.5)
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, 'JUEGA TU PRIMERA PARTIDA', {
        ...F_LABEL,
        fontSize: '11px',
        color: '#444444',
      })
      .setOrigin(0.5)
  }

  // ── Columna izquierda ─────────────────────────────────────

  _drawGeneralStats(summary) {
    let y = CONTENT_Y + 10

    this.add.text(COL_L, y, 'GENERAL', F_SECTION).setOrigin(0, 0.5)
    y += 42

    const rows = [
      ['PARTIDAS', `${summary.totalGames}`],
      ['VICTORIAS', `${summary.totalWins}`],
      ['% VICT.', `${summary.winRate}%`],
      ['RACHA MAX.', `${summary.consecutiveWins}`],
    ]

    const F_STAT_LABEL = { ...F_LABEL, fontSize: '18px', color: '#ffffff' }
    rows.forEach(([label, value]) => {
      this.add.text(COL_L + 4, y, label, F_STAT_LABEL).setOrigin(0, 0.5)
      this.add.text(COL_LDIV, y, value, F_VALUE).setOrigin(1, 0.5)
      y += 42
    })

    // Nueva fila COMPLETADO: label a la izquierda + barra pixel art con % centrado a la derecha
    this._drawCompletionRow(F_STAT_LABEL, y)
  }

  // Fila especial dentro de GENERAL: porcentaje de completado del juego con
  // barra pixel art estilo Cartelón de Feria (mismo lenguaje visual que
  // NavButton). Ocupa una única fila de 42 px, coincidiendo con el resto de
  // stats, así que no descuadra la sección. Al 100 % la barra se sustituye
  // por un botón que lanza la escena final de fuegos artificiales.
  _drawCompletionRow(labelStyle, y) {
    this.add.text(COL_L + 4, y, 'COMPLETADO', labelStyle).setOrigin(0, 0.5)

    const rewardsCatalog = this.cache.json.get('rewards')
    const rewardsCount = Array.isArray(rewardsCatalog) ? rewardsCatalog.length : 0
    const completion = getCompletion(rewardsCount)

    if (isGameComplete(completion)) {
      this._drawFinaleButton(y)
      return
    }

    const { percent } = completion
    const BAR_W = 180
    const BAR_H = 22
    const BAR_X = COL_LDIV - BAR_W
    const BAR_Y = y - BAR_H / 2

    // Sombra pixel art (mismo desplazamiento que NavButton)
    const g = this.add.graphics().setDepth(2)
    g.fillStyle(0x000000, 0.35)
    g.fillRect(BAR_X + 2, BAR_Y + 2, BAR_W, BAR_H)

    // Fondo oscuro del carril
    g.fillStyle(0x1a0800, 1)
    g.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H)

    // Relleno dorado proporcional
    const fillW = Math.max(0, Math.min(BAR_W - 4, Math.round(((BAR_W - 4) * percent) / 100)))
    if (fillW > 0) {
      g.fillStyle(0xd4a520, 1)
      g.fillRect(BAR_X + 2, BAR_Y + 2, fillW, BAR_H - 4)
      // Highlight superior (línea de brillo pixel art)
      g.lineStyle(1, 0xffe580, 0.9)
      g.lineBetween(BAR_X + 2, BAR_Y + 3, BAR_X + 2 + fillW, BAR_Y + 3)
    }

    // Borde marrón oscuro
    g.lineStyle(2, 0x5c2d00, 1)
    g.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H)

    // Porcentaje centrado sobre la barra
    this.add
      .text(BAR_X + BAR_W / 2, y, `${percent}%`, {
        ...headingStyle(20, '#ffffff', 3),
        stroke: '#000000',
      })
      .setOrigin(0.5)
      .setDepth(3)
  }

  // Juego completado al 100 %: en lugar de la barra, botón para rever la
  // escena final. Desaparece (vuelve la barra) si una actualización añade
  // contenido y el porcentaje baja de 100.
  _drawFinaleButton(y) {
    const opts = { depth: 2, fontSize: '20px', paddingX: 14, paddingY: 8 }
    const label = 'VER FUEGOS ARTIFICIALES'
    const { w, h } = measureNavButtonSize(this, label, opts)
    makeNavButton(
      this,
      COL_LDIV - w,
      Math.round(y - h / 2),
      w,
      h,
      label,
      () => this.scene.start(SCENES.FINALE, { returnTo: SCENES.STATS }),
      opts
    )
  }

  _drawBestCharacter(topChars) {
    if (!topChars?.length) return

    // y justo debajo de la sección GENERAL (título 42 + 5 filas × 42 + gap 12)
    let y = CONTENT_Y + 10 + 42 + 5 * 42 + 12

    this.add.text(COL_L, y, 'MÁS VICTORIAS', F_SECTION).setOrigin(0, 0.5)
    y += 38

    const imgSize = 44
    const rowH = 58
    const F_STAT_LABEL = { ...F_LABEL, fontSize: '18px', color: '#ffffff' }

    topChars.forEach((char) => {
      const imgX = COL_L + imgSize / 2 + 4
      const imgY = y + rowH / 2
      const imgKey = `char-${char.characterId}`

      if (this.textures.exists(imgKey)) {
        this.add.image(imgX, imgY, imgKey).setDisplaySize(imgSize, imgSize).setOrigin(0.5)
      }

      const textX = imgX + imgSize / 2 + 10
      const charName = this._getCharacterName(char.characterId)
      this.add.text(textX, imgY, charName, F_STAT_LABEL).setOrigin(0, 0.5)
      this.add.text(COL_LDIV, imgY, `${char.wins}`, F_VALUE).setOrigin(1, 0.5)

      y += rowH
    })
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

      const blockY = PODIUM_BASE_Y - blockH
      const spriteY = blockY // sprite con origin (0.5, 1) → pies en blockY
      const nameY = spriteY - SPRITE_H - 6

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
      // Override de stroke ARGB '#00000055' (sombra translúcida ligera).
      this.add
        .text(x, blockY + blockH / 2, `${rank}`, {
          ...uiLabelLight(16, textColor),
          stroke: '#00000055',
          strokeThickness: 1,
        })
        .setOrigin(0.5)

      // — Sprite animado del skin —
      this._makeWalkingSprite(x, spriteY, entry.skinKey)

      // — Nombre del skin (encima del sprite, truncado) —
      const rawName = this._getSkinName(entry.skinKey)
      const skinName = rawName.length > 11 ? rawName.slice(0, 10) + '…' : rawName
      this.add
        .text(x, nameY, skinName, {
          ...F_LABEL,
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5, 1)

      // — Banderas conseguidas (debajo del bloque) —
      this._drawWinsWithFlag(
        x,
        PODIUM_BASE_Y + 10,
        entry.wins,
        rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
        rank === 1 ? 0xffd700 : rank === 2 ? 0xc0c0c0 : 0xcd7f32
      )
    })
  }

  // ── Columna derecha — Top premios ─────────────────────────

  _drawTopRewards(topRewards) {
    let y = TOP_REWARDS_Y

    this.add.text(COL_R, y, 'TOP PREMIOS', F_SECTION).setOrigin(0, 0.5)
    y += 44

    if (!topRewards.length) {
      this.add.text(COL_R + 4, y + 20, 'SIN DATOS', F_LABEL).setOrigin(0, 0.5)
      return
    }

    topRewards.slice(0, 3).forEach(({ rewardId, count }, i) => {
      const rowY = y + i * ROW_H_REWARDS
      const imgX = COL_R + IMG_SIZE_REWARD / 2
      const imgY = rowY + ROW_H_REWARDS / 2

      if (this.textures.exists(rewardId)) {
        this.add
          .image(imgX, imgY, rewardId)
          .setDisplaySize(IMG_SIZE_REWARD, IMG_SIZE_REWARD)
          .setOrigin(0.5)
      }

      const labelX = imgX + IMG_SIZE_REWARD / 2 + 10
      const rewardName = this._getRewardName(rewardId)
      this.add.text(labelX, imgY - 12, rewardName, F_VALUE).setOrigin(0, 0.5)
      this.add
        .text(labelX, imgY + 14, `x${count}`, {
          ...headingStyle(28, '#ffffff', 3),
          stroke: '#000000',
        })
        .setOrigin(0, 0.5)
    })
  }

  // ── Banderas del pódium ──────────────────────────────────

  // Dibuja el número de victorias + mini bandera pixel art (misma estética
  // que las banderas de SkinSelectScene). El número se centra en x y la
  // bandera se coloca inmediatamente a la derecha.
  _drawWinsWithFlag(x, y, wins, textColor, flagHexColor) {
    const numText = this.add
      .text(x, y, `${wins}`, {
        ...F_LABEL,
        fontSize: '16px',
        color: textColor,
      })
      .setOrigin(0.5, 0)

    const flagX = Math.round(x + numText.width / 2 + 5)
    const g = this.add.graphics()
    const PW = 2,
      PH = 14,
      FW = 9,
      FH = 6

    g.fillStyle(flagHexColor, 1)
    g.fillRect(flagX, y, PW, PH) // palo
    g.fillRect(flagX + PW, y + 1, FW, FH) // tela
  }

  // ── Sprite animado del pódium ────────────────────────────

  _makeWalkingSprite(x, spriteY, skinKey) {
    if (!this.textures.exists(skinKey)) return

    const sprite = this.add
      .sprite(x, spriteY, skinKey, SPRITE_FRAMES.STAND)
      .setDisplaySize(SPRITE_W, SPRITE_H)
      .setOrigin(0.5, 1)

    let isJumping = false
    let walkFrame = SPRITE_FRAMES.STAND

    // Animación de caminar: alterna frame STAND ↔ WALK cada 220 ms
    this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (isJumping) return
        walkFrame = walkFrame === SPRITE_FRAMES.STAND ? SPRITE_FRAMES.WALK : SPRITE_FRAMES.STAND
        sprite.setFrame(walkFrame)
      },
    })

    // Salto al pulsar: frame JUMP + tween arriba/abajo
    sprite.setInteractive({ useHandCursor: true })
    sprite.on('pointerdown', () => {
      if (isJumping) return
      isJumping = true
      sprite.setFrame(SPRITE_FRAMES.JUMP)
      this.tweens.add({
        targets: sprite,
        y: spriteY - 24,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: sprite,
            y: spriteY,
            duration: 180,
            ease: 'Quad.easeIn',
            onComplete: () => {
              isJumping = false
              sprite.setFrame(walkFrame)
            },
          })
        },
      })
    })
  }

  // ── Helpers de resolución de nombres ─────────────────────

  _getSkinName(skinKey) {
    const spritesheetName = skinKey.replace('sprite-', '')
    for (const char of CHARACTERS) {
      const skin = char.skins?.find((s) => s.spritesheet === spritesheetName)
      if (skin) return skin.nombre
    }
    return spritesheetName
  }

  _getCharacterName(characterId) {
    const char = CHARACTERS.find((c) => c.id === characterId)
    return char ? char.name : characterId
  }

  _getRewardName(rewardId) {
    const rewards = this.cache.json.get('rewards') || []
    const reward = rewards.find((r) => r.id === rewardId)
    return reward ? reward.nombre : rewardId
  }
}
