// geo — utilidades puras para GPS: distancia y conversión lat/lon <-> pixel.
// Sin dependencias externas ni Phaser. Testeables al 100%.

const EARTH_RADIUS_M = 6371000

const toRad = (deg) => (deg * Math.PI) / 180

// Distancia en metros entre dos puntos GPS (fórmula haversine).
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

// Convierte una coord GPS a píxel del mapa ilustrado.
// bounds = { nw, ne, sw, se } con {lat, lon} cada uno.
// Devuelve { x, y } en píxeles del sistema original del mapa.
//
// Interpolación lineal asumiendo rectángulo alineado con los ejes lat/lon.
// Para el mapa de Sevilla (pocos km) la deformación es despreciable.
export function latLonToPixel(lat, lon, bounds, mapWidth, mapHeight) {
  const latRange = bounds.nw.lat - bounds.sw.lat
  const lonRange = bounds.ne.lon - bounds.nw.lon
  const x = ((lon - bounds.nw.lon) / lonRange) * mapWidth
  const y = ((bounds.nw.lat - lat) / latRange) * mapHeight
  return { x, y }
}

// True si la coord cae dentro del rectángulo de las 4 esquinas.
export function isInBounds(lat, lon, bounds) {
  return (
    lat <= bounds.nw.lat &&
    lat >= bounds.sw.lat &&
    lon >= bounds.nw.lon &&
    lon <= bounds.ne.lon
  )
}

// Deriva la pieza (row, col) a la que pertenece un pixel global del mapa.
// pieceSize en las mismas unidades que x, y.
export function pixelToPiece(x, y, pieceSize) {
  return {
    row: Math.floor(y / pieceSize),
    col: Math.floor(x / pieceSize),
  }
}
