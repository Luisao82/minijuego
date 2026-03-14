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

    // FIX: eliminados driftDirection, timeSinceLastChange y nextChangeTime.
    // Antes el drift cambiaba de dirección aleatoriamente cada ~0.8s (70% prob.),
    // lo que causaba saltos bruscos e impredecibles en el cursor.
    // Ahora la oscilación la gestiona Math.sin() → inversión gradual sin snapshots.
    this.driftIntensity = this.baseDrift

    // Fase inicial aleatoria: evita que el drift siempre empiece hacia el mismo lado
    this.elapsed = Math.random() * Math.PI * 2 / BALANCE.DRIFT_FREQUENCY
  }

  // oilMultiplier: proporcionado por OilSystem (0 = sin grasa, hasta OIL.DRIFT_MULTIPLIER)
  update(dt, inputDirection, oilMultiplier = 0) {
    if (this.bar.failed) return

    this.elapsed += dt

    // Dificultad progresiva suave (se intensifica con el tiempo)
    const difficultyMultiplier = 1 + this.elapsed * BALANCE.DIFFICULTY_INCREASE

    // FIX: antes → this.driftDirection * this.driftIntensity * difficultyMultiplier
    //   driftDirection cambiaba bruscamente con Math.random() → saltos impredecibles.
    // Ahora → oscilación senoidal suave:
    //   el drift sube, llega a un máximo, baja, invierte y sube al otro lado.
    //   DRIFT_FREQUENCY controla la velocidad del ciclo (0.45 rad/s ≈ 14s por ciclo completo).
    //   El jugador puede anticipar y reaccionar porque el movimiento es continuo.
    // La grasa del palo amplifica el drift: 100% grasa → * (1 + OIL.DRIFT_MULTIPLIER)
    const driftAccel = Math.sin(this.elapsed * BALANCE.DRIFT_FREQUENCY)
      * this.driftIntensity
      * difficultyMultiplier
      * (1 + oilMultiplier)

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
