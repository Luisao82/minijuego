// Sistema de equilibrio analógico — modos giroscopio del móvil y tabla.
// Lógica pura, sin Phaser ni navegador.
//
// 1. inputFromTilt: grados de inclinación → inputDirection (-1..1) con zona
//    muerta y curva de respuesta. La inclinación NO coloca el cursor: es una
//    fuerza, igual que el botón pero dosificada. Quedarse recto = fuerza 0 →
//    el drift tira y el jugador cae.
// 2. extraAcceleration: inestabilidad que se suma a la física del equilibrio:
//    - vaivén: perturbación suave y continua (el palo cimbreándose)
//    - gravedad: péndulo invertido, cuanto más lejos del centro más tira hacia fuera
//    Ambas se amplifican con la grasa con la misma curva que el drift.
//
// tuning: { deadZoneDeg, maxTiltDeg, curve, invert, sway, gravity }

import { OIL } from '../config/gameConfig'

// Frecuencias inconmensurables: la suma de senos nunca se repite igual
const SWAY_WAVES = [
  { freq: 1.3, weight: 1 },
  { freq: 2.7, weight: 0.6 },
  { freq: 5.1, weight: 0.35 },
]
const SWAY_WEIGHT_TOTAL = SWAY_WAVES.reduce((sum, w) => sum + w.weight, 0)

export const mapTiltToInput = (tiltDeg, { deadZoneDeg, maxTiltDeg, curve, invert = false }) => {
  const magnitude = Math.abs(tiltDeg)
  if (magnitude <= deadZoneDeg) return 0

  const normalized = Math.min(1, (magnitude - deadZoneDeg) / (maxTiltDeg - deadZoneDeg))
  const input = Math.sign(tiltDeg) * Math.pow(normalized, curve)
  return invert ? -input : input
}

export class AnalogBalanceSystem {
  constructor(tuning, random = Math.random) {
    this.tuning = tuning
    this.elapsed = 0
    this.phases = SWAY_WAVES.map(() => random() * Math.PI * 2)
  }

  inputFromTilt(tiltDeg) {
    return mapTiltToInput(tiltDeg, this.tuning)
  }

  extraAcceleration(dt, position, greaseRatio = 0) {
    this.elapsed += dt
    const { sway, gravity } = this.tuning
    if (!sway && !gravity) return 0

    const swayWave =
      SWAY_WAVES.reduce(
        (sum, w, i) => sum + w.weight * Math.sin(w.freq * this.elapsed + this.phases[i]),
        0
      ) / SWAY_WEIGHT_TOTAL

    const amplify = 1 + Math.pow(greaseRatio, OIL.CURVE_POWER) * OIL.DRIFT_MULTIPLIER
    return (swayWave * sway + position * gravity) * amplify
  }
}
