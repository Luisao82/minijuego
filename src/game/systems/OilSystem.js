// Sistema de grasa del palo — gestiona la dificultad acumulada entre intentos
// El palo se divide en NUM_ZONES zonas. Cada zona tiene un nivel de grasa (0-100%).
// La grasa se desgasta mientras el personaje pasa por esa zona.
// Persiste en sessionStorage → resiste reinicios pero no cierre del navegador.
// Se resetea al 100% cuando el jugador coge la bandera.

import { OIL } from '../config/gameConfig'

export class OilSystem {

  constructor() {
    this.zones = new Array(OIL.NUM_ZONES).fill(100)
    this._load()
  }

  // Desgastar la zona activa según el tiempo transcurrido
  // progressRatio: posición del personaje en el palo (0 = inicio, 1 = bandera)
  update(dt, progressRatio) {
    if (progressRatio < 0 || progressRatio > 1) return
    const i = this._zoneIndex(progressRatio)
    this.zones[i] = Math.max(0, this.zones[i] - OIL.WEAR_RATE * dt)
    this._save()
  }

  // % de grasa en la zona donde está el personaje
  getZoneGrease(progressRatio) {
    return this.zones[this._zoneIndex(progressRatio)]
  }

  // Multiplicador de drift para la zona actual (0 sin grasa → OIL.DRIFT_MULTIPLIER al 100%)
  getDriftMultiplier(progressRatio) {
    return (this.getZoneGrease(progressRatio) / 100) * OIL.DRIFT_MULTIPLIER
  }

  // % total de grasa en todo el palo (media de todas las zonas)
  getTotalGrease() {
    return Math.round(this.zones.reduce((a, b) => a + b, 0) / OIL.NUM_ZONES)
  }

  getZones() {
    return this.zones
  }

  // Resetear al 100% (cuando se coge la bandera)
  reset() {
    this.zones.fill(100)
    try { sessionStorage.removeItem('cucana_oil') } catch(e) {}
  }

  _zoneIndex(progressRatio) {
    return Math.min(OIL.NUM_ZONES - 1, Math.floor(progressRatio * OIL.NUM_ZONES))
  }

  _save() {
    try { sessionStorage.setItem('cucana_oil', JSON.stringify(this.zones)) } catch(e) {}
  }

  _load() {
    try {
      const raw = sessionStorage.getItem('cucana_oil')
      if (raw) this.zones = JSON.parse(raw)
    } catch(e) {}
  }
}
