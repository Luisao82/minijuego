import { OilSystem } from '../../src/game/systems/OilSystem'
import { OIL } from '../../src/game/config/gameConfig'

describe('OilSystem', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  describe('estado inicial', () => {
    it('todas las zonas arrancan al 100%', () => {
      const sys = new OilSystem()
      const zones = sys.getZones()
      expect(zones).toHaveLength(OIL.NUM_ZONES)
      expect(zones.every((g) => g === 100)).toBe(true)
    })

    it('getTotalGrease arranca en 100', () => {
      expect(new OilSystem().getTotalGrease()).toBe(100)
    })
  })

  describe('update desgasta la zona activa', () => {
    it('disminuye la grasa de la zona donde está el personaje', () => {
      const sys = new OilSystem()
      sys.update(0.5, 0.5) // medio segundo en el centro del palo
      expect(sys.getZoneGrease(0.5)).toBeLessThan(100)
    })

    it('respeta WEAR_RATE: en 1s baja exactamente WEAR_RATE puntos', () => {
      const sys = new OilSystem()
      sys.update(1, 0)
      expect(sys.getZoneGrease(0)).toBeCloseTo(100 - OIL.WEAR_RATE)
    })

    it('nunca baja por debajo de 0', () => {
      const sys = new OilSystem()
      // 100 segundos en la misma zona — más que suficiente para vaciarla
      sys.update(100, 0)
      expect(sys.getZoneGrease(0)).toBe(0)
    })

    it('no afecta a otras zonas cuando el personaje está fuera de ellas', () => {
      const sys = new OilSystem()
      sys.update(1, 0) // desgasta la zona 0
      expect(sys.getZoneGrease(0.5)).toBe(100) // zona central intacta
    })

    it('ignora progressRatio fuera de [0, 1]', () => {
      const sys = new OilSystem()
      sys.update(1, -0.5)
      sys.update(1, 1.5)
      expect(sys.getTotalGrease()).toBe(100)
    })
  })

  describe('getDriftMultiplier', () => {
    it('al 100% de grasa devuelve OIL.DRIFT_MULTIPLIER', () => {
      const sys = new OilSystem()
      expect(sys.getDriftMultiplier(0)).toBe(OIL.DRIFT_MULTIPLIER)
    })

    it('al 0% de grasa devuelve 0', () => {
      const sys = new OilSystem()
      sys.update(100, 0)
      expect(sys.getDriftMultiplier(0)).toBe(0)
    })

    it('escala linealmente con la grasa', () => {
      const sys = new OilSystem()
      // Reducir a 50%
      sys.update(50 / OIL.WEAR_RATE, 0)
      expect(sys.getDriftMultiplier(0)).toBeCloseTo(OIL.DRIFT_MULTIPLIER * 0.5)
    })
  })

  describe('reset', () => {
    it('todas las zonas vuelven al 100%', () => {
      const sys = new OilSystem()
      sys.update(2, 0.3)
      sys.update(2, 0.7)
      sys.reset()
      expect(sys.getTotalGrease()).toBe(100)
      expect(sys.getZones().every((g) => g === 100)).toBe(true)
    })

    it('borra el estado de sessionStorage', () => {
      const sys = new OilSystem()
      sys.update(1, 0)
      expect(sessionStorage.getItem('cucana_oil')).not.toBeNull()
      sys.reset()
      expect(sessionStorage.getItem('cucana_oil')).toBeNull()
    })
  })

  describe('persistencia entre instancias', () => {
    it('una nueva instancia hereda el estado guardado', () => {
      const a = new OilSystem()
      a.update(2, 0)
      const wearedZone0 = a.getZoneGrease(0)

      const b = new OilSystem() // nueva instancia, lee de sessionStorage
      expect(b.getZoneGrease(0)).toBe(wearedZone0)
    })
  })

  describe('robustez', () => {
    it('sessionStorage corrupto se trata como estado inicial', () => {
      sessionStorage.setItem('cucana_oil', '{not valid json')
      const sys = new OilSystem()
      expect(sys.getTotalGrease()).toBe(100)
    })
  })
})
