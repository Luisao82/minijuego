// GeoService — único punto que toca la geolocalización nativa (Capacitor)
// o del navegador. El resto del juego consume este servicio, no las APIs.
//
// Estados de permiso normalizados que devuelve este servicio:
//   'granted'      — el usuario aceptó
//   'denied'       — el usuario rechazó (en móvil, no se le vuelve a preguntar)
//   'prompt'       — no se ha preguntado todavía (o el navegador puede preguntar)
//   'unavailable'  — el dispositivo/navegador no soporta geolocalización
//
// `deps` permite inyectar fakes en tests:
//   { isNative, geolocation, navGeolocation, navPermissions }

import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { App } from '@capacitor/app'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'

const DEFAULT_TIMEOUT = 10000

function normalizeCapacitorState(state) {
  if (state === 'granted') return 'granted'
  if (state === 'denied') return 'denied'
  return 'prompt'
}

function normalizeCoords(pos) {
  return {
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  }
}

export class GeoService {
  constructor(deps = {}) {
    this._isNative = deps.isNative ?? Capacitor.isNativePlatform()
    this._geolocation = deps.geolocation ?? Geolocation
    this._navGeolocation =
      deps.navGeolocation ?? (typeof navigator !== 'undefined' ? navigator.geolocation : null)
    this._navPermissions =
      deps.navPermissions ?? (typeof navigator !== 'undefined' ? navigator.permissions : null)
    this._nativeSettings = deps.nativeSettings ?? NativeSettings
    this._app = deps.app ?? App
    this._watchId = null
    this._resumeHandle = null
  }

  async checkPermission() {
    if (this._isNative) {
      try {
        const status = await this._geolocation.checkPermissions()
        return normalizeCapacitorState(status.location)
      } catch (_) {
        return 'unavailable'
      }
    }
    if (!this._navGeolocation) return 'unavailable'
    if (!this._navPermissions) return 'prompt'
    try {
      const result = await this._navPermissions.query({ name: 'geolocation' })
      return result.state
    } catch (_) {
      return 'prompt'
    }
  }

  async requestPermission() {
    if (this._isNative) {
      try {
        const status = await this._geolocation.requestPermissions({ permissions: ['location'] })
        return normalizeCapacitorState(status.location)
      } catch (_) {
        return 'unavailable'
      }
    }
    // Web: no hay API explícita de request; se pide implícitamente al
    // llamar a getCurrentPosition.
    return this.checkPermission()
  }

  async getCurrentPosition() {
    if (this._isNative) {
      const pos = await this._geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: DEFAULT_TIMEOUT,
      })
      return normalizeCoords(pos)
    }
    if (!this._navGeolocation) throw new Error('Geolocation not available')
    return new Promise((resolve, reject) => {
      this._navGeolocation.getCurrentPosition(
        (pos) => resolve(normalizeCoords(pos)),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: DEFAULT_TIMEOUT }
      )
    })
  }

  async watchPosition(callback, errorCallback = null) {
    await this.stopWatch()
    if (this._isNative) {
      this._watchId = await this._geolocation.watchPosition(
        { enableHighAccuracy: true },
        (pos, err) => {
          if (err) {
            if (errorCallback) errorCallback(err)
            return
          }
          if (!pos) return
          callback(normalizeCoords(pos))
        }
      )
      return
    }
    if (!this._navGeolocation) throw new Error('Geolocation not available')
    this._watchId = this._navGeolocation.watchPosition(
      (pos) => callback(normalizeCoords(pos)),
      (err) => {
        if (errorCallback) errorCallback(err)
      },
      { enableHighAccuracy: true }
    )
  }

  async stopWatch() {
    if (this._watchId === null) return
    const id = this._watchId
    this._watchId = null
    if (this._isNative) {
      try {
        await this._geolocation.clearWatch({ id })
      } catch (_) {}
    } else if (this._navGeolocation) {
      this._navGeolocation.clearWatch(id)
    }
  }

  // Abre la ficha de ajustes de la app en el sistema operativo (allí el
  // usuario puede reactivar el permiso de ubicación si lo rechazó antes).
  // En web no hay equivalente universal: devuelve false y la UI debe
  // mostrar un mensaje explicando cómo llegar a los ajustes del navegador.
  async openNativeSettings() {
    if (!this._isNative) return false
    try {
      await this._nativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      })
      return true
    } catch (_) {
      return false
    }
  }

  // Registra un callback que se llamará cada vez que la app vuelva al
  // foreground (útil para re-consultar `checkPermission()` tras un viaje
  // del usuario a los ajustes del sistema). Devuelve una función para
  // cancelar la suscripción.
  //
  // En web se traduce a los eventos `focus` + `visibilitychange` de la
  // pestaña, que no son exactamente lo mismo pero cubren el caso equivalente.
  onAppResume(callback) {
    if (this._isNative && this._app?.addListener) {
      let handle
      const promise = this._app.addListener('appStateChange', (state) => {
        if (state.isActive) callback()
      })
      Promise.resolve(promise).then((h) => {
        handle = h
      })
      return () => {
        if (handle?.remove) handle.remove()
      }
    }
    if (typeof window === 'undefined') return () => {}
    const onVisible = () => {
      if (document.visibilityState === 'visible') callback()
    }
    window.addEventListener('focus', callback)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', callback)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

export const geoService = new GeoService()
