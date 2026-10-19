// Servicio de ajustes de control: modo elegido y calibración del laboratorio.
//
// Fuera del laboratorio (labEnabled = false) el modo es siempre BUTTONS y la
// calibración la de config/controlConfig.js: el juego publicado no cambia.
// En el laboratorio, el modo y la calibración de CADA modo analógico (móvil y
// tabla por separado) se guardan en localStorage para ajustar entre partidas.
//
// Uso:
//   import { controlSettingsService } from '../services/ControlSettingsService'
//   controlSettingsService.getMode()
//   controlSettingsService.getTuning()        → calibración del modo actual
//   controlSettingsService.getTuning(mode)    → calibración de un modo concreto

import { CONTROL_MODES, TUNING_DEFAULTS, LAB_ENABLED } from '../config/controlConfig'

const MODE_KEY = 'cucana_control_mode'
const TUNING_KEY = 'cucana_lab_tuning_v2'

const ANALOG_MODES = Object.keys(TUNING_DEFAULTS)

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

// Con botones no hay calibración analógica: se devuelve la del móvil para
// que los consumidores siempre reciban un objeto válido
const defaultsFor = (mode) => TUNING_DEFAULTS[mode] ?? TUNING_DEFAULTS[CONTROL_MODES.DEVICE_TILT]

export function createControlSettingsService({ labEnabled }) {
  let storedCache = null

  const stored = () => {
    if (!storedCache) {
      try {
        storedCache = JSON.parse(_read(TUNING_KEY) || '{}')
      } catch {
        storedCache = {}
      }
    }
    return storedCache
  }

  const tuningCache = {}

  return {
    isLabEnabled() {
      return labEnabled
    },

    getMode() {
      if (!labEnabled) return CONTROL_MODES.BUTTONS
      const mode = _read(MODE_KEY)
      return Object.values(CONTROL_MODES).includes(mode) ? mode : CONTROL_MODES.BUTTONS
    },

    setMode(mode) {
      if (!labEnabled || !Object.values(CONTROL_MODES).includes(mode)) return
      _write(MODE_KEY, mode)
    },

    // Se consulta cada frame: se cachea en memoria
    getTuning(mode = this.getMode()) {
      if (!labEnabled) return defaultsFor(mode)
      if (!tuningCache[mode]) tuningCache[mode] = { ...defaultsFor(mode), ...stored()[mode] }
      return tuningCache[mode]
    },

    setTuning(partial, mode = this.getMode()) {
      if (!labEnabled || !ANALOG_MODES.includes(mode)) return
      const all = stored()
      all[mode] = { ...all[mode], ...partial }
      tuningCache[mode] = null
      _write(TUNING_KEY, JSON.stringify(all))
    },

    resetTuning(mode = this.getMode()) {
      if (!labEnabled) return
      const all = stored()
      delete all[mode]
      tuningCache[mode] = null
      _write(TUNING_KEY, JSON.stringify(all))
    },

    // Bloque listo para pegar en TUNING_DEFAULTS de config/controlConfig.js
    exportTuning(mode = this.getMode()) {
      const t = this.getTuning(mode)
      const key = Object.keys(CONTROL_MODES).find((k) => CONTROL_MODES[k] === mode) ?? mode
      const lines = Object.entries(t).map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
      return [`  [CONTROL_MODES.${key}]: {`, ...lines, '  },'].join('\n')
    },
  }
}

export const controlSettingsService = createControlSettingsService({ labEnabled: LAB_ENABLED })
