import { StatsCalculator } from '../../src/game/systems/StatsCalculator'

// Helpers para fabricar registros de partida con el shape mínimo que
// StatsCalculator usa: { success, characterId, skinKey, polePercent, rewardId }
const win = (overrides = {}) => ({
  success: true,
  characterId: 'trianero',
  skinKey: 'trianero',
  polePercent: 100,
  ...overrides,
})
const loss = (overrides = {}) => ({
  success: false,
  characterId: 'trianero',
  skinKey: 'trianero',
  polePercent: 50,
  ...overrides,
})

describe('StatsCalculator', () => {
  describe('historial vacío', () => {
    const calc = new StatsCalculator([])
    it('totalGames = 0', () => expect(calc.totalGames()).toBe(0))
    it('totalWins = 0', () => expect(calc.totalWins()).toBe(0))
    it('winRate = 0 (sin divisiones por cero)', () => expect(calc.winRate()).toBe(0))
    it('avgPolePercent = 0', () => expect(calc.avgPolePercent()).toBe(0))
    it('consecutiveWins = 0', () => expect(calc.consecutiveWins()).toBe(0))
    it('topSkinsByWins devuelve array vacío', () => expect(calc.topSkinsByWins(3)).toEqual([]))
    it('bestCharacter devuelve null', () => expect(calc.bestCharacter()).toBeNull())
  })

  describe('contadores básicos', () => {
    it('totalGames cuenta todas las partidas', () => {
      const calc = new StatsCalculator([win(), loss(), win(), loss()])
      expect(calc.totalGames()).toBe(4)
    })

    it('totalWins solo cuenta las exitosas', () => {
      const calc = new StatsCalculator([win(), loss(), win(), loss()])
      expect(calc.totalWins()).toBe(2)
    })

    it('totalRewards es alias de totalWins (1 victoria = 1 premio)', () => {
      const calc = new StatsCalculator([win(), win(), loss()])
      expect(calc.totalRewards()).toBe(2)
    })

    it('winRate redondea al entero más cercano', () => {
      // 2 victorias / 3 partidas = 66.67% → 67
      const calc = new StatsCalculator([win(), win(), loss()])
      expect(calc.winRate()).toBe(67)
    })
  })

  describe('avgPolePercent', () => {
    it('media simple de polePercent', () => {
      const calc = new StatsCalculator([
        win({ polePercent: 100 }),
        win({ polePercent: 50 }),
        win({ polePercent: 0 }),
      ])
      expect(calc.avgPolePercent()).toBe(50) // (100+50+0)/3 = 50
    })

    it('redondea a un decimal', () => {
      const calc = new StatsCalculator([
        win({ polePercent: 33 }),
        win({ polePercent: 67 }),
        win({ polePercent: 50 }),
      ])
      expect(calc.avgPolePercent()).toBe(50) // (33+67+50)/3 = 50
    })

    it('partidas sin polePercent cuentan como 0 en la media', () => {
      // win() devuelve polePercent: 100 por defecto, así que usamos un registro
      // crudo (sin la propiedad) para verificar el fallback || 0 del reduce.
      const calc = new StatsCalculator([win({ polePercent: 80 }), { success: true }])
      expect(calc.avgPolePercent()).toBe(40) // (80 + 0) / 2 = 40
    })
  })

  describe('consecutiveWins', () => {
    it('cuenta la racha más larga de victorias seguidas', () => {
      const records = [win(), win(), loss(), win(), win(), win(), loss(), win()]
      // rachas: 2, 3, 1 → máxima 3
      const calc = new StatsCalculator(records)
      expect(calc.consecutiveWins()).toBe(3)
    })

    it('una sola victoria es racha 1', () => {
      const calc = new StatsCalculator([loss(), win(), loss()])
      expect(calc.consecutiveWins()).toBe(1)
    })

    it('todo victorias devuelve length total', () => {
      const calc = new StatsCalculator([win(), win(), win()])
      expect(calc.consecutiveWins()).toBe(3)
    })
  })

  describe('topSkinsByWins', () => {
    it('agrupa por skinKey y ordena descendiente', () => {
      const records = [
        win({ skinKey: 'trianero' }),
        win({ skinKey: 'flamenca' }),
        win({ skinKey: 'flamenca' }),
        win({ skinKey: 'flamenca' }),
        win({ skinKey: 'trianero' }),
      ]
      const top = new StatsCalculator(records).topSkinsByWins(3)
      expect(top[0]).toEqual({ skinKey: 'flamenca', characterId: 'trianero', wins: 3 })
      expect(top[1]).toEqual({ skinKey: 'trianero', characterId: 'trianero', wins: 2 })
    })

    it('respeta el límite N', () => {
      const records = [win({ skinKey: 'a' }), win({ skinKey: 'b' }), win({ skinKey: 'c' })]
      expect(new StatsCalculator(records).topSkinsByWins(2)).toHaveLength(2)
    })

    it('solo cuenta partidas exitosas', () => {
      const records = [loss({ skinKey: 'a' }), loss({ skinKey: 'a' }), win({ skinKey: 'b' })]
      const top = new StatsCalculator(records).topSkinsByWins(3)
      expect(top).toHaveLength(1)
      expect(top[0].skinKey).toBe('b')
    })
  })

  describe('topRewards', () => {
    it('agrupa por rewardId y devuelve los más frecuentes', () => {
      const records = [
        win({ rewardId: 'turron' }),
        win({ rewardId: 'turron' }),
        win({ rewardId: 'mantecado' }),
      ]
      const top = new StatsCalculator(records).topRewards(5)
      expect(top[0]).toEqual({ rewardId: 'turron', count: 2 })
      expect(top[1]).toEqual({ rewardId: 'mantecado', count: 1 })
    })

    it('ignora registros sin rewardId', () => {
      const records = [win({ rewardId: 'x' }), win(), loss()]
      const top = new StatsCalculator(records).topRewards(5)
      expect(top).toHaveLength(1)
      expect(top[0].rewardId).toBe('x')
    })
  })

  describe('bestCharacter', () => {
    it('devuelve el personaje con mejor winRate', () => {
      const records = [
        // trianero: 3 partidas, 1 win → 33%
        win({ characterId: 'trianero' }),
        loss({ characterId: 'trianero' }),
        loss({ characterId: 'trianero' }),
        // flamenca: 2 partidas, 2 wins → 100%
        win({ characterId: 'flamenca' }),
        win({ characterId: 'flamenca' }),
      ]
      const best = new StatsCalculator(records).bestCharacter()
      expect(best.characterId).toBe('flamenca')
      expect(best.winRate).toBe(100)
      expect(best.games).toBe(2)
      expect(best.wins).toBe(2)
    })
  })

  describe('getSummary', () => {
    it('expone todas las stats principales como un único objeto', () => {
      const records = [
        win({ rewardId: 'turron', skinKey: 'flamenca', characterId: 'flamenca', polePercent: 100 }),
        win({ rewardId: 'turron', skinKey: 'flamenca', characterId: 'flamenca', polePercent: 90 }),
        loss({ characterId: 'trianero', polePercent: 30 }),
      ]
      const summary = new StatsCalculator(records).getSummary()
      expect(summary.totalGames).toBe(3)
      expect(summary.totalWins).toBe(2)
      expect(summary.winRate).toBe(67)
      expect(summary.totalRewards).toBe(2)
      expect(summary.consecutiveWins).toBe(2)
      expect(summary.bestCharacter.characterId).toBe('flamenca')
      expect(summary.topRewards[0]).toEqual({ rewardId: 'turron', count: 2 })
      expect(summary.topSkins[0].skinKey).toBe('flamenca')
    })
  })
})
