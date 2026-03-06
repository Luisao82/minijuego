// Configuración de personajes
// Cada personaje tiene un sprite en: public/assets/sprites/characters/{id}.png

export const CHARACTERS = [
  {
    id: 'trianero',
    name: 'EL TRIANERO',
    description: 'Nacido y criado en Triana.\nEquilibrado en todo.',
    sprite: 'char-trianero',
    stats: { peso: 5, equilibrio: 4, altura: 5, edad: 5 },
    available: true,
  },
  {
    id: 'abuela',
    name: 'LA AGÜELA',
    description: 'Veterana de mil velás.\nSabiduría y temple.',
    sprite: 'char-abuela',
    stats: { peso: 10, equilibrio: 8, altura: 4, edad: 9 },
    available: true,
  },
  {
    id: 'chaval',
    name: 'ER CHAVAL',
    description: 'Joven y ágil.\nSin miedo a nada.',
    sprite: 'char-chaval',
    stats: { peso: 3, equilibrio: 4, altura: 3, edad: 2 },
    available: true,
  },
  {
    id: 'flamenca',
    name: 'LA FLAMENCA',
    description: 'Joven, guapa y alegre.\nCasi nunca pierde el equilibrio.',
    sprite: 'char-flamenca',
    stats: { peso: 4, equilibrio: 6, altura: 5, edad: 5 },
    available: true,
  },
  {
    id: 'guiri',
    name: 'El guiri',
    description: 'Turista despistado, que le gusta las tradiciones "baratas" de Sevillanas\nLe cuesta mantener el equilibrio.',
    sprite: 'char-guiri',
    stats: { peso: 4, equilibrio: 1, altura: 5, edad: 5 },
    available: true,
  },
]
