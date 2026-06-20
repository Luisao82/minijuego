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
    it('con greaseRatio alto el cursor se desvía más rápido (sin input)', () => {
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
        sysA.update(DT, 0, 0) // palo limpio (ratio 0)
        sysB.update(DT, 0, 0.5) // palo a media grasa (ratio 0.5)
      }
      expect(Math.abs(b.position)).toBeGreaterThan(Math.abs(a.position))
    })

    it('con greaseRatio alto cada cruce del centro castiga más el drift', () => {
      // Para aislar el efecto del growthFactor, forzamos a mano una inversión
      // de signo de velocity (que es lo que dispara el crecimiento del drift)
      // y comparamos cuánto creció la fuerza en cada sistema.
      // Equilibrio = 3 para que maxDrift > DRIFT_MIN (con 10 el techo coincide
      // con el suelo y driftForce nunca podría subir).
      const seco = new BalanceBar(3)
      const grasa = new BalanceBar(3)
      const sSeco = new BalanceSystem(seco)
      const sGrasa = new BalanceSystem(grasa)
      sSeco.driftDirection = 1
      sGrasa.driftDirection = 1

      // Forzamos velocity opuesta a driftDirection → primer update dispara
      // el cruce y crece driftForce con el growthFactor aplicado.
      seco.velocity = -0.5
      grasa.velocity = -0.5
      sSeco.update(DT, 0, 0) // palo limpio
      sGrasa.update(DT, 0, 1) // palo a tope de grasa

      expect(sGrasa.driftForce).toBeGreaterThan(sSeco.driftForce)
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
