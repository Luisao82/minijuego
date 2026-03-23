// Sistema de equilibrio — controla la mecánica de la Fase 2
//
// Modelo de inercia con drift direccional:
//   - El drift sigue el signo de la velocidad actual del cursor:
//     velocity > 0 → drift empuja derecha (+1), velocity < 0 → drift empuja izquierda (-1).
//   - Esto amplifica la inercia: el jugador debe frenar activamente la dirección en la que va.
//   - La fuerza crece ligeramente cuando la velocidad cambia de signo (dificultad orgánica).
//   - El aceite amplifica la fuerza, pero INPUT_FORCE siempre la supera (control garantizado).
//
// La stat "equilibrio" del personaje escala la fuerza máxima alcanzable del drift:
//   equilibrio 10 → DRIFT_MIN más bajo → más tiempo antes de llegar al máximo → más fácil
//   equilibrio  0 → DRIFT_MAX más alto → drift más agresivo desde antes → más difícil

import { BALANCE } from '../config/gameConfig'

export class BalanceSystem {

  constructor(balanceBar) {
    this.bar = balanceBar
    this.elapsed = 0

    // Fuerza máxima del drift escalada por la stat de equilibrio del personaje
    const t = Math.max(0, Math.min(10, balanceBar.equilibrioStat)) / 10
    this.maxDrift = BALANCE.DRIFT_MIN + (1 - t) * (BALANCE.DRIFT_MAX - BALANCE.DRIFT_MIN)

    // Empieza con la fuerza mínima y crece con cada oscilación
    this.driftForce = BALANCE.DRIFT_MIN

    // Dirección inicial aleatoria: ±1
    this.driftDirection = Math.random() < 0.5 ? 1 : -1
  }

  // oilMultiplier: proporcionado por OilSystem (0 = sin grasa, hasta OIL.DRIFT_MULTIPLIER)
  update(dt, inputDirection, oilMultiplier = 0) {
    if (this.bar.failed) return

    this.elapsed += dt

    // El drift sigue el signo de la velocidad actual: amplifica la inercia existente.
    // Cuando la velocidad cambia de signo (el cursor invierte dirección), la fuerza crece.
    const velSign = Math.sign(this.bar.velocity)
    if (velSign !== 0) {
      if (velSign !== this.driftDirection) {
        this.driftForce = Math.min(this.maxDrift, this.driftForce + BALANCE.DRIFT_GROWTH_PER_CROSS)
      }
      this.driftDirection = velSign
    }

    // Consumir el flag de cruce de centro (ya no se usa, pero evita acumulación interna)
    this.bar.crossedCenter()

    const driftAccel = this.driftDirection * this.driftForce * (1 + oilMultiplier)

    this.bar.setDriftAcceleration(driftAccel)
    this.bar.setInputDirection(inputDirection)
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
