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
