import { createFinaleService } from '../../src/game/services/FinaleService'

const makeCompletion = (obtained, total) => ({
  totals: { total },
  obtained: { total: obtained },
  percent: total > 0 ? Math.round((obtained / total) * 100) : 0,
})

describe('FinaleService', () => {
  let service

  beforeEach(() => {
    localStorage.clear()
    service = createFinaleService()
  })

  describe('shouldAutoShow', () => {
    it('no se auto-muestra si el juego no está completo', () => {
      expect(service.shouldAutoShow(makeCompletion(30, 40))).toBe(false)
    })

    it('se auto-muestra al alcanzar el 100 % por primera vez', () => {
      expect(service.shouldAutoShow(makeCompletion(40, 40))).toBe(true)
    })

    it('no se auto-muestra dos veces para el mismo contenido (ej. otra bandera al 100 %)', () => {
      service.markShown(40)
      expect(service.shouldAutoShow(makeCompletion(40, 40))).toBe(false)
    })

    it('no usa percent redondeado: 99,6 % no dispara el final', () => {
      // 249/250 → percent redondea a 100 pero los totales no coinciden
      const completion = makeCompletion(249, 250)
      expect(completion.percent).toBe(100)
      expect(service.shouldAutoShow(completion)).toBe(false)
    })

    it('no se auto-muestra tras una actualización que baja el porcentaje de 100', () => {
      service.markShown(40)
      // La actualización añade 3 objetivos: el jugador ya no está al 100 %
      expect(service.shouldAutoShow(makeCompletion(40, 43))).toBe(false)
    })

    it('vuelve a auto-mostrarse al re-conquistar el 100 % tras una actualización', () => {
      service.markShown(40)
      expect(service.shouldAutoShow(makeCompletion(43, 43))).toBe(true)
    })

    it('no se auto-muestra con un juego sin contenido (total 0)', () => {
      expect(service.shouldAutoShow(makeCompletion(0, 0))).toBe(false)
    })
  })

  describe('persistencia', () => {
    it('markShown persiste el total y getSeenTotal lo recupera', () => {
      service.markShown(40)
      expect(service.getSeenTotal()).toBe(40)
    })

    it('getSeenTotal devuelve null si nunca se mostró', () => {
      expect(service.getSeenTotal()).toBe(null)
    })

    it('getSeenTotal devuelve null si el valor guardado está corrupto', () => {
      localStorage.setItem('cucana_finale_seen_total', 'no-es-un-numero')
      expect(service.getSeenTotal()).toBe(null)
    })

    it('clear elimina el registro y el final vuelve a auto-mostrarse', () => {
      service.markShown(40)
      service.clear()
      expect(service.shouldAutoShow(makeCompletion(40, 40))).toBe(true)
    })
  })
})
