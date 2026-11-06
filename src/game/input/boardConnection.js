// Conexión Web Bluetooth con la tabla de equilibrio (ESP32).
// La usan el juego (modo tabla) y las páginas de hardware/tabla-equilibrio/.
// El protocolo debe coincidir con el firmware (p5_tabla, p6_tabla_bandera).

export const SERVICE_UUID = '6b1d0001-4c75-4361-9b2a-0a5ec0cafe01'
export const DATA_CHAR_UUID = '6b1d0002-4c75-4361-9b2a-0a5ec0cafe01'
export const PING_CHAR_UUID = '6b1d0003-4c75-4361-9b2a-0a5ec0cafe01'
export const FLAG_CHAR_UUID = '6b1d0004-4c75-4361-9b2a-0a5ec0cafe01'

const FLAG_BUTTON_DOWN = 0x01
const FLAG_SENSOR_ERROR = 0x02
const FLAG_FLAG_PRESENT = 0x04
const FLAG_FLAG_CYCLING = 0x08
const CMD_RAISE_FLAG = 0x01
const FLAG_PACKET_SIZE = 13
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
  // Solo con bandera física (p6): sin ella, grabs es null
  flagPresent: (view.getUint8(4) & FLAG_FLAG_PRESENT) !== 0,
  flagCycling: (view.getUint8(4) & FLAG_FLAG_CYCLING) !== 0,
  grabs: view.byteLength >= FLAG_PACKET_SIZE ? view.getUint8(12) : null,
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
    this.flagChar = null
    this.manualDisconnect = false
    this._handleValue = (event) => this.onPacket(parsePacket(event.target.value), performance.now())
    this._handleDisconnect = () => this._onDisconnected()
  }

  get isConnected() {
    return Boolean(this.device?.gatt?.connected)
  }

  get hasFlag() {
    return Boolean(this.flagChar)
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

  // Sube la bandera física; holdMs = tiempo arriba (lo limita el firmware a 100–3000 ms)
  async raiseFlag(holdMs) {
    if (!this.flagChar) return false
    try {
      await this.flagChar.writeValueWithoutResponse(
        new Uint8Array([CMD_RAISE_FLAG, holdMs & 0xff, (holdMs >> 8) & 0xff])
      )
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
    // El firmware sin bandera (p5) no tiene esta característica
    this.flagChar = await service.getCharacteristic(FLAG_CHAR_UUID).catch(() => null)
    dataChar.addEventListener('characteristicvaluechanged', this._handleValue)
    await dataChar.startNotifications()
    this.onStatus('connected', `Conectado a ${this.device.name}`)
  }

  async _onDisconnected() {
    this.pingChar = null
    this.flagChar = null

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
