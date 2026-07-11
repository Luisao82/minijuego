import { initNativeStorageBridge } from '../../src/game/services/NativeStorageBridge'

// Fake de localStorage: objeto plano con la API de Storage
function makeFakeStorage(initial = {}) {
  let data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
    removeItem: (k) => {
      delete data[k]
    },
    key: (i) => Object.keys(data)[i] ?? null,
    get length() {
      return Object.keys(data).length
    },
    _dump: () => ({ ...data }),
  }
}

// Fake de Capacitor Preferences
function makeFakePrefs(initial = {}) {
  const data = { ...initial }
  return {
    keys: async () => ({ keys: Object.keys(data) }),
    get: async ({ key }) => ({ value: key in data ? data[key] : null }),
    set: async ({ key, value }) => {
      data[key] = value
    },
    remove: async ({ key }) => {
      delete data[key]
    },
    _dump: () => ({ ...data }),
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('NativeStorageBridge', () => {
  it('en web (no nativo) no hace nada y devuelve false', async () => {
    const storage = makeFakeStorage()
    const prefs = makeFakePrefs({ cucana_rewards: '{"a":1}' })
    const result = await initNativeStorageBridge({ isNative: false, preferences: prefs, storage })
    expect(result).toBe(false)
    expect(storage._dump()).toEqual({})
  })

  it('restaura desde Preferences las claves cucana_* que faltan en localStorage', async () => {
    const storage = makeFakeStorage()
    const prefs = makeFakePrefs({ cucana_rewards: '{"a":1}', otra_clave: 'x' })
    await initNativeStorageBridge({ isNative: true, preferences: prefs, storage })
    expect(storage.getItem('cucana_rewards')).toBe('{"a":1}')
    expect(storage.getItem('otra_clave')).toBe(null) // solo claves del juego
  })

  it('no pisa los datos que ya existen en localStorage', async () => {
    const storage = makeFakeStorage({ cucana_rewards: 'local' })
    const prefs = makeFakePrefs({ cucana_rewards: 'nativo' })
    await initNativeStorageBridge({ isNative: true, preferences: prefs, storage })
    expect(storage.getItem('cucana_rewards')).toBe('local')
  })

  it('copia a Preferences el progreso previo de localStorage (migración inicial)', async () => {
    const storage = makeFakeStorage({ cucana_skins: '{"trianero":{}}', ajeno: 'no' })
    const prefs = makeFakePrefs()
    await initNativeStorageBridge({ isNative: true, preferences: prefs, storage })
    await tick()
    expect(prefs._dump()).toEqual({ cucana_skins: '{"trianero":{}}' })
  })

  it('espeja en Preferences las escrituras y borrados posteriores de claves cucana_*', async () => {
    const storage = makeFakeStorage()
    const prefs = makeFakePrefs()
    await initNativeStorageBridge({ isNative: true, preferences: prefs, storage })

    storage.setItem('cucana_map', '{"unlocked":[]}')
    storage.setItem('temporal', 'x')
    await tick()
    expect(prefs._dump()).toEqual({ cucana_map: '{"unlocked":[]}' })

    storage.removeItem('cucana_map')
    await tick()
    expect(prefs._dump()).toEqual({})
    // localStorage sigue funcionando con normalidad
    expect(storage.getItem('temporal')).toBe('x')
  })
})
