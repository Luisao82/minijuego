// Contenido narrativo de HistoryScene.
// Cada bloque tiene un título, una imagen (key de asset) y varias páginas de texto.
// Para editar el guion, añadir bloques o cambiar imágenes, edita solo este archivo.

export const HISTORY_BLOCKS = [
  {
    title: 'La Velá de Santa Ana',
    image: 'hist-intro',
    pages: [
      '¡Escúcha mi arma! Te lo voy a contar una historia como si estuviéramos sentados con una "fresquita" en la calle Betis viendo caer la tarde.',
      'Para entender este juego, tienes que entender que Triana no es un barrio, es una religión. Y su fiesta mayor, la Velá, es el momento en que el corazón de Sevilla cruza el puente y se queda a vivir en la otra orilla.',
    ],
  },
  {
    title: 'El Milagro del Sabio',
    image: 'hist-sabio',
    pages: [
      'Todo este jaleo lo empezó Alfonso X, el que llamaban el Sabio. El pobre hombre tenía los ojos que no veía ni tres en un burro por una enfermedad "malaje".',
      'Se encomendó a la Señora Santa Ana, la abuela de todos los trianeros, y sin más, sanó por arte de "magia".',
      'En agradecimiento, mandó levantar esa joya que es la Parroquia de Santa Ana en 1266. De ese "ir de velada" nos queda el nombre de nuestra fiesta.',
    ],
  },
  {
    title: 'La Picaresca se echa al río',
    image: 'hist-picaresca',
    pages: [
      'Pero claro, en Triana el espíritu es inquieto. La gente rezaba, sí, pero luego el cuerpo pedía alegría. La fiesta bajó del altar a la orilla del Guadalquivir.',
      'Lo que eran rezos se convirtieron en cantes, en avellanas verdes —que se comen a espuertas— y en el olor a sardina asada que quita er sentio.',
      'La Velá pasó de ser un rito de iglesia a ser la feria del pueblo, donde el río es el que manda.',
    ],
  },
  {
    title: 'La Leyenda de la Cucaña',
    image: 'hist-leyenda',
    pages: [
      'Y aquí llegamos a lo que te interesa: la Cucaña. Dicen los antiguos que esto viene de los marineros y calafates que vivían en el barrio.',
      'Para demostrar quién tenía más "age" y más equilibrio, ponían un palo en la proa de los barcos que venían de las Indias.',
      'Un palo largo, embadurnado de grasa —¡que resbala más que una anguila en una bañera!— y al final, el trofeo: una banderita que te corona como el rey del río.',
      'Si llegas, eres un héroe; si te caes —que te vas a caer—, el chapuzón en el Guadalquivir te bautiza como trianero de pura cepa.',
    ],
  },
  {
    title: 'Tu Misión',
    image: 'hist-mision',
    pages: [
      'Ahora te toca a ti, mi arma. Vas a subirte a ese palo con el puente de Triana de fondo y la Giralda mirándote de reojo.\nTen cuidado, que el palo no tiene amigos y el río está esperando.',
      '¡Échale coraje, aprieta los dientes y no te olvides de la gracia, que en Triana hasta para caerse hay que tener arte!',
    ],
  },
]

// Texto que aparece al completar todos los bloques, antes del botón ¡A JUGAR!
export const HISTORY_END_TEXT = '¡Eso es todo, mi arma! ¡A por la bandera!'
