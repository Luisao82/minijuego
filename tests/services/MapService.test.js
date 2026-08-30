// El MapService exporta una instancia singleton sin factory pública, así que
// trabajamos directamente con ella y reseteamos localStorage entre tests.
import { mapService } from '../../src/game/services/MapService'

// Fixture mínimo con dos bloques y POIs alineados con las 4 esquinas del
// mapa reales de mapBounds.js. Se recomputa el índice de POIs en cada test
// mediante setMapData().
const FIXTURE = {
  mapBounds: {
    nw: { lat: 37.41, lon: -6.01 },
    ne: { lat: 37.41, lon: -5.978 },
    sw: { lat: 37.37, lon: -6.01 },
    se: { lat: 37.37, lon: -5.978 },
  },
  blocks: [
    {
      id: 'sevilla-esencial',
      title: 'Sevilla Esencial',
      order: 0,
      contentAlwaysVisible: true,
      unlockDistance: 50,
      pois: [
        { id: 'giralda', title: 'Giralda', lat: 37.3859, lon: -5.993, photo: 'x.webp' },
        { id: 'torre-oro', title: 'Torre del Oro', lat: 37.3826, lon: -5.9963, photo: 'x.webp' },
      ],
    },
    {
      id: 'triana-de-barrio',
      title: 'Triana de barrio',
      order: 1,
      unlockDistance: 200,
      pois: [
        { id: 'bar-curioso', title: 'Bar', lat: 37.3895, lon: -5.99331, photo: 'x.webp' },
      ],
    },
  ],
}

describe('MapService', () => {
  beforeEach(() => {
    localStorage.clear()
    mapService.setMapData(null)
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

  describe('bloques (setMapData / getBlocks / getBlock)', () => {
    beforeEach(() => mapService.setMapData(FIXTURE))

    it('sin datos cargados, getBlocks devuelve []', () => {
      mapService.setMapData(null)
      expect(mapService.getBlocks()).toEqual([])
    })

    it('devuelve los bloques ordenados por order', () => {
      mapService.setMapData({
        ...FIXTURE,
        blocks: [FIXTURE.blocks[1], FIXTURE.blocks[0]],
      })
      const ids = mapService.getBlocks().map((b) => b.id)
      expect(ids).toEqual(['sevilla-esencial', 'triana-de-barrio'])
    })

    it('getBlock busca por id', () => {
      expect(mapService.getBlock('sevilla-esencial').title).toBe('Sevilla Esencial')
      expect(mapService.getBlock('inexistente')).toBeNull()
    })

    it('getFirstBlock y getNextBlock siguen la cadena de order', () => {
      expect(mapService.getFirstBlock().id).toBe('sevilla-esencial')
      expect(mapService.getNextBlock('sevilla-esencial').id).toBe('triana-de-barrio')
      expect(mapService.getNextBlock('triana-de-barrio')).toBeNull()
    })
  })

  describe('POIs derivados por pieza', () => {
    beforeEach(() => mapService.setMapData(FIXTURE))

    it('un POI cae en su pieza esperada según su lat/lon', () => {
      // La Giralda (37.3859, -5.9930) cae dentro del mapa; comprobamos que
      // getPoiPiece devuelve algo dentro del grid 3x5.
      const piece = mapService.getPoiPiece('giralda')
      expect(piece).not.toBeNull()
      expect(piece.row).toBeGreaterThanOrEqual(0)
      expect(piece.row).toBeLessThan(5)
      expect(piece.col).toBeGreaterThanOrEqual(0)
      expect(piece.col).toBeLessThan(3)
    })

    it('getPoisForPiece incluye los POIs cuya pieza coincide', () => {
      const piece = mapService.getPoiPiece('giralda')
      const pois = mapService.getPoisForPiece(piece.row, piece.col)
      const ids = pois.map((p) => p.id)
      expect(ids).toContain('giralda')
    })

    it('los POIs devueltos llevan x, y locales a la pieza y blockId', () => {
      const piece = mapService.getPoiPiece('giralda')
      const pois = mapService.getPoisForPiece(piece.row, piece.col)
      const giralda = pois.find((p) => p.id === 'giralda')
      expect(giralda.x).toBeGreaterThanOrEqual(0)
      expect(giralda.x).toBeLessThan(200)
      expect(giralda.y).toBeGreaterThanOrEqual(0)
      expect(giralda.y).toBeLessThan(200)
      expect(giralda.blockId).toBe('sevilla-esencial')
    })

    it('getPoisForPiece filtra por blockId cuando se pasa', () => {
      // Piedra angular: cualquier pieza filtrando por un blockId incorrecto
      // debe devolver [] para POIs que no son de ese bloque.
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          const pois = mapService.getPoisForPiece(r, c, 'triana-de-barrio')
          pois.forEach((p) => expect(p.blockId).toBe('triana-de-barrio'))
        }
      }
    })
  })

  describe('visitedInPerson', () => {
    beforeEach(() => mapService.setMapData(FIXTURE))

    it('arranca vacío', () => {
      expect(mapService.isVisitedInPerson('giralda')).toBe(false)
      expect(mapService.getVisitedCount('sevilla-esencial')).toBe(0)
    })

    it('markVisitedInPerson persiste y es idempotente', () => {
      mapService.markVisitedInPerson('giralda')
      mapService.markVisitedInPerson('giralda')
      expect(mapService.isVisitedInPerson('giralda')).toBe(true)
      expect(mapService.getVisitedCount('sevilla-esencial')).toBe(1)
    })

    it('cuenta solo POIs del bloque', () => {
      mapService.markVisitedInPerson('giralda')
      mapService.markVisitedInPerson('bar-curioso')
      expect(mapService.getVisitedCount('sevilla-esencial')).toBe(1)
      expect(mapService.getVisitedCount('triana-de-barrio')).toBe(1)
    })
  })

  describe('unlockMode', () => {
    it('arranca en null', () => {
      expect(mapService.getUnlockMode()).toBeNull()
    })

    it('setUnlockMode acepta gps / meters / null', () => {
      mapService.setUnlockMode('gps')
      expect(mapService.getUnlockMode()).toBe('gps')
      mapService.setUnlockMode('meters')
      expect(mapService.getUnlockMode()).toBe('meters')
      mapService.setUnlockMode(null)
      expect(mapService.getUnlockMode()).toBeNull()
    })

    it('setUnlockMode ignora valores inválidos', () => {
      mapService.setUnlockMode('gps')
      mapService.setUnlockMode('foo')
      expect(mapService.getUnlockMode()).toBe('gps')
    })
  })

  describe('contador de metros', () => {
    it('arranca en 0', () => {
      expect(mapService.getUnlockDistanceCounter()).toBe(0)
    })

    it('addDistance suma acumulativamente', () => {
      mapService.addDistance(3)
      mapService.addDistance(7.5)
      expect(mapService.getUnlockDistanceCounter()).toBeCloseTo(10.5)
    })

    it('addDistance ignora valores no positivos o no finitos', () => {
      mapService.addDistance(5)
      mapService.addDistance(0)
      mapService.addDistance(-2)
      mapService.addDistance(NaN)
      mapService.addDistance(Infinity)
      expect(mapService.getUnlockDistanceCounter()).toBe(5)
    })

    it('resetDistanceCounter vuelve a 0', () => {
      mapService.addDistance(42)
      mapService.resetDistanceCounter()
      expect(mapService.getUnlockDistanceCounter()).toBe(0)
    })
  })

  describe('bloques activos y completados', () => {
    beforeEach(() => mapService.setMapData(FIXTURE))

    it('activeBlockId arranca en null y persiste al asignarse', () => {
      expect(mapService.getActiveBlockId()).toBeNull()
      mapService.setActiveBlockId('sevilla-esencial')
      expect(mapService.getActiveBlockId()).toBe('sevilla-esencial')
    })

    it('markBlockCompleted persiste id + modo + timestamp', () => {
      mapService.markBlockCompleted('sevilla-esencial', 'gps')
      expect(mapService.isBlockCompleted('sevilla-esencial')).toBe(true)
      expect(mapService.getBlockCompletionMode('sevilla-esencial')).toBe('gps')
      const entry = mapService.getCompletedBlocks()[0]
      expect(entry.completedAt).toBeTruthy()
    })

    it('markBlockCompleted es idempotente', () => {
      mapService.markBlockCompleted('sevilla-esencial', 'gps')
      mapService.markBlockCompleted('sevilla-esencial', 'meters')
      expect(mapService.getCompletedBlocks()).toHaveLength(1)
      expect(mapService.getBlockCompletionMode('sevilla-esencial')).toBe('gps')
    })

    it('markBlockCompleted ignora modos inválidos', () => {
      mapService.markBlockCompleted('sevilla-esencial', 'foo')
      expect(mapService.isBlockCompleted('sevilla-esencial')).toBe(false)
    })

    it('isBlockUnlocked es true para order=0 y para el siguiente si el previo está completado', () => {
      expect(mapService.isBlockUnlocked('sevilla-esencial')).toBe(true)
      expect(mapService.isBlockUnlocked('triana-de-barrio')).toBe(false)
      mapService.markBlockCompleted('sevilla-esencial', 'gps')
      expect(mapService.isBlockUnlocked('triana-de-barrio')).toBe(true)
    })
  })

  describe('isBlockFullyVisited / checkAndCompleteBlock', () => {
    beforeEach(() => mapService.setMapData(FIXTURE))

    it('isBlockFullyVisited es false si falta algún POI', () => {
      expect(mapService.isBlockFullyVisited('sevilla-esencial')).toBe(false)
      mapService.markVisitedInPerson('giralda')
      expect(mapService.isBlockFullyVisited('sevilla-esencial')).toBe(false)
    })

    it('isBlockFullyVisited es true cuando todos los POIs están visitados', () => {
      mapService.markVisitedInPerson('giralda')
      mapService.markVisitedInPerson('torre-oro')
      expect(mapService.isBlockFullyVisited('sevilla-esencial')).toBe(true)
    })

    it('checkAndCompleteBlock no completa si faltan visitas', () => {
      mapService.markVisitedInPerson('giralda')
      const next = mapService.checkAndCompleteBlock('sevilla-esencial')
      expect(next).toBeNull()
      expect(mapService.isBlockCompleted('sevilla-esencial')).toBe(false)
    })

    it('checkAndCompleteBlock cierra el bloque, cambia el activo y devuelve el siguiente', () => {
      mapService.markVisitedInPerson('giralda')
      mapService.markVisitedInPerson('torre-oro')
      const next = mapService.checkAndCompleteBlock('sevilla-esencial', 'gps')
      expect(next.id).toBe('triana-de-barrio')
      expect(mapService.isBlockCompleted('sevilla-esencial')).toBe(true)
      expect(mapService.getBlockCompletionMode('sevilla-esencial')).toBe('gps')
      expect(mapService.getActiveBlockId()).toBe('triana-de-barrio')
    })

    it('checkAndCompleteBlock devuelve null si ya estaba completado', () => {
      mapService.markVisitedInPerson('giralda')
      mapService.markVisitedInPerson('torre-oro')
      mapService.checkAndCompleteBlock('sevilla-esencial', 'gps')
      // Segunda llamada
      const next = mapService.checkAndCompleteBlock('sevilla-esencial', 'gps')
      expect(next).toBeNull()
    })

    it('checkAndCompleteBlock devuelve null si no hay siguiente bloque', () => {
      mapService.markVisitedInPerson('bar-curioso')
      // triana-de-barrio no está desbloqueado pero podemos marcarlo aquí:
      // el método no lo comprueba (solo mira si sus POIs están visitados).
      const next = mapService.checkAndCompleteBlock('triana-de-barrio', 'gps')
      expect(next).toBeNull()
      expect(mapService.isBlockCompleted('triana-de-barrio')).toBe(true)
    })
  })

  describe('tutorial del mapa', () => {
    it('arranca sin ver', () => {
      expect(mapService.hasSeenMapTutorial()).toBe(false)
    })

    it('markMapTutorialSeen persiste', () => {
      mapService.markMapTutorialSeen()
      expect(mapService.hasSeenMapTutorial()).toBe(true)
    })
  })
})
