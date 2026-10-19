// Punto único de entrada del equilibrio, sea cual sea el modo de control.
// La escena de juego solo pregunta: "¿cuánta fuerza aplica el jugador?" y
// "¿hay fuerza extra?". Los botones siguen funcionando como siempre; en los
// modos analógicos la fuerza sale de la inclinación (móvil o tabla).
//
// Vive más allá de las escenas (singleton): el sensor y la conexión Bluetooth
// se mantienen entre partidas. La escena activa registra su handler de "tap"
// para que el microrruptor de la tabla actúe como tocar la pantalla.

import { CONTROL_MODES, CONTROL_MODELS } from '../config/controlConfig'
import { controlSettingsService } from '../services/ControlSettingsService'
import { AnalogBalanceSystem } from '../systems/AnalogBalanceSystem'
import { BalanceSystem } from '../systems/BalanceSystem'
import { VelocityBalanceSystem } from '../systems/VelocityBalanceSystem'
import { DeviceTiltSource } from './DeviceTiltSource'
import { BoardTiltSource } from './BoardTiltSource'

// Margen máximo entre límites rojos al ampliarlo con limitScale
const MAX_LIMIT = 0.95

class ControlInput {
  constructor(settings) {
    this.settings = settings
    this.analog = null
    this.lastInput = 0
    this._deviceTilt = null
    this._board = null
    this._tapHandler = null
  }

  get mode() {
    return this.settings.getMode()
  }

  isAnalog() {
    return this.mode !== CONTROL_MODES.BUTTONS
  }

  get deviceTilt() {
    if (!this._deviceTilt) this._deviceTilt = new DeviceTiltSource()
    return this._deviceTilt
  }

  get board() {
    if (!this._board) this._board = new BoardTiltSource({ onPress: () => this._tapHandler?.() })
    return this._board
  }

  setTapHandler(handler) {
    this._tapHandler = handler
  }

  clearTapHandler(handler) {
    if (this._tapHandler === handler) this._tapHandler = null
  }

  getTiltDeg() {
    if (this.mode === CONTROL_MODES.DEVICE_TILT) return this.deviceTilt.getTiltDeg()
    if (this.mode === CONTROL_MODES.BOARD) return this.board.getTiltDeg()
    return 0
  }

  // Sistema de equilibrio para esta partida. Con botones, el de siempre.
  // En los modos analógicos, según la calibración del modo: por fuerza
  // (BalanceSystem con drift y amortiguación ajustados) o por velocidad.
  // Los cambios de física desde el panel LAB se aplican en la siguiente partida.
  createBalanceSystem(bar) {
    if (!this.isAnalog()) return new BalanceSystem(bar)

    const tuning = this.settings.getTuning()
    bar.limit = Math.min(MAX_LIMIT, bar.limit * tuning.limitScale)

    if (tuning.model === CONTROL_MODELS.VELOCITY) return new VelocityBalanceSystem(bar, tuning)

    bar.extraDamping = tuning.dampingExtra
    return new BalanceSystem(bar, {
      driftScale: tuning.driftScale,
      growthScale: tuning.growthScale,
    })
  }

  // Arranque de la fase de equilibrio. Con el móvil, la forma en que lo
  // sujeta el jugador en ese momento pasa a ser "recto". La tabla no se
  // re-centra: el jugador acaba de inclinarse hacia delante para el impulso.
  beginBalance() {
    if (this.mode === CONTROL_MODES.DEVICE_TILT) this.deviceTilt.calibrate()
    this.analog = this.isAnalog() ? new AnalogBalanceSystem(this.settings.getTuning()) : null
  }

  balanceInput(buttonDirection) {
    if (!this.analog) {
      this.lastInput = buttonDirection
      return buttonDirection
    }
    // La calibración puede cambiar en vivo desde el panel LAB
    this.analog.tuning = this.settings.getTuning()
    this.lastInput = this.analog.inputFromTilt(this.getTiltDeg())
    return this.lastInput
  }

  // Vaivén y gravedad del modelo por fuerza. En el modelo por velocidad
  // la gravedad ya la aplica VelocityBalanceSystem.
  extraAcceleration(dt, position, greaseRatio) {
    if (!this.analog || this.analog.tuning.model === CONTROL_MODELS.VELOCITY) return 0
    return this.analog.extraAcceleration(dt, position, greaseRatio)
  }
}

export const controlInput = new ControlInput(controlSettingsService)
