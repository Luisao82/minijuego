// Ventana para coger la bandera física. Empieza cuando el personaje llega a
// la bandera y dura windowMs de tiempo real (no el de la cámara lenta).
// Un agarre que llega hasta graceMs después del final aún cuenta: el aviso de
// la tabla tarda unas decenas de ms en llegar por Bluetooth.
// Lógica pura: sin Phaser.

export class FlagWindowSystem {
  constructor({ windowMs, graceMs = 0 }) {
    this.windowMs = windowMs
    this.graceMs = graceMs
    this.elapsed = 0
    this.state = 'open' // open → grace → missed, o grabbed
  }

  get isOpen() {
    return this.state === 'open'
  }

  get remainingRatio() {
    return Math.max(0, 1 - this.elapsed / this.windowMs)
  }

  // Devuelve true en el momento en que se acaba el tiempo para el jugador
  update(deltaMs) {
    if (this.state !== 'open' && this.state !== 'grace') return false
    this.elapsed += deltaMs
    if (this.state === 'grace') {
      if (this.elapsed >= this.windowMs + this.graceMs) this.state = 'missed'
      return false
    }
    if (this.elapsed < this.windowMs) return false
    this.state = this.graceMs > 0 ? 'grace' : 'missed'
    return true
  }

  // Devuelve true si el agarre cuenta
  grab() {
    if (this.state !== 'open' && this.state !== 'grace') return false
    this.state = 'grabbed'
    return true
  }

  // El jugador ya ha caído al agua: un agarre tardío no cuenta
  close() {
    if (this.state === 'open' || this.state === 'grace') this.state = 'missed'
  }
}
