// Sistema de equilibrio — controla la mecánica de la Fase 2
// Gestiona el drift aleatorio que desestabiliza al jugador

import { BALANCE } from '../config/gameConfig'

export class BalanceSystem {

  constructor(balanceBar) {
    this.bar = balanceBar
    this.elapsed = 0
    this.driftDirection = Math.random() > 0.5 ? 1 : -1
    this.driftIntensity = BALANCE.DRIFT_BASE
    this.timeSinceLastChange = 0
    this.nextChangeTime = BALANCE.DRIFT_CHANGE_INTERVAL * (0.7 + Math.random() * 0.6)
  }

  update(dt) {
    if (this.bar.failed) return

    this.elapsed += dt
    this.timeSinceLastChange += dt

    // Cambiar dirección/intensidad del drift periódicamente
    if (this.timeSinceLastChange >= this.nextChangeTime) {
      this.timeSinceLastChange = 0
      this.nextChangeTime = BALANCE.DRIFT_CHANGE_INTERVAL * (0.7 + Math.random() * 0.6)

      // Cambiar dirección (a veces mantiene, a veces cambia)
      if (Math.random() > 0.3) {
        this.driftDirection *= -1
      }

      // Variar intensidad
      this.driftIntensity = BALANCE.DRIFT_BASE
        + (Math.random() * 2 - 1) * BALANCE.DRIFT_VARIANCE
    }

    // Dificultad progresiva: el drift se intensifica con el tiempo
    const difficultyMultiplier = 1 + this.elapsed * 0.1

    // Reducir drift según stat de equilibrio del personaje
    const equilibrioReduction = 1 - (this.bar.equilibrioStat * BALANCE.EQUILIBRIO_FACTOR)
    const effectiveReduction = Math.max(0.2, equilibrioReduction)

    // Aplicar drift como fuerza al bar
    const driftForce = this.driftDirection * this.driftIntensity
      * difficultyMultiplier * effectiveReduction * dt
    this.bar.applyDrift(driftForce)

    // Actualizar bar (física, fricción, posición)
    this.bar.update(dt)
  }

  isActive() {
    return !this.bar.failed
  }

  isFailed() {
    return this.bar.failed
  }

  getElapsedTime() {
    return this.elapsed
  }

  hasWon() {
    return this.elapsed >= BALANCE.DURATION && !this.bar.failed
  }
}
