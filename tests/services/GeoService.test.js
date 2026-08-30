import { GeoService } from '../../src/game/services/GeoService'

function makeFakeCapacitorGeo(initial = {}) {
  let permission = initial.permission ?? 'prompt'
  let position = initial.position ?? { coords: { latitude: 37.3859, longitude: -5.9930, accuracy: 12 } }
  let watchCbs = []
  let nextWatchId = 1

  return {
    checkPermissions: async () => ({ location: permission }),
    requestPermissions: async () => {
      permission = 'granted'
      return { location: permission }
    },
    getCurrentPosition: async () => position,
    watchPosition: async (_opts, cb) => {
      const id = String(nextWatchId++)
      watchCbs.push({ id, cb })
      // Emisión inmediata para simular una lectura
      cb(position, null)
      return id
    },
    clearWatch: async ({ id }) => {
      watchCbs = watchCbs.filter((w) => w.id !== id)
    },
    _setPermission: (p) => {
      permission = p
    },
    _setPosition: (p) => {
      position = p
    },
    _watches: () => watchCbs.length,
  }
}

function makeFakeNavGeo() {
  let nextWatchId = 1
  const watches = new Map()
  const position = { coords: { latitude: 37.3859, longitude: -5.9930, accuracy: 12 } }

  return {
    getCurrentPosition: (ok) => ok(position),
    watchPosition: (ok) => {
      const id = nextWatchId++
      watches.set(id, ok)
      ok(position)
      return id
    },
    clearWatch: (id) => {
      watches.delete(id)
    },
    _watches: () => watches.size,
  }
}

describe('GeoService — modo nativo', () => {
  it('checkPermission normaliza granted/denied', async () => {
    const geo = makeFakeCapacitorGeo({ permission: 'granted' })
    const svc = new GeoService({ isNative: true, geolocation: geo })
    expect(await svc.checkPermission()).toBe('granted')
    geo._setPermission('denied')
    expect(await svc.checkPermission()).toBe('denied')
  })

  it('checkPermission trata prompt-with-rationale como prompt', async () => {
    const geo = makeFakeCapacitorGeo({ permission: 'prompt-with-rationale' })
    const svc = new GeoService({ isNative: true, geolocation: geo })
    expect(await svc.checkPermission()).toBe('prompt')
  })

  it('getCurrentPosition devuelve coord normalizadas', async () => {
    const geo = makeFakeCapacitorGeo()
    const svc = new GeoService({ isNative: true, geolocation: geo })
    const pos = await svc.getCurrentPosition()
    expect(pos).toEqual({ lat: 37.3859, lon: -5.9930, accuracy: 12 })
  })

  it('watchPosition invoca el callback y stopWatch cancela', async () => {
    const geo = makeFakeCapacitorGeo()
    const svc = new GeoService({ isNative: true, geolocation: geo })
    const seen = []
    await svc.watchPosition((p) => seen.push(p))
    expect(seen).toHaveLength(1)
    expect(seen[0]).toEqual({ lat: 37.3859, lon: -5.9930, accuracy: 12 })
    expect(geo._watches()).toBe(1)
    await svc.stopWatch()
    expect(geo._watches()).toBe(0)
  })
})

describe('GeoService — openNativeSettings', () => {
  it('devuelve true si el plugin nativo abre los ajustes', async () => {
    const opened = []
    const nativeSettings = {
      open: async (opts) => {
        opened.push(opts)
        return { status: true }
      },
    }
    const svc = new GeoService({
      isNative: true,
      geolocation: makeFakeCapacitorGeo(),
      nativeSettings,
    })
    const ok = await svc.openNativeSettings()
    expect(ok).toBe(true)
    expect(opened).toHaveLength(1)
    expect(opened[0]).toHaveProperty('optionIOS')
    expect(opened[0]).toHaveProperty('optionAndroid')
  })

  it('devuelve false si el plugin falla', async () => {
    const nativeSettings = { open: async () => { throw new Error('nope') } }
    const svc = new GeoService({
      isNative: true,
      geolocation: makeFakeCapacitorGeo(),
      nativeSettings,
    })
    expect(await svc.openNativeSettings()).toBe(false)
  })

  it('en web devuelve false sin intentar abrir nada', async () => {
    let called = false
    const nativeSettings = {
      open: async () => {
        called = true
      },
    }
    const svc = new GeoService({
      isNative: false,
      navGeolocation: makeFakeNavGeo(),
      navPermissions: null,
      nativeSettings,
    })
    expect(await svc.openNativeSettings()).toBe(false)
    expect(called).toBe(false)
  })
})

describe('GeoService — onAppResume', () => {
  it('registra el callback en nativo y lo dispara al volver al foreground', async () => {
    let listener
    const fakeHandle = { remove: () => {} }
    const app = {
      addListener: (event, cb) => {
        listener = { event, cb }
        return Promise.resolve(fakeHandle)
      },
    }
    const svc = new GeoService({ isNative: true, geolocation: makeFakeCapacitorGeo(), app })
    const seen = []
    const unsub = svc.onAppResume(() => seen.push(true))
    expect(listener.event).toBe('appStateChange')
    listener.cb({ isActive: true })
    expect(seen).toEqual([true])
    // Estado no activo no dispara
    listener.cb({ isActive: false })
    expect(seen).toEqual([true])
    unsub()
  })
})

describe('GeoService — modo web', () => {
  it('getCurrentPosition usa navigator.geolocation y normaliza', async () => {
    const nav = makeFakeNavGeo()
    const svc = new GeoService({ isNative: false, navGeolocation: nav, navPermissions: null })
    const pos = await svc.getCurrentPosition()
    expect(pos).toEqual({ lat: 37.3859, lon: -5.9930, accuracy: 12 })
  })

  it('checkPermission devuelve unavailable si no hay geolocation', async () => {
    const svc = new GeoService({ isNative: false, navGeolocation: null, navPermissions: null })
    expect(await svc.checkPermission()).toBe('unavailable')
  })

  it('checkPermission usa navigator.permissions cuando existe', async () => {
    const nav = makeFakeNavGeo()
    const perms = { query: async () => ({ state: 'granted' }) }
    const svc = new GeoService({ isNative: false, navGeolocation: nav, navPermissions: perms })
    expect(await svc.checkPermission()).toBe('granted')
  })

  it('watchPosition/stopWatch delegan a navigator y limpian', async () => {
    const nav = makeFakeNavGeo()
    const svc = new GeoService({ isNative: false, navGeolocation: nav, navPermissions: null })
    const seen = []
    await svc.watchPosition((p) => seen.push(p))
    expect(seen).toHaveLength(1)
    expect(nav._watches()).toBe(1)
    await svc.stopWatch()
    expect(nav._watches()).toBe(0)
  })
})
