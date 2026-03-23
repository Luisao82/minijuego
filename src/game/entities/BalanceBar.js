// Entidad de la barra de equilibrio — Fase 2 (Equilibrio)
// Modelo de inercia: drift e input acumulan velocity sobre la misma variable.
// El cursor empieza en el centro (posición = 0).
// Detecta cuando el cursor cruza el centro para que BalanceSystem invierta el drift.
// Lógica pura, sin dependencias de Phaser

import { BALANCE, DEBUG } from '../config/gameConfig'

export class BalanceBar {

  constructor(equilibrioStat) {
    this.velocity = 0
    this.driftAcceleration = 0
    this.inputDirection = 0
    this.equilibrioStat = equilibrioStat

    // Límite calculado según stat: equilibrio 10 = más separado (fácil), 0 = más junto (difícil)
    const t = Math.max(0, Math.min(10, equilibrioStat)) / 10
    this.limit = BALANCE.LIMIT_MIN + t * (BALANCE.LIMIT_MAX - BALANCE.LIMIT_MIN)

    // Empieza exactamente en el centro
    this.position = 0
    this.prevPosition = 0

    // Flag: el cursor cruzó el centro este frame
    this._centerCrossed = false
    // Input activo en el momento exacto del cruce (para evaluar si fue player-driven)
    this._inputAtCross = 0

    this.failed = false
  }

  setDriftAcceleration(accel) {
    this.driftAcceleration = accel
  }

  setInputDirection(dir) {
    this.inputDirection = dir
  }

  // Retorna true si el cursor cruzó el centro este frame (y resetea el flag)
  crossedCenter() {
    const crossed = this._centerCrossed
    this._centerCrossed = false
    return crossed
  }

  // Input que estaba activo en el momento exacto del último cruce de centro
  getInputAtLastCross() {
    return this._inputAtCross
  }

  update(dt) {
    if (this.failed) return

    this.prevPosition = this.position

    // 1. Aceleración del drift natural (impuesto por BalanceSystem)
    this.velocity += this.driftAcceleration * dt

    // 2. Contrafuerza del jugador (acumula velocity mientras se mantiene pulsado)
    this.velocity += this.inputDirection * BALANCE.INPUT_FORCE * dt

    // 3. Amortiguamiento: frena la velocity de forma natural al soltar el botón
    this.velocity *= (1 - BALANCE.DAMPING * dt)

    // 4. Cap de velocidad: evita acumulación descontrolada independientemente del modelo
    this.velocity = Math.max(-BALANCE.VELOCITY_CAP, Math.min(BALANCE.VELOCITY_CAP, this.velocity))

    // 5. Integrar posición
    this.position += this.velocity * dt

    // 6. Detectar cruce del centro (cambio de signo distinto de cero)
    // Se guarda el input activo EN ESTE MOMENTO para evitar el bug de timing de 1 frame
    const prevSign = Math.sign(this.prevPosition)
    const currSign = Math.sign(this.position)
    if (prevSign !== 0 && currSign !== 0 && prevSign !== currSign) {
      this._centerCrossed = true
      this._inputAtCross = this.inputDirection
    }

    // 7. Comprobar límites → caída (en modo debug: rebote en el límite sin caída)
    if (Math.abs(this.position) > this.limit) {
      if (DEBUG.BALANCE_PANEL) {
        this.position = Math.sign(this.position) * this.limit
        this.velocity = 0
      } else {
        this.failed = true
      }
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
