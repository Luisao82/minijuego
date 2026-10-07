// Fuente de inclinación: giroscopio/acelerómetro del propio móvil o tablet.
// Se juega como un volante: con el móvil en horizontal, girarlo en el plano
// de la pantalla. El ángulo sale de la gravedad proyectada en ese plano, así
// que da igual cuánto lo incline el jugador hacia sí (como en los juegos de coches).
//
// iOS exige pedir permiso (DeviceMotionEvent.requestPermission) desde un gesto
// del usuario; Android no. Requiere HTTPS o localhost.

import { DEVICE_TILT } from '../config/controlConfig'

const RAD_TO_DEG = 180 / Math.PI

// Diferencia de ángulos en el rango (-180, 180]
const wrapDegrees = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180

export class DeviceTiltSource {
  constructor() {
    this.listening = false
    this.center = 0
    this._gx = null
    this._gy = null
    this._onMotion = (event) => this._handleMotion(event)
  }

  static isSupported() {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
  }

  needsPermission() {
    return typeof window.DeviceMotionEvent?.requestPermission === 'function'
  }

  // Llamar desde un gesto del usuario (tap/click) para que iOS muestre el permiso
  async enable() {
    if (this.listening) return
    if (this.needsPermission()) {
      const result = await window.DeviceMotionEvent.requestPermission()
      if (result !== 'granted') throw new Error('Permiso del sensor de movimiento denegado')
    }
    window.addEventListener('devicemotion', this._onMotion)
    this.listening = true
  }

  disable() {
    window.removeEventListener('devicemotion', this._onMotion)
    this.listening = false
  }

  hasData() {
    return this._gx !== null
  }

  // La posición actual pasa a ser "recto"
  calibrate() {
    if (this.hasData()) this.center = this._rawDegrees()
  }

  getTiltDeg() {
    if (!this.hasData()) return 0
    return wrapDegrees(this._rawDegrees() - this.center)
  }

  _rawDegrees() {
    // Girar el móvil a la derecha (horario) hace decrecer atan2 → se invierte el signo
    return -Math.atan2(this._gx, this._gy) * RAD_TO_DEG
  }

  _handleMotion(event) {
    const g = event.accelerationIncludingGravity
    if (!g || g.x === null || g.y === null) return

    // Con el móvil casi plano la gravedad apenas cae en el plano de la pantalla
    if (Math.hypot(g.x, g.y) < DEVICE_TILT.MIN_GRAVITY_IN_PLANE) return

    // Suavizado sobre las componentes (no sobre el ángulo) para evitar saltos en ±180°
    const k = this.hasData() ? DEVICE_TILT.SMOOTHING : 0
    this._gx = this.hasData() ? this._gx * k + g.x * (1 - k) : g.x
    this._gy = this.hasData() ? this._gy * k + g.y * (1 - k) : g.y
  }
}
