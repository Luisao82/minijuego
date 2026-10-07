// Servicio de ajustes de control: modo elegido y calibración del laboratorio.
//
// Fuera del laboratorio (labEnabled = false) el modo es siempre BUTTONS y la
// calibración la de config/controlConfig.js: el juego publicado no cambia.
// En el laboratorio, el modo y los ajustes se guardan en localStorage para
// poder calibrar entre partida y partida.
//
// Uso:
//   import { controlSettingsService } from '../services/ControlSettingsService'
//   controlSettingsService.getMode()
//   controlSettingsService.getTuning() → { deadZoneDeg, maxTiltDeg, curve, invert, sway, gravity }

import { ANALOG, INSTABILITY, CONTROL_MODES, LAB_ENABLED } from '../config/controlConfig'

const MODE_KEY = 'cucana_control_mode'
const TUNING_KEY = 'cucana_lab_tuning'

export const DEFAULT_TUNING = Object.freeze({
  deadZoneDeg: ANALOG.DEAD_ZONE_DEG,
  maxTiltDeg: ANALOG.MAX_TILT_DEG,
  curve: ANALOG.CURVE,
  invert: ANALOG.INVERT,
  sway: INSTABILITY.SWAY,
  gravity: INSTABILITY.GRAVITY,
})

const _read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const _write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Ignorar errores de cuota o privacidad
  }
}

export function createControlSettingsService({ labEnabled }) {
  let tuningCache = null

  const loadTuning = () => {
    try {
      const stored = JSON.parse(_read(TUNING_KEY) || '{}')
      return { ...DEFAULT_TUNING, ...stored }
    } catch {
      return { ...DEFAULT_TUNING }
    }
  }

  return {
    isLabEnabled() {
      return labEnabled
    },

    getMode() {
      if (!labEnabled) return CONTROL_MODES.BUTTONS
      const stored = _read(MODE_KEY)
      return Object.values(CONTROL_MODES).includes(stored) ? stored : CONTROL_MODES.BUTTONS
    },

    setMode(mode) {
      if (!labEnabled || !Object.values(CONTROL_MODES).includes(mode)) return
      _write(MODE_KEY, mode)
    },

    // Se consulta cada frame: se cachea en memoria
    getTuning() {
      if (!labEnabled) return DEFAULT_TUNING
      if (!tuningCache) tuningCache = loadTuning()
      return tuningCache
    },

    setTuning(partial) {
      if (!labEnabled) return
      tuningCache = { ...this.getTuning(), ...partial }
      _write(TUNING_KEY, JSON.stringify(tuningCache))
    },

    resetTuning() {
      if (!labEnabled) return
      tuningCache = null
      _write(TUNING_KEY, null)
    },

    // Bloque listo para pegar en config/controlConfig.js
    exportTuning() {
      const t = this.getTuning()
      return [
        'export const ANALOG = {',
        `  DEAD_ZONE_DEG: ${t.deadZoneDeg},`,
        `  MAX_TILT_DEG: ${t.maxTiltDeg},`,
        `  CURVE: ${t.curve},`,
        `  INVERT: ${t.invert},`,
        '}',
        '',
        'export const INSTABILITY = {',
        `  SWAY: ${t.sway},`,
        `  GRAVITY: ${t.gravity},`,
        '}',
      ].join('\n')
    },
  }
}

export const controlSettingsService = createControlSettingsService({ labEnabled: LAB_ENABLED })
