import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig'

// Configuración de la vista 3D en primera persona (estilo Doom)
// El mundo 3D se mide en metros; el palo equivale al POLE.LENGTH en píxeles
// de las vistas 2D. Se renderiza a baja resolución y se escala con NEAREST
// para respetar la estética pixel art del resto del juego.
export const GAME3D = {
  RENDER_SCALE: 4, // Divisor de resolución interna (1024/4 × 768/4 = 256×192)
  POLE_LENGTH: 40, // Longitud del palo en metros
  POLE_Y: 1.05, // Altura del palo sobre el agua (m)
  EYE_HEIGHT: 0.85, // Altura de los ojos sobre el palo (m)
  FLAG_GRAB_RANGE: 1.1, // Distancia (m) a la bandera para considerarla cogida

  // Colores muestreados de los fondos 2D para que el mundo 3D encaje con ellos
  SKY_COLOR: 0x46a7f6, // Cielo muestreado de fondo_b (Triana) y frontal-rio (puente)
  SKY_COLOR_SEVILLA: 0x7dc4f5, // Cielo original de fondo_a (más claro) — se sustituye por SKY_COLOR en la textura 3D
  SKY_COLOR_FRONTAL: 0x64a7f0, // Cielo original de frontal-rio.webp — se sustituye por SKY_COLOR en la textura 3D
  WATER_COLOR: 0x4882c3, // Agua muestreada de fondo_a y fondo_b (idéntica en ambas)
  FOG_NEAR: 90,
  FOG_FAR: 220,

  // Fracción de cada fondo por encima de su línea de agua (medida sobre la imagen):
  // las orillas se recortan ahí para que el caserío apoye justo donde empieza el agua 3D
  BANK_WATERLINE_TRIANA: 0.354, // fondo_b — caserío de Triana
  BANK_WATERLINE_SEVILLA: 0.362, // fondo_a — orilla de Sevilla

  // Geometría y animación del escenario (World3D)
  WORLD: {
    CAMERA_FOV: 75,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 400,
    WATER_SIZE: 500, // Lado del plano de agua (m)
    WATER_SEGMENTS: 64, // Subdivisiones del plano para el oleaje por vértices
    WAVE: {
      AMP_X: 0.14, // Amplitud del oleaje según x
      AMP_Y: 0.12, // Amplitud del oleaje según y
      FREQ_X: 0.25,
      FREQ_Y: 0.2,
      SPEED_X: 1.6,
      SPEED_Y: 1.1,
    },
    BANK_X: 62, // Distancia de cada orilla al centro del río (m)
    BANK_Z: -40, // Desplazamiento de las orillas hacia el fondo (m)
    BANK_WIDTH: 320, // Ancho del plano de cada orilla (m)
    BANK_REPEAT_X: 3, // Repeticiones horizontales de la textura de orilla
    // Puente de Triana (frontal-rio.webp). Composición reconocible:
    //   • Tablero al mismo horizonte que la línea de tierra de las orillas
    //     (Y_DECK ≈ altura del caserío de las orillas laterales, ~37 m).
    //   • Cuatro columnas: 2 en el agua (ya en el asset) y 2 en tierra
    //     (clonadas del pilar del agua y estampadas justo sobre la línea
    //     de las orillas, ±BANK_X en el mundo).
    //   • Plano suficientemente grande y cercano para que los arcos con
    //     sus círculos característicos se lean bien.
    // La banda visible [SRC_Y0, SRC_Y1] cubre desde justo encima del
    // tablero hasta la línea de agua; el resto queda cortado por el propio
    // plano. Las medidas SRC_* son píxeles sobre la imagen de 1024×1024.
    BRIDGE: {
      WIDTH: 148, // Ancho del plano (m) — al ser algo más estrecho que 2·BANK_X (=124), los pilares de tierra caen justo dentro de las orillas (±LAND_PILLAR_WORLD_X)
      HEIGHT: 58, // Alto del plano (m) — deck a Y_DECK, base debajo del agua (queda escondida por el plano del río)
      Y_DECK: 24, // Altura del tablero (m): coincide con la línea alta de las orillas visible desde el pole (calibrado a ojo)
      Z: -140, // Distancia del puente (m) — algo más cerca aún para que la estructura sea inconfundible
      SRC_Y0: 400, // Techo de la banda visible (deja fuera el edificio del fondo derecho del asset)
      SRC_Y1: 665, // Línea de agua de la imagen (base de las columnas del agua)
      DECK_SRC_Y: 480, // Fila del tablero en la imagen (para calibrar Y_DECK sobre el plano)
      PILLAR_SRC: { X: 725, Y: 500, W: 102, H: 165 }, // Pilar del agua (derecho) usado como fuente del clon
      // Los pilares de tierra se plantan a esta distancia del centro en el
      // mundo (BANK_X = 62 m). Se dejan a 55 m para que queden claramente
      // delante del plano de la orilla y el jugador vea las 4 columnas.
      LAND_PILLAR_WORLD_X: 55,
    },
    // Torre Sevilla — plano propio detrás del puente. La parte que se ve
    // es el remate y el arranque del fuste asomando por encima del
    // tablero; el resto queda oculto tras el puente. La banda incluye el
    // CAP (remate pixel art dibujado sobre el asset, que trae la torre
    // cortada por arriba) hasta un poco más abajo del tope actual del
    // fuste; así al escalar el plano se ve una torre esbelta y alta.
    TOWER: {
      WIDTH: 22, // Ancho del plano (m)
      HEIGHT: 55, // Alto del plano (m) — su tope asoma bien por encima del tablero
      X: -42, // A la izquierda del centro, como en la ribera real
      Y_BASE: 8, // Base del plano (m) — queda oculta tras el puente
      Z: -158, // Detrás del puente
      SRC_X0: 55,
      SRC_X1: 190,
      SRC_Y0: 130, // Deja aire suficiente para el remate dibujado (CAP)
      SRC_Y1: 470, // Corte inferior — el resto del fuste queda tras el puente
      // Remate pixel art: Torre Sevilla es un rascacielos rectangular alto
      // (no una torre con antena). Un único bloque un poco más ancho extiende
      // el fuste hacia arriba manteniendo la silueta.
      // El asset trae la torre con un pico decorativo estrecho (px 156-171 en
      // y=193) que a baja resolución parece un sombrero flotando; el CAP
      // arranca en y=214 (fuste ya ancho y consistente) y sube 65 px,
      // sobrescribiendo el pico y extendiendo el fuste como bloque uniforme.
      CAP: {
        Y: 214,
        BLOCKS: [
          [134, 174, 65], // Ancho exacto del fuste real (evita "sombrero" a resoluciones bajas)
        ],
        FILL: '#7d5f5e', // Tono claro del fuste
        SHADE: '#523b41', // Sombra del lado izquierdo
      },
    },
    POLE_RADIUS: 0.12, // Grosor del palo (m)
    FLAG: {
      MAST_HEIGHT: 1.5,
      MAST_RADIUS: 0.03,
      CLOTH_WIDTH: 0.8,
      CLOTH_HEIGHT: 0.5,
      WAVE_SPEED: 3, // Velocidad del ondear de la tela
      WAVE_AMP: 0.3, // Amplitud del ondear (rad)
    },
    BOAT: {
      SCALE_X: 7,
      SCALE_Y: 4,
      START_X: -45, // Inicio del paseo de la barcaza (m)
      RANGE: 95, // Longitud del paseo antes de reiniciar (m)
      SPEED: 2.2, // Velocidad de paseo (m/s)
      Y: 1.6, // Altura base sobre el agua (m)
      Z: -80,
      BOB_AMP: 0.12, // Balanceo vertical
      BOB_FREQ: 1.8,
    },
    // Tolerancia de sustitución de color al unificar los cielos planos
    SKY_REPLACE_TOLERANCE: 14,
    SKY_REPLACE_TOLERANCE_FRONTAL: 16,
  },

  // Cámara en primera persona (CameraController)
  CAMERA: {
    PITCH: -0.12, // Inclinación base de la cámara hacia el agua (rad)
    JUMP_PITCH: -0.1, // Inclinación extra durante el salto (rad)
    MAX_ROLL: 0.55, // Roll máximo (rad) cuando la barra de equilibrio llega al límite
    ROLL_APPLY: 0.9, // Fracción del roll interno aplicada a la rotación final
    ROLL_SWAY: 0.55, // Desplazamiento lateral de la cámara según el roll (m)
    BREATH_FREQ: 2, // Respiración en la salida (fase de impulso)
    BREATH_AMP: 0.02,
    BOB_BASE_FREQ: 4, // Cabeceo al correr: frecuencia base + velocidad
    BOB_AMP: 0.05,
    BOB_SPEED_CAP: 2, // Tope de velocidad que amplifica el cabeceo
    WATER_EYE_Y: 0.15, // Altura de ojos que se considera "tocar el agua" (m)
    LEVEL_OUT_SPEED: 2, // Velocidad de nivelado del roll tras el chapuzón
    FALL: {
      ROLL_SPEED: 3.2, // Velocidad de giro al perder el equilibrio (rad/s)
      BASE_SPEED: 2, // Velocidad inicial de caída (m/s)
      ACCEL: 6, // Aceleración de la caída (m/s²)
      SWAY: 0.9, // Desplazamiento lateral durante la caída (m)
    },
  },

  // Salto en primera persona — mismas ecuaciones que JumpSystem, en metros.
  // Convención de JumpSystem: caída = y creciente, por eso VY0 es negativa (hacia arriba).
  JUMP: {
    GRAVITY: 6, // m/s²
    VY0: -2.1, // Velocidad vertical inicial (m/s, negativa = arriba)
    EXTRA_DISTANCE: 1.5, // Avance extra base del salto (m)
    EXTRA_PER_STAT: 0.3, // Metros extra por punto de la stat 'jump' del personaje
  },

  // Chapuzón y transición al resultado
  SPLASH: {
    FLASH_COLOR: 0xbfe3ff, // Flash blanco-azulado al entrar en el agua
    FLASH_ALPHA: 0.85,
    FLASH_MS: 320,
    WIN_DELAY_MS: 900, // Espera antes de la pantalla de premio
    LOSE_DELAY_MS: 600, // Espera antes del panel de game over
  },
}

// Resolución interna del render 3D (se escala a pantalla completa con NEAREST)
export const RENDER_WIDTH = GAME_WIDTH / GAME3D.RENDER_SCALE
export const RENDER_HEIGHT = GAME_HEIGHT / GAME3D.RENDER_SCALE
