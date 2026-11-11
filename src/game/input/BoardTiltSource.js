// Fuente de inclinación: tabla de equilibrio física (ESP32 + MPU6050 por Bluetooth).
// El ESP32 ya calibra el centro al arrancar (o con su botón BOOT); calibrate()
// permite re-centrar desde el juego. Cada pulsación del microrruptor delantero
// llama a onPress (parar la barra de impulso / saltar / volver a jugar).
// Con el firmware de la bandera física (p6), raiseFlag() la sube y cada
// bandera cogida llama a onFlagGrab.

import { BOARD } from '../config/controlConfig'
import { BoardConnection, isBluetoothAvailable } from './boardConnection'

export class BoardTiltSource {
  constructor({ onPress = () => {}, onFlagGrab = () => {}, onStatus = () => {} } = {}) {
    this.onPress = onPress
    this.onFlagGrab = onFlagGrab
    this.flagPresent = false
    this.tilt = 0
    this.center = 0
    this.sensorError = false
    this.status = 'disconnected'
    this.statusText = 'Desconectada'
    this._lastPacketAt = 0
    this._lastPresses = null
    this._lastGrabs = null

    this.connection = new BoardConnection({
      onPacket: (packet, arrivalMs) => this._handlePacket(packet, arrivalMs),
      onStatus: (state, text) => {
        this.status = state
        this.statusText = text
        if (state === 'connected') {
          this._lastPresses = null
          this._lastGrabs = null
        }
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

  // Firmware con bandera, conectada y con el palo puesto en el portapalo
  hasPhysicalFlag() {
    return this.connection.hasFlag && this.isLive() && this.flagPresent
  }

  raiseFlag(holdMs) {
    return this.connection.raiseFlag(holdMs)
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

    this.flagPresent = packet.flagPresent
    if (packet.grabs === null) return
    if (this._lastGrabs !== null && packet.grabs !== this._lastGrabs) this.onFlagGrab()
    this._lastGrabs = packet.grabs
  }
}
