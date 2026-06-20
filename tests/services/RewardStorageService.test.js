import { createRewardStorage } from '../../src/game/services/RewardStorageService'

// Adaptador en memoria para tests deterministas: implementa el mismo contrato
// (load/save) que el adaptador real de localStorage pero sin tocar el storage.
// Útil para verificar la lógica de la fábrica independientemente de happy-dom.
function createMemoryAdapter(initial = {}) {
  let data = { ...initial }
  return {
    load: () => ({ ...data }),
    save: (next) => {
      data = { ...next }
    },
    _peek: () => data,
  }
}

describe('createRewardStorage (con adaptador en memoria)', () => {
  it('getAll empieza vacío', () => {
    const storage = createRewardStorage(createMemoryAdapter())
    expect(storage.getAll()).toEqual({})
  })

  it('addReward crea la entrada con contador 1 la primera vez', () => {
    const storage = createRewardStorage(createMemoryAdapter())
    storage.addReward('reward_turron')
    expect(storage.getCount('reward_turron')).toBe(1)
  })

  it('addReward incrementa el contador en sucesivas llamadas', () => {
    const storage = createRewardStorage(createMemoryAdapter())
    storage.addReward('x')
    storage.addReward('x')
    storage.addReward('x')
    expect(storage.getCount('x')).toBe(3)
  })

  it('getCount devuelve 0 para premios que nunca se han registrado', () => {
    const storage = createRewardStorage(createMemoryAdapter())
    expect(storage.getCount('nunca_jamas')).toBe(0)
  })

  it('clear deja el storage vacío', () => {
    const storage = createRewardStorage(createMemoryAdapter())
    storage.addReward('a')
    storage.addReward('b')
    storage.clear()
    expect(storage.getAll()).toEqual({})
  })
})

describe('createRewardStorage (con adaptador localStorage real)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste a través de la API real de happy-dom', () => {
    const storage = createRewardStorage()
    storage.addReward('reward_turron')
    expect(localStorage.getItem('cucana_rewards')).toBe(JSON.stringify({ reward_turron: 1 }))
  })

  it('un localStorage corrupto se trata como estado vacío', () => {
    localStorage.setItem('cucana_rewards', '{not valid json')
    const storage = createRewardStorage()
    expect(storage.getAll()).toEqual({})
  })
})
