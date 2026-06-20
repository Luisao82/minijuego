import { createUnlockService } from '../../src/game/services/UnlockService'

// Fake reward storage que implementa el contrato mínimo que UnlockService espera:
//   - getAll()          → { [rewardId]: count }
//   - getCount(rewardId) → number
//
// Usar un fake en memoria es más rápido y más explícito que reutilizar el
// servicio real con localStorage (que tendría su propia migración y singleton).
function makeFakeRewardStorage(initial = {}) {
  let data = { ...initial }
  return {
    getAll: () => ({ ...data }),
    getCount: (id) => data[id] || 0,
    addReward: (id) => {
      data[id] = (data[id] || 0) + 1
    },
  }
}

describe('UnlockService', () => {
  let service

  beforeEach(() => {
    localStorage.clear()
    service = createUnlockService()
  })

  describe('estado inicial', () => {
    it('arranca con los personajes por defecto desbloqueados (trianero, flamenca)', () => {
      expect(service.getUnlocked()).toEqual(expect.arrayContaining(['trianero', 'flamenca']))
      expect(service.getUnlocked()).toHaveLength(2)
    })

    it('isUnlocked devuelve true para los defaults y false para el resto', () => {
      expect(service.isUnlocked('trianero')).toBe(true)
      expect(service.isUnlocked('flamenca')).toBe(true)
      expect(service.isUnlocked('cualquier_otro')).toBe(false)
    })
  })

  describe('condición specific_reward', () => {
    beforeEach(() => {
      service.setConditions([
        {
          characterId: 'abuela',
          condition: {
            type: 'specific_reward',
            rewardId: 'reward_bizcocho',
            hint: 'Consigue un bizcocho',
          },
        },
      ])
    })

    it('no desbloquea cuando el premio aún no se ha obtenido', () => {
      const storage = makeFakeRewardStorage()
      expect(service.checkNewUnlocks(storage)).toEqual([])
    })

    it('desbloquea cuando el premio específico ha sido obtenido al menos una vez', () => {
      const storage = makeFakeRewardStorage({ reward_bizcocho: 1 })
      expect(service.checkNewUnlocks(storage)).toEqual(['abuela'])
    })

    it('no devuelve el desbloqueo si el personaje ya está desbloqueado previamente', () => {
      const storage = makeFakeRewardStorage({ reward_bizcocho: 1 })
      service.saveUnlocks(['abuela'])
      expect(service.checkNewUnlocks(storage)).toEqual([])
    })
  })

  describe('condición total_rewards', () => {
    beforeEach(() => {
      service.setConditions([
        {
          characterId: 'pescador',
          condition: { type: 'total_rewards', count: 5, hint: 'Consigue 5 premios' },
        },
      ])
    })

    it('no desbloquea con menos premios del umbral', () => {
      const storage = makeFakeRewardStorage({ a: 1, b: 2 }) // total = 3 < 5
      expect(service.checkNewUnlocks(storage)).toEqual([])
    })

    it('desbloquea exactamente al alcanzar el umbral', () => {
      const storage = makeFakeRewardStorage({ a: 3, b: 2 }) // total = 5
      expect(service.checkNewUnlocks(storage)).toEqual(['pescador'])
    })

    it('desbloquea también al superar el umbral', () => {
      const storage = makeFakeRewardStorage({ a: 100 })
      expect(service.checkNewUnlocks(storage)).toEqual(['pescador'])
    })
  })

  describe('saveUnlocks', () => {
    it('no escribe nada si la lista está vacía', () => {
      const before = localStorage.getItem('cucana_unlocked_characters')
      service.saveUnlocks([])
      expect(localStorage.getItem('cucana_unlocked_characters')).toBe(before)
    })

    it('persiste los nuevos desbloqueos en localStorage', () => {
      service.saveUnlocks(['abuela'])
      expect(service.isUnlocked('abuela')).toBe(true)
      const stored = JSON.parse(localStorage.getItem('cucana_unlocked_characters'))
      expect(stored).toContain('abuela')
    })

    it('deduplica al guardar el mismo personaje dos veces', () => {
      service.saveUnlocks(['abuela'])
      service.saveUnlocks(['abuela', 'pescador'])
      const unlocked = service.getUnlocked()
      const abuelaCount = unlocked.filter((id) => id === 'abuela').length
      expect(abuelaCount).toBe(1)
      expect(unlocked).toContain('pescador')
    })
  })

  describe('getHint', () => {
    beforeEach(() => {
      service.setConditions([
        {
          characterId: 'abuela',
          condition: { type: 'specific_reward', rewardId: 'x', hint: 'Pista X' },
        },
        { characterId: 'no_hint', condition: { type: 'specific_reward', rewardId: 'y' } },
      ])
    })

    it('devuelve el hint configurado', () => {
      expect(service.getHint('abuela')).toBe('Pista X')
    })

    it('devuelve null si la condición no tiene hint', () => {
      expect(service.getHint('no_hint')).toBeNull()
    })

    it('devuelve null para personajes sin condición declarada', () => {
      expect(service.getHint('desconocido')).toBeNull()
    })
  })

  describe('getProgressHint', () => {
    beforeEach(() => {
      service.setConditions([
        {
          characterId: 'chaval',
          condition: { type: 'total_rewards', count: 10, hint: 'Consigue 10 premios' },
        },
        {
          characterId: 'abuela',
          condition: {
            type: 'specific_reward',
            rewardId: 'reward_vajilla',
            hint: 'Consigue la Vajilla de La Cartuja',
          },
        },
      ])
    })

    it('devuelve null para personajes sin condición registrada', () => {
      expect(service.getProgressHint('desconocido', makeFakeRewardStorage())).toBeNull()
    })

    it('devuelve hint estático para condiciones specific_reward', () => {
      const storage = makeFakeRewardStorage()
      expect(service.getProgressHint('abuela', storage)).toBe('Consigue la Vajilla de La Cartuja')
    })

    it('devuelve "Te faltan N premios" calculado para total_rewards', () => {
      const storage = makeFakeRewardStorage({ a: 4 }) // total = 4, faltan 6
      expect(service.getProgressHint('chaval', storage)).toBe('Te faltan 6 premios')
    })

    it('usa singular cuando falta exactamente 1 premio', () => {
      const storage = makeFakeRewardStorage({ a: 9 })
      expect(service.getProgressHint('chaval', storage)).toBe('Te faltan 1 premio')
    })

    it('clamp a 0 cuando el jugador ya tiene más que el umbral', () => {
      const storage = makeFakeRewardStorage({ a: 50 })
      expect(service.getProgressHint('chaval', storage)).toBe('Te faltan 0 premios')
    })
  })

  describe('clear', () => {
    it('borra los desbloqueos persistidos manteniendo los defaults', () => {
      service.saveUnlocks(['abuela', 'pescador'])
      service.clear()
      const unlocked = service.getUnlocked()
      expect(unlocked).toEqual(expect.arrayContaining(['trianero', 'flamenca']))
      expect(unlocked).not.toContain('abuela')
    })
  })

  describe('robustez ante localStorage corrupto', () => {
    it('devuelve los defaults si el contenido guardado no es un array', () => {
      localStorage.setItem('cucana_unlocked_characters', '"corrupto"')
      expect(service.getUnlocked()).toEqual(expect.arrayContaining(['trianero', 'flamenca']))
    })

    it('devuelve los defaults si el JSON está roto', () => {
      localStorage.setItem('cucana_unlocked_characters', '{not valid json')
      expect(service.getUnlocked()).toEqual(expect.arrayContaining(['trianero', 'flamenca']))
    })
  })
})
