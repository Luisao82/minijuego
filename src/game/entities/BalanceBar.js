// Entidad de la barra de equilibrio — Fase 2 (Equilibrio)
// Lógica pura, sin dependencias de Phaser

import { BALANCE } from '../config/gameConfig'

export class BalanceBar {

  constructor(equilibrioStat) {
    this.position = 0          // -1 (izquierda) a +1 (derecha), 0 = centro
    this.velocity = 0          // Velocidad actual del cursor
    this.limit = BALANCE.LIMIT // Umbral de caída
    this.equilibrioStat = equilibrioStat
    this.failed = false
  }

  // Aplica fuerza del input del jugador con aceleración progresiva
  // direction: -1 (izquierda) o +1 (derecha)
  applyForce(direction, dt) {
    this.velocity += direction * BALANCE.INPUT_ACCELERATION * dt
    // Limitar velocidad máxima de corrección
    const maxSpeed = BALANCE.INPUT_MAX_SPEED
    this.velocity = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity))
  }

  // Aplica drift directamente a la posición (independiente de velocity/fricción)
  applyDrift(amount) {
    this.position += amount
  }

  update(dt) {
    if (this.failed) return

    // Aplicar fricción al input del jugador (frena progresivamente al soltar)
    const friction = BALANCE.FRICTION * dt
    if (Math.abs(this.velocity) > friction) {
      this.velocity -= Math.sign(this.velocity) * friction
    } else {
      this.velocity = 0
    }

    // Mover posición con la velocidad del input
    this.position += this.velocity * dt

    // Comprobar límites
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
