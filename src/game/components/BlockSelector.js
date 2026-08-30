// BlockSelector — lista vertical de bloques del reto en la mitad izquierda
// del mapa. Cada tarjeta muestra el nombre y un indicador de estado
// (medalla, progreso o candado). El bloque activo se rodea de esquinas
// en "L" al estilo del header de escena.
//
// Se redibuja llamando a refresh(); el consumidor lo hace tras cambios
// de estado (nuevo check-in, cambio de modo, bloque completado, etc.).

import { COLORS } from '../config/gameConfig'
import { headingStyle, mutedStyle, uiLabelLight } from '../config/textStyles'
import { mapService } from '../services/MapService'

const CARD_H = 60
const CARD_GAP = 12
const CARD_PAD_X = 16
const CORNER_LEN = 10
const CORNER_INSET = 4

export class BlockSelector {
  constructor(scene, config) {
    this._scene = scene
    this._x = config.x
    this._y = config.y
    this._w = config.width
    this._onSelect = config.onSelect || (() => {})
    this._items = []
    this.refresh()
  }

  destroy() {
    this._items.forEach((o) => {
      if (o?.destroy) o.destroy()
    })
    this._items = []
  }

  refresh() {
    this.destroy()

    const mode = mapService.getUnlockMode() || 'gps'
    const modeLabel = mode === 'meters' ? 'Modo metros' : 'Modo GPS'
    this._addText(this._x, this._y, modeLabel, {
      ...headingStyle(22, '#f0d99a', 2),
      stroke: '#000000',
    })

    const activeId = this._resolveActiveBlockId()
    const blocks = mapService.getBlocks()
    let y = this._y + 40
    blocks.forEach((block) => {
      this._drawCard(block, y, block.id === activeId, mode)
      y += CARD_H + CARD_GAP
    })
  }

  _resolveActiveBlockId() {
    const stored = mapService.getActiveBlockId()
    if (stored && mapService.isBlockUnlocked(stored)) return stored
    const first = mapService.getFirstBlock()
    return first ? first.id : null
  }

  _drawCard(block, y, isActive, mode) {
    const unlocked = mapService.isBlockUnlocked(block.id)
    const completed = mapService.isBlockCompleted(block.id)
    const x = this._x

    const bg = this._add(this._scene.add.graphics().setDepth(2))
    bg.fillStyle(0x000000, unlocked ? 0.55 : 0.35)
    bg.fillRect(x, y, this._w, CARD_H)
    bg.lineStyle(1, COLORS.GOLD, unlocked ? 0.45 : 0.2)
    bg.strokeRect(x, y, this._w, CARD_H)

    // Nombre
    const titleColor = unlocked ? '#f0d99a' : '#6b6b7a'
    this._addText(x + CARD_PAD_X, y + CARD_H / 2, block.title, {
      ...headingStyle(18, titleColor, 2),
      stroke: '#000000',
    }).setOrigin(0, 0.5)

    // Indicador a la derecha según estado
    const rx = x + this._w - CARD_PAD_X
    const ry = y + CARD_H / 2
    if (completed) {
      const completionMode = mapService.getBlockCompletionMode(block.id)
      this._drawMedal(rx, ry, completionMode)
    } else if (unlocked) {
      this._drawProgress(block, mode, rx, ry)
    } else {
      this._drawLock(block, mode, rx, ry)
    }

    // Esquinas en "L" si es el bloque activo — refuerza que "es el que
    // pinta sus POIs en el mapa".
    if (isActive && unlocked && !completed) this._drawCorners(x, y)

    // Área táctil (permite reactivar un bloque completado o desbloqueado).
    if (unlocked) {
      const zone = this._add(
        this._scene.add.zone(x, y, this._w, CARD_H).setOrigin(0).setDepth(3)
      )
      zone.setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => this._onSelect(block.id))
    }
  }

  _drawCorners(x, y) {
    const g = this._add(this._scene.add.graphics().setDepth(4))
    g.lineStyle(2, COLORS.GOLD, 0.95)
    const left = x + CORNER_INSET
    const right = x + this._w - CORNER_INSET
    const top = y + CORNER_INSET
    const bot = y + CARD_H - CORNER_INSET
    g.lineBetween(left, top, left + CORNER_LEN, top)
    g.lineBetween(left, top, left, top + CORNER_LEN)
    g.lineBetween(right, top, right - CORNER_LEN, top)
    g.lineBetween(right, top, right, top + CORNER_LEN)
    g.lineBetween(left, bot, left + CORNER_LEN, bot)
    g.lineBetween(left, bot, left, bot - CORNER_LEN)
    g.lineBetween(right, bot, right - CORNER_LEN, bot)
    g.lineBetween(right, bot, right, bot - CORNER_LEN)
  }

  _drawMedal(rx, ry, completionMode) {
    // Sellos provisionales (imágenes finales las aporta el equipo).
    // GPS   → círculo dorado + '★'  (estrella: haber estado allí)
    // Metros → círculo plateado + 'M' (mando: haberlo jugado)
    const g = this._add(this._scene.add.graphics().setDepth(3))
    if (completionMode === 'meters') {
      g.fillStyle(0xb8b8c8, 1)
      g.fillCircle(rx - 12, ry, 12)
      g.lineStyle(2, 0xffffff, 1)
      g.strokeCircle(rx - 12, ry, 12)
      this._addText(rx - 12, ry, 'M', uiLabelLight(14, '#1a1a2e')).setOrigin(0.5)
    } else {
      g.fillStyle(0xe8b842, 1)
      g.fillCircle(rx - 12, ry, 12)
      g.lineStyle(2, 0xffffff, 1)
      g.strokeCircle(rx - 12, ry, 12)
      this._addText(rx - 12, ry, '★', uiLabelLight(14, '#5a3a08')).setOrigin(0.5)
    }
  }

  _drawProgress(block, mode, rx, ry) {
    let text
    if (mode === 'gps') {
      const done = mapService.getVisitedCount(block.id)
      const total = (block.pois || []).length
      text = `${done} de ${total} visitas`
    } else {
      const need = block.unlockDistance ?? 0
      const acc = mapService.getUnlockDistanceCounter()
      const remaining = Math.max(0, need - acc)
      text = `${Math.round(remaining)} m`
    }
    this._addText(rx, ry, text, {
      ...mutedStyle(14, '#e57373'),
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0.5)
  }

  _drawLock(block, mode, rx, ry) {
    const text = mode === 'gps' ? 'Completa el anterior' : `${block.unlockDistance ?? 0} m`
    this._addText(rx, ry, text, {
      ...mutedStyle(12, '#6b6b7a'),
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0.5)
    // Candadito
    const g = this._add(this._scene.add.graphics().setDepth(3))
    g.fillStyle(0x333355, 1)
    g.fillRect(rx - 14, ry - 4, 12, 9)
    g.lineStyle(1.5, 0x555577, 1)
    g.strokeRect(rx - 11, ry - 10, 6, 6)
  }

  _addText(x, y, str, style) {
    const t = this._scene.add.text(x, y, str, style).setDepth(3)
    this._items.push(t)
    return t
  }

  _add(obj) {
    this._items.push(obj)
    return obj
  }

  get width() {
    return this._w
  }
}

// Alto total que ocuparía el selector si tuviera N bloques (label + tarjetas).
export function blockSelectorHeight(count) {
  return 40 + count * CARD_H + (count - 1) * CARD_GAP
}

export const BLOCK_CARD_HEIGHT = CARD_H
