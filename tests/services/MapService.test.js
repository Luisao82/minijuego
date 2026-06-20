// El MapService exporta una instancia singleton sin factory pública, así que
// trabajamos directamente con ella y reseteamos localStorage entre tests.
import { mapService } from '../../src/game/services/MapService'

describe('MapService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('estado inicial', () => {
    it('arranca sin piezas desbloqueadas', () => {
      expect(mapService.getUnlocked()).toEqual([])
    })

    it('isUnlocked devuelve false para cualquier id', () => {
      expect(mapService.isUnlocked('piece-0-0')).toBe(false)
    })

    it('hasUnseenPieces es false cuando no hay nada desbloqueado', () => {
      expect(mapService.hasUnseenPieces()).toBe(false)
    })

    it('getProgress arranca en 0', () => {
      expect(mapService.getProgress()).toBe(0)
    })
  })

  describe('unlockRandom', () => {
    it('desbloquea una pieza y la devuelve', () => {
      const piece = mapService.unlockRandom()
      expect(piece).toMatch(/^piece-\d-\d$/)
      expect(mapService.isUnlocked(piece)).toBe(true)
    })

    it('nunca desbloquea dos veces la misma pieza', () => {
      const pieces = new Set()
      for (let i = 0; i < 15; i++) pieces.add(mapService.unlockRandom())
      expect(pieces.size).toBe(15) // las 15 piezas únicas (3x5)
    })

    it('devuelve null cuando ya no quedan piezas por desbloquear', () => {
      for (let i = 0; i < 15; i++) mapService.unlockRandom()
      expect(mapService.unlockRandom()).toBeNull()
    })

    it('avanza getProgress proporcionalmente al número desbloqueado', () => {
      mapService.unlockRandom()
      expect(mapService.getProgress()).toBeCloseTo(1 / 15)
      mapService.unlockRandom()
      mapService.unlockRandom()
      expect(mapService.getProgress()).toBeCloseTo(3 / 15)
    })
  })

  describe('markSeen / isSeen / hasUnseenPieces', () => {
    it('una pieza recién desbloqueada es "no vista" → hasUnseenPieces=true', () => {
      const piece = mapService.unlockRandom()
      expect(mapService.isSeen(piece)).toBe(false)
      expect(mapService.hasUnseenPieces()).toBe(true)
    })

    it('marcarla como vista la elimina del set de no vistas', () => {
      const piece = mapService.unlockRandom()
      mapService.markSeen(piece)
      expect(mapService.isSeen(piece)).toBe(true)
      expect(mapService.hasUnseenPieces()).toBe(false)
    })

    it('marcar la misma pieza dos veces es idempotente', () => {
      const piece = mapService.unlockRandom()
      mapService.markSeen(piece)
      mapService.markSeen(piece)
      // No hay forma directa de inspeccionar el array seen pero comprobamos
      // que hasUnseenPieces sigue siendo false y no se ha "duplicado" nada
      // que rompa otras consultas.
      expect(mapService.isSeen(piece)).toBe(true)
      expect(mapService.hasUnseenPieces()).toBe(false)
    })

    it('una pieza vista pero con otra nueva sin ver detecta unseen=true', () => {
      const p1 = mapService.unlockRandom()
      mapService.markSeen(p1)
      mapService.unlockRandom()
      expect(mapService.hasUnseenPieces()).toBe(true)
    })
  })

  describe('persistencia', () => {
    it('los cambios sobreviven entre llamadas (a través de localStorage)', () => {
      const piece = mapService.unlockRandom()
      // Simula recargar la página: la próxima lectura debe leer del storage
      expect(mapService.isUnlocked(piece)).toBe(true)
      expect(mapService.getUnlocked()).toContain(piece)
    })

    it('un localStorage corrupto se trata como estado vacío', () => {
      localStorage.setItem('cucana_map', '{not valid json')
      expect(mapService.getUnlocked()).toEqual([])
    })
  })
})
