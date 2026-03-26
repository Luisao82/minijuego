// Configuración centralizada del juego

export const GAME_WIDTH = 1024
export const GAME_HEIGHT = 768

export const COLORS = {
  // Paleta principal pixel art
  SKY_BLUE: 0x4a90d9,
  RIVER_BLUE: 0x2d6da4,
  RIVER_DARK: 0x1b4f72,
  SAND: 0xd4a574,
  WOOD_LIGHT: 0x8b6914,
  WOOD_DARK: 0x5c4a1e,
  WHITE: 0xffffff,
  BLACK: 0x000000,
  CREAM: 0xfff8dc,
  RED: 0xc0392b,
  GREEN: 0x27ae60,
  YELLOW: 0xf1c40f,
  ORANGE: 0xe67e22,
  DARK_BG: 0x1a1a2e,
  UI_BORDER: 0x3d3d5c,
  UI_BG: 0x16213e,
  UI_HIGHLIGHT: 0xe94560,
  GOLD: 0xffd700,
}

export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  CRT: 'CRTScene',
  MENU: 'MenuScene',
  HISTORY: 'HistoryScene',
  TUTORIAL: 'TutorialScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  REWARD: 'RewardScene',
  CHARACTER_UNLOCK: 'CharacterUnlockScene',
  COLLECTION: 'CollectionScene',
}

// Configuración de texto pixel art (temporal hasta tener bitmap fonts)
export const PIXEL_FONT = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '16px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 4,
}

export const PIXEL_FONT_TITLE = {
  ...PIXEL_FONT,
  fontSize: '32px',
  strokeThickness: 6,
}

export const PIXEL_FONT_SMALL = {
  ...PIXEL_FONT,
  fontSize: '10px',
  strokeThickness: 2,
}

// Panel de control inferior (1/5 de la pantalla)
export const CONTROL_PANEL = {
  HEIGHT: Math.round(GAME_HEIGHT / 5),  // ~154px
  get Y() { return GAME_HEIGHT - this.HEIGHT },  // ~614
  get CENTER_Y() { return this.Y + this.HEIGHT / 2 },  // ~691
}

// Configuración de la Fase 1 — Impulso ("La carrera")
export const PHASE1 = {
  BASE_SPEED: 0.15,             // Velocidad inicial de la barra (pos/seg)
  BASE_ACCELERATION: 0.1,      // Aceleración base por segundo
  WEIGHT_FACTOR: 0.1,          // Aceleración extra por punto de peso
  MAX_PASSES: 5,                // Máximo de pasadas antes de que se acabe el tiempo
  PASS_SPEED_INCREASE: 0.1,     // Incremento de velocidad base por pasada completada
  ZONES: {
    RED: { start: 0, end: 0.4 },
    YELLOW: { start: 0.4, end: 0.75 },
    GREEN: { start: 0.75, end: 1 },
  },
  BAR: {
    WIDTH: 400,
    HEIGHT: 36,
  },
}

// Configuración del barco (barcaza)
// Proporciones basadas en referencia visual: barco 8m, palo 5m → ratio palo:barco = 5:8
const BOAT_IMAGE_W = 333
const BOAT_IMAGE_H = 182
const BOAT_SCALE = 1.6                                    // Escala grande para coincidir con referencia visual
const BOAT_W = Math.round(BOAT_IMAGE_W * BOAT_SCALE)     // ~416px
const BOAT_H = Math.round(BOAT_IMAGE_H * BOAT_SCALE)     // ~228px
const POLE_LENGTH = Math.round(BOAT_W * 5 / 8)           // ~364px (ratio 5:8)

export const BOAT = {
  DISPLAY_WIDTH: BOAT_W,
  DISPLAY_HEIGHT: BOAT_H,
  RIGHT_X: 985,               // Borde derecho del barco (pegado al borde de pantalla)
  DECK_Y_RATIO: 0.32,         // El palo se ancla al 32% desde arriba del barco (zona superior del casco)
}

// Configuración del palo (cucaña) — prolongación horizontal del barco (5:8)
export const POLE = {
  LENGTH: POLE_LENGTH,
  START_X: BOAT.RIGHT_X - BOAT_W,                          // Borde izquierdo del barco (palo pegado)
  END_X: BOAT.RIGHT_X - BOAT_W - POLE_LENGTH,             // Donde está la bandera
  Y_FACTOR: 0.555,                                         // Ajustado para mantener el barco en su posición con DECK_Y_RATIO 0.32
  FLAG_GRAB_RANGE: 10,                                     // Margen de colisión para coger la bandera (~alcance del brazo)
}

// Configuración del salto
export const JUMP = {
  EXTRA_DISTANCE: 5 ,     // Avance extra del salto en px (~1.5 cuerpos, futura stat 'jump' del personaje)
  VY0: -100,              // Velocidad vertical inicial del salto (px/s, negativa = arriba)
  GRAVITY: 600,           // Gravedad durante el salto (px/s²)
}

// Configuración de la Fase 2 — Equilibrio
// Modelo de inercia: drift constante en una dirección + input del jugador acumula velocity.
// El drift invierte cuando el cursor cruza el centro (posición = 0).
// La stat "equilibrio" del personaje (0-10) escala la fuerza máxima del drift y los límites:
//   equilibrio 10 → más fácil (drift lento + límites separados)
//   equilibrio  0 → más difícil (drift rápido + límites muy juntos)
export const BALANCE = {
  // Fuerza del drift según stat de equilibrio del personaje
  DRIFT_MIN: 0.3,                // Fuerza inicial del drift (empieza suave)
  DRIFT_MAX: 1.2,                // Fuerza máxima alcanzable del drift (con equilibrio 0)
  DRIFT_GROWTH_PER_CROSS: 0.06,  // Incremento de fuerza por cada cruce del centro (dificultad orgánica)

  // Fuerza del input del jugador
  // GARANTÍA: INPUT_FORCE > DRIFT_MAX × (1 + OIL.DRIFT_MULTIPLIER) = 1.2 × 1.5 = 1.8
  // Margen de control: 2.5 - 1.8 = 0.7
  // Acel máx combinada: 2.5 + 1.8 = 4.3 u/s² → tarda ~1.2s en llegar al cap (antes 0.5s)
  INPUT_FORCE: 4.5,

  DAMPING: 0.10,                 // Amortiguamiento de velocity — bajo = más inercia, la velocity acumulada dura más
  VELOCITY_CAP: 5,               // Velocidad máxima absoluta del cursor (u/s) — evita acumulación descontrolada

  // Límites según stat de equilibrio del personaje
  LIMIT_MIN: 0.25,               // Límite con equilibrio 0  (muy cerca del centro = muy difícil)
  LIMIT_MAX: 0.9,                // Límite con equilibrio 10 (más separado = más fácil)

  BAR: {
    WIDTH: 550,
    HEIGHT: 20,
  },
  BUTTON_SIZE: 80,               // Tamaño de los botones táctiles izq/der
}

// Configuración del sistema de grasa del palo
// La grasa amplifica el drift en la fase de equilibrio
//   100% grasa → drift * (1 + DRIFT_MULTIPLIER) → máxima dificultad
//     0% grasa → drift * 1                       → comportamiento base
export const OIL = {
  NUM_ZONES: 30,          // Zonas en que se divide el palo
  WEAR_RATE: 12,          // % de grasa desgastado por segundo en la zona activa
  DRIFT_MULTIPLIER: 0.5,  // Multiplicador máximo del drift al 100% de grasa (drift × 1.5 como máximo)
  OVERLAY_ALPHA: 0.55,    // Opacidad máxima del overlay oscuro sobre el palo
}

// ─── DEBUG ────────────────────────────────────────────────────────────────────
// Cambiar a true para mostrar el panel de debug correspondiente en pantalla.
export const DEBUG = {
  BALANCE_PANEL: false,    // Panel de parámetros de equilibrio en tiempo real
}

// Configuración del movimiento del personaje
export const MOVEMENT = {
  MIN_RUN_DURATION: 0.8,    // Duración mínima del recorrido (seg)
  MAX_RUN_DURATION: 8, //4.0,    // Duración máxima del recorrido (seg)
  FALL_DURATION: 350,       // Duración de la caída al agua (ms)
  RESULT_DISPLAY_MS: 1500,  // Tiempo mostrando resultado antes de que el personaje corra
}