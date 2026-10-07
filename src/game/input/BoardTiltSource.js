// Fuente de inclinación: tabla de equilibrio física (ESP32 + MPU6050 por Bluetooth).
// El ESP32 ya calibra el centro al arrancar (o con su botón BOOT); calibrate()
// permite re-centrar desde el juego. Cada pulsación del microrruptor delantero
// llama a onPress (parar la barra de impulso / saltar / volver a jugar).

import { BOARD } from '../config/controlConfig'
import { BoardConnection, isBluetoothAvailable } from './boardConnection'

export class BoardTiltSource {
  constructor({ onPress = () => {}, onStatus = () => {} } = {}) {
    this.onPress = onPress
    this.tilt = 0
    this.center = 0
    this.sensorError = false
    this.status = 'disconnected'
    this.statusText = 'Desconectada'
    this._lastPacketAt = 0
    this._lastPresses = null

    this.connection = new BoardConnection({
      onPacket: (packet, arrivalMs) => this._handlePacket(packet, arrivalMs),
      onStatus: (state, text) => {
        this.status = state
        this.statusText = text
        if (state === 'connected') this._lastPresses = null
        onStatus(state, text)
      },
    })
  }

  static isSupported() {
    return isBluetoothAvailable()
  }

  // Llamar desde un gesto del usuario: el navegador muestra el selector de dispositivos
  connect() {
    return this.connection.connect()
  }

  disconnect() {
    this.connection.disconnect()
  }

  isLive() {
    return performance.now() - this._lastPacketAt < BOARD.STALE_MS
  }

  calibrate() {
    this.center = this.tilt
  }

  getTiltDeg() {
    return this.isLive() && !this.sensorError ? this.tilt - this.center : 0
  }

  _handlePacket(packet, arrivalMs) {
    this._lastPacketAt = arrivalMs
    this.tilt = packet.tilt
    this.sensorError = packet.sensorError

    // El contador de pulsaciones no pierde ninguna aunque un paquete llegue tarde
    if (this._lastPresses !== null && packet.presses !== this._lastPresses) this.onPress()
    this._lastPresses = packet.presses
  }
}
