// Entidad de la barra de poder — Fase 1 (Impulso)
// Lógica pura, sin dependencias de Phaser

import { PHASE1 } from '../config/gameConfig'

export class PowerBar {

  constructor(weightStat) {
    this.position = 0
    this.velocity = PHASE1.BASE_SPEED
    this.acceleration = PHASE1.BASE_ACCELERATION + (weightStat * PHASE1.WEIGHT_FACTOR)
    this.passes = 0
    this.maxPasses = PHASE1.MAX_PASSES
    this.stopped = false
    this.finished = false
    this.weightStat = weightStat
  }

  getZone() {
    const { ZONES } = PHASE1
    if (this.position < ZONES.RED.end) return 'red'
    if (this.position < ZONES.YELLOW.end) return 'yellow'
    return 'green'
  }

  getZoneLabel() {
    const labels = { red: 'MALA', yellow: 'REGULAR', green: 'ÓPTIMA' }
    return labels[this.getZone()]
  }

  getImpulseValue() {
    return this.position
  }

  reset() {
    this.position = 0
    this.velocity = PHASE1.BASE_SPEED + (this.passes * PHASE1.PASS_SPEED_INCREASE)
  }
}
