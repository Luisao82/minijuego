// Configuración de los modos de control del equilibrio.
//
// BUTTONS     → botones ◀ ▶ (el modo de siempre, digital: -1 / 0 / +1)
// DEVICE_TILT → girar el móvil como un volante (giroscopio del dispositivo)
// BOARD       → tabla de equilibrio física (ESP32 + MPU6050 por Bluetooth)
//
// Los modos analógicos convierten grados de inclinación en inputDirection
// (-1..1) con ANALOG y añaden la inestabilidad de INSTABILITY. Los valores se
// calibran con el panel LAB (solo en builds de laboratorio) y se fijan aquí.

export const CONTROL_MODES = {
  BUTTONS: 'buttons',
  DEVICE_TILT: 'device-tilt',
  BOARD: 'board',
}

export const ANALOG = {
  DEAD_ZONE_DEG: 1, // Por debajo de esta inclinación no hay fuerza (temblor de la mano/cuerpo)
  MAX_TILT_DEG: 13, // Inclinación que equivale a mantener pulsado el botón (fuerza completa)
  CURVE: 1.5, // Curva de respuesta: 1 = lineal, >1 = más precisión en correcciones finas
  INVERT: false, // Invierte el sentido si la tabla o el móvil van al revés
}

// Fuerzas extra para que la barra nunca esté quieta en los modos analógicos.
// Ambas se amplifican con la grasa igual que el drift. 0 = física del juego tal cual.
export const INSTABILITY = {
  SWAY: 0, // Vaivén del palo: perturbación suave y continua (u/s²)
  GRAVITY: 0, // Péndulo invertido: cuanto más lejos del centro, más tira hacia fuera (u/s² por unidad)
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
