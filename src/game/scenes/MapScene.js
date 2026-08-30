import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/gameConfig'
import { COLOR_GOLD } from '../config/fonts'
import { headingStyle, mutedStyle, uiLabelLight, uiLabelStyle } from '../config/textStyles'
import { makeNavButton } from '../components/NavButton'
import { drawBandBackground, drawSceneHeader } from '../utils/backgroundUtils'
import { mapService } from '../services/MapService'
import { geoService } from '../services/GeoService'
import { PlayerMarker } from '../components/PlayerMarker'
import { BlockSelector } from '../components/BlockSelector'
import {
  MAP_BOUNDS,
  MAP_PIXEL_WIDTH,
  MAP_PIXEL_HEIGHT,
  PIECE_ORIGINAL_SIZE,
  CHECKIN_RADIUS_M,
} from '../config/mapBounds'
import { haversineDistance, isInBounds, latLonToPixel } from '../utils/geo'

// ── Layout general (mismo band que CollectionScene para coherencia) ──
// Header a Y=55, band de fondo semi-transparente Y=120 → Y=620.
const BAND_Y = 120
const BAND_H = 500

// Grid del mapa desplazado a la derecha (dentro del band). Piezas más
// pequeñas para que el grid completo (5 filas) quepa en el band.
const COLS = 3
const ROWS = 5
const TILE = 96
const GAP = 2
const GRID_W = COLS * TILE + (COLS - 1) * GAP // 292
const GRID_H = ROWS * TILE + (ROWS - 1) * GAP // 488
const MAP_RIGHT_MARGIN = 32
const MAP_X = GAME_WIDTH - GRID_W - MAP_RIGHT_MARGIN // 700
const MAP_Y = BAND_Y + Math.round((BAND_H - GRID_H) / 2) // centrado vertical en el band

// Cabecera del selector: título "LISTA DE RETOS" a la izquierda y el
// selector radio de modo (GPS / METROS) a la derecha, alineado con la
// parte superior del mapa.
const HEADER_X = 32
const HEADER_Y = MAP_Y
const HEADER_H = 44

// Selector de bloques (mitad izquierda, debajo del header)
const SEL_X = 32
const SEL_Y = HEADER_Y + HEADER_H + 12
const SEL_W = MAP_X - SEL_X - 24

// ── Layout zoom ───────────────────────────────────────────────
const ZOOM_SIZE = 460
const ZOOM_CX = GAME_WIDTH / 2 // 512
const ZOOM_CY = 360
const ZOOM_HALF = ZOOM_SIZE / 2 // 230
const ARROW_GAP = 48 // distancia del borde de imagen al centro de la flecha

// ── Barra inferior (VOLVER / TUTORIAL) ────────────────────────
// Centrada verticalmente entre el borde inferior del band y el bottom
// de la escena — mismo criterio que CollectionScene.
const BTN_W = 240
const BTN_H = 58
const BTN_GAP = 40
const BTN_Y = Math.round((GAME_HEIGHT + BAND_Y + BAND_H) / 2 - BTN_H / 2)
const BTN_ROW_W = BTN_W * 2 + BTN_GAP
const BTN_ROW_X = Math.round((GAME_WIDTH - BTN_ROW_W) / 2)

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
    this.lastGpsPosition = null
    this._geoStopped = false
    this.blockSelector = null
  }

  create() {
    // Contingencia: si por lo que sea PreloadScene no cargó el JSON,
    // rehidratamos MapService desde la cache aquí antes de dibujar.
    if (!mapService.getMapData()) {
      const mapData = this.cache.json.get('map-data')
      if (mapData) mapService.setMapData(mapData)
    }

    // Primera entrada al mapa: si el usuario aún no ha visto el tutorial y
    // no ha elegido modo, lanzamos MapTutorialScene y salimos sin dibujar
    // el mapa (evita flash). El tutorial marca `mapTutorialSeen` y setea
    // `unlockMode` al terminar, y vuelve aquí.
    if (!mapService.hasSeenMapTutorial() && mapService.getUnlockMode() === null) {
      this.scene.start(SCENES.MAP_TUTORIAL, { character: this.characterData })
      return
    }

    // Asegura que hay un bloque activo: por defecto el primero desbloqueado.
    if (!mapService.getActiveBlockId()) {
      const first = mapService.getFirstBlock()
      if (first) mapService.setActiveBlockId(first.id)
    }

    drawBandBackground(this, 'bg-characters', BAND_Y, BAND_H)
    drawSceneHeader(this, GAME_WIDTH / 2, 55, 'MAPA DE SEVILLA', 240)
    this.drawMap()
    if (mapService.getUnlocked().length === 0) this.drawEmptyHint()

    this.drawSelectorHeader()
    this.blockSelector = new BlockSelector(this, {
      x: SEL_X,
      y: SEL_Y,
      width: SEL_W,
      onSelect: (blockId) => this.onBlockSelected(blockId),
    })

    this.drawBottomBar()

    this.playerMarker = new PlayerMarker(this, { radius: 7, depth: 12 })
    this.startGpsTracking()

    this.events.once('shutdown', () => this.cleanupGps())
    this.events.once('destroy', () => this.cleanupGps())
  }

  // Un bloque desbloqueado tocado en el selector pasa a ser el activo.
  onBlockSelected(blockId) {
    mapService.setActiveBlockId(blockId)
    this.blockSelector?.refresh()
  }

  // ── GPS (POC) ─────────────────────────────────────────────────
  // Primera integración cruda: pide permiso al entrar al mapa, arranca
  // watchPosition y refresca marker + debug con cada tick. Aún sin
  // selector de modo ni restricción por pieza desbloqueada (llegará
  // con el resto de UI del reto). Debug visible para calibrar mapBounds.

  async startGpsTracking() {
    // Solo tiene sentido si el modo es GPS. En modo metros no pedimos
    // permiso ni arrancamos el watch — el usuario no lo necesita.
    if ((mapService.getUnlockMode() || 'gps') !== 'gps') return

    // Escuchamos el resume de la app para re-chequear el permiso cuando
    // el usuario vuelve de los ajustes del sistema o del popup del
    // navegador. Solo una vez, incluso si startGpsTracking se llama varias.
    if (!this._resumeUnsubscribe) {
      this._resumeUnsubscribe = geoService.onAppResume(() => this._recheckOnResume())
    }

    const perm = await geoService.checkPermission()

    if (perm === 'unavailable') {
      this.showToast('GPS no disponible en este dispositivo')
      return
    }
    if (perm === 'denied') {
      this.showPermissionDeniedModal()
      return
    }

    if (perm === 'prompt') {
      const next = await geoService.requestPermission()
      if (next === 'denied') {
        this.showPermissionDeniedModal()
        return
      }
      // En web, `next` seguirá siendo 'prompt' porque no hay API de request
      // explícita: el popup del navegador se dispara con watchPosition.
    }

    if (this._geoStopped) return

    this._watchActive = true
    try {
      await geoService.watchPosition(
        (pos) => this.onGpsPosition(pos),
        (err) => {
          // navigator.geolocation error codes: 1 = PERMISSION_DENIED,
          // 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
          if (err?.code === 1) {
            this._watchActive = false
            this.showPermissionDeniedModal()
          }
        }
      )
    } catch (_) {
      this._watchActive = false
    }
  }

  // Se llama cuando la app vuelve del foreground (ej. tras salir a los
  // ajustes del sistema). Si el permiso ahora es 'granted' y no hay
  // watch activo, arranca el tracking y cierra el modal si estaba abierto.
  async _recheckOnResume() {
    if (this._geoStopped) return
    if ((mapService.getUnlockMode() || 'gps') !== 'gps') return
    const perm = await geoService.checkPermission()
    if (perm !== 'granted') return
    if (this._watchActive) return
    this._watchActive = true
    this.closePermissionDeniedModal()
    try {
      await geoService.watchPosition(
        (pos) => this.onGpsPosition(pos),
        () => {}
      )
    } catch (_) {
      this._watchActive = false
    }
  }

  // ── Modal: permiso GPS denegado ──────────────────────────────
  //
  // Ofrece dos salidas: abrir la ficha de ajustes del sistema para
  // reactivar el permiso, o cambiar a modo metros para poder seguir
  // jugando sin GPS. En web, si el sistema no soporta abrir ajustes
  // directamente, mostramos un mensaje explicando cómo hacerlo desde
  // los ajustes del navegador.

  showPermissionDeniedModal() {
    if (this._permissionModalOpen) return
    this._permissionModalOpen = true

    const PW = 520
    const PH = 300
    const PX = Math.round((GAME_WIDTH - PW) / 2)
    const PY = Math.round((GAME_HEIGHT - PH) / 2)
    const CX = GAME_WIDTH / 2
    const D = 90

    const store = (o) => {
      this._permissionModalObjs = this._permissionModalObjs || []
      this._permissionModalObjs.push(o)
      return o
    }

    const overlay = store(this.add.graphics().setDepth(D))
    overlay.fillStyle(0x000000, 0.75)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    )

    const panel = store(this.add.graphics().setDepth(D + 1))
    panel.fillStyle(0x000000, 0.5)
    panel.fillRect(PX + 5, PY + 5, PW, PH)
    panel.fillStyle(COLORS.DARK_BG, 1)
    panel.fillRect(PX, PY, PW, PH)
    panel.lineStyle(3, COLORS.GOLD, 1)
    panel.strokeRect(PX, PY, PW, PH)
    panel.lineStyle(1, COLORS.GOLD, 0.25)
    panel.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10)
    panel.setInteractive(new Phaser.Geom.Rectangle(PX, PY, PW, PH), Phaser.Geom.Rectangle.Contains)

    store(
      this.add
        .text(CX, PY + 34, 'PERMISO DE UBICACIÓN', {
          ...uiLabelStyle(18, COLOR_GOLD, 3),
          stroke: '#000000',
        })
        .setOrigin(0.5)
        .setDepth(D + 2)
    )

    store(
      this.add
        .text(
          CX,
          PY + 100,
          'Para el reto GPS necesitamos acceso\na tu ubicación.\n\nActívalo en los ajustes o pásate al\nmodo metros para seguir jugando.',
          {
            ...headingStyle(20, '#e8e8f0', 2),
            stroke: '#000000',
            align: 'center',
            lineSpacing: 6,
          }
        )
        .setOrigin(0.5)
        .setDepth(D + 2)
    )

    const BW = 200
    const BH = 48
    const gap = 20
    const totalW = BW * 2 + gap
    const xL = CX - Math.round(totalW / 2)
    const xR = xL + BW + gap
    const by = PY + PH - BH - 22

    const beforeL = this.children.list.length
    makeNavButton(this, xL, by, BW, BH, 'ABRIR AJUSTES', () => this._onOpenSettings(), {
      depth: D + 2,
    })
    this.children.list.slice(beforeL).forEach((o) => store(o))

    const beforeR = this.children.list.length
    makeNavButton(this, xR, by, BW, BH, 'MODO METROS', () => this._onSwitchToMeters(), {
      depth: D + 2,
    })
    this.children.list.slice(beforeR).forEach((o) => store(o))
  }

  closePermissionDeniedModal() {
    if (!this._permissionModalOpen) return
    this._permissionModalOpen = false
    ;(this._permissionModalObjs || []).forEach((o) => {
      if (o?.active) o.destroy()
    })
    this._permissionModalObjs = []
  }

  async _onOpenSettings() {
    const ok = await geoService.openNativeSettings()
    if (!ok) {
      // Web / plataforma sin plugin: no podemos abrir los ajustes por
      // nosotros. Mostramos un toast con instrucciones básicas.
      this.showToast('Actívalo desde los ajustes del navegador')
    }
    // El modal queda abierto — se cerrará solo cuando el usuario vuelva
    // con el permiso concedido (evento appResume / focus).
  }

  _onSwitchToMeters() {
    mapService.setUnlockMode('meters')
    this.closePermissionDeniedModal()
    this.blockSelector?.refresh()
    this._drawModeRadios(MAP_X - 8, HEADER_Y + HEADER_H / 2)
    this.refreshPlayerMarkerVisibility()
    this.showToast('Modo cambiado a metros')
  }

  async cleanupGps() {
    this._geoStopped = true
    this._watchActive = false
    try {
      await geoService.stopWatch()
    } catch (_) {}
    if (this._resumeUnsubscribe) {
      try {
        this._resumeUnsubscribe()
      } catch (_) {}
      this._resumeUnsubscribe = null
    }
    if (this.playerMarker) this.playerMarker.destroy()
    if (this.zoomPlayerMarker) this.zoomPlayerMarker.destroy()
    this.playerMarker = null
    this.zoomPlayerMarker = null
    this.closePermissionDeniedModal()
  }

  onGpsPosition({ lat, lon, accuracy }) {
    if (this._geoStopped) return
    this.lastGpsPosition = { lat, lon, accuracy }
    this.refreshPlayerMarkerVisibility()
  }

  // Reglas de visibilidad del marker (vista global y zoom):
  //   - Solo si hay posición GPS y cae dentro del rectángulo del mapa.
  //   - Solo si el modo de desbloqueo es 'gps' (en 'meters' no tiene
  //     sentido pintarlo — el jugador acumula metros del palo).
  //   - Solo si la pieza donde cae está desbloqueada (regla acordada:
  //     "no se revela nada fuera de piezas conseguidas").
  refreshPlayerMarkerVisibility() {
    if (!this.playerMarker) return
    const pos = this.lastGpsPosition
    if (!pos) return this.playerMarker.hide()
    const mode = mapService.getUnlockMode() || 'gps'
    if (mode !== 'gps') {
      this.playerMarker.hide()
      this.zoomPlayerMarker?.hide()
      return
    }
    if (!isInBounds(pos.lat, pos.lon, MAP_BOUNDS)) {
      this.playerMarker.hide()
      this.zoomPlayerMarker?.hide()
      return
    }
    const px = latLonToPixel(pos.lat, pos.lon, MAP_BOUNDS, MAP_PIXEL_WIDTH, MAP_PIXEL_HEIGHT)
    const row = Math.floor(px.y / PIECE_ORIGINAL_SIZE)
    const col = Math.floor(px.x / PIECE_ORIGINAL_SIZE)
    const pieceId = `piece-${row}-${col}`
    if (!mapService.isUnlocked(pieceId)) {
      this.playerMarker.hide()
      this.zoomPlayerMarker?.hide()
      return
    }
    const screen = this.mapPixelToScreen(px)
    this.playerMarker.setPosition(screen.x, screen.y)
    this.updateZoomPlayerMarker()
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


  // ── Pista cuando aún no hay ninguna pieza ─────────────────────
  // Panel centrado sobre la cuadrícula explicando cómo se consiguen
  // las piezas. Mismo estilo de texto que los diálogos de Historia
  // y Tutorial (Jersey 10 + stroke negro).

  drawEmptyHint() {
    const panelW = GRID_W
    const panelH = 200
    const cx = MAP_X + GRID_W / 2
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
        'Consigue piezas\ncogiendo la bandera\ncon MAX POWER.',
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

  drawBottomBar() {
    const y = BTN_Y
    const xVolver = BTN_ROW_X
    const xTut = BTN_ROW_X + BTN_W + BTN_GAP

    makeNavButton(
      this,
      xVolver,
      y,
      BTN_W,
      BTN_H,
      'VOLVER',
      () => {
        this.scene.start(SCENES.COLLECTION, { character: this.characterData })
      },
      { depth: 3 }
    )
    makeNavButton(
      this,
      xTut,
      y,
      BTN_W,
      BTN_H,
      'TUTORIAL',
      () => this.openMapTutorial(),
      { depth: 3 }
    )
  }

  // ── Cabecera del selector: título + selector radio de modo ────
  //
  // Layout:
  //   [ LISTA DE RETOS ]                        Modo: (●) GPS  ( ) METROS
  //
  // Al pulsar cualquiera de los dos radios se cambia el unlockMode y se
  // refresca la lista de bloques + el marker del jugador.

  drawSelectorHeader() {
    this._headerObjs = []

    // Título "LISTA DE RETOS" a la izquierda
    const title = this.add
      .text(HEADER_X, HEADER_Y + HEADER_H / 2, 'LISTA DE RETOS', {
        ...headingStyle(32, COLOR_GOLD, 4),
        stroke: '#000000',
      })
      .setOrigin(0, 0.5)
      .setDepth(3)
    this._headerObjs.push(title)

    // Selector radio de modo a la derecha (termina justo antes del mapa)
    this._modeRadioObjs = []
    this._drawModeRadios(MAP_X - 8, HEADER_Y + HEADER_H / 2)
  }

  _drawModeRadios(rightX, cy) {
    this._modeRadioObjs.forEach((o) => {
      if (o?.destroy) o.destroy()
    })
    this._modeRadioObjs = []

    const mode = mapService.getUnlockMode() || 'gps'

    const track = (o) => {
      this._modeRadioObjs.push(o)
      return o
    }

    const RADIO_R = 8
    const RADIO_GAP = 8
    const LABEL_GAP = 20
    const HIT_H = 44

    // Fila alineada a la derecha:  [Modo:]  [○ GPS]  [○ METROS]
    const optMeters = this._buildRadioOption('METROS', mode === 'meters', RADIO_R, RADIO_GAP)
    const optGps = this._buildRadioOption('GPS', mode === 'gps', RADIO_R, RADIO_GAP)
    const modoLabel = this.add
      .text(0, 0, 'Modo:', { ...headingStyle(22, '#f0d99a', 3), stroke: '#000000' })
      .setOrigin(1, 0.5)
      .setDepth(3)

    optMeters.setRight(rightX, cy)
    optGps.setRight(optMeters.left - LABEL_GAP, cy)
    modoLabel.setPosition(optGps.left - LABEL_GAP, cy)

    track(modoLabel)
    optGps.objs.forEach((o) => track(o))
    optMeters.objs.forEach((o) => track(o))

    // Áreas táctiles anchas por radio
    const zoneGps = track(
      this.add
        .zone(optGps.left, cy - HIT_H / 2, optGps.width, HIT_H)
        .setOrigin(0)
        .setDepth(4)
        .setInteractive({ useHandCursor: true })
    )
    zoneGps.on('pointerdown', () => this._pickMode('gps'))

    const zoneMeters = track(
      this.add
        .zone(optMeters.left, cy - HIT_H / 2, optMeters.width, HIT_H)
        .setOrigin(0)
        .setDepth(4)
        .setInteractive({ useHandCursor: true })
    )
    zoneMeters.on('pointerdown', () => this._pickMode('meters'))
  }

  // Devuelve un "objeto" ligero con métodos setRight/left para poder
  // right-align sin recalcular a mano cada anchura.
  _buildRadioOption(text, selected, radius, gap) {
    const g = this.add.graphics().setDepth(3)
    g.lineStyle(2, COLORS.GOLD, 1)
    g.strokeCircle(0, 0, radius)
    if (selected) {
      g.fillStyle(COLORS.GOLD, 1)
      g.fillCircle(0, 0, radius - 3)
    }

    const label = this.add.text(0, 0, text, {
      ...headingStyle(22, selected ? '#f0d99a' : '#8a8a9a', 3),
      stroke: '#000000',
    }).setOrigin(0, 0.5).setDepth(3)

    const width = radius * 2 + gap + label.width
    let left = 0
    const opt = {
      objs: [g, label],
      get width() { return width },
      get left() { return left },
      setRight(rightX, cy) {
        left = rightX - width
        g.setPosition(left + radius, cy)
        label.setPosition(left + radius * 2 + gap, cy)
      },
    }
    return opt
  }

  _pickMode(mode) {
    if ((mapService.getUnlockMode() || 'gps') === mode) return
    this.toggleUnlockMode(mode)
  }

  // Cambia el modo de desbloqueo. Si se pasa `target`, va a ese modo
  // directamente (usado por los radio buttons); si no, hace toggle.
  // Efectos secundarios: al pasar a metros paramos el watch y ocultamos
  // el marker; al pasar a GPS reintentamos el tracking (puede abrir el
  // modal de permiso denegado si el usuario no lo concedió antes).
  async toggleUnlockMode(target) {
    const current = mapService.getUnlockMode() || 'gps'
    const next = target || (current === 'gps' ? 'meters' : 'gps')
    if (next === current) return
    mapService.setUnlockMode(next)
    this.blockSelector?.refresh()
    this._drawModeRadios(MAP_X - 8, HEADER_Y + HEADER_H / 2)

    if (next === 'meters') {
      // Parar watch y cerrar modal si estaba abierto por permiso denegado
      this._watchActive = false
      try {
        await geoService.stopWatch()
      } catch (_) {}
      this.closePermissionDeniedModal()
      this.refreshPlayerMarkerVisibility()
      this.showToast('Modo cambiado a metros')
    } else {
      this.showToast('Modo cambiado a GPS')
      // Arranca el tracking; si el permiso está denegado, showPermissionDeniedModal
      // se disparará dentro de startGpsTracking.
      this.startGpsTracking()
    }
  }

  openMapTutorial() {
    this.scene.start(SCENES.MAP_TUTORIAL, { character: this.characterData })
  }

  showToast(message) {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const w = 360
    const h = 44
    const g = this.add.graphics().setDepth(100)
    g.fillStyle(0x000000, 0.85)
    g.fillRect(cx - w / 2, cy - h / 2, w, h)
    g.lineStyle(1, COLORS.GOLD, 0.7)
    g.strokeRect(cx - w / 2, cy - h / 2, w, h)
    const t = this.add
      .text(cx, cy, message, {
        ...uiLabelStyle(14, COLOR_GOLD, 2),
        stroke: '#000000',
      })
      .setOrigin(0.5)
      .setDepth(101)
    this.tweens.add({
      targets: [g, t],
      alpha: 0,
      delay: 1600,
      duration: 350,
      onComplete: () => {
        g.destroy()
        t.destroy()
      },
    })
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

    // Puntos de interés (solo del bloque activo y en piezas desbloqueadas)
    if (isUnlocked) {
      const scale = ZOOM_SIZE / PIECE_ORIGINAL_SIZE
      const imgLeft = ZOOM_CX - ZOOM_HALF
      const imgTop = ZOOM_CY - ZOOM_HALF
      const activeBlockId = mapService.getActiveBlockId()
      const points = mapService.getPoisForPiece(row, col, activeBlockId)
      points.forEach((point) => {
        this.addZoomPoint(track, point, imgLeft + point.x * scale, imgTop + point.y * scale)
      })
    }

    // Marker del jugador en la vista de zoom — se crea siempre que haya
    // una lectura previa de GPS y luego se aplica la lógica de visibilidad
    // (modo, bounds, pieza desbloqueada) desde refreshPlayerMarkerVisibility.
    if (this.lastGpsPosition) {
      this.zoomPlayerMarker = new PlayerMarker(this, { radius: 12, depth: 26 })
      this.refreshPlayerMarkerVisibility()
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
    const visited = mapService.isVisitedInPerson(point.id)

    // Rojo pulsante si pendiente, verde con ✓ estático si visitado
    const dot = track(this.add.graphics().setDepth(24))
    if (visited) {
      dot.fillStyle(0x2ecc40, 1)
      dot.fillCircle(px, py, 10)
      dot.lineStyle(2, 0xffffff, 1)
      dot.strokeCircle(px, py, 10)
      // Tick blanco encima
      const tick = track(
        this.add
          .text(px, py, '✓', uiLabelLight(14, '#ffffff'))
          .setOrigin(0.5)
          .setDepth(25)
      )
      tick.setStroke('#0a4a10', 3)
    } else {
      dot.fillStyle(0xff2200, 1)
      dot.fillCircle(px, py, 10)
      dot.lineStyle(2, 0xffffff, 1)
      dot.strokeCircle(px, py, 10)
      this.tweens.add({
        targets: dot,
        alpha: 0.45,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

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
    const imgH = 400
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
          ...mutedStyle(18, COLOR_GOLD),
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: PW - 40 },
        })
        .setOrigin(0.5, 0)
        .setDepth(D + 2)
    )

    // Zona de check-in (botón / sello / distancia)
    this.drawPointCheckin(m, point, PX, PY, PW, PH, CX, D)

    // Hint cierre
    m(
      this.add
        .text(CX, PY + PH - 18, 'Toca fuera para cerrar', mutedStyle(10, '#555566'))
        .setOrigin(0.5)
        .setDepth(D + 2)
    )
  }

  // Dibuja la sección inferior del modal de POI: sello si ya visitado,
  // botón "ESTOY AQUÍ" si estás en rango, o distancia estimada si no.
  drawPointCheckin(m, point, PX, PY, PW, PH, CX, D) {
    const AREA_Y = PY + PH - 88 // top de la zona (56px alto + hint)
    const AREA_H = 56

    if (mapService.isVisitedInPerson(point.id)) {
      this.drawVisitedBadge(m, CX, AREA_Y + AREA_H / 2, D)
      return
    }

    // Si el POI no lleva coord GPS aún, no podemos hacer check-in.
    if (point.lat === null || point.lat === undefined) return
    if (point.lon === null || point.lon === undefined) return

    const pos = this.lastGpsPosition
    if (!pos) {
      m(
        this.add
          .text(CX, AREA_Y + AREA_H / 2, 'Esperando GPS…', mutedStyle(14, '#888899'))
          .setOrigin(0.5)
          .setDepth(D + 2)
      )
      return
    }

    const distance = haversineDistance(pos.lat, pos.lon, point.lat, point.lon)

    if (distance <= CHECKIN_RADIUS_M) {
      this.drawCheckinButton(m, point, CX, AREA_Y, D)
    } else {
      m(
        this.add
          .text(
            CX,
            AREA_Y + AREA_H / 2,
            `A ${Math.round(distance)} m del punto`,
            mutedStyle(14, '#a8a8b8')
          )
          .setOrigin(0.5)
          .setDepth(D + 2)
      )
    }
  }

  drawVisitedBadge(m, cx, cy, D) {
    const BW = 320
    const BH = 44
    const bx = cx - BW / 2
    const by = cy - BH / 2

    const g = m(this.add.graphics().setDepth(D + 2))
    g.fillStyle(0x0a4a10, 1)
    g.fillRect(bx, by, BW, BH)
    g.lineStyle(2, 0x2ecc40, 1)
    g.strokeRect(bx, by, BW, BH)

    m(
      this.add
        .text(cx, cy, '✓  VISITADO EN PERSONA', {
          ...uiLabelStyle(14, '#a8ffb0', 2),
          stroke: '#000000',
        })
        .setOrigin(0.5)
        .setDepth(D + 3)
    )
  }

  drawCheckinButton(m, point, cx, y, D) {
    const BW = 240
    const BH = 48
    const bx = Math.round(cx - BW / 2)
    const before = this.children.list.length
    makeNavButton(
      this,
      bx,
      y,
      BW,
      BH,
      'ESTOY AQUÍ',
      () => this.onCheckinPressed(point),
      { depth: D + 2 }
    )
    this.children.list.slice(before).forEach((o) => m(o))
  }

  onCheckinPressed(point) {
    // Doble verificación: la posición puede haber cambiado entre abrir
    // el modal y pulsar el botón.
    const pos = this.lastGpsPosition
    if (!pos) return
    const distance = haversineDistance(pos.lat, pos.lon, point.lat, point.lon)
    if (distance > CHECKIN_RADIUS_M) {
      // Fuera de rango justo al pulsar — refrescamos y salimos sin marcar.
      this.showPointModal(point)
      return
    }

    mapService.markVisitedInPerson(point.id)
    try {
      this.sound.play('sfx-flag', { volume: 0.6 })
    } catch (_) {}

    const nextBlock = mapService.checkAndCompleteBlock(point.blockId, 'gps')

    // Refresca contador del selector de bloques.
    this.blockSelector?.refresh()

    // Redibujamos el modal para que aparezca el sello.
    this.showPointModal(point)

    // Redibujamos también los POIs del zoom (para pasar de rojo a verde).
    if (this.zoomOpen && this._zoomRow !== null && this._zoomCol !== null) {
      const row = this._zoomRow
      const col = this._zoomCol
      this.closeZoomView()
      this.openZoomView(row, col)
      this.showPointModal(point)
    }

    if (nextBlock) {
      this.showBlockCompletedToast(nextBlock)
    }
  }

  showBlockCompletedToast(nextBlock) {
    const cx = GAME_WIDTH / 2
    const cy = 120
    const g = this.add.graphics().setDepth(100)
    g.fillStyle(0x000000, 0.9)
    g.fillRect(cx - 260, cy - 40, 520, 80)
    g.lineStyle(2, 0x2ecc40, 1)
    g.strokeRect(cx - 260, cy - 40, 520, 80)

    const text = this.add
      .text(
        cx,
        cy,
        `¡BLOQUE COMPLETADO!\nDesbloqueado: ${nextBlock.title}`,
        {
          ...uiLabelStyle(14, '#a8ffb0', 2),
          stroke: '#000000',
          align: 'center',
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5)
      .setDepth(101)

    this.tweens.add({
      targets: [g, text],
      alpha: 0,
      delay: 3200,
      duration: 400,
      onComplete: () => {
        g.destroy()
        text.destroy()
      },
    })
  }

  closePointModal() {
    this.pointModal.forEach((o) => {
      if (o?.active) o.destroy()
    })
    this.pointModal = []
  }
}
