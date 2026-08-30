// Contenido narrativo de MapTutorialScene, alineado con el contrato de
// BaseNarratedScene (bloques con `pages: string[]`).
// Las imágenes `map-tut-XX` aún no existen: el equipo las aportará.
// Mientras tanto, BaseNarratedScene pinta un placeholder con el título.

export const MAP_TUTORIAL_BLOCKS = [
  {
    title: 'El Mapa de Sevilla',
    image: 'map-tut-01',
    pages: [
      '¡Aquí lo tienes! El Mapa de Sevilla, dividido en 15 piezas que se van desbloqueando conforme consigas la bandera con el MAX POWER. ¡Ya conoces cómo!',
    ],
  },
  {
    title: 'Los Retos',
    image: 'map-tut-02',
    pages: [
      'Además, el mapa esconde RETOS. Cada reto es una colección de fotos de sitios especiales de Sevilla que debes ir descubriendo. Al completar un reto se te desbloquea el siguiente.',
    ],
  },
  {
    title: 'Sevilla Esencial',
    image: 'map-tut-03',
    pages: [
      'El bloque "Sevilla Esencial" está disponible desde el principio. Contiene los sitios más emblemáticos: puedes ver sus fotos y leer su historia siempre que quieras.',
    ],
  },
  {
    title: 'Modo GPS',
    image: 'map-tut-04',
    pages: [
      'Los retos se desbloquean visitando los sitios EN PERSONA. Tu móvil detecta cuándo estás cerca (a 50 metros o menos) y podrás marcar la foto como visitada. ¡Este es el MODO GPS!',
    ],
  },
  {
    title: 'Modo metros',
    image: 'map-tut-05',
    pages: [
      '¿No estás en Sevilla o prefieres no usar el GPS? ¡Sin problema! En MODO METROS, cada partida cuenta. Los metros que recorras en el palo, aunque no cojas la bandera, te acercan al siguiente reto.',
    ],
  },
  {
    title: 'Elige tu modo',
    image: 'map-tut-06',
    pages: [
      'Cada modo tiene su propio sello y puedes cambiar de uno a otro cuando quieras desde el propio mapa.',
    ],
  },
]

export const MAP_TUTORIAL_END_TEXT = '¿Cómo prefieres empezar?'
