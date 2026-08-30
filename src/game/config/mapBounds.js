// mapBounds — coordenadas GPS de las 4 esquinas del mapa ilustrado de
// Sevilla, y dimensiones en píxeles del sistema original del mapa.
//
// Las coord son una estimación inicial hecha a ojo sobre la screenshot
// original del mapa. Se irán afinando durante pruebas reales sobre el
// terreno; al ajustarlas aquí todos los POIs se recolocan automáticamente
// en el mapa ilustrado sin tocar sus lat/lon.

// Esquinas medidas por el equipo sobre el mapa real de Google Maps.
// Debe mantenerse EN SINCRONÍA con el bloque `mapBounds` de
// public/assets/map/map-data.json (a día de hoy dos fuentes de verdad).
export const MAP_BOUNDS = {
  nw: { lat: 37.408546, lon: -6.014119 },
  ne: { lat: 37.408546, lon: -5.981311 },
  sw: { lat: 37.369732, lon: -6.014119 },
  se: { lat: 37.369732, lon: -5.981311 },
}

// Dimensiones del mapa en píxeles originales.
// Alineado con MapScene (COLS=3, ROWS=5, PIECE_ORIGINAL_SIZE=200).
// Si cambian allí, cambiar aquí.
export const MAP_PIXEL_WIDTH = 600
export const MAP_PIXEL_HEIGHT = 1000
export const PIECE_ORIGINAL_SIZE = 200

// Radio de tolerancia para el check-in de un POI (metros).
// Se ajustará con pruebas reales sobre el terreno; un valor mayor es
// más permisivo con el error del GPS urbano; menor exige estar más
// cerca del punto de vista de la foto.
export const CHECKIN_RADIUS_M = 50

// Longitud del palo en metros "reales", para convertir `distanceTraveled`
// (expresado en la unidad interna de cada vista — px en 2D, metros en 3D)
// al contador de metros del reto. Cada partida contribuye:
//   meters = (distanceTraveled / getPoleLength()) * POLE_METERS
// Estimación: una cucaña sevillana ronda 15 m. Ajustar si el ritmo de
// desbloqueo por partidas se siente flojo o excesivo.
export const POLE_METERS = 15
