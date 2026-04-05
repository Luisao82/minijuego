// Configuración de personajes
// Cada personaje tiene un sprite en: public/assets/sprites/characters/{id}.png
//
// Todos los personajes aparecen en el carrusel. El estado de desbloqueo
// lo gestiona UnlockService (localStorage). Trianero y flamenca están
// siempre desbloqueados por defecto aunque se empiece en un navegador nuevo.

export const CHARACTERS = [
  {
    id: 'trianero',
    name: 'EL TRIANERO',
    description: 'Nacido y criado en Triana.\nEquilibrado en todo.',
    sprite: 'char-trianero',
    stats: { peso: 5, equilibrio: 4, altura: 5, edad: 5 },
    available: true,
    skins: [
      { spritesheet: 'trianero', nombre: 'Clásico', como: null },
      { spritesheet: 'nazareno', nombre: 'Nazareno', como: null },
      { spritesheet: 'feriante', nombre: 'Feriante', como: null },
      { spritesheet: 'costalero', nombre: 'Costalero', como: null },
      { spritesheet: 'armao', nombre: 'Armao', como: null },
    ],
  },
  {
    id: 'flamenca',
    name: 'LA FLAMENCA',
    description: 'Joven, guapa y alegre.\nCasi nunca pierde el equilibrio.',
    sprite: 'char-flamenca',
    stats: { peso: 4, equilibrio: 6, altura: 5, edad: 5 },
    available: true,
    skins: [
      { spritesheet: 'flamenca', nombre: 'Clásico', como: null },
      { spritesheet: 'nazarena', nombre: 'Nazarena', como: null },
      { spritesheet: 'mantilla', nombre: 'Mantilla', como: null },
    ],
  },
  {
    id: 'abuela',
    name: 'LA AGÜELA',
    description: 'Veterana de mil velás.\nSabiduría y temple.',
    sprite: 'char-abuela',
    stats: { peso: 10, equilibrio: 8, altura: 4, edad: 9 },
    available: true,
    skins: [
      { spritesheet: 'abuela', nombre: 'Omaita', como: null },
      { spritesheet: 'antonia', nombre: 'Antonia', como: null },
      { spritesheet: 'paco', nombre: 'Paco', como: null },
    ],
  },
  {
    id: 'chaval',
    name: 'ER CHAVAL',
    description: 'Joven y ágil.\nSin miedo a nada.',
    sprite: 'char-chaval',
    stats: { peso: 3, equilibrio: 4, altura: 3, edad: 2 },
    available: true,
    skins: [
      { spritesheet: 'chaval', nombre: 'Clásico', como: null },
    ],
  },
  {
    id: 'guiri',
    name: 'El guiri',
    description: 'Turista despistado, que le gusta las tradiciones "baratas" de Sevillanas\nLe cuesta mantener el equilibrio.',
    sprite: 'char-guiri',
    stats: { peso: 4, equilibrio: 1, altura: 5, edad: 5 },
    available: true,
    skins: [
      { spritesheet: 'guiri', nombre: 'Clásico', como: null },
    ],
  },
  {
    id: 'retro01',
    name: 'Personajes Retro',
    description: 'Personajes de juegos retro',
    sprite: 'char-retro01',
    stats: { peso: 2, equilibrio: 9, altura: 3, edad: 9 },
    available: true,
    skins: [
      { spritesheet: 'retro02', nombre: 'Mario', como: null },
      { spritesheet: 'retro01', nombre: 'Abu Simbel', como: null },
    ],
  },
]
