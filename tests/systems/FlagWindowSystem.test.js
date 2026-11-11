import { FlagWindowSystem } from '../../src/game/systems/FlagWindowSystem'

describe('FlagWindowSystem', () => {
  it('el agarre dentro de la ventana cuenta', () => {
    const w = new FlagWindowSystem({ windowMs: 1500, graceMs: 100 })
    w.update(1000)
    expect(w.isOpen).toBe(true)
    expect(w.grab()).toBe(true)
    expect(w.state).toBe('grabbed')
  })

  it('avisa una sola vez cuando se acaba el tiempo', () => {
    const w = new FlagWindowSystem({ windowMs: 1500, graceMs: 100 })
    expect(w.update(1499)).toBe(false)
    expect(w.update(1)).toBe(true)
    expect(w.update(50)).toBe(false)
    expect(w.isOpen).toBe(false)
  })

  it('un agarre que llega en el margen aún cuenta, después ya no', () => {
    const w = new FlagWindowSystem({ windowMs: 1500, graceMs: 100 })
    w.update(1550)
    expect(w.grab()).toBe(true)

    const late = new FlagWindowSystem({ windowMs: 1500, graceMs: 100 })
    late.update(1500)
    late.update(100)
    expect(late.state).toBe('missed')
    expect(late.grab()).toBe(false)
  })

  it('al caer al agua se cierra y un agarre tardío no cuenta', () => {
    const w = new FlagWindowSystem({ windowMs: 1500, graceMs: 100 })
    w.update(500)
    w.close()
    expect(w.grab()).toBe(false)
  })

  it('solo cuenta el primer agarre', () => {
    const w = new FlagWindowSystem({ windowMs: 1500 })
    expect(w.grab()).toBe(true)
    expect(w.grab()).toBe(false)
  })

  it('la barra baja con el tiempo', () => {
    const w = new FlagWindowSystem({ windowMs: 1000 })
    w.update(250)
    expect(w.remainingRatio).toBeCloseTo(0.75)
    w.update(2000)
    expect(w.remainingRatio).toBe(0)
  })
})
