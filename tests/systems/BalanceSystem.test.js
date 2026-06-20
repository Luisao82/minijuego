import { BalanceSystem } from '../../src/game/systems/BalanceSystem'
import { BalanceBar } from '../../src/game/entities/BalanceBar'

// Probamos sistema + entidad reales (lógica pura, sin Phaser).
// dt = 1/60 simula un frame a 60fps.
const DT = 1 / 60

describe('BalanceSystem', () => {
  describe('estado inicial', () => {
    it('arranca en posición 0 (centro) con velocidad 0', () => {
      const bar = new BalanceBar(5)
      expect(bar.position).toBe(0)
      expect(bar.velocity).toBe(0)
      expect(bar.failed).toBe(false)
    })

    it('isActive es true al inicio', () => {
      const sys = new BalanceSystem(new BalanceBar(5))
      expect(sys.isActive()).toBe(true)
      expect(sys.isFailed()).toBe(false)
    })

    it('el límite escala con la stat de equilibrio', () => {
      const novato = new BalanceBar(0)
      const maestro = new BalanceBar(10)
      expect(maestro.limit).toBeGreaterThan(novato.limit)
    })
  })

  describe('drift sin input → eventualmente cae', () => {
    it('el cursor se desvía y termina superando el límite', () => {
      const bar = new BalanceBar(5)
      // Forzamos dirección inicial determinista (constructor usa Math.random)
      bar.position = 0.01 // un pelín a la derecha para arrancar el drift hacia derecha
      const sys = new BalanceSystem(bar)
      // 600 frames = 10 segundos simulados, debería haber caído
      for (let i = 0; i < 600 && !bar.failed; i++) sys.update(DT, 0)
      expect(bar.failed).toBe(true)
      expect(sys.isFailed()).toBe(true)
    })
  })

  describe('input contrarresta el drift', () => {
    it('input opuesto al drift evita la caída durante un tiempo razonable', () => {
      const bar = new BalanceBar(5)
      const sys = new BalanceSystem(bar)
      // Drift hacia un lado, input hacia el otro
      let frames = 0
      while (!bar.failed && frames < 60) {
        const dir = bar.position > 0 ? -1 : 1 // contrarrestar
        sys.update(DT, dir, 0)
        frames++
      }
      // Con corrección activa durante 60 frames (1s), no debe haber caído
      expect(bar.failed).toBe(false)
    })
  })

  describe('aceite amplifica la fuerza del drift', () => {
    it('con oilMultiplier alto el cursor se desvía más rápido (sin input)', () => {
      // BalanceSystem arranca con driftDirection ±1 aleatorio. Para comparar
      // sin que la randomización falsee el resultado, las dos instancias se
      // crean con la misma posición inicial y dirección forzada al mismo lado.
      const a = new BalanceBar(5)
      const b = new BalanceBar(5)
      a.position = 0.05
      b.position = 0.05
      const sysA = new BalanceSystem(a)
      const sysB = new BalanceSystem(b)
      sysA.driftDirection = 1
      sysB.driftDirection = 1

      for (let i = 0; i < 30; i++) {
        sysA.update(DT, 0, 0) // sin aceite
        sysB.update(DT, 0, 0.5) // con aceite
      }
      expect(Math.abs(b.position)).toBeGreaterThan(Math.abs(a.position))
    })
  })

  describe('elapsed time tracking', () => {
    it('acumula dt frame a frame', () => {
      const sys = new BalanceSystem(new BalanceBar(5))
      sys.update(DT, 0)
      sys.update(DT, 0)
      sys.update(DT, 0)
      expect(sys.getElapsedTime()).toBeCloseTo(3 * DT)
    })

    it('deja de acumular cuando la barra falla', () => {
      const bar = new BalanceBar(5)
      bar.failed = true
      const sys = new BalanceSystem(bar)
      sys.update(DT, 0)
      sys.update(DT, 0)
      expect(sys.getElapsedTime()).toBe(0)
    })
  })

  describe('límite de velocidad', () => {
    it('la velocidad nunca excede el cap absoluto', () => {
      const bar = new BalanceBar(5)
      const sys = new BalanceSystem(bar)
      // Empujar al máximo durante muchos frames
      for (let i = 0; i < 100 && !bar.failed; i++) sys.update(DT, 1)
      expect(Math.abs(bar.velocity)).toBeLessThanOrEqual(5) // BALANCE.VELOCITY_CAP
    })
  })

  describe('getNormalizedPosition', () => {
    it('mapea -1 → 0, 0 → 0.5, +1 → 1', () => {
      const bar = new BalanceBar(5)
      bar.position = 0
      expect(bar.getNormalizedPosition()).toBe(0.5)
      bar.position = -1
      expect(bar.getNormalizedPosition()).toBe(0)
      bar.position = 1
      expect(bar.getNormalizedPosition()).toBe(1)
    })
  })
})
