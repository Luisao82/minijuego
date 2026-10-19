import { VelocityBalanceSystem } from '../../src/game/systems/VelocityBalanceSystem'
import { BalanceBar } from '../../src/game/entities/BalanceBar'
import { TUNING_DEFAULTS, CONTROL_MODES } from '../../src/game/config/controlConfig'

const DT = 1 / 60
const TUNING = TUNING_DEFAULTS[CONTROL_MODES.BOARD]

const run = (bar, sys, inputFn, frames = 600) => {
  let f = 0
  while (!bar.failed && f < frames) {
    sys.update(DT, inputFn(bar), 0)
    f++
  }
  return f
}

describe('VelocityBalanceSystem', () => {
  it('quedarse recto (input 0) no mantiene el equilibrio: el drift acaba tirando', () => {
    const bar = new BalanceBar(5)
    const sys = new VelocityBalanceSystem(bar, TUNING, () => 0.3)
    run(bar, sys, () => 0, 60 * 30)
    expect(bar.failed).toBe(true)
  })

  it('corregir hacia el centro mantiene el equilibrio durante una partida entera', () => {
    const bar = new BalanceBar(5)
    const sys = new VelocityBalanceSystem(bar, TUNING, () => 0.3)
    // Jugador sencillo: se inclina hacia el centro en proporción a lo lejos que está
    const frames = run(bar, sys, (b) => Math.max(-1, Math.min(1, -b.position * 4)), 60 * 10)
    expect(bar.failed).toBe(false)
    expect(frames).toBe(60 * 10)
  })

  it('sin inercia: al enderezarse, el jugador deja de mover el cursor al instante', () => {
    const bar = new BalanceBar(5)
    const sys = new VelocityBalanceSystem(bar, { ...TUNING, driftSpeed: 0, gravity: 0 })
    sys.update(DT, 1, 0)
    expect(bar.position).toBeGreaterThan(0)
    const before = bar.position
    sys.update(DT, 0, 0)
    expect(bar.position).toBe(before)
  })

  it('a fuerza completa el cursor va a la velocidad configurada', () => {
    const bar = new BalanceBar(5)
    const sys = new VelocityBalanceSystem(bar, { ...TUNING, driftSpeed: 0, gravity: 0, speed: 1 })
    sys.update(0.1, 1, 0)
    expect(bar.position).toBeCloseTo(0.1)
  })

  it('la grasa hace el drift más fuerte', () => {
    const amplitude = (grease) => {
      const sys = new VelocityBalanceSystem(new BalanceBar(5), TUNING, () => 0)
      sys.update(DT, 0, grease)
      return sys.maxDrift
    }
    expect(amplitude(1)).toBeGreaterThan(amplitude(0))
  })
})
