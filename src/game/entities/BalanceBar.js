// Entidad de la barra de equilibrio — Fase 2 (Equilibrio)
// Modelo unificado de aceleraciones: drift e input actúan sobre la misma velocity
// Lógica pura, sin dependencias de Phaser

import { BALANCE } from '../config/gameConfig'

export class BalanceBar {

  constructor(equilibrioStat) {
    this.position = 0              // -1 (izquierda) a +1 (derecha), 0 = centro
    this.velocity = 0              // Velocidad actual del cursor (unidades/s)
    this.driftAcceleration = 0     // Aceleración del drift natural (set por BalanceSystem)
    this.inputDirection = 0        // -1, 0, +1 (set por la escena via input)
    this.limit = BALANCE.LIMIT     // Umbral de caída
    this.equilibrioStat = equilibrioStat
    this.failed = false
  }

  // El sistema de equilibrio establece la aceleración del drift
  setDriftAcceleration(accel) {
    this.driftAcceleration = accel
  }

  // La escena establece la dirección del input del jugador
  setInputDirection(dir) {
    this.inputDirection = dir
  }

  update(dt) {
    if (this.failed) return

    // 1. Aplicar aceleración del drift natural
    this.velocity += this.driftAcceleration * dt

    // 2. Aplicar contrafuerza del jugador
    this.velocity += this.inputDirection * BALANCE.INPUT_FORCE * dt

    // 3. Amortiguamiento proporcional (previene acumulación infinita)
    this.velocity *= (1 - BALANCE.DAMPING * dt)

    // 4. Integrar posición
    this.position += this.velocity * dt

    // 5. Comprobar límites
    if (Math.abs(this.position) > this.limit) {
      this.failed = true
    }
  }

  isOutOfBounds() {
    return this.failed
  }

  // Posición normalizada para la UI (0 a 1, 0.5 = centro)
  getNormalizedPosition() {
    return (this.position + 1) / 2
  }
}
