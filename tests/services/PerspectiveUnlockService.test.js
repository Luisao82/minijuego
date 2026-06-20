import { createPerspectiveUnlockService } from '../../src/game/services/PerspectiveUnlockService'

function makeFakeRewardStorage(initial = {}) {
  const data = { ...initial }
  return {
    getAll: () => ({ ...data }),
    getCount: (id) => data[id] || 0,
  }
}

describe('PerspectiveUnlockService', () => {
  let service

  beforeEach(() => {
    localStorage.clear()
    service = createPerspectiveUnlockService()
  })

  describe('default unlocks', () => {
    it('arranca con "triana" desbloqueada por defecto', () => {
      expect(service.getUnlocked()).toContain('triana')
    })
  })

  describe('perspectivas sin condición', () => {
    beforeEach(() => {
      service.setData([
        { id: 'triana', label: 'Triana', backgroundKey: 'bg-triana', direction: 'rtl' },
      ])
    })

    it('una perspectiva sin condition siempre está desbloqueada', () => {
      expect(service.isUnlocked('triana')).toBe(true)
    })

    it('una perspectiva sin condition no aparece en checkNewUnlocks', () => {
      const storage = makeFakeRewardStorage()
      expect(service.checkNewUnlocks(storage)).toEqual([])
    })
  })

  describe('perspectivas con condición', () => {
    beforeEach(() => {
      service.setData([
        { id: 'triana', label: 'Triana', backgroundKey: 'bg-triana', direction: 'rtl' },
        {
          id: 'sevilla',
          label: 'Sevilla',
          backgroundKey: 'bg-sevilla',
          direction: 'ltr',
          condition: { type: 'total_rewards', count: 3, hint: 'Consigue 3 premios' },
        },
        {
          id: 'guadalquivir',
          label: 'Guadalquivir',
          backgroundKey: 'bg-river',
          direction: 'rtl',
          condition: {
            type: 'specific_reward',
            rewardId: 'reward_barca',
            hint: 'Consigue la barca',
          },
        },
      ])
    })

    it('isUnlocked es false hasta que se cumpla la condición y se persista', () => {
      expect(service.isUnlocked('sevilla')).toBe(false)
    })

    it('checkNewUnlocks devuelve las perspectivas que cumplen condición total_rewards', () => {
      const storage = makeFakeRewardStorage({ a: 2, b: 1 }) // total = 3
      expect(service.checkNewUnlocks(storage)).toContain('sevilla')
    })

    it('checkNewUnlocks devuelve las que cumplen specific_reward', () => {
      const storage = makeFakeRewardStorage({ reward_barca: 1 })
      expect(service.checkNewUnlocks(storage)).toContain('guadalquivir')
    })

    it('no devuelve perspectivas ya desbloqueadas', () => {
      const storage = makeFakeRewardStorage({ reward_barca: 1 })
      service.saveUnlocks(['guadalquivir'])
      expect(service.checkNewUnlocks(storage)).not.toContain('guadalquivir')
    })

    it('isUnlocked devuelve true tras saveUnlocks', () => {
      service.saveUnlocks(['sevilla'])
      expect(service.isUnlocked('sevilla')).toBe(true)
    })
  })

  describe('getById', () => {
    beforeEach(() => {
      service.setData([
        { id: 'triana', direction: 'rtl', label: 'Triana' },
        { id: 'sevilla', direction: 'ltr', label: 'Sevilla' },
      ])
    })

    it('devuelve null si no existe', () => {
      expect(service.getById('inexistente')).toBeNull()
    })

    it('normaliza direction "ltr" a flipX=true', () => {
      expect(service.getById('sevilla').flipX).toBe(true)
    })

    it('normaliza direction "rtl" a flipX=false', () => {
      expect(service.getById('triana').flipX).toBe(false)
    })
  })

  describe('getHint', () => {
    beforeEach(() => {
      service.setData([
        {
          id: 'sevilla',
          condition: { type: 'total_rewards', count: 3, hint: 'Consigue 3 premios' },
        },
        { id: 'sin_hint', condition: { type: 'total_rewards', count: 1 } },
        { id: 'sin_cond' },
      ])
    })

    it('devuelve el hint si está definido', () => {
      expect(service.getHint('sevilla')).toBe('Consigue 3 premios')
    })

    it('devuelve null si no hay hint en la condición', () => {
      expect(service.getHint('sin_hint')).toBeNull()
    })

    it('devuelve null si la perspectiva no tiene condition', () => {
      expect(service.getHint('sin_cond')).toBeNull()
    })
  })
})
