import { RunSystem } from '../../src/game/systems/RunSystem'
import { MOVEMENT } from '../../src/game/config/gameConfig'

const POLE_LENGTH = 100

// Avanza el sistema en pasos pequeños hasta agotar la carrera
const runToEnd = (sys, step = 0.05) => {
  for (let t = 0; t < MOVEMENT.MAX_RUN_DURATION + 1 && !sys.finished; t += step) {
    sys.update(step)
  }
}

describe('RunSystem', () => {
  describe('start()', () => {
    it('con impulso pleno la duración es la máxima configurada', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(1)
      expect(sys.duration).toBeCloseTo(MOVEMENT.MAX_RUN_DURATION)
      expect(sys.stalled).toBe(false)
    })

    it('la velocidad inicial cubre la distancia máxima con deceleración lineal (v0 = 2d/T)', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.5)
      expect(sys.initialSpeed).toBeCloseTo((2 * 0.5 * POLE_LENGTH) / sys.duration)
    })

    it('un impulso por debajo del mínimo efectivo deja la carrera en stalled', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.005)
      expect(sys.stalled).toBe(true)
      expect(sys.finished).toBe(true)
      expect(sys.distance).toBe(0)
    })
  })

  describe('update()', () => {
    it('la distancia crece de forma monótona y decelerando', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.8)
      const d1 = sys.update(0.5)
      const d2 = sys.update(0.5) - d1
      const d3 = sys.update(0.5) - d1 - d2
      expect(d1).toBeGreaterThan(0)
      expect(d2).toBeGreaterThan(0)
      expect(d3).toBeGreaterThan(0)
      expect(d2).toBeLessThan(d1) // decelera
      expect(d3).toBeLessThan(d2)
    })

    it('al agotar la duración clava la distancia en impulso × longitud', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.6)
      runToEnd(sys)
      expect(sys.finished).toBe(true)
      expect(sys.distance).toBeCloseTo(0.6 * POLE_LENGTH, 5)
    })

    it('nunca supera la longitud del palo', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(1)
      runToEnd(sys)
      expect(sys.distance).toBeLessThanOrEqual(POLE_LENGTH)
    })

    it('una vez terminada, update() no avanza más', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.4)
      runToEnd(sys)
      const frozen = sys.distance
      sys.update(1)
      expect(sys.distance).toBe(frozen)
    })
  })

  describe('currentSpeed', () => {
    it('decrece linealmente y llega a 0 al terminar', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(0.7)
      const v0 = sys.currentSpeed
      sys.update(sys.duration / 2)
      const vMid = sys.currentSpeed
      expect(v0).toBeCloseTo(sys.initialSpeed)
      expect(vMid).toBeCloseTo(sys.initialSpeed / 2, 5)
      runToEnd(sys)
      expect(sys.currentSpeed).toBe(0)
    })
  })

  describe('forceToEnd()', () => {
    it('clava la distancia al final del palo y termina la carrera', () => {
      const sys = new RunSystem(POLE_LENGTH)
      sys.start(1)
      sys.update(0.5)
      sys.forceToEnd()
      expect(sys.distance).toBe(POLE_LENGTH)
      expect(sys.finished).toBe(true)
      expect(sys.progressRatio).toBe(1)
    })
  })
})
