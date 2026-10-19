// Configuración de los modos de control del equilibrio.
//
// BUTTONS     → botones ◀ ▶ (el modo de siempre, digital: -1 / 0 / +1)
// DEVICE_TILT → girar el móvil como un volante (giroscopio del dispositivo)
// BOARD       → tabla de equilibrio física (ESP32 + MPU6050 por Bluetooth)
//
// El modo botones usa la física de siempre (BALANCE en gameConfig.js) y no
// lee nada de este archivo. Cada modo analógico tiene su propia calibración
// (TUNING_DEFAULTS), que se ajusta con el panel LAB y se fija aquí.

export const CONTROL_MODES = {
  BUTTONS: 'buttons',
  DEVICE_TILT: 'device-tilt',
  BOARD: 'board',
}

// Cómo actúa la inclinación sobre el cursor:
//   FORCE    → acelera el cursor, igual que el botón (física de BalanceSystem).
//              Con inercia: muy exigente si se controla con todo el cuerpo.
//   VELOCITY → mueve el cursor a una velocidad proporcional a la inclinación,
//              sin inercia acumulada. Un drift que cambia de sentido con el
//              tiempo obliga a corregir siempre (VelocityBalanceSystem).
export const CONTROL_MODELS = {
  FORCE: 'force',
  VELOCITY: 'velocity',
}

// Campos de la calibración:
//   model                     → CONTROL_MODELS
//   deadZoneDeg, maxTiltDeg   → inclinación sin efecto / inclinación de fuerza completa
//   curve, invert             → curva de respuesta (1 = lineal) / invertir sentido
//   limitScale                → multiplica el margen entre límites rojos (1 = el del personaje)
//   gravity                   → empuje hacia fuera proporcional a la distancia al centro
//   Solo FORCE:    sway (vaivén), driftScale, growthScale (crecimiento por cruce), dampingExtra
//   Solo VELOCITY: speed (u/s a fuerza completa), driftSpeed (u/s), driftChange
//                  (rapidez con que el drift cambia de sentido), driftGrowth (aumento por segundo)
const COMMON_TUNING = {
  sway: 0,
  driftScale: 1,
  growthScale: 1,
  dampingExtra: 0,
  speed: 1.2,
  driftSpeed: 0.35,
  driftChange: 1,
  driftGrowth: 0.03,
}

export const TUNING_DEFAULTS = {
  [CONTROL_MODES.DEVICE_TILT]: {
    ...COMMON_TUNING,
    model: CONTROL_MODELS.FORCE,
    deadZoneDeg: 1,
    maxTiltDeg: 13,
    curve: 1.5,
    invert: false,
    limitScale: 1,
    gravity: 0,
  },
  // Pensada para gente que prueba una o dos veces: poca inclinación, sin
  // inercia, drift suave y algo más de margen
  [CONTROL_MODES.BOARD]: {
    ...COMMON_TUNING,
    model: CONTROL_MODELS.VELOCITY,
    deadZoneDeg: 1,
    maxTiltDeg: 8,
    curve: 1.2,
    invert: false,
    limitScale: 1.2,
    gravity: 0.3,
    driftScale: 0.6,
    growthScale: 0.4,
    dampingExtra: 1,
    speed: 1,
    driftSpeed: 0.3,
    driftChange: 0.8,
    driftGrowth: 0.02,
  },
}

// Lecturas del giroscopio del móvil
export const DEVICE_TILT = {
  SMOOTHING: 0.5, // Suavizado exponencial de la lectura (0 = sin suavizar, 1 = congelada)
  MIN_GRAVITY_IN_PLANE: 2, // m/s² — con el móvil casi plano el ángulo no es fiable: se ignora
}

// La tabla deja de considerarse conectada si no llegan datos en este tiempo
export const BOARD = {
  STALE_MS: 300,
}

// Build de laboratorio: modos analógicos + panel LAB de calibración.
// __LAB__ lo inyecta Vite al compilar (VITE_LAB=true, solo en las vistas previas
// de Vercel y en desarrollo). En producción vale false y el panel no se incluye.
export const LAB_ENABLED = typeof __LAB__ !== 'undefined' && __LAB__
