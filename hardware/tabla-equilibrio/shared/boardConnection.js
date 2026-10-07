// Conexión Web Bluetooth con la tabla de equilibrio (ESP32).
// Compartido entre la página de diagnóstico y el simulador.
// El protocolo debe coincidir con firmware/p3_ble_simulado y p4_giroscopio.

export const SERVICE_UUID = '6b1d0001-4c75-4361-9b2a-0a5ec0cafe01'
export const DATA_CHAR_UUID = '6b1d0002-4c75-4361-9b2a-0a5ec0cafe01'
export const PING_CHAR_UUID = '6b1d0003-4c75-4361-9b2a-0a5ec0cafe01'

const FLAG_BUTTON_DOWN = 0x01
const FLAG_SENSOR_ERROR = 0x02
const RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 1000

export const isBluetoothAvailable = () => Boolean(navigator.bluetooth)

export const parsePacket = (view) => ({
  seq: view.getUint16(0, true),
  tilt: view.getInt16(2, true) / 100,
  buttonDown: (view.getUint8(4) & FLAG_BUTTON_DOWN) !== 0,
  sensorError: (view.getUint8(4) & FLAG_SENSOR_ERROR) !== 0,
  presses: view.getUint8(5),
  echo: view.getUint16(6, true),
})

// Callbacks:
//   onPacket(packet, arrivalMs)
//   onStatus(state, text) — state: 'connecting' | 'connected' | 'reconnecting' | 'lost' | 'disconnected' | 'failed'
export class BoardConnection {
  constructor({ onPacket = () => {}, onStatus = () => {} } = {}) {
    this.onPacket = onPacket
    this.onStatus = onStatus
    this.device = null
    this.pingChar = null
    this.manualDisconnect = false
    this._handleValue = (event) => this.onPacket(parsePacket(event.target.value), performance.now())
    this._handleDisconnect = () => this._onDisconnected()
  }

  get isConnected() {
    return Boolean(this.device?.gatt?.connected)
  }

  async connect() {
    this.manualDisconnect = false
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
    })
    this.device.addEventListener('gattserverdisconnected', this._handleDisconnect)
    await this._attach()
  }

  disconnect() {
    this.manualDisconnect = true
    this.device?.gatt?.disconnect()
  }

  async ping(id) {
    if (!this.pingChar) return false
    try {
      await this.pingChar.writeValueWithoutResponse(new Uint8Array([id & 0xff, id >> 8]))
      return true
    } catch {
      return false
    }
  }

  async _attach() {
    this.onStatus('connecting', 'Conectando…')
    const server = await this.device.gatt.connect()
    const service = await server.getPrimaryService(SERVICE_UUID)
    const dataChar = await service.getCharacteristic(DATA_CHAR_UUID)
    this.pingChar = await service.getCharacteristic(PING_CHAR_UUID)
    dataChar.addEventListener('characteristicvaluechanged', this._handleValue)
    await dataChar.startNotifications()
    this.onStatus('connected', `Conectado a ${this.device.name}`)
  }

  async _onDisconnected() {
    this.pingChar = null

    if (this.manualDisconnect) {
      this.onStatus('disconnected', 'Desconectado')
      return
    }

    this.onStatus('lost', '¡Conexión perdida! Reintentando…')
    for (let i = 1; i <= RECONNECT_ATTEMPTS; i++) {
      try {
        this.onStatus('reconnecting', `Reconectando (${i}/${RECONNECT_ATTEMPTS})…`)
        await this._attach()
        return
      } catch {
        await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS))
      }
    }
    this.onStatus('failed', 'No se pudo reconectar')
  }
}
