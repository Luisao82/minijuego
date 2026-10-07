import {
  createControlSettingsService,
  DEFAULT_TUNING,
} from '../../src/game/services/ControlSettingsService'
import { CONTROL_MODES } from '../../src/game/config/controlConfig'

describe('ControlSettingsService', () => {
  beforeEach(() => localStorage.clear())

  describe('fuera del laboratorio (juego publicado)', () => {
    const service = createControlSettingsService({ labEnabled: false })

    it('el modo es siempre botones aunque haya algo guardado', () => {
      localStorage.setItem('cucana_control_mode', CONTROL_MODES.DEVICE_TILT)
      expect(service.getMode()).toBe(CONTROL_MODES.BUTTONS)
    })

    it('ignora la calibración guardada y no escribe nada', () => {
      localStorage.setItem('cucana_lab_tuning', JSON.stringify({ gravity: 9 }))
      service.setTuning({ sway: 5 })
      service.setMode(CONTROL_MODES.BOARD)
      expect(service.getTuning()).toEqual(DEFAULT_TUNING)
      expect(localStorage.getItem('cucana_control_mode')).toBeNull()
    })
  })

  describe('en el laboratorio', () => {
    it('guarda y recupera el modo', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setMode(CONTROL_MODES.BOARD)
      expect(createControlSettingsService({ labEnabled: true }).getMode()).toBe(CONTROL_MODES.BOARD)
    })

    it('ignora modos desconocidos', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setMode('joystick')
      expect(service.getMode()).toBe(CONTROL_MODES.BUTTONS)
    })

    it('mezcla la calibración guardada con los valores por defecto', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ gravity: 2.5 })
      const reloaded = createControlSettingsService({ labEnabled: true })
      expect(reloaded.getTuning()).toEqual({ ...DEFAULT_TUNING, gravity: 2.5 })
    })

    it('resetTuning vuelve a los valores de config', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ sway: 3 })
      service.resetTuning()
      expect(service.getTuning()).toEqual(DEFAULT_TUNING)
    })

    it('exporta un bloque con los valores actuales para config/', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ sway: 0.8, curve: 2 })
      const text = service.exportTuning()
      expect(text).toContain('SWAY: 0.8,')
      expect(text).toContain('CURVE: 2,')
      expect(text).toContain('export const INSTABILITY = {')
    })
  })
})
