import { createCharacterRewardService } from '../../src/game/services/CharacterRewardService'

describe('CharacterRewardService', () => {
  let service

  beforeEach(() => {
    localStorage.clear()
    service = createCharacterRewardService()
  })

  describe('estado inicial', () => {
    it('getCount devuelve 0 para personajes que nunca jugaron', () => {
      expect(service.getCount('trianero')).toBe(0)
    })

    it('getAll devuelve un objeto vacío', () => {
      expect(service.getAll()).toEqual({})
    })
  })

  describe('addReward', () => {
    it('incrementa el contador del personaje en 1', () => {
      service.addReward('trianero')
      expect(service.getCount('trianero')).toBe(1)
    })

    it('acumula correctamente varias llamadas seguidas', () => {
      for (let i = 0; i < 7; i++) service.addReward('trianero')
      expect(service.getCount('trianero')).toBe(7)
    })

    it('mantiene contadores independientes por personaje', () => {
      service.addReward('trianero')
      service.addReward('trianero')
      service.addReward('flamenca')
      expect(service.getCount('trianero')).toBe(2)
      expect(service.getCount('flamenca')).toBe(1)
    })
  })

  describe('meetsCondition', () => {
    it('devuelve false si no hay condición', () => {
      expect(service.meetsCondition('trianero', null)).toBe(false)
    })

    it('devuelve false si el tipo de condición no es reconocido', () => {
      expect(service.meetsCondition('trianero', { tipo: 'otro_tipo', cantidad: 1 })).toBe(false)
    })

    it('premios_personaje: false si el contador es menor al requerido', () => {
      service.addReward('trianero')
      expect(service.meetsCondition('trianero', { tipo: 'premios_personaje', cantidad: 5 })).toBe(
        false
      )
    })

    it('premios_personaje: true al alcanzar exactamente el umbral', () => {
      for (let i = 0; i < 5; i++) service.addReward('trianero')
      expect(service.meetsCondition('trianero', { tipo: 'premios_personaje', cantidad: 5 })).toBe(
        true
      )
    })

    it('premios_personaje: true al superar el umbral', () => {
      for (let i = 0; i < 10; i++) service.addReward('trianero')
      expect(service.meetsCondition('trianero', { tipo: 'premios_personaje', cantidad: 5 })).toBe(
        true
      )
    })
  })

  describe('clear', () => {
    it('resetea todos los contadores', () => {
      service.addReward('trianero')
      service.addReward('flamenca')
      service.clear()
      expect(service.getCount('trianero')).toBe(0)
      expect(service.getCount('flamenca')).toBe(0)
      expect(service.getAll()).toEqual({})
    })
  })
})
