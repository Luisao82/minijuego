import { JumpSystem } from '../../src/game/systems/JumpSystem'
import { JUMP } from '../../src/game/config/gameConfig'

// Parámetros sanos de inicialización para los tests.
const baseParams = {
  playerX: 500,
  playerY: 300,
  runElapsed: 0,
  runDuration: 4,
  initialSpeed: 100,
  waterY: 600,
}

describe('JumpSystem', () => {
  describe('estado inicial', () => {
    it('arranca con elapsed = 0 y todo a 0', () => {
      const sys = new JumpSystem()
      const pos = sys.update(0)
      expect(pos.x).toBe(0) // _startX === 0 antes de start()
      expect(pos.y).toBe(0)
    })
  })

  describe('después de start()', () => {
    it('en t=0 devuelve la posición inicial del jugador', () => {
      const sys = new JumpSystem()
      sys.start(baseParams)
      const pos = sys.update(0)
      expect(pos.x).toBe(500)
      expect(pos.y).toBe(300)
    })

    it('el jugador avanza hacia la izquierda (cucaña va en sentido decreciente de X)', () => {
      const sys = new JumpSystem()
      sys.start(baseParams)
      sys.update(0.1)
      const pos = sys.update(0.1)
      expect(pos.x).toBeLessThan(500)
    })

    it('el jugador primero sube (vy0 negativa) y luego baja por gravedad', () => {
      const sys = new JumpSystem()
      sys.start(baseParams)
      // Primer frame muy corto: aún no ha llegado al peak
      const peak = sys.update(0.05)
      expect(peak.y).toBeLessThan(300) // ha subido (Y crece hacia abajo)
      // Luego mucho tiempo después: ya está bajando
      const later = sys.update(2)
      expect(later.y).toBeGreaterThan(peak.y)
    })
  })

  describe('integración con la corrida previa', () => {
    it('una velocidad de carrera más alta produce un x final más alejado', () => {
      const slow = new JumpSystem()
      const fast = new JumpSystem()
      slow.start({ ...baseParams, initialSpeed: 50 })
      fast.start({ ...baseParams, initialSpeed: 200 })
      const slowPos = slow.update(0.3)
      const fastPos = fast.update(0.3)
      // fast.x debe haber retrocedido (negative X) más que slow.x
      expect(fastPos.x).toBeLessThan(slowPos.x)
    })

    it('si runDuration = 0 trata la carrera como ya consumida (currentRunSpeed = 0)', () => {
      const sys = new JumpSystem()
      expect(() => sys.start({ ...baseParams, runDuration: 0 })).not.toThrow()
      // Sin error en runtime, simplemente vx solo dependerá del jumpDistance/flightTime
      const pos = sys.update(0.1)
      expect(pos.x).toBeLessThan(500) // sigue avanzando aunque la corrida no aporte
    })
  })

  describe('jumpDistance personalizable', () => {
    it('un jumpDistance mayor produce más alcance en x', () => {
      const a = new JumpSystem()
      const b = new JumpSystem()
      a.start({ ...baseParams, jumpDistance: JUMP.EXTRA_DISTANCE })
      b.start({ ...baseParams, jumpDistance: JUMP.EXTRA_DISTANCE * 4 })
      const aPos = a.update(0.3)
      const bPos = b.update(0.3)
      expect(bPos.x).toBeLessThan(aPos.x)
    })
  })
})
