import { AnalogBalanceSystem, mapTiltToInput } from '../../src/game/systems/AnalogBalanceSystem'
import { BalanceSystem } from '../../src/game/systems/BalanceSystem'
import { BalanceBar } from '../../src/game/entities/BalanceBar'

const DT = 1 / 60
const TUNING = { deadZoneDeg: 1, maxTiltDeg: 13, curve: 1, invert: false, sway: 0, gravity: 0 }

describe('mapTiltToInput', () => {
  it('dentro de la zona muerta no hay fuerza', () => {
    expect(mapTiltToInput(0, TUNING)).toBe(0)
    expect(mapTiltToInput(0.9, TUNING)).toBe(0)
    expect(mapTiltToInput(-1, TUNING)).toBe(0)
  })

  it('la inclinación máxima equivale al botón (±1) y no la supera', () => {
    expect(mapTiltToInput(13, TUNING)).toBe(1)
    expect(mapTiltToInput(-30, TUNING)).toBe(-1)
  })

  it('es proporcional entre la zona muerta y el máximo (curva lineal)', () => {
    expect(mapTiltToInput(7, TUNING)).toBeCloseTo(0.5)
  })

  it('una curva > 1 da menos fuerza a las inclinaciones pequeñas', () => {
    const lineal = mapTiltToInput(4, TUNING)
    const curvada = mapTiltToInput(4, { ...TUNING, curve: 2 })
    expect(curvada).toBeLessThan(lineal)
  })

  it('invert cambia el sentido', () => {
    expect(mapTiltToInput(7, { ...TUNING, invert: true })).toBeCloseTo(-0.5)
  })
})

describe('AnalogBalanceSystem.extraAcceleration', () => {
  it('sin vaivén ni gravedad no añade nada (física del juego intacta)', () => {
    const sys = new AnalogBalanceSystem(TUNING)
    expect(sys.extraAcceleration(DT, 0.5, 1)).toBe(0)
  })

  it('la gravedad empuja hacia fuera, proporcional a la distancia al centro', () => {
    const sys = new AnalogBalanceSystem({ ...TUNING, gravity: 2 })
    expect(sys.extraAcceleration(DT, 0.5)).toBeCloseTo(1)
    expect(sys.extraAcceleration(DT, -0.25)).toBeCloseTo(-0.5)
  })

  it('la grasa amplifica la inestabilidad', () => {
    const sys = new AnalogBalanceSystem({ ...TUNING, gravity: 2 })
    expect(Math.abs(sys.extraAcceleration(DT, 0.5, 1))).toBeGreaterThan(
      Math.abs(sys.extraAcceleration(DT, 0.5, 0))
    )
  })

  it('el vaivén varía con el tiempo y está acotado por su fuerza', () => {
    const sys = new AnalogBalanceSystem({ ...TUNING, sway: 1 }, () => 0)
    const values = Array.from({ length: 300 }, () => sys.extraAcceleration(DT, 0))
    expect(new Set(values.map((v) => v.toFixed(3))).size).toBeGreaterThan(50)
    values.forEach((v) => expect(Math.abs(v)).toBeLessThanOrEqual(1))
  })
})

describe('integración con BalanceSystem', () => {
  it('quedarse recto (inclinación 0) no mantiene el equilibrio: se acaba cayendo', () => {
    const bar = new BalanceBar(5)
    const sys = new BalanceSystem(bar)
    const analog = new AnalogBalanceSystem(TUNING)
    for (let i = 0; i < 600 && !bar.failed; i++) {
      sys.update(DT, analog.inputFromTilt(0), 0, analog.extraAcceleration(DT, bar.position))
    }
    expect(bar.failed).toBe(true)
  })

  it('con la gravedad activa se cae antes que sin ella', () => {
    const framesUntilFall = (gravity) => {
      const bar = new BalanceBar(5)
      bar.position = 0.01
      const sys = new BalanceSystem(bar)
      const analog = new AnalogBalanceSystem({ ...TUNING, gravity })
      let frames = 0
      while (!bar.failed && frames < 600) {
        sys.update(DT, 0, 0, analog.extraAcceleration(DT, bar.position))
        frames++
      }
      return frames
    }
    expect(framesUntilFall(4)).toBeLessThan(framesUntilFall(0))
  })
})
