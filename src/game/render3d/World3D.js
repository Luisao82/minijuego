import { COLORS } from '../config/gameConfig'
import { GAME3D, RENDER_WIDTH, RENDER_HEIGHT } from '../config/game3dConfig'
import { replaceColor } from './textureUtils'

// Escenario 3D de la vista en primera persona: el Guadalquivir con el caserío
// de Triana a la izquierda, la orilla de Sevilla a la derecha, el Puente de
// Triana al fondo, el palo con su bandera y la barcaza paseando.
//
// three.js se carga con import() dinámico: solo se descarga su chunk al entrar
// en la vista 3D — el resto del juego no paga el coste en el bundle inicial.
//
// El módulo es solo presentación: renderiza a un canvas propio a baja
// resolución y la escena lo vuelca en su CanvasTexture de Phaser. No conoce
// las mecánicas del juego; la cámara la posiciona CameraController.

export class World3D {
  static async create(phaserTextures) {
    const THREE = await import('three')
    return new World3D(THREE, phaserTextures)
  }

  constructor(THREE, phaserTextures) {
    this._THREE = THREE
    this._textures = phaserTextures
    this._t = 0

    this._canvas = document.createElement('canvas')
    this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: false })
    this._renderer.outputColorSpace = THREE.SRGBColorSpace
    this._renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT, false)

    this._scene = new THREE.Scene()
    this._scene.background = new THREE.Color(GAME3D.SKY_COLOR)
    this._scene.fog = new THREE.Fog(GAME3D.SKY_COLOR, GAME3D.FOG_NEAR, GAME3D.FOG_FAR)

    const W = GAME3D.WORLD
    this._camera = new THREE.PerspectiveCamera(
      W.CAMERA_FOV,
      RENDER_WIDTH / RENDER_HEIGHT,
      W.CAMERA_NEAR,
      W.CAMERA_FAR
    )
    this._camera.rotation.order = 'YXZ'

    this._buildWater()
    this._buildBanks()
    this._buildBridge()
    this._buildPole()
    this._buildBoat()
  }

  get canvas() {
    return this._canvas
  }

  // Las texturas se reutilizan de Phaser (ya precargadas en PreloadScene):
  // evita volver a descargar los fondos por red al entrar en la escena.
  _makeTex(img) {
    const THREE = this._THREE
    const tex = new THREE.Texture(img)
    tex.needsUpdate = true
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    return tex
  }

  _texFromPhaser(key) {
    return this._makeTex(this._textures.get(key).getSourceImage())
  }

  // Agua del Guadalquivir con oleaje por vértices. Material sin iluminación
  // para que el color coincida exactamente con el agua de los fondos 2D.
  // fog:false — el agua no se funde con el cielo al horizonte: si no, en la
  // distancia del puente se ve una banda celeste entre las orillas y el
  // agua cercana (el color se mezcla con SKY_COLOR por la niebla activa
  // de la escena). Sin niebla en el agua, el río mantiene su tono desde
  // el palo hasta el puente y la unión con las orillas queda limpia.
  _buildWater() {
    const THREE = this._THREE
    const W = GAME3D.WORLD
    const geo = new THREE.PlaneGeometry(
      W.WATER_SIZE,
      W.WATER_SIZE,
      W.WATER_SEGMENTS,
      W.WATER_SEGMENTS
    )
    const water = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: GAME3D.WATER_COLOR, fog: false })
    )
    water.rotation.x = -Math.PI / 2
    this._scene.add(water)
    this._waterPos = geo.attributes.position
    this._waterBase = this._waterPos.array.slice()
  }

  // Orillas: Triana a la izquierda, Sevilla a la derecha.
  // Cada orilla se recorta exactamente por la línea de agua de su imagen:
  // el caserío apoya justo donde empieza el agua del plano 3D, sin que se
  // cuele la franja de agua dibujada en el fondo.
  // La orilla de Sevilla (fondo_a) tiene el cielo más claro que el resto de
  // fondos; como es un color plano, se sustituye por el azul común para que
  // todo el horizonte 3D comparta un único cielo.
  _buildBanks() {
    const W = GAME3D.WORLD
    this._addBank(
      'bg-game-sevilla',
      -W.BANK_X,
      Math.PI / 2,
      GAME3D.BANK_WATERLINE_TRIANA,
      W.BANK_TEX_OFFSET_LEFT
    )
    this._addBank(
      'bg-game',
      W.BANK_X,
      -Math.PI / 2,
      GAME3D.BANK_WATERLINE_SEVILLA,
      W.BANK_TEX_OFFSET_RIGHT,
      {
        unifySkyFrom: GAME3D.SKY_COLOR_SEVILLA,
      }
    )
  }

  _addBank(key, x, rotY, waterline, texOffsetX, { unifySkyFrom = null } = {}) {
    const THREE = this._THREE
    const W = GAME3D.WORLD
    const tex = unifySkyFrom
      ? this._makeTex(
          replaceColor(
            this._textures.get(key).getSourceImage(),
            unifySkyFrom,
            GAME3D.SKY_COLOR,
            W.SKY_REPLACE_TOLERANCE
          )
        )
      : this._texFromPhaser(key)
    tex.wrapS = THREE.RepeatWrapping
    tex.repeat.set(W.BANK_REPEAT_X, waterline)
    // El desplazamiento horizontal permite que un punto concreto de la imagen
    // fuente coincida con una Z específica del mundo (típicamente el puente).
    tex.offset.x = texOffsetX
    tex.offset.y = 1 - waterline

    const bankH = (W.BANK_WIDTH / W.BANK_REPEAT_X) * waterline // mantiene la proporción del dibujo
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(W.BANK_WIDTH, bankH),
      new THREE.MeshBasicMaterial({ map: tex, fog: true })
    )
    mesh.position.set(x, bankH / 2, W.BANK_Z)
    mesh.rotation.y = rotY
    this._scene.add(mesh)
  }

  // Puente de Triana (frontal-rio.webp): plano frontal + torre en plano
  // billboard aparte. El asset trae ya dibujados los 4 pilares (2 agua + 2
  // tierra), la barandilla del tablero, los arcos con sus círculos, y el
  // fuste de la torre asomando por encima del tablero. La torre se saca a
  // su propio plano orientado a la cámara para que el fuste se vea recto:
  // al estar off-center (world x≈-35 m) y con la cámara ligeramente
  // pitcheada hacia abajo, sobre el plano frontal aparecería inclinada por
  // proyección perspectiva. En el plano del puente su área se pinta de
  // cielo antes de subir la textura para no duplicar la silueta.
  //
  // La geometría del plano frontal respeta el aspecto de la banda visible
  // [SRC_Y0, SRC_Y1] × ancho de la imagen: HEIGHT se deriva de WIDTH para
  // que las columnas y los arcos no se deformen. La posición vertical del
  // centro se calcula para que la fila DECK_SRC_Y caiga en Y_DECK.
  _buildBridge() {
    const THREE = this._THREE
    const W = GAME3D.WORLD
    const { BRIDGE, TOWER } = W

    // Canvas del asset con el cielo unificado al azul común del escenario 3D
    const bridgeCanvas = replaceColor(
      this._textures.get('bg-3d-frontal').getSourceImage(),
      GAME3D.SKY_COLOR_FRONTAL,
      GAME3D.SKY_COLOR,
      W.SKY_REPLACE_TOLERANCE_FRONTAL
    )

    // Extraemos la torre del canvas ya unificado, así los píxeles de cielo
    // del recorte comparten color con el fondo del escenario y no aparece
    // un halo cuando el plano billboard se ve pegado al hueco del frontal.
    const towerCanvas = document.createElement('canvas')
    towerCanvas.width = TOWER.SRC_X1 - TOWER.SRC_X0
    towerCanvas.height = TOWER.SRC_Y1 - TOWER.SRC_Y0
    towerCanvas
      .getContext('2d')
      .drawImage(
        bridgeCanvas,
        TOWER.SRC_X0,
        TOWER.SRC_Y0,
        towerCanvas.width,
        towerCanvas.height,
        0,
        0,
        towerCanvas.width,
        towerCanvas.height
      )

    // El plano frontal se queda sin torre — la muestra el plano billboard.
    const bctx = bridgeCanvas.getContext('2d')
    bctx.fillStyle = '#' + GAME3D.SKY_COLOR.toString(16).padStart(6, '0')
    bctx.fillRect(
      TOWER.SRC_X0,
      TOWER.SRC_Y0,
      TOWER.SRC_X1 - TOWER.SRC_X0,
      TOWER.SRC_Y1 - TOWER.SRC_Y0
    )

    const ih = bridgeCanvas.height

    const bandHeightPx = BRIDGE.SRC_Y1 - BRIDGE.SRC_Y0
    const height = (BRIDGE.WIDTH * bandHeightPx) / BRIDGE.IMG_WIDTH
    const deckFracFromTop = (BRIDGE.DECK_SRC_Y - BRIDGE.SRC_Y0) / bandHeightPx
    const yCenter = BRIDGE.Y_DECK - height * (0.5 - deckFracFromTop)

    const bridgeTex = this._makeTex(bridgeCanvas)
    bridgeTex.offset.set(0, 1 - BRIDGE.SRC_Y1 / ih)
    bridgeTex.repeat.set(1, bandHeightPx / ih)
    const bridge = new THREE.Mesh(
      new THREE.PlaneGeometry(BRIDGE.WIDTH, height),
      new THREE.MeshBasicMaterial({
        map: bridgeTex,
        fog: false,
        // El puente gana el z-test frente a la superficie coincidente de
        // las orillas allí donde el plano cruza la ribera (x=±BANK_X).
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
    bridge.position.set(0, yCenter, BRIDGE.Z)
    this._scene.add(bridge)

    // Plano de la torre — dimensiones derivadas del recorte del asset
    // manteniendo la misma escala metros/píxel que el puente. Se pinta a
    // la misma Z para que su tamaño aparente coincida con el hueco que le
    // hemos dejado en el plano frontal.
    // La posición vertical del centro se calcula desde SRC_Y* usando la
    // misma correspondencia píxeles-mundo que el plano del puente, así el
    // billboard queda perfectamente alineado con el borrado.
    const perPixel = BRIDGE.WIDTH / BRIDGE.IMG_WIDTH
    const towerWidth = towerCanvas.width * perPixel
    const towerHeight = towerCanvas.height * perPixel
    const bridgePlaneTop = yCenter + height / 2
    const towerTopY = bridgePlaneTop - (TOWER.SRC_Y0 - BRIDGE.SRC_Y0) * perPixel
    const towerTex = this._makeTex(towerCanvas)
    const tower = new THREE.Mesh(
      new THREE.PlaneGeometry(towerWidth, towerHeight),
      new THREE.MeshBasicMaterial({
        map: towerTex,
        fog: false,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    )
    tower.position.set(TOWER.X, towerTopY - towerHeight / 2, BRIDGE.Z)
    this._scene.add(tower)
    this._tower = tower
  }

  // Se llama cada frame desde applyCamera para que el plano de la torre
  // rote alrededor del eje Y y su normal apunte a la cámara. Con esto el
  // fuste se ve siempre vertical desde cualquier punto del palo, sin la
  // inclinación de perspectiva que aparecería sobre el plano frontal.
  _updateTowerBillboard() {
    if (!this._tower) return
    const { x, z } = this._tower.position
    const cx = this._camera.position.x
    const cz = this._camera.position.z
    this._tower.rotation.y = Math.atan2(cx - x, cz - z)
  }

  // El palo: grosor uniforme y el mismo color plano que en las vistas 2D
  // (COLORS.WOOD_LIGHT, sin iluminación para que el tono no varíe),
  // con la bandera blanca en la punta.
  _buildPole() {
    const THREE = this._THREE
    const W = GAME3D.WORLD

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(W.POLE_RADIUS, W.POLE_RADIUS, GAME3D.POLE_LENGTH, 10, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.WOOD_LIGHT })
    )
    pole.rotation.x = Math.PI / 2
    pole.position.set(0, GAME3D.POLE_Y, -GAME3D.POLE_LENGTH / 2)
    this._scene.add(pole)

    const F = W.FLAG
    this._flagGroup = new THREE.Group()
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(F.MAST_RADIUS, F.MAST_RADIUS, F.MAST_HEIGHT, 6),
      new THREE.MeshBasicMaterial({ color: COLORS.WOOD_DARK })
    )
    mast.position.set(0, GAME3D.POLE_Y + F.MAST_HEIGHT / 2, 0)
    this._flagGroup.add(mast)

    this._flagCloth = new THREE.Mesh(
      new THREE.PlaneGeometry(F.CLOTH_WIDTH, F.CLOTH_HEIGHT),
      new THREE.MeshBasicMaterial({ color: COLORS.WHITE, side: THREE.DoubleSide })
    )
    this._flagCloth.position.set(
      -(F.CLOTH_WIDTH / 2 + 0.02),
      GAME3D.POLE_Y + F.MAST_HEIGHT - F.CLOTH_HEIGHT / 2,
      0
    )
    this._flagGroup.add(this._flagCloth)
    this._flagGroup.position.z = -GAME3D.POLE_LENGTH
    this._scene.add(this._flagGroup)
  }

  _buildBoat() {
    const THREE = this._THREE
    const B = GAME3D.WORLD.BOAT
    this._boat = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._texFromPhaser('boat') }))
    this._boat.scale.set(B.SCALE_X, B.SCALE_Y, 1)
    this._boat.position.set(B.START_X, B.Y, B.Z)
    this._scene.add(this._boat)
  }

  setFlagVisible(visible) {
    this._flagGroup.visible = visible
  }

  applyCamera({ x, y, z, pitch, roll }) {
    this._camera.position.set(x, y, z)
    this._camera.rotation.x = pitch
    this._camera.rotation.z = roll
    this._updateTowerBillboard()
  }

  // Anima el oleaje, la barcaza y la bandera
  update(dt) {
    this._t += dt
    const t = this._t
    const { WAVE, BOAT, FLAG } = GAME3D.WORLD

    for (let i = 0; i < this._waterPos.count; i++) {
      const x = this._waterBase[i * 3]
      const y = this._waterBase[i * 3 + 1]
      this._waterPos.array[i * 3 + 2] =
        Math.sin(x * WAVE.FREQ_X + t * WAVE.SPEED_X) * WAVE.AMP_X +
        Math.cos(y * WAVE.FREQ_Y + t * WAVE.SPEED_Y) * WAVE.AMP_Y
    }
    this._waterPos.needsUpdate = true

    this._boat.position.x = BOAT.START_X + ((t * BOAT.SPEED) % BOAT.RANGE)
    this._boat.position.y = BOAT.Y + Math.sin(t * BOAT.BOB_FREQ) * BOAT.BOB_AMP
    this._flagCloth.rotation.y = Math.sin(t * FLAG.WAVE_SPEED) * FLAG.WAVE_AMP
  }

  // Renderiza el frame y devuelve el canvas para volcarlo en Phaser
  render() {
    this._renderer.render(this._scene, this._camera)
    return this._canvas
  }

  dispose() {
    this._renderer.dispose()
    this._renderer.forceContextLoss()
  }
}
