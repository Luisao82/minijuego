import { createControlSettingsService } from '../../src/game/services/ControlSettingsService'
import { CONTROL_MODES, TUNING_DEFAULTS } from '../../src/game/config/controlConfig'

const { DEVICE_TILT, BOARD, BUTTONS } = CONTROL_MODES

describe('ControlSettingsService', () => {
  beforeEach(() => localStorage.clear())

  describe('fuera del laboratorio (juego publicado)', () => {
    const service = createControlSettingsService({ labEnabled: false })

    it('el modo es siempre botones aunque haya algo guardado', () => {
      localStorage.setItem('cucana_control_mode', DEVICE_TILT)
      expect(service.getMode()).toBe(BUTTONS)
    })

    it('ignora la calibración guardada y no escribe nada', () => {
      localStorage.setItem('cucana_lab_tuning_v2', JSON.stringify({ [BOARD]: { gravity: 9 } }))
      service.setTuning({ sway: 5 }, BOARD)
      service.setMode(BOARD)
      expect(service.getTuning(BOARD)).toEqual(TUNING_DEFAULTS[BOARD])
      expect(localStorage.getItem('cucana_control_mode')).toBeNull()
    })
  })

  describe('en el laboratorio', () => {
    it('guarda y recupera el modo', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setMode(BOARD)
      expect(createControlSettingsService({ labEnabled: true }).getMode()).toBe(BOARD)
    })

    it('ignora modos desconocidos', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setMode('joystick')
      expect(service.getMode()).toBe(BUTTONS)
    })

    it('cada modo analógico parte de sus propios valores por defecto', () => {
      const service = createControlSettingsService({ labEnabled: true })
      expect(service.getTuning(BOARD)).toEqual(TUNING_DEFAULTS[BOARD])
      expect(service.getTuning(DEVICE_TILT)).toEqual(TUNING_DEFAULTS[DEVICE_TILT])
    })

    it('la calibración de la tabla y la del móvil son independientes', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ gravity: 2.5 }, BOARD)
      const reloaded = createControlSettingsService({ labEnabled: true })
      expect(reloaded.getTuning(BOARD).gravity).toBe(2.5)
      expect(reloaded.getTuning(DEVICE_TILT)).toEqual(TUNING_DEFAULTS[DEVICE_TILT])
    })

    it('sin modo indicado usa el modo actual', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setMode(BOARD)
      service.setTuning({ speed: 1.7 })
      expect(service.getTuning().speed).toBe(1.7)
      expect(service.getTuning(BOARD).speed).toBe(1.7)
    })

    it('resetTuning solo restablece el modo indicado', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ sway: 3 }, DEVICE_TILT)
      service.setTuning({ sway: 2 }, BOARD)
      service.resetTuning(BOARD)
      expect(service.getTuning(BOARD)).toEqual(TUNING_DEFAULTS[BOARD])
      expect(service.getTuning(DEVICE_TILT).sway).toBe(3)
    })

    it('exporta un bloque listo para TUNING_DEFAULTS', () => {
      const service = createControlSettingsService({ labEnabled: true })
      service.setTuning({ driftSpeed: 0.25, model: 'velocity' }, BOARD)
      const text = service.exportTuning(BOARD)
      expect(text).toContain('[CONTROL_MODES.BOARD]: {')
      expect(text).toContain('driftSpeed: 0.25,')
      expect(text).toContain('model: "velocity",')
    })
  })
})
