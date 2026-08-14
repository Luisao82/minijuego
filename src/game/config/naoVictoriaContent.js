// Contenido narrativo de la historia de la Nao Victoria contada en
// primera persona por un marinero superviviente de la expedición de
// Magallanes-Elcano. Se dispara desde el barco atracado ambient
// (barco "noa-victoria" en public/data/ambient-boats.json) al pulsarlo
// durante una partida.

export const NAO_VICTORIA_BLOCKS = [
  {
    title: 'La Nao Victoria',
    image: null,
    pages: [
      'Soy Juan, marinero de Sanlúcar. Zarpamos 245 hombres en cinco naos en 1519. Solo dieciocho volvimos, tres años después, en esta pequeña Victoria.',
      'Magallanes buscaba un paso al sur del Nuevo Mundo. Bajamos por Brasil hasta la Patagonia, donde vimos hombres tan altos que el capitán los llamó "patagones".',
    ],
  },
  {
    title: 'El estrecho y el Pacífico',
    image: null,
    pages: [
      'En octubre de 1520 encontramos el paso — hoy lo llaman Estrecho de Magallanes. Al salir, un océano tan calmo que lo bautizó "Pacífico". Noventa y nueve días sin ver tierra: comimos serrín, cuero cocido y ratas a un ducado cada una.',
      'En Filipinas, Magallanes murió atravesado por lanzas en la playa de Mactán. Elcano, un vasco de Guetaria, tomó el mando.',
    ],
  },
  {
    title: 'La vuelta al mundo',
    image: null,
    pages: [
      'Cargamos las Molucas de clavo y canela. Solo esta Victoria se atrevió a volver por el Índico. Los portugueses nos cazaron por sus aguas; perdimos veintiuno más.',
      'El 6 de septiembre de 1522 entramos en Sanlúcar. Éramos dieciocho fantasmas — y los primeros hombres en dar la vuelta al mundo.',
    ],
  },
]

export const NAO_VICTORIA_END_TEXT = 'Dieciocho hombres, tres años, una vuelta al mundo.'
