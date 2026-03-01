// Sistema de impulso — controla la mecánica de la Fase 1
// Gestiona el movimiento de la barra, aceleración, reset y resultado

export class ImpulseSystem {

  constructor(powerBar) {
    this.bar = powerBar
  }

  update(deltaSeconds) {
    if (this.bar.stopped || this.bar.finished) return

    // Acelerar progresivamente
    this.bar.velocity += this.bar.acceleration * deltaSeconds

    // Mover posición
    this.bar.position += this.bar.velocity * deltaSeconds

    // Si llega al final, nueva pasada o fin
    if (this.bar.position >= 1) {
      this.bar.passes++
      if (this.bar.passes >= this.bar.maxPasses) {
        this.bar.finished = true
        this.bar.position = 0
      } else {
        this.bar.reset()
      }
    }
  }

  stop() {
    if (this.bar.finished) return this.getResult()
    this.bar.stopped = true
    return this.getResult()
  }

  getResult() {
    return {
      position: this.bar.position,
      zone: this.bar.getZone(),
      zoneLabel: this.bar.getZoneLabel(),
      impulseValue: this.bar.getImpulseValue(),
      passes: this.bar.passes,
    }
  }

  isActive() {
    return !this.bar.stopped && !this.bar.finished
  }
}
