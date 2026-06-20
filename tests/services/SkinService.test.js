import { createSkinService } from '../../src/game/services/SkinService'

// Fixture mínima de personajes con la forma que el servicio espera.
const trianero = {
  id: 'trianero',
  skins: [{ spritesheet: 'trianero' }, { spritesheet: 'trianero_02' }],
}

const flamenca = {
  id: 'flamenca',
  skins: [{ spritesheet: 'flamenca' }, { spritesheet: 'flamenca_02' }],
}

describe('SkinService', () => {
  let service

  beforeEach(() => {
    localStorage.clear()
    service = createSkinService()
  })

  describe('getActiveSkin', () => {
    it('devuelve el primer skin del personaje cuando no hay nada guardado', () => {
      expect(service.getActiveSkin(trianero)).toBe('trianero')
    })

    it('devuelve el skin activo guardado si existe', () => {
      service.setActiveSkin('trianero', 'trianero_02')
      expect(service.getActiveSkin(trianero)).toBe('trianero_02')
    })
  })

  describe('getUnlockedSkins', () => {
    it('siempre incluye el skin por defecto (primero del array)', () => {
      expect(service.getUnlockedSkins(trianero)).toEqual(['trianero'])
    })

    it('incluye el skin por defecto + los desbloqueados, deduplicados', () => {
      service.unlockSkin('trianero', 'trianero_02')
      expect(service.getUnlockedSkins(trianero)).toEqual(['trianero', 'trianero_02'])
    })

    it('no añade duplicados si se desbloquea el mismo skin dos veces', () => {
      service.unlockSkin('trianero', 'trianero_02')
      service.unlockSkin('trianero', 'trianero_02')
      const unlocked = service.getUnlockedSkins(trianero)
      const count = unlocked.filter((s) => s === 'trianero_02').length
      expect(count).toBe(1)
    })
  })

  describe('isSkinUnlocked', () => {
    it('el skin por defecto siempre está desbloqueado', () => {
      expect(service.isSkinUnlocked(trianero, 'trianero')).toBe(true)
    })

    it('un skin no desbloqueado devuelve false', () => {
      expect(service.isSkinUnlocked(trianero, 'trianero_02')).toBe(false)
    })

    it('un skin recién desbloqueado devuelve true', () => {
      service.unlockSkin('trianero', 'trianero_02')
      expect(service.isSkinUnlocked(trianero, 'trianero_02')).toBe(true)
    })
  })

  describe('aislamiento entre personajes', () => {
    it('desbloquear un skin a un personaje no afecta a otro', () => {
      service.unlockSkin('trianero', 'trianero_02')
      expect(service.isSkinUnlocked(flamenca, 'flamenca_02')).toBe(false)
    })

    it('cambiar el skin activo de uno no afecta al otro', () => {
      service.setActiveSkin('trianero', 'trianero_02')
      expect(service.getActiveSkin(flamenca)).toBe('flamenca')
    })
  })

  describe('clear', () => {
    it('elimina todos los skins desbloqueados', () => {
      service.unlockSkin('trianero', 'trianero_02')
      service.clear()
      expect(service.isSkinUnlocked(trianero, 'trianero_02')).toBe(false)
    })

    it('tras clear, el skin activo vuelve al primero del array', () => {
      service.setActiveSkin('trianero', 'trianero_02')
      service.clear()
      expect(service.getActiveSkin(trianero)).toBe('trianero')
    })
  })
})
