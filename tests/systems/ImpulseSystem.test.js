import { ImpulseSystem } from '../../src/game/systems/ImpulseSystem'
import { PowerBar } from '../../src/game/entities/PowerBar'

// PowerBar es lógica pura y ya importa PHASE1 de config. Usarlo directo
// es más fiel que un mock — testeamos el sistema con su entidad real,
// que es como se usa en GameScene.

describe('ImpulseSystem', () => {
  describe('movimiento', () => {
    it('arranca con position 0 y velocidad BASE_SPEED', () => {
      const bar = new PowerBar(5)
      expect(bar.position).toBe(0)
      expect(bar.velocity).toBeGreaterThan(0)
    })

    it('update avanza la posición con dt', () => {
      const bar = new PowerBar(5)
      const sys = new ImpulseSystem(bar)
      sys.update(0.1)
      expect(bar.position).toBeGreaterThan(0)
    })

    it('update acelera la velocidad progresivamente', () => {
      const bar = new PowerBar(5)
      const sys = new ImpulseSystem(bar)
      const v0 = bar.velocity
      sys.update(0.5)
      expect(bar.velocity).toBeGreaterThan(v0)
    })

    it('peso del personaje aumenta la aceleración', () => {
      const ligero = new PowerBar(0)
      const pesado = new PowerBar(10)
      expect(pesado.acceleration).toBeGreaterThan(ligero.acceleration)
    })
  })

  describe('reset y pasadas', () => {
    it('al llegar a position >= 1 cuenta una pasada y resetea', () => {
      const bar = new PowerBar(5)
      bar.position = 0.95
      bar.velocity = 10 // suficiente para superar 1 en un dt
      const sys = new ImpulseSystem(bar)
      sys.update(0.1)
      expect(bar.passes).toBe(1)
      expect(bar.position).toBeLessThan(1) // reset
    })

    it('cada nueva pasada arranca con velocidad mayor', () => {
      const bar = new PowerBar(5)
      const v1 = bar.velocity
      bar.passes = 2
      bar.reset()
      expect(bar.velocity).toBeGreaterThan(v1)
    })

    it('al alcanzar maxPasses marca finished=true', () => {
      const bar = new PowerBar(5)
      bar.passes = bar.maxPasses - 1
      bar.position = 0.99
      bar.velocity = 10
      const sys = new ImpulseSystem(bar)
      sys.update(0.1)
      expect(bar.finished).toBe(true)
    })
  })

  describe('stop', () => {
    it('marca la barra como stopped y devuelve el resultado', () => {
      const bar = new PowerBar(5)
      const sys = new ImpulseSystem(bar)
      sys.update(0.5)
      const result = sys.stop()
      expect(bar.stopped).toBe(true)
      expect(result).toMatchObject({
        position: bar.position,
        zone: expect.any(String),
        zoneLabel: expect.any(String),
        impulseValue: bar.position,
        passes: bar.passes,
      })
    })

    it('update no hace nada si la barra está stopped', () => {
      const bar = new PowerBar(5)
      const sys = new ImpulseSystem(bar)
      sys.update(0.1)
      sys.stop()
      const pos = bar.position
      sys.update(1.0)
      expect(bar.position).toBe(pos)
    })

    it('isActive es false cuando está stopped', () => {
      const bar = new PowerBar(5)
      const sys = new ImpulseSystem(bar)
      sys.stop()
      expect(sys.isActive()).toBe(false)
    })

    it('isActive es false cuando está finished', () => {
      const bar = new PowerBar(5)
      bar.finished = true
      const sys = new ImpulseSystem(bar)
      expect(sys.isActive()).toBe(false)
    })
  })

  describe('zonas', () => {
    it('zona roja cuando position < 0.4', () => {
      const bar = new PowerBar(5)
      bar.position = 0.2
      expect(bar.getZone()).toBe('red')
      expect(bar.getZoneLabel()).toBe('MALA')
    })

    it('zona amarilla en el rango medio', () => {
      const bar = new PowerBar(5)
      bar.position = 0.6
      expect(bar.getZone()).toBe('yellow')
      expect(bar.getZoneLabel()).toBe('REGULAR')
    })

    it('zona verde cuando position >= 0.75', () => {
      const bar = new PowerBar(5)
      bar.position = 0.9
      expect(bar.getZone()).toBe('green')
      expect(bar.getZoneLabel()).toBe('ÓPTIMA')
    })
  })
})
