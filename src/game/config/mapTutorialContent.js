// Contenido narrativo de MapTutorialScene.
// Cada bloque tiene un título, una imagen (clave de asset) y un texto que
// se muestra con efecto máquina de escribir carácter a carácter — el mismo
// patrón que tutorialContent.js. Para editar el guion, tocar solo este
// archivo.
//
// Las imágenes `map-tut-XX` aún no existen: el equipo las aportará. Mientras
// tanto la escena no dibuja imagen y el diálogo se ve solo.

export const MAP_TUTORIAL_BLOCKS = [
  {
    title: 'El Mapa de Sevilla',
    image: 'map-tut-01',
    text:
      '¡Aquí lo tienes! El Mapa de Sevilla, dividido en 15 piezas que se van desbloqueando conforme consigas la bandera con el MAX POWER. ¡Ya conoces cómo!',
  },
  {
    title: 'Los Retos',
    image: 'map-tut-02',
    text:
      'Además, el mapa esconde RETOS. Cada reto es una colección de fotos de sitios especiales de Sevilla que debes ir descubriendo. Al completar un reto se te desbloquea el siguiente.',
  },
  {
    title: 'Sevilla Esencial',
    image: 'map-tut-03',
    text:
      'El bloque "Sevilla Esencial" está disponible desde el principio. Contiene los sitios más emblemáticos: puedes ver sus fotos y leer su historia siempre que quieras.',
  },
  {
    title: 'Modo GPS',
    image: 'map-tut-04',
    text:
      'Los retos se desbloquean visitando los sitios EN PERSONA. Tu móvil detecta cuándo estás cerca (a 50 metros o menos) y podrás marcar la foto como visitada. ¡Este es el MODO GPS!',
  },
  {
    title: 'Modo metros',
    image: 'map-tut-05',
    text:
      '¿No estás en Sevilla o prefieres no usar el GPS? ¡Sin problema! En MODO METROS, cada partida cuenta. Los metros que recorras en el palo, aunque no cojas la bandera, te acercan al siguiente reto.',
  },
  {
    title: 'Elige tu modo',
    image: 'map-tut-06',
    text:
      'Cada modo tiene su propio sello. Puedes cambiar de uno a otro cuando quieras desde el propio mapa. ¿Cómo prefieres empezar?',
  },
]
