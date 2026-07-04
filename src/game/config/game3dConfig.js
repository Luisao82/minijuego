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
    // Puente de Triana (frontal-rio.webp). El tablero es la continuación de las
    // orillas laterales: el plano se achata a la altura real del tablero (~11 m
    // sobre el agua) en vez de respetar el aspect de la imagen — la decimación
    // del render estilo Doom absorbe la compresión vertical sin artefactos.
    // Las medidas SRC_* son píxeles sobre la imagen de 1024×1024.
    BRIDGE: {
      WIDTH: 160, // Ancho del plano (m) — los extremos mueren dentro de las orillas (±62)
      HEIGHT: 11.5, // Altura del plano (m): barandilla ~10 m, base del tablero ~6 m
      Z: -170, // Distancia del puente (m)
      SRC_Y0: 390, // Techo de la banda mostrada (farolas y edificios del fondo)
      SRC_Y1: 665, // Línea de agua de la imagen (base de las columnas)
      // El puente tiene 4 columnas: 2 en el agua (ya en la imagen) y 2 pegadas
      // a tierra — estas últimas se clonan del pilar derecho del agua y se
      // estampan en los extremos, a la altura de las orillas laterales.
      PILLAR_SRC: { X: 723, Y: 505, W: 121, H: 160 }, // Pilar del agua usado como fuente
      LAND_PILLAR_DST_X: [55, 849], // Destinos x del clon (px) — caen sobre las orillas (±62 m)
    },
    // Torre Sevilla — plano propio detrás del puente, con proporción esbelta
    // (el plano comprime la banda en horizontal) y el remate dibujado encima
    // del asset, que la trae cortada en plano.
    TOWER: {
      WIDTH: 18, // Ancho del plano (m)
      HEIGHT: 46, // Alto del plano (m)
      X: -48, // A la izquierda del puente, como en la ribera real
      Y_BASE: 5, // Base del plano (m) — queda oculta tras el tablero del puente
      Z: -178, // Un poco por detrás del puente
      SRC_X0: 55,
      SRC_X1: 190,
      SRC_Y0: 150, // Deja aire para el remate dibujado (CAP)
      SRC_Y1: 470, // La base del fuste desaparece tras el tablero
      // Remate pixel art: bloques centrados apilados sobre el tope del fuste
      // [x0, x1, alto] de abajo arriba, en px de imagen; colores del propio fuste
      CAP: {
        Y: 194, // Tope actual del fuste en la imagen
        BLOCKS: [
          [124, 182, 12],
          [130, 176, 12],
          [146, 160, 10],
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
