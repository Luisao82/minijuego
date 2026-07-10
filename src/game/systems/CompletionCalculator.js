// CompletionCalculator — calcula el porcentaje de completado del juego.
//
// Lógica pura: sin dependencias de Phaser ni de localStorage. Recibe todo por
// parámetro para que sea 100% testeable con mocks.
//
// Denominador (total conseguible):
//   - Personajes con desbloqueo condicional (excluye los DEFAULT_CHARACTER_IDS
//     y los personajes marcados como `hidden`, ej. easter_egg).
//   - Skins con `flags` no nulos en cualquier personaje no-hidden.
//   - Todos los premios definidos en `rewards.json`.
//   - Todas las piezas del mapa de Sevilla.
//   - Perspectiva "sevilla" (la 3D queda fuera porque el diseño del juego la
//     desbloquea al 100 %, así el porcentaje no se auto-referencia).
//
// Numerador (obtenidos): lo que el jugador ha desbloqueado en cada categoría.
//
// Uso desde StatsScene:
//   const result = computeCompletion({
//     characters: CHARACTERS,
//     rewardsCount: ALL_REWARDS.length,
//     mapPiecesCount: ALL_PIECES.length,
//     unlockedCharacterIds: unlockService.getUnlocked(),
//     unlockedSkinsPerCharacter: getUnlockedSkinsMap(),
//     ownedRewardIds: Object.keys(rewardStorage.getAll()),
//     unlockedMapPieceIds: mapService.getUnlocked(),
//     sevillaUnlocked: perspectiveUnlockService.isUnlocked('sevilla'),
//   })
//   // → { totals: {...}, obtained: {...}, percent: 73 }

export const DEFAULT_CHARACTER_IDS = ['trianero', 'flamenca']

// Cuenta los elementos del denominador partiendo de la definición del juego.
export function computeTotals({ characters, rewardsCount, mapPiecesCount }) {
  let unlockableCharacters = 0
  let unlockableSkins = 0

  for (const c of characters) {
    if (c.hidden) continue
    if (!DEFAULT_CHARACTER_IDS.includes(c.id) && c.available !== false) {
      unlockableCharacters++
    }
    for (const s of c.skins || []) {
      if (s.flags !== null && s.flags !== undefined) unlockableSkins++
    }
  }

  const perspectives = 1 // solo Sevilla
  const total =
    unlockableCharacters + unlockableSkins + rewardsCount + mapPiecesCount + perspectives

  return {
    characters: unlockableCharacters,
    skins: unlockableSkins,
    rewards: rewardsCount,
    mapPieces: mapPiecesCount,
    perspectives,
    total,
  }
}

// Cuenta los elementos del numerador partiendo del estado del jugador.
export function computeObtained({
  characters,
  unlockedCharacterIds = [],
  unlockedSkinsPerCharacter = {},
  ownedRewardIds = [],
  unlockedMapPieceIds = [],
  sevillaUnlocked = false,
}) {
  const unlockedChars = new Set(unlockedCharacterIds)
  let obtainedCharacters = 0
  let obtainedSkins = 0

  for (const c of characters) {
    if (c.hidden) continue
    if (!DEFAULT_CHARACTER_IDS.includes(c.id) && unlockedChars.has(c.id)) {
      obtainedCharacters++
    }
    const unlockedSkins = new Set(unlockedSkinsPerCharacter[c.id] || [])
    for (const s of c.skins || []) {
      if (s.flags !== null && s.flags !== undefined && unlockedSkins.has(s.spritesheet)) {
        obtainedSkins++
      }
    }
  }

  const perspectives = sevillaUnlocked ? 1 : 0
  const total =
    obtainedCharacters +
    obtainedSkins +
    ownedRewardIds.length +
    unlockedMapPieceIds.length +
    perspectives

  return {
    characters: obtainedCharacters,
    skins: obtainedSkins,
    rewards: ownedRewardIds.length,
    mapPieces: unlockedMapPieceIds.length,
    perspectives,
    total,
  }
}

// Devuelve { totals, obtained, percent } donde percent es entero 0-100.
export function computeCompletion(inputs) {
  const totals = computeTotals(inputs)
  const obtained = computeObtained(inputs)
  const percent =
    totals.total > 0
      ? Math.max(0, Math.min(100, Math.round((obtained.total / totals.total) * 100)))
      : 0
  return { totals, obtained, percent }
}
