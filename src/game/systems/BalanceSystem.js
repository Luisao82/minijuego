// Sistema de equilibrio — controla la mecánica de la Fase 2
// La stat "equilibrio" del personaje escala la velocidad base del drift:
//   equilibrio 10 → drift lento (DRIFT_MIN) → más fácil
//   equilibrio  0 → drift rápido (DRIFT_MAX) → más difícil

import { BALANCE } from '../config/gameConfig'

export class BalanceSystem {

  constructor(balanceBar) {
    this.bar = balanceBar
    this.elapsed = 0

    // Calcular velocidad base del drift según stat del personaje
    // t=1 (equilibrio 10) → DRIFT_MIN (lento), t=0 (equilibrio 0) → DRIFT_MAX (rápido)
    const t = Math.max(0, Math.min(10, balanceBar.equilibrioStat)) / 10
    this.baseDrift = BALANCE.DRIFT_MAX - t * (BALANCE.DRIFT_MAX - BALANCE.DRIFT_MIN)

    this.driftDirection = Math.random() > 0.5 ? 1 : -1
    this.driftIntensity = this.baseDrift
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

      // Variar intensidad alrededor del base calculado por stat
      this.driftIntensity = this.baseDrift
        + (Math.random() * 2 - 1) * BALANCE.DRIFT_VARIANCE
    }

    // Dificultad progresiva suave (se intensifica con el tiempo)
    const difficultyMultiplier = 1 + this.elapsed * BALANCE.DIFFICULTY_INCREASE

    // Aceleración efectiva del drift
    const driftAccel = this.driftDirection * this.driftIntensity * difficultyMultiplier
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
