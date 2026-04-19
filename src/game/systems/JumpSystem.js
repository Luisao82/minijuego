import { JUMP } from '../config/gameConfig'

// Sistema de salto — física balística del personaje sobre la cucaña
// Lógica pura: sin Phaser, sin referencias a la escena.
// GameScene orquesta: actualiza el jugador con la posición devuelta y gestiona transiciones.

export class JumpSystem {

  constructor() {
    this._elapsed = 0
    this._startX  = 0
    this._startY  = 0
    this._vx      = 0
    this._vy0     = 0
  }

  // Inicializa los parámetros del salto a partir del estado actual del personaje y la carrera
  start({ playerX, playerY, runElapsed, runDuration, initialSpeed, waterY, jumpDistance = JUMP.EXTRA_DISTANCE }) {
    this._elapsed = 0
    this._startX  = playerX
    this._startY  = playerY

    const t = runElapsed
    const T = runDuration
    const currentRunSpeed = T > 0 ? Math.max(initialSpeed * (1 - t / T), 0) : 0

    // Tiempo de vuelo hasta el agua: resuelve vy0*t + 0.5*g*t² = drop
    const drop         = waterY - playerY
    const a            = 0.5 * JUMP.GRAVITY
    const b            = JUMP.VY0
    const discriminant = b * b - 4 * a * (-drop)
    const flightTime   = (-b + Math.sqrt(discriminant)) / (2 * a)

    this._vx  = currentRunSpeed + jumpDistance / flightTime
    this._vy0 = JUMP.VY0
  }

  // Avanza la física del salto — retorna la nueva posición del personaje
  update(dt) {
    this._elapsed += dt
    const t = this._elapsed

    return {
      x: this._startX - this._vx * t,
      y: this._startY + this._vy0 * t + 0.5 * JUMP.GRAVITY * t * t,
    }
  }
}
