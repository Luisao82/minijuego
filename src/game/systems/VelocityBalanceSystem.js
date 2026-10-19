// Sistema de equilibrio por VELOCIDAD — para controlar con el cuerpo (tabla).
// Lógica pura, sin Phaser. Misma interfaz que BalanceSystem, así la escena
// los usa indistintamente.
//
// Con el cuerpo, controlar una fuerza (aceleración) es muy difícil: reacciona
// tarde y la inercia lo desborda. Aquí la inclinación mueve el cursor a una
// velocidad proporcional, sin inercia acumulada:
//
//   velocidad = jugador + drift + gravedad
//     jugador  = input × speed                    (se para en cuanto se endereza)
//     drift    = driftSpeed × onda suave           (cambia de sentido con el tiempo:
//                                                   quedarse quieto NO es estar en equilibrio)
//     gravedad = gravity × posición                (cuanto más lejos, más tira hacia fuera)
//
// La grasa amplifica drift y gravedad con la misma curva que en BalanceSystem,
// y el drift crece poco a poco con el tiempo (driftGrowth).

import { OIL } from '../config/gameConfig'

// Frecuencias inconmensurables: el vaivén del drift nunca se repite igual
const WAVES = [
  { freq: 0.45, weight: 1 },
  { freq: 0.97, weight: 0.5 },
  { freq: 1.73, weight: 0.25 },
]
const WEIGHT_TOTAL = WAVES.reduce((sum, w) => sum + w.weight, 0)

export class VelocityBalanceSystem {
  constructor(balanceBar, tuning, random = Math.random) {
    this.bar = balanceBar
    this.tuning = tuning
    this.elapsed = 0
    this.phases = WAVES.map(() => random() * Math.PI * 2)
    this.driftForce = 0 // velocidad actual del drift (para el panel de depuración)
    this.maxDrift = 0
    this.driftDirection = 1
  }

  update(dt, inputDirection, greaseRatio = 0) {
    if (this.bar.failed) return
    this.elapsed += dt

    const { speed, driftSpeed, driftChange, driftGrowth, gravity } = this.tuning
    const curvedGrease = Math.pow(greaseRatio, OIL.CURVE_POWER)
    const amplify = 1 + curvedGrease * OIL.DRIFT_MULTIPLIER

    const wave =
      WAVES.reduce(
        (sum, w, i) =>
          sum + w.weight * Math.sin(w.freq * driftChange * this.elapsed + this.phases[i]),
        0
      ) / WEIGHT_TOTAL

    const driftAmplitude = driftSpeed * (1 + driftGrowth * this.elapsed) * amplify
    const drift = driftAmplitude * wave
    const pull = gravity * this.bar.position * amplify
    const velocity = inputDirection * speed + drift + pull

    this.driftForce = Math.abs(drift)
    this.maxDrift = driftAmplitude
    this.driftDirection = Math.sign(drift) || 1

    this.bar.setInputDirection(inputDirection)
    this.bar.velocity = velocity
    this.bar.advanceBy(velocity * dt)
    this.bar.crossedCenter()
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
