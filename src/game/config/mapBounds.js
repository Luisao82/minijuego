// mapBounds — coordenadas GPS de las 4 esquinas del mapa ilustrado de
// Sevilla, y dimensiones en píxeles del sistema original del mapa.
//
// Las coord son una estimación inicial hecha a ojo sobre la screenshot
// original del mapa. Se irán afinando durante pruebas reales sobre el
// terreno; al ajustarlas aquí todos los POIs se recolocan automáticamente
// en el mapa ilustrado sin tocar sus lat/lon.

export const MAP_BOUNDS = {
  nw: { lat: 37.4100, lon: -6.0100 }, // Norte de Triana / La Cartuja oeste
  ne: { lat: 37.4100, lon: -5.9780 }, // Macarena / La Barzola
  sw: { lat: 37.3700, lon: -6.0100 }, // Sur de Los Remedios / Tablada
  se: { lat: 37.3700, lon: -5.9780 }, // Parque de María Luisa / Bermejales
}

// Dimensiones del mapa en píxeles originales.
// Alineado con MapScene (COLS=3, ROWS=5, PIECE_ORIGINAL_SIZE=200).
// Si cambian allí, cambiar aquí.
export const MAP_PIXEL_WIDTH = 600
export const MAP_PIXEL_HEIGHT = 1000
export const PIECE_ORIGINAL_SIZE = 200
