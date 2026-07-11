// Puente de persistencia nativa (Capacitor Preferences).
//
// En web el progreso vive en localStorage y este módulo no hace nada.
// En la app nativa, iOS trata el almacenamiento del WebView (localStorage
// incluido) como purgable: puede borrarlo si el dispositivo va justo de
// espacio. Este puente duplica cada escritura de localStorage con prefijo
// `cucana_` en Preferences (UserDefaults en iOS / SharedPreferences en
// Android), que sí es duradero, y al arrancar restaura en localStorage lo
// que falte. Los servicios siguen usando localStorage síncrono: cero cambios
// en el resto del código, y cualquier clave `cucana_*` futura queda cubierta
// automáticamente.
//
// Uso (una vez, antes de arrancar Phaser — ver src/main.js):
//   await initNativeStorageBridge()
//
// `deps` permite inyectar fakes en tests: { isNative, preferences, storage }.

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KEY_PREFIX = 'cucana_'

export async function initNativeStorageBridge(deps = {}) {
  const isNative = deps.isNative ?? Capacitor.isNativePlatform()
  if (!isNative) return false

  const prefs = deps.preferences ?? Preferences
  const storage = deps.storage ?? window.localStorage

  // 1. Restaurar: claves que están en Preferences pero no en localStorage
  //    (WebView purgado por iOS, o primer arranque tras reinstalar)
  const { keys } = await prefs.keys()
  for (const key of keys) {
    if (!key.startsWith(KEY_PREFIX)) continue
    if (storage.getItem(key) !== null) continue
    const { value } = await prefs.get({ key })
    if (value !== null) storage.setItem(key, value)
  }

  // 2. Copia inicial: progreso que ya existía en localStorage (jugadores
  //    anteriores a este puente) pasa a Preferences
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(KEY_PREFIX)) {
      prefs.set({ key, value: storage.getItem(key) })
    }
  }

  // 3. Espejo: toda escritura/borrado futuro de claves `cucana_*` se duplica
  //    en Preferences (fire-and-forget: el juego no espera al disco nativo).
  //    Se parchea el prototipo porque los Storage reales no permiten
  //    sombrear sus métodos por asignación en la instancia.
  const target = deps.storage ? storage : Object.getPrototypeOf(storage)
  const originalSet = target.setItem
  const originalRemove = target.removeItem

  target.setItem = function (key, value) {
    originalSet.call(this, key, value)
    if (this === storage && String(key).startsWith(KEY_PREFIX)) {
      prefs.set({ key: String(key), value: String(value) })
    }
  }
  target.removeItem = function (key) {
    originalRemove.call(this, key)
    if (this === storage && String(key).startsWith(KEY_PREFIX)) {
      prefs.remove({ key: String(key) })
    }
  }

  return true
}
