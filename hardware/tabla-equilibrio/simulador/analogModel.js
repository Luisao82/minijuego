// Modelo de entrada analógica para el equilibrio (giroscopio del móvil / tabla).
// Lógica pura, sin navegador ni Phaser: si se adopta, pasa tal cual a src/game/systems/.
//
// 1. mapTiltToInput: convierte grados de inclinación en inputDirection (-1..1)
//    con zona muerta y curva de respuesta.
// 2. InstabilityModel: fuerzas extra para que la barra nunca esté quieta:
//    - vaivén: perturbación suave y continua (el palo cimbreándose)
//    - gravedad: péndulo invertido, cuanto más lejos del centro más tira hacia fuera

export const mapTiltToInput = (tiltDeg, { deadZoneDeg, maxTiltDeg, curve }) => {
  const magnitude = Math.abs(tiltDeg)
  if (magnitude <= deadZoneDeg) return 0

  const normalized = Math.min(1, (magnitude - deadZoneDeg) / (maxTiltDeg - deadZoneDeg))
  return Math.sign(tiltDeg) * Math.pow(normalized, curve)
}

// Frecuencias inconmensurables: la suma de senos nunca se repite igual
const SWAY_WAVES = [
  { freq: 1.3, weight: 1 },
  { freq: 2.7, weight: 0.6 },
  { freq: 5.1, weight: 0.35 },
]
const SWAY_WEIGHT_TOTAL = SWAY_WAVES.reduce((sum, w) => sum + w.weight, 0)

export class InstabilityModel {
  constructor(random = Math.random) {
    this.elapsed = 0
    this.phases = SWAY_WAVES.map(() => random() * Math.PI * 2)
  }

  // Devuelve la aceleración extra (u/s²) para este frame.
  // amplify: multiplicador común (p. ej. el del aceite) aplicado a ambas fuerzas.
  update(dt, position, { swayStrength, gravityStrength, amplify = 1 }) {
    this.elapsed += dt

    const sway =
      SWAY_WAVES.reduce(
        (sum, w, i) => sum + w.weight * Math.sin(w.freq * this.elapsed + this.phases[i]),
        0
      ) / SWAY_WEIGHT_TOTAL

    return (sway * swayStrength + position * gravityStrength) * amplify
  }
}
