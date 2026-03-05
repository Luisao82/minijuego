// Sistema de equilibrio — controla la mecánica de la Fase 2
// Gestiona el drift aleatorio que desestabiliza al jugador
// El drift actúa como aceleración sobre la velocity del bar (modelo F=ma)

import { BALANCE } from '../config/gameConfig'

export class BalanceSystem {

  constructor(balanceBar) {
    this.bar = balanceBar
    this.elapsed = 0
    this.driftDirection = Math.random() > 0.5 ? 1 : -1
    this.driftIntensity = BALANCE.DRIFT_ACCELERATION
    this.timeSinceLastChange = 0
    this.nextChangeTime = BALANCE.DRIFT_CHANGE_INTERVAL * (0.7 + Math.random() * 0.6)
  }

  update(dt, inputDirection) {
    if (this.bar.failed) return

    this.elapsed += dt
    this.timeSinceLastChange += dt

    // Cambiar dirección/intensidad del drift periódicamente
    if (this.timeSinceLastChange >= this.nextChangeTime) {
      this.timeSinceLastChange = 0
      this.nextChangeTime = BALANCE.DRIFT_CHANGE_INTERVAL * (0.7 + Math.random() * 0.6)

      // Cambiar dirección (70% de probabilidad de cambiar)
      if (Math.random() > 0.3) {
        this.driftDirection *= -1
      }

      // Variar intensidad alrededor de la base
      this.driftIntensity = BALANCE.DRIFT_ACCELERATION
        + (Math.random() * 2 - 1) * BALANCE.DRIFT_VARIANCE
    }

    // Dificultad progresiva suave
    const difficultyMultiplier = 1 + this.elapsed * BALANCE.DIFFICULTY_INCREASE

    // Reducir drift según stat de equilibrio del personaje
    const equilibrioReduction = 1 - (this.bar.equilibrioStat * BALANCE.EQUILIBRIO_FACTOR)
    const effectiveReduction = Math.max(0.2, equilibrioReduction)

    // Calcular aceleración efectiva del drift y pasarla al bar
    const driftAccel = this.driftDirection * this.driftIntensity
      * difficultyMultiplier * effectiveReduction
    this.bar.setDriftAcceleration(driftAccel)

    // Pasar input del jugador al bar
    this.bar.setInputDirection(inputDirection)

    // Actualizar bar (toda la física: drift + input + damping + posición)
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
}
