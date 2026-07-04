import { MOVEMENT } from '../config/gameConfig'

// Sistema de avance por el palo — física de la carrera tras el impulso.
// Lógica pura: sin Phaser, sin referencias a la escena.
// La escena orquesta y traduce `distance` a su representación
// (píxeles en las vistas 2D, metros en la vista 3D).

const MIN_EFFECTIVE_IMPULSE = 0.01

export class RunSystem {
  constructor(poleLength) {
    this._poleLength = poleLength
    this._maxDistance = 0
    this._duration = 0
    this._initialSpeed = 0
    this._elapsed = 0
    this._distance = 0
    this._finished = false
    this._stalled = false
  }

  // Calcula los parámetros de la carrera a partir del impulso (0..1).
  // Un impulso por debajo del mínimo efectivo no mueve al personaje (stalled).
  start(impulse) {
    if (impulse <= MIN_EFFECTIVE_IMPULSE) {
      this._stalled = true
      this._finished = true
      return
    }

    this._maxDistance = impulse * this._poleLength
    this._duration =
      MOVEMENT.MIN_RUN_DURATION + impulse * (MOVEMENT.MAX_RUN_DURATION - MOVEMENT.MIN_RUN_DURATION)
    this._initialSpeed = (2 * this._maxDistance) / this._duration
  }

  // Avanza la carrera con deceleración lineal: d(t) = v0·t·(1 − t/2T).
  // Al agotar la duración, la distancia queda clavada en el máximo alcanzado.
  update(dt) {
    if (this._finished) return this._distance

    this._elapsed += dt

    if (this._elapsed >= this._duration) {
      this._elapsed = this._duration
      this._distance = Math.min(this._maxDistance, this._poleLength)
      this._finished = true
      return this._distance
    }

    const t = this._elapsed
    const T = this._duration
    this._distance = this._initialSpeed * t * (1 - t / (2 * T))
    return this._distance
  }

  // Clava la distancia al final del palo (al coger la bandera)
  forceToEnd() {
    this._distance = this._poleLength
    this._finished = true
  }

  get distance() {
    return this._distance
  }

  get elapsed() {
    return this._elapsed
  }

  get duration() {
    return this._duration
  }

  get initialSpeed() {
    return this._initialSpeed
  }

  // Velocidad instantánea — 0 una vez terminada la carrera
  get currentSpeed() {
    if (this._finished || this._duration <= 0) return 0
    return Math.max(0, this._initialSpeed * (1 - this._elapsed / this._duration))
  }

  get progressRatio() {
    if (this._poleLength <= 0) return 0
    return Math.max(0, Math.min(1, this._distance / this._poleLength))
  }

  get finished() {
    return this._finished
  }

  get stalled() {
    return this._stalled
  }
}
