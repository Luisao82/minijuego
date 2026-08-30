import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle, mutedStyle, uiLabelLight, uiLabelStyle } from '../config/textStyles'
import { makeNavButton } from '../components/NavButton'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'
import { mapService } from '../services/MapService'
import { geoService } from '../services/GeoService'
import { PlayerMarker } from '../components/PlayerMarker'
import {
  MAP_BOUNDS,
  MAP_PIXEL_WIDTH,
  MAP_PIXEL_HEIGHT,
  PIECE_ORIGINAL_SIZE,
} from '../config/mapBounds'
import { haversineDistance, isInBounds, latLonToPixel } from '../utils/geo'

// ── Layout mapa general ───────────────────────────────────────
const COLS = 3
const ROWS = 5
const TILE = 120
const GAP = 2
const GRID_W = COLS * TILE + (COLS - 1) * GAP // 364
const GRID_H = ROWS * TILE + (ROWS - 1) * GAP // 608
const MAP_X = Math.round((GAME_WIDTH - GRID_W) / 2) // 330
const MAP_Y = 80
const BAND_Y = 72
const BAND_H = 690

// ── Layout zoom ───────────────────────────────────────────────
const ZOOM_SIZE = 460
const ZOOM_CX = GAME_WIDTH / 2 // 512
const ZOOM_CY = 360
const ZOOM_HALF = ZOOM_SIZE / 2 // 230
const ARROW_GAP = 48 // distancia del borde de imagen al centro de la flecha

// ── Botón inferior general ────────────────────────────────────
const BTN_W = 240
const BTN_H = 58
const BTN_Y = MAP_Y + GRID_H + 8 // 696 — bottom a 754

export class MapScene extends BaseScene {
  constructor() {
    super(SCENES.MAP)
  }

  init(data) {
    super.init(data)
    this.characterData = data?.character || null
    this.zoomGroup = [] // objetos del zoom, destruidos al cerrar
    this.pointModal = [] // objetos del modal de punto, destruidos al cerrar
    this.zoomOpen = false
    this.playerMarker = null
    this.zoomPlayerMarker = null
    this.debugText = null
    this.lastGpsPosition = null
    this._geoStopped = false
  }

  create() {
    // Contingencia: si por lo que sea PreloadScene no cargó el JSON,
    // rehidratamos MapService desde la cache aquí antes de dibujar.
    if (!mapService.getMapData()) {
      const mapData = this.cache.json.get('map-data')
      if (mapData) mapService.setMapData(mapData)
    }

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 40, 'MAPA DE SEVILLA', 240)
    this.drawMap()
    if (mapService.getUnlocked().length === 0) this.drawEmptyHint()
    this.drawButtons()

    this.playerMarker = new PlayerMarker(this, { radius: 7, depth: 12 })
    this.drawDebugPanel()
    this.startGpsTracking()

    this.events.once('shutdown', () => this.cleanupGps())
    this.events.once('destroy', () => this.cleanupGps())
  }

  // ── GPS (POC) ─────────────────────────────────────────────────
  // Primera integración cruda: pide permiso al entrar al mapa, arranca
  // watchPosition y refresca marker + debug con cada tick. Aún sin
  // selector de modo ni restricción por pieza desbloqueada (llegará
  // con el resto de UI del reto). Debug visible para calibrar mapBounds.

  async startGpsTracking() {
    const perm = await geoService.checkPermission()
    let effective = perm
    if (perm === 'prompt') {
      effective = await geoService.requestPermission()
    }
    if (effective !== 'granted') {
      this.updateDebugPanel({ status: `GPS: ${effective}` })
      return
    }
    if (this._geoStopped) return
    try {
      await geoService.watchPosition((pos) => this.onGpsPosition(pos))
    } catch (err) {
      this.updateDebugPanel({ status: `GPS error: ${err?.message ?? err}` })
    }
  }

  async cleanupGps() {
    this._geoStopped = true
    try {
      await geoService.stopWatch()
    } catch (_) {}
    if (this.playerMarker) this.playerMarker.destroy()
    if (this.zoomPlayerMarker) this.zoomPlayerMarker.destroy()
    this.playerMarker = null
    this.zoomPlayerMarker = null
  }

  onGpsPosition({ lat, lon, accuracy }) {
    if (this._geoStopped) return
    this.lastGpsPosition = { lat, lon, accuracy }

    const inside = isInBounds(lat, lon, MAP_BOUNDS)
    if (!inside) {
      this.playerMarker?.hide()
      this.zoomPlayerMarker?.hide()
    } else {
      const globalScreen = this.mapPixelToScreen(
        latLonToPixel(lat, lon, MAP_BOUNDS, MAP_PIXEL_WIDTH, MAP_PIXEL_HEIGHT)
      )
      this.playerMarker?.setPosition(globalScreen.x, globalScreen.y)
      this.updateZoomPlayerMarker()
    }

    this.updateDebugPanel({
      status: inside ? 'GPS OK' : 'Fuera del mapa',
      lat,
      lon,
      accuracy,
    })
  }

  // Conversión de píxel del mapa original (0..600 × 0..1000) a píxel de
  // pantalla del grid pequeño. Respeta los GAP entre piezas.
  mapPixelToScreen(px) {
    const col = Math.max(0, Math.min(COLS - 1, Math.floor(px.x / PIECE_ORIGINAL_SIZE)))
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor(px.y / PIECE_ORIGINAL_SIZE)))
    const xInPiece = px.x - col * PIECE_ORIGINAL_SIZE
    const yInPiece = px.y - row * PIECE_ORIGINAL_SIZE
    const scale = TILE / PIECE_ORIGINAL_SIZE
    return {
      x: MAP_X + col * (TILE + GAP) + xInPiece * scale,
      y: MAP_Y + row * (TILE + GAP) + yInPiece * scale,
    }
  }

  updateZoomPlayerMarker() {
    if (!this.zoomOpen || !this.zoomPlayerMarker || !this.lastGpsPosition) return
    const { lat, lon } = this.lastGpsPosition
    if (!isInBounds(lat, lon, MAP_BOUNDS)) {
      this.zoomPlayerMarker.hide()
      return
    }
    const px = latLonToPixel(lat, lon, MAP_BOUNDS, MAP_PIXEL_WIDTH, MAP_PIXEL_HEIGHT)
    const zoomRow = Math.floor(px.y / PIECE_ORIGINAL_SIZE)
    const zoomCol = Math.floor(px.x / PIECE_ORIGINAL_SIZE)
    if (zoomRow !== this._zoomRow || zoomCol !== this._zoomCol) {
      this.zoomPlayerMarker.hide()
      return
    }
    const xInPiece = px.x - zoomCol * PIECE_ORIGINAL_SIZE
    const yInPiece = px.y - zoomRow * PIECE_ORIGINAL_SIZE
    const scale = ZOOM_SIZE / PIECE_ORIGINAL_SIZE
    this.zoomPlayerMarker.setPosition(
      ZOOM_CX - ZOOM_HALF + xInPiece * scale,
      ZOOM_CY - ZOOM_HALF + yInPiece * scale
    )
  }

  // Panel de debug provisional (esquina superior). Se retirará cuando el
  // reto esté afinado; útil para calibrar mapBounds sobre el terreno.
  drawDebugPanel() {
    this.debugText = this.add
      .text(8, 8, 'GPS: esperando…', mutedStyle(12, '#a8ccff'))
      .setDepth(50)
      .setScrollFactor(0)
  }

  updateDebugPanel({ status = 'GPS…', lat = null, lon = null, accuracy = null } = {}) {
    if (!this.debugText) return
    const lines = [status]
    if (lat !== null && lon !== null) {
      lines.push(`lat ${lat.toFixed(5)}  lon ${lon.toFixed(5)}`)
      if (accuracy !== null) lines.push(`± ${Math.round(accuracy)} m`)
      const nearest = this.nearestPoi(lat, lon)
      if (nearest) {
        lines.push(`~ ${nearest.title}: ${Math.round(nearest.distance)} m`)
      }
    }
    this.debugText.setText(lines.join('\n'))
  }

  nearestPoi(lat, lon) {
    let best = null
    for (const block of mapService.getBlocks()) {
      for (const poi of block.pois || []) {
        if (poi.lat === null || poi.lat === undefined) continue
        if (poi.lon === null || poi.lon === undefined) continue
        const d = haversineDistance(lat, lon, poi.lat, poi.lon)
        if (!best || d < best.distance) {
          best = { title: poi.title, distance: d }
        }
      }
    }
    return best
  }

  // ── Pista cuando aún no hay ninguna pieza ─────────────────────
  // Panel centrado sobre la cuadrícula explicando cómo se consiguen
  // las piezas. Mismo estilo de texto que los diálogos de Historia
  // y Tutorial (Jersey 10 + stroke negro).

  drawEmptyHint() {
    const panelW = GRID_W + 120
    const panelH = 200
    const cx = GAME_WIDTH / 2
    const cy = MAP_Y + GRID_H / 2
    const px = cx - panelW / 2
    const py = cy - panelH / 2

    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x000000, 0.85)
    g.fillRect(px, py, panelW, panelH)
    g.lineStyle(2, COLORS.GOLD, 0.9)
    g.strokeRect(px, py, panelW, panelH)
    g.lineStyle(1, COLORS.GOLD, 0.3)
    g.strokeRect(px + 4, py + 4, panelW - 8, panelH - 8)

    this.add
      .text(
        cx,
        cy,
        'Para conseguir las piezas del mapa,\ndebes conseguir la bandera\ncon el MAX POWER de impulso.',
        {
          ...headingStyle(32, '#f0d99a', 2),
          stroke: '#000000',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: panelW - 48 },
        }
      )
      .setOrigin(0.5)
      .setDepth(11)
  }

  // ── Vista general ─────────────────────────────────────────────

  drawMap() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = MAP_X + col * (TILE + GAP)
        const y = MAP_Y + row * (TILE + GAP)
        const id = `piece-${row}-${col}`

        const unlocked = mapService.isUnlocked(id)
        if (unlocked) {
          this.drawUnlockedPiece(x, y, row, col)
          if (!mapService.isSeen(id)) this.drawNewBadge(x, y)
        } else {
          this.drawLockedPiece(x, y)
        }

        const zone = this.add.zone(x + TILE / 2, y + TILE / 2, TILE, TILE)
        zone.setInteractive({ useHandCursor: true })
        zone.on('pointerdown', () => {
          if (!this.zoomOpen) this.openZoomView(row, col)
        })
      }
    }
  }

  drawUnlockedPiece(x, y, row, col) {
    const key = `map-piece-${row}-${col}`
    const ok = this.textures.exists(key) && this.textures.get(key).key !== '__MISSING'
    if (ok) {
      this.add
        .image(x + TILE / 2, y + TILE / 2, key)
        .setDisplaySize(TILE, TILE)
        .setOrigin(0.5)
    } else {
      const g = this.add.graphics()
      g.fillStyle(0x1a3a1a, 1)
      g.fillRect(x, y, TILE, TILE)
      g.lineStyle(2, COLORS.GOLD, 0.5)
      g.strokeRect(x, y, TILE, TILE)
      this.add.text(x + TILE / 2, y + TILE / 2, '?', uiLabelLight(24, COLOR_GOLD)).setOrigin(0.5)
    }
  }

  drawNewBadge(x, y) {
    const g = this.add.graphics()
    g.lineStyle(3, COLORS.GOLD, 1)
    g.strokeRect(x, y, TILE, TILE)
    // Pulso suave sobre el borde
    this.tweens.add({
      targets: g,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  drawLockedPiece(x, y) {
    const g = this.add.graphics()
    g.fillStyle(0x0d0d1e, 1)
    g.fillRect(x, y, TILE, TILE)
    g.lineStyle(1, 0x2a2a4a, 1)
    g.strokeRect(x, y, TILE, TILE)
    g.lineStyle(1, 0x1a1a30, 1)
    const step = TILE / 4
    for (let i = step; i < TILE; i += step) {
      g.lineBetween(x + i, y, x + i, y + TILE)
      g.lineBetween(x, y + i, x + TILE, y + i)
    }
    // Candado pixel art
    const lx = x + TILE / 2 - 7
    const ly = y + TILE / 2 - 4
    g.fillStyle(0x333355, 1)
    g.fillRect(lx, ly, 14, 10)
    g.lineStyle(2, 0x444466, 1)
    g.strokeRect(lx + 3, ly - 7, 8, 8)
  }

  drawButtons() {
    makeNavButton(
      this,
      Math.round(GAME_WIDTH / 2 - BTN_W / 2),
      BTN_Y,
      BTN_W,
      BTN_H,
      'VOLVER',
      () => {
        this.scene.start(SCENES.COLLECTION, { character: this.characterData })
      },
      { depth: 3 }
    )
  }

  // ── Vista zoom ────────────────────────────────────────────────

  openZoomView(row, col) {
    this.zoomOpen = true
    this._zoomRow = row
    this._zoomCol = col

    // Contingencia: si MapService no tiene los datos, intenta cachearlos
    // desde la cache de Phaser (carga tardía o entrada directa a la escena).
    if (!mapService.getMapData()) {
      const mapData = this.cache.json.get('map-data')
      if (mapData) mapService.setMapData(mapData)
    }

    const id = `piece-${row}-${col}`
    const key = `map-piece-${row}-${col}`
    const isUnlocked = mapService.isUnlocked(id)

    mapService.markSeen(id)

    const track = (o) => {
      this.zoomGroup.push(o)
      return o
    }

    // Overlay oscuro
    const overlay = track(this.add.graphics().setDepth(20))
    overlay.fillStyle(0x000000, 0.88)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    // Intercepta clicks fuera para no propagar al mapa
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    )

    // Pieza ampliada
    const hasImg =
      isUnlocked && this.textures.exists(key) && this.textures.get(key).key !== '__MISSING'
    if (hasImg) {
      track(
        this.add
          .image(ZOOM_CX, ZOOM_CY, key)
          .setDisplaySize(ZOOM_SIZE, ZOOM_SIZE)
          .setOrigin(0.5)
          .setDepth(21)
      )
    } else {
      const g = track(this.add.graphics().setDepth(21))
      g.fillStyle(0x0d0d1e, 1)
      g.fillRect(ZOOM_CX - ZOOM_HALF, ZOOM_CY - ZOOM_HALF, ZOOM_SIZE, ZOOM_SIZE)
      g.lineStyle(2, 0x333366, 1)
      g.strokeRect(ZOOM_CX - ZOOM_HALF, ZOOM_CY - ZOOM_HALF, ZOOM_SIZE, ZOOM_SIZE)
      // Candado grande
      const lx = ZOOM_CX - 18,
        ly = ZOOM_CY - 8
      g.fillStyle(0x333355, 1)
      g.fillRect(lx, ly, 36, 26)
      g.lineStyle(3, 0x444466, 1)
      g.strokeRect(lx + 8, ly - 20, 20, 22)
    }

    // Flechas de navegación.
    // Phaser rota en sentido horario con ángulos positivos. La textura base
    // `btn-nav-left` apunta a la izquierda (◀), así que:
    //   +90° → arriba (▲)
    //   −90° → abajo (▼)
    //     0° → izquierda (◀)
    //   180° → derecha (▶, usa textura propia `btn-nav-right` a 0°)
    this.addZoomArrow(
      track,
      row - 1,
      col,
      ZOOM_CX,
      ZOOM_CY - ZOOM_HALF - ARROW_GAP,
      'btn-nav-left',
      90,
      row > 0
    )
    this.addZoomArrow(
      track,
      row + 1,
      col,
      ZOOM_CX,
      ZOOM_CY + ZOOM_HALF + ARROW_GAP,
      'btn-nav-left',
      -90,
      row < ROWS - 1
    )
    this.addZoomArrow(
      track,
      row,
      col - 1,
      ZOOM_CX - ZOOM_HALF - ARROW_GAP,
      ZOOM_CY,
      'btn-nav-left',
      0,
      col > 0
    )
    this.addZoomArrow(
      track,
      row,
      col + 1,
      ZOOM_CX + ZOOM_HALF + ARROW_GAP,
      ZOOM_CY,
      'btn-nav-right',
      0,
      col < COLS - 1
    )

    // Puntos de interés (solo en piezas desbloqueadas)
    if (isUnlocked) {
      const scale = ZOOM_SIZE / PIECE_ORIGINAL_SIZE
      const imgLeft = ZOOM_CX - ZOOM_HALF
      const imgTop = ZOOM_CY - ZOOM_HALF
      const points = mapService.getPoisForPiece(row, col)
      points.forEach((point) => {
        this.addZoomPoint(track, point, imgLeft + point.x * scale, imgTop + point.y * scale)
      })
    }

    // Marker del jugador en la vista de zoom (POC)
    if (this.lastGpsPosition) {
      this.zoomPlayerMarker = new PlayerMarker(this, { radius: 12, depth: 26 })
      this.updateZoomPlayerMarker()
    }

    // Botón VOLVER del zoom
    const btnX = Math.round(ZOOM_CX - BTN_W / 2)
    const btnY = GAME_HEIGHT - BTN_H - 8
    const before = this.children.list.length
    makeNavButton(this, btnX, btnY, BTN_W, BTN_H, 'VOLVER', () => this.closeZoomView(), {
      depth: 22,
    })
    this.children.list.slice(before).forEach((o) => track(o))
  }

  addZoomPoint(track, point, px, py) {
    // Círculo rojo con borde blanco — se dibuja una sola vez
    const dot = track(this.add.graphics().setDepth(24))
    dot.fillStyle(0xff2200, 1)
    dot.fillCircle(px, py, 10)
    dot.lineStyle(2, 0xffffff, 1)
    dot.strokeCircle(px, py, 10)

    // Pulso animando el alpha del objeto directamente (sin onUpdate)
    this.tweens.add({
      targets: dot,
      alpha: 0.45,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Zona táctil 56×56 px — cómoda para el dedo en móvil
    const hit = track(this.add.zone(px, py, 56, 56).setDepth(25))
    hit.setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => this.showPointModal(point))
  }

  addZoomArrow(track, targetRow, targetCol, x, y, texture, angle, enabled) {
    const arrow = track(
      this.add
        .image(x, y, enabled ? texture : texture)
        .setScale(2)
        .setAngle(angle)
        .setDepth(22)
        .setAlpha(enabled ? 1 : 0.2)
        .setOrigin(0.5)
    )
    if (enabled) {
      arrow.setInteractive({ useHandCursor: true })
      arrow.on('pointerdown', () => {
        this.sound.play('sfx-click', { volume: 0.6 })
        this.navigateZoom(targetRow, targetCol)
      })
    }
  }

  navigateZoom(row, col) {
    this.closeZoomView()
    this.openZoomView(row, col)
  }

  closeZoomView() {
    this.closePointModal()
    this.zoomGroup.forEach((o) => {
      if (o?.active) o.destroy()
    })
    this.zoomGroup = []
    if (this.zoomPlayerMarker) {
      this.zoomPlayerMarker.destroy()
      this.zoomPlayerMarker = null
    }
    this.zoomOpen = false
    this._zoomRow = null
    this._zoomCol = null
  }

  // ── Modal de punto de interés ─────────────────────────────────

  showPointModal(point) {
    this.closePointModal()

    const PW = 540
    const PH = 660
    const PX = Math.round((GAME_WIDTH - PW) / 2)
    const PY = Math.round((GAME_HEIGHT - PH) / 2)
    const CX = GAME_WIDTH / 2
    const D = 30 // profundidad base del modal

    const m = (o) => {
      this.pointModal.push(o)
      return o
    }

    // Overlay que cierra al pulsar fuera
    const overlay = m(this.add.graphics().setDepth(D))
    overlay.fillStyle(0x000000, 0.55)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    )
    overlay.on('pointerdown', () => this.closePointModal())

    // Panel
    const panel = m(this.add.graphics().setDepth(D + 1))
    panel.fillStyle(0x000000, 0.45)
    panel.fillRect(PX + 5, PY + 5, PW, PH)
    panel.fillStyle(COLORS.DARK_BG, 1)
    panel.fillRect(PX, PY, PW, PH)
    panel.lineStyle(3, COLORS.GOLD, 1)
    panel.strokeRect(PX, PY, PW, PH)
    panel.lineStyle(1, COLORS.GOLD, 0.25)
    panel.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10)
    panel.fillStyle(COLORS.GOLD, 0.1)
    panel.fillRect(PX, PY, PW, 50)
    // Intercepta clicks dentro del panel para no cerrarlo
    panel.setInteractive(new Phaser.Geom.Rectangle(PX, PY, PW, PH), Phaser.Geom.Rectangle.Contains)

    // Título — override de stroke '#000000'.
    m(
      this.add
        .text(CX, PY + 26, point.title || '', {
          ...uiLabelStyle(20, COLOR_GOLD, 3),
          stroke: '#000000',
          align: 'center',
          wordWrap: { width: PW - 40 },
        })
        .setOrigin(0.5)
        .setDepth(D + 2)
    )

    // Separador
    const sep = m(this.add.graphics().setDepth(D + 2))
    sep.lineStyle(1, COLORS.GOLD, 0.35)
    sep.lineBetween(PX + 24, PY + 50, PX + PW - 24, PY + 50)

    // Foto
    const imgMaxW = Math.round(PW * 0.98)
    const imgH = 460
    const imgY = PY + 66
    const hasImg =
      point.id && this.textures.exists(point.id) && this.textures.get(point.id).key !== '__MISSING'

    if (hasImg) {
      const img = m(
        this.add
          .image(CX, imgY + imgH / 2, point.id)
          .setOrigin(0.5)
          .setDepth(D + 2)
      )
      const scale = Math.min(imgMaxW / img.width, imgH / img.height)
      img.setScale(scale)
    } else {
      const ig = m(this.add.graphics().setDepth(D + 2))
      ig.fillStyle(0x1a1a2e, 1)
      ig.fillRect(PX + Math.round(PW * 0.01), imgY, imgMaxW, imgH)
      ig.lineStyle(1, COLORS.GOLD, 0.4)
      ig.strokeRect(PX + Math.round(PW * 0.01), imgY, imgMaxW, imgH)
      m(
        this.add
          .text(CX, imgY + imgH / 2, '?', uiLabelLight(48, '#444466'))
          .setOrigin(0.5)
          .setDepth(D + 2)
      )
    }

    // Texto descriptivo — override: monospace con stroke (no es el patrón habitual).
    m(
      this.add
        .text(CX, imgY + imgH + 12, point.text || '', {
          ...mutedStyle(20, COLOR_GOLD),
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: PW - 40 },
        })
        .setOrigin(0.5, 0)
        .setDepth(D + 2)
    )

    // Hint cierre
    m(
      this.add
        .text(CX, PY + PH - 18, 'Toca fuera para cerrar', mutedStyle(10, '#555566'))
        .setOrigin(0.5)
        .setDepth(D + 2)
    )
  }

  closePointModal() {
    this.pointModal.forEach((o) => {
      if (o?.active) o.destroy()
    })
    this.pointModal = []
  }
}
