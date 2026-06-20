import { weightedRandom } from '../../src/game/utils/math'

describe('weightedRandom', () => {
  it('returns null for an empty array', () => {
    expect(weightedRandom([])).toBeNull()
  })

  it('returns null for null/undefined input', () => {
    expect(weightedRandom(null)).toBeNull()
    expect(weightedRandom(undefined)).toBeNull()
  })

  it('returns the only item when there is one', () => {
    const items = [{ id: 'a', probabilidad: 1 }]
    expect(weightedRandom(items)).toBe(items[0])
  })

  it('respects the configured weightKey instead of defaulting to "probabilidad"', () => {
    const items = [{ id: 'only', peso: 5 }]
    expect(weightedRandom(items, 'peso')).toBe(items[0])
  })

  it('always picks the item with weight 1 when others have weight 0', () => {
    const items = [
      { id: 'never', probabilidad: 0 },
      { id: 'always', probabilidad: 1 },
      { id: 'never2', probabilidad: 0 },
    ]
    for (let i = 0; i < 50; i++) {
      expect(weightedRandom(items).id).toBe('always')
    }
  })

  it('falls back to uniform random selection when all weights are 0', () => {
    const items = [
      { id: 'a', probabilidad: 0 },
      { id: 'b', probabilidad: 0 },
    ]
    // Forzamos Math.random a un valor que apunte al primer índice
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(weightedRandom(items).id).toBe('a')
  })

  it('approximately respects weight distribution over many iterations', () => {
    const items = [
      { id: 'a', probabilidad: 0.7 },
      { id: 'b', probabilidad: 0.3 },
    ]
    const counts = { a: 0, b: 0 }
    for (let i = 0; i < 10000; i++) counts[weightedRandom(items).id]++
    // Tolerancia generosa: con 10k muestras la desviación típica es muy baja
    expect(counts.a / 10000).toBeGreaterThan(0.65)
    expect(counts.a / 10000).toBeLessThan(0.75)
  })
})
