import {
  DEFAULT_CHARACTER_IDS,
  computeCompletion,
  computeObtained,
  computeTotals,
} from '../../src/game/systems/CompletionCalculator'

// Helpers para fabricar personajes con el shape mínimo que
// CompletionCalculator lee: { id, available, hidden, skins:[{spritesheet, flags}] }
const char = (id, skins = [], overrides = {}) => ({
  id,
  available: true,
  skins,
  ...overrides,
})
const skin = (spritesheet, flags = null) => ({ spritesheet, flags })

// Fixture aproximada a la realidad del juego: 2 defaults (Trianero, Flamenca)
// con skins con flags + 1 no-default (Abuela) + 1 hidden (easter egg).
const fixtureCharacters = () => [
  char('trianero', [skin('trianero'), skin('nazareno', 3), skin('feriante', 8)]),
  char('flamenca', [skin('flamenca'), skin('mantilla', 8)]),
  char('abuela', [skin('abuela'), skin('antonia', 4)]),
  char('easter_egg', [skin('developer')], { hidden: true }),
]

describe('CompletionCalculator', () => {
  describe('computeTotals', () => {
    it('cuenta personajes desbloqueables excluyendo defaults y hidden', () => {
      const totals = computeTotals({
        characters: fixtureCharacters(),
        rewardsCount: 0,
        mapPiecesCount: 0,
      })
      // trianero + flamenca son defaults → fuera
      // easter_egg es hidden → fuera
      // solo abuela cuenta → 1
      expect(totals.characters).toBe(1)
    })

    it('cuenta skins con flags no-null en todos los personajes no-hidden', () => {
      const totals = computeTotals({
        characters: fixtureCharacters(),
        rewardsCount: 0,
        mapPiecesCount: 0,
      })
      // trianero: 2 (nazareno, feriante) + flamenca: 1 (mantilla) + abuela: 1 (antonia) = 4
      expect(totals.skins).toBe(4)
    })

    it('propaga rewardsCount y mapPiecesCount tal cual', () => {
      const totals = computeTotals({
        characters: fixtureCharacters(),
        rewardsCount: 17,
        mapPiecesCount: 15,
      })
      expect(totals.rewards).toBe(17)
      expect(totals.mapPieces).toBe(15)
    })

    it('perspectives es siempre 1 (solo cuenta Sevilla)', () => {
      const totals = computeTotals({
        characters: fixtureCharacters(),
        rewardsCount: 0,
        mapPiecesCount: 0,
      })
      expect(totals.perspectives).toBe(1)
    })

    it('total suma todas las categorías', () => {
      const totals = computeTotals({
        characters: fixtureCharacters(),
        rewardsCount: 17,
        mapPiecesCount: 15,
      })
      // 1 char + 4 skins + 17 rewards + 15 pieces + 1 perspective = 38
      expect(totals.total).toBe(38)
    })

    it('array de personajes vacío da totales a cero salvo perspectives', () => {
      const totals = computeTotals({ characters: [], rewardsCount: 0, mapPiecesCount: 0 })
      expect(totals).toEqual({
        characters: 0,
        skins: 0,
        rewards: 0,
        mapPieces: 0,
        perspectives: 1,
        total: 1,
      })
    })

    it('respeta available: false — el personaje no se cuenta aunque no sea default ni hidden', () => {
      const totals = computeTotals({
        characters: [char('abuela', [skin('abuela')], { available: false })],
        rewardsCount: 0,
        mapPiecesCount: 0,
      })
      expect(totals.characters).toBe(0)
    })
  })

  describe('computeObtained', () => {
    const base = {
      characters: fixtureCharacters(),
      unlockedCharacterIds: DEFAULT_CHARACTER_IDS,
      unlockedSkinsPerCharacter: {},
      ownedRewardIds: [],
      unlockedMapPieceIds: [],
      sevillaUnlocked: false,
    }

    it('jugador nuevo (solo defaults) → todo a cero', () => {
      const obt = computeObtained(base)
      expect(obt).toEqual({
        characters: 0,
        skins: 0,
        rewards: 0,
        mapPieces: 0,
        perspectives: 0,
        total: 0,
      })
    })

    it('los personajes default en unlockedCharacterIds no cuentan', () => {
      const obt = computeObtained({ ...base, unlockedCharacterIds: ['trianero', 'flamenca'] })
      expect(obt.characters).toBe(0)
    })

    it('cuenta personajes no-default desbloqueados', () => {
      const obt = computeObtained({
        ...base,
        unlockedCharacterIds: [...DEFAULT_CHARACTER_IDS, 'abuela'],
      })
      expect(obt.characters).toBe(1)
    })

    it('los personajes hidden desbloqueados no cuentan', () => {
      const obt = computeObtained({
        ...base,
        unlockedCharacterIds: [...DEFAULT_CHARACTER_IDS, 'easter_egg'],
      })
      expect(obt.characters).toBe(0)
    })

    it('cuenta skins con flags desbloqueados; los base con flags:null no cuentan', () => {
      const obt = computeObtained({
        ...base,
        unlockedSkinsPerCharacter: {
          trianero: ['trianero', 'nazareno'], // base (no cuenta) + nazareno (cuenta)
          flamenca: ['flamenca'], // solo base → 0
        },
      })
      expect(obt.skins).toBe(1)
    })

    it('ignora skins de personajes hidden aunque estén desbloqueados', () => {
      const obt = computeObtained({
        ...base,
        characters: [char('easter_egg', [skin('developer', 100)], { hidden: true })],
        unlockedSkinsPerCharacter: { easter_egg: ['developer'] },
      })
      expect(obt.skins).toBe(0)
    })

    it('rewards = cantidad de ids distintos en ownedRewardIds', () => {
      const obt = computeObtained({
        ...base,
        ownedRewardIds: ['reward_pali', 'reward_giraldillo', 'reward_avellana'],
      })
      expect(obt.rewards).toBe(3)
    })

    it('mapPieces = cantidad de ids en unlockedMapPieceIds', () => {
      const obt = computeObtained({
        ...base,
        unlockedMapPieceIds: ['piece-0-0', 'piece-0-1', 'piece-2-2'],
      })
      expect(obt.mapPieces).toBe(3)
    })

    it('sevillaUnlocked true → perspectives = 1', () => {
      const obt = computeObtained({ ...base, sevillaUnlocked: true })
      expect(obt.perspectives).toBe(1)
    })
  })

  describe('computeCompletion (integración)', () => {
    const empty = {
      characters: fixtureCharacters(),
      rewardsCount: 17,
      mapPiecesCount: 15,
      unlockedCharacterIds: DEFAULT_CHARACTER_IDS,
      unlockedSkinsPerCharacter: {},
      ownedRewardIds: [],
      unlockedMapPieceIds: [],
      sevillaUnlocked: false,
    }

    it('jugador recién empezado → 0 %', () => {
      const result = computeCompletion(empty)
      expect(result.percent).toBe(0)
      expect(result.obtained.total).toBe(0)
      expect(result.totals.total).toBe(38) // 1 + 4 + 17 + 15 + 1
    })

    it('todo desbloqueado → 100 %', () => {
      const result = computeCompletion({
        ...empty,
        unlockedCharacterIds: [...DEFAULT_CHARACTER_IDS, 'abuela'],
        unlockedSkinsPerCharacter: {
          trianero: ['trianero', 'nazareno', 'feriante'],
          flamenca: ['flamenca', 'mantilla'],
          abuela: ['abuela', 'antonia'],
        },
        ownedRewardIds: Array.from({ length: 17 }, (_, i) => `reward_${i}`),
        unlockedMapPieceIds: Array.from({ length: 15 }, (_, i) => `piece-${i}`),
        sevillaUnlocked: true,
      })
      expect(result.percent).toBe(100)
      expect(result.obtained.total).toBe(38)
    })

    it('estado parcial devuelve un porcentaje entero entre 0 y 100', () => {
      const result = computeCompletion({
        ...empty,
        unlockedSkinsPerCharacter: { trianero: ['trianero', 'nazareno'] },
        ownedRewardIds: ['reward_pali', 'reward_giraldillo'],
      })
      // obtained = 1 (skin) + 2 (rewards) = 3
      // total    = 38
      // percent  = round(3/38 * 100) = 8
      expect(result.percent).toBe(8)
    })

    it('nunca sobrepasa 100 aunque los datos sean inconsistentes', () => {
      const result = computeCompletion({
        ...empty,
        // Pasa MÁS rewards de los que existen (inconsistencia del cliente)
        ownedRewardIds: Array.from({ length: 100 }, (_, i) => `reward_${i}`),
      })
      expect(result.percent).toBeGreaterThanOrEqual(0)
      expect(result.percent).toBeLessThanOrEqual(100)
    })

    it('percent = 0 si el total es 0 (sin dividir por cero)', () => {
      const result = computeCompletion({
        characters: [],
        rewardsCount: 0,
        mapPiecesCount: 0,
        unlockedCharacterIds: [],
        unlockedSkinsPerCharacter: {},
        ownedRewardIds: [],
        unlockedMapPieceIds: [],
        sevillaUnlocked: false,
      })
      // total = 1 (perspectives) porque la 1 se cuenta siempre; obtained = 0 → 0%
      expect(result.percent).toBe(0)
    })
  })
})
