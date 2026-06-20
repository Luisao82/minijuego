import { createGameStatsService } from '../../src/game/services/GameStatsService'

function createMemoryAdapter(initial = []) {
  let data = [...initial]
  return {
    load: () => [...data],
    save: (next) => {
      data = [...next]
    },
  }
}

describe('createGameStatsService', () => {
  it('arranca con array vacío', () => {
    const svc = createGameStatsService(createMemoryAdapter())
    expect(svc.getAll()).toEqual([])
  })

  it('addRecord acumula partidas en orden', () => {
    const svc = createGameStatsService(createMemoryAdapter())
    svc.addRecord({ timestamp: 1, characterId: 'trianero', success: true })
    svc.addRecord({ timestamp: 2, characterId: 'flamenca', success: false })
    const all = svc.getAll()
    expect(all).toHaveLength(2)
    expect(all[0].timestamp).toBe(1)
    expect(all[1].characterId).toBe('flamenca')
  })

  it('clear deja el historial vacío', () => {
    const svc = createGameStatsService(createMemoryAdapter())
    svc.addRecord({ timestamp: 1, success: true })
    svc.clear()
    expect(svc.getAll()).toEqual([])
  })

  it('arranca con un estado inicial pasado al adaptador', () => {
    const initial = [{ timestamp: 0, characterId: 'previo' }]
    const svc = createGameStatsService(createMemoryAdapter(initial))
    expect(svc.getAll()).toEqual(initial)
  })

  it('persiste a localStorage cuando se usa el adaptador por defecto', () => {
    localStorage.clear()
    const svc = createGameStatsService()
    svc.addRecord({ timestamp: 42, characterId: 'trianero' })
    expect(JSON.parse(localStorage.getItem('cucana_game_stats'))).toEqual([
      { timestamp: 42, characterId: 'trianero' },
    ])
  })

  it('un localStorage corrupto se trata como historial vacío', () => {
    localStorage.setItem('cucana_game_stats', '{not valid json')
    const svc = createGameStatsService()
    expect(svc.getAll()).toEqual([])
  })
})
