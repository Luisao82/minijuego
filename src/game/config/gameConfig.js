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
  MENU: 'MenuScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
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
  BASE_ACCELERATION: 0.25,      // Aceleración base por segundo
  WEIGHT_FACTOR: 0.06,          // Aceleración extra por punto de peso
  MAX_PASSES: 3,                // Máximo de pasadas antes de que se acabe el tiempo
  PASS_SPEED_INCREASE: 0.1,     // Incremento de velocidad base por pasada completada
  ZONES: {
    RED: { start: 0, end: 0.4 },
    YELLOW: { start: 0.4, end: 0.75 },
    GREEN: { start: 0.75, end: 1.0 },
  },
  BAR: {
    WIDTH: 600,
    HEIGHT: 36,
  },
}

// Configuración del barco (barcaza)
// Proporciones basadas en referencia visual: barco 8m, palo 7m → ratio palo:barco = 7:8
const BOAT_IMAGE_W = 333
const BOAT_IMAGE_H = 182
const BOAT_SCALE = 1.25                                    // Escala grande para coincidir con referencia visual
const BOAT_W = Math.round(BOAT_IMAGE_W * BOAT_SCALE)     // ~416px
const BOAT_H = Math.round(BOAT_IMAGE_H * BOAT_SCALE)     // ~228px
const POLE_LENGTH = Math.round(BOAT_W * 7 / 8)           // ~364px (ratio 7:8)

export const BOAT = {
  DISPLAY_WIDTH: BOAT_W,
  DISPLAY_HEIGHT: BOAT_H,
  RIGHT_X: 985,               // Borde derecho del barco (pegado al borde de pantalla)
  DECK_Y_RATIO: 0.32,         // El palo se ancla al 32% desde arriba del barco (zona superior del casco)
}

// Configuración del palo (cucaña) — prolongación horizontal del barco (7:8)
export const POLE = {
  LENGTH: POLE_LENGTH,
  START_X: BOAT.RIGHT_X - BOAT_W,                          // Borde izquierdo del barco (palo pegado)
  END_X: BOAT.RIGHT_X - BOAT_W - POLE_LENGTH,             // Donde está la bandera
  Y_FACTOR: 0.555,                                         // Ajustado para mantener el barco en su posición con DECK_Y_RATIO 0.32
}

// Configuración del movimiento del personaje
export const MOVEMENT = {
  MIN_RUN_DURATION: 0.8,    // Duración mínima del recorrido (seg)
  MAX_RUN_DURATION: 4.0,    // Duración máxima del recorrido (seg)
  FALL_DURATION: 350,       // Duración de la caída al agua (ms)
  RESULT_DISPLAY_MS: 1500,  // Tiempo mostrando resultado antes de que el personaje corra
}
