import { haversineDistance, latLonToPixel, isInBounds, pixelToPiece } from '../../src/game/utils/geo'

const BOUNDS = {
  nw: { lat: 37.4100, lon: -6.0100 },
  ne: { lat: 37.4100, lon: -5.9780 },
  sw: { lat: 37.3700, lon: -6.0100 },
  se: { lat: 37.3700, lon: -5.9780 },
}
const W = 600
const H = 1000

describe('haversineDistance', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineDistance(37.3859, -5.9930, 37.3859, -5.9930)).toBe(0)
  })

  it('mide correctamente ~1km (aprox.) entre dos puntos cercanos', () => {
    // Giralda a un punto ~1km al norte (misma lon, +0.009 lat ≈ 1km)
    const d = haversineDistance(37.3859, -5.9930, 37.3949, -5.9930)
    expect(d).toBeGreaterThan(990)
    expect(d).toBeLessThan(1010)
  })

  it('es simétrica', () => {
    const a = haversineDistance(37.3859, -5.9930, 37.3826, -5.9963)
    const b = haversineDistance(37.3826, -5.9963, 37.3859, -5.9930)
    expect(a).toBeCloseTo(b, 5)
  })

  it('Sevilla-Madrid es del orden de 390km', () => {
    // Giralda vs Puerta del Sol (aprox.)
    const d = haversineDistance(37.3859, -5.9930, 40.4168, -3.7038)
    expect(d).toBeGreaterThan(380000)
    expect(d).toBeLessThan(400000)
  })
})

describe('latLonToPixel', () => {
  it('NW cae en (0, 0)', () => {
    const p = latLonToPixel(BOUNDS.nw.lat, BOUNDS.nw.lon, BOUNDS, W, H)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
  })

  it('NE cae en (W, 0)', () => {
    const p = latLonToPixel(BOUNDS.ne.lat, BOUNDS.ne.lon, BOUNDS, W, H)
    expect(p.x).toBeCloseTo(W, 6)
    expect(p.y).toBeCloseTo(0, 6)
  })

  it('SW cae en (0, H)', () => {
    const p = latLonToPixel(BOUNDS.sw.lat, BOUNDS.sw.lon, BOUNDS, W, H)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(H, 6)
  })

  it('SE cae en (W, H)', () => {
    const p = latLonToPixel(BOUNDS.se.lat, BOUNDS.se.lon, BOUNDS, W, H)
    expect(p.x).toBeCloseTo(W, 6)
    expect(p.y).toBeCloseTo(H, 6)
  })

  it('el centro del rectángulo cae en el centro del mapa', () => {
    const cLat = (BOUNDS.nw.lat + BOUNDS.sw.lat) / 2
    const cLon = (BOUNDS.nw.lon + BOUNDS.ne.lon) / 2
    const p = latLonToPixel(cLat, cLon, BOUNDS, W, H)
    expect(p.x).toBeCloseTo(W / 2, 6)
    expect(p.y).toBeCloseTo(H / 2, 6)
  })
})

describe('isInBounds', () => {
  it('true para un punto interior', () => {
    expect(isInBounds(37.3900, -5.9950, BOUNDS)).toBe(true)
  })

  it('true para las esquinas exactas', () => {
    expect(isInBounds(BOUNDS.nw.lat, BOUNDS.nw.lon, BOUNDS)).toBe(true)
    expect(isInBounds(BOUNDS.se.lat, BOUNDS.se.lon, BOUNDS)).toBe(true)
  })

  it('false para un punto al norte del mapa', () => {
    expect(isInBounds(37.5000, -5.9950, BOUNDS)).toBe(false)
  })

  it('false para un punto al oeste del mapa', () => {
    expect(isInBounds(37.3900, -6.1000, BOUNDS)).toBe(false)
  })
})

describe('pixelToPiece', () => {
  it('(0, 0) cae en pieza (0, 0)', () => {
    expect(pixelToPiece(0, 0, 200)).toEqual({ row: 0, col: 0 })
  })

  it('un punto en el centro de la pieza (2, 1) devuelve (2, 1)', () => {
    // pieza row=2, col=1 → x ∈ [200, 400), y ∈ [400, 600)
    expect(pixelToPiece(300, 500, 200)).toEqual({ row: 2, col: 1 })
  })

  it('el borde exacto salta a la siguiente pieza', () => {
    expect(pixelToPiece(200, 200, 200)).toEqual({ row: 1, col: 1 })
  })
})
