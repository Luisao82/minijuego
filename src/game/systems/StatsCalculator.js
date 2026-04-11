// StatsCalculator — calcula estadísticas agregadas a partir de los registros de partidas.
//
// Lógica pura: sin dependencias de Phaser. Recibe el array de registros del
// GameStatsService y expone un método por estadística.
//
// Para añadir una nueva estadística:
//   1. Crear un método que opere sobre this.records
//   2. Añadir una línea en getSummary() con su clave
//
// Uso:
//   const calc = new StatsCalculator(gameStatsService.getAll())
//   const summary = calc.getSummary()

export class StatsCalculator {

  constructor(records) {
    this.records = records || []
  }

  // Total de partidas jugadas
  totalGames() {
    return this.records.length
  }

  // Partidas en las que se cogió la bandera
  totalWins() {
    return this.records.filter(r => r.success).length
  }

  // Porcentaje de victorias (0-100, entero)
  winRate() {
    if (!this.records.length) return 0
    return Math.round((this.totalWins() / this.totalGames()) * 100)
  }

  // Total de premios obtenidos (equivalente a totalWins: cada victoria = 1 premio)
  totalRewards() {
    return this.totalWins()
  }

  // Media del porcentaje de palo recorrido en todas las partidas
  avgPolePercent() {
    if (!this.records.length) return 0
    const total = this.records.reduce((sum, r) => sum + (r.polePercent || 0), 0)
    return Math.round((total / this.records.length) * 10) / 10
  }

  // Top N skins con más victorias — [{ skinKey, characterId, wins }] ordenado desc
  topSkinsByWins(n = 3) {
    const map = {}
    this.records.filter(r => r.success).forEach(r => {
      if (!map[r.skinKey]) {
        map[r.skinKey] = { skinKey: r.skinKey, characterId: r.characterId, wins: 0 }
      }
      map[r.skinKey].wins++
    })
    return Object.values(map)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, n)
  }

  // Top N premios conseguidos, de más a menos — [{ rewardId, count }]
  topRewards(n = 5) {
    const map = {}
    this.records.filter(r => r.rewardId).forEach(r => {
      map[r.rewardId] = (map[r.rewardId] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([rewardId, count]) => ({ rewardId, count }))
  }

  // Personaje con mejor ratio de victorias — { characterId, games, wins, winRate }
  bestCharacter() {
    const map = {}
    this.records.forEach(r => {
      if (!map[r.characterId]) {
        map[r.characterId] = { characterId: r.characterId, games: 0, wins: 0 }
      }
      map[r.characterId].games++
      if (r.success) map[r.characterId].wins++
    })
    const sorted = Object.values(map)
      .map(c => ({ ...c, winRate: Math.round((c.wins / c.games) * 100) }))
      .sort((a, b) => b.winRate - a.winRate)
    return sorted[0] || null
  }

  // Victorias consecutivas máximas (racha más larga)
  consecutiveWins() {
    let max = 0
    let current = 0
    for (const r of this.records) {
      if (r.success) {
        current++
        if (current > max) max = current
      } else {
        current = 0
      }
    }
    return max
  }

  // Objeto resumen con todas las estadísticas — consumido por StatsScene
  getSummary() {
    return {
      totalGames:      this.totalGames(),
      totalWins:       this.totalWins(),
      winRate:         this.winRate(),
      totalRewards:    this.totalRewards(),
      avgPolePercent:  this.avgPolePercent(),
      consecutiveWins: this.consecutiveWins(),
      topSkins:        this.topSkinsByWins(3),
      topRewards:      this.topRewards(5),
      bestCharacter:  this.bestCharacter(),
    }
  }
}
