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
      { spritesheet: 'trianero', nombre: 'Clásico', flags: null },
      { spritesheet: 'nazareno', nombre: 'Nazareno', flags: 5 },
      { spritesheet: 'feriante', nombre: 'Feriante', flags: 10 },
      { spritesheet: 'costalero', nombre: 'Costalero', flags: 15 },
      { spritesheet: 'armao', nombre: 'Armao', flags: 20 },
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
      { spritesheet: 'flamenca', nombre: 'Clásico', flags: null },
      { spritesheet: 'nazarena', nombre: 'Nazarena', flags: 5 },
      { spritesheet: 'mantilla', nombre: 'Mantilla', flags: 10 },
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
      { spritesheet: 'abuela', nombre: 'Omaita', flags: null },
      { spritesheet: 'antonia', nombre: 'Antonia', flags: 5 },
      { spritesheet: 'paco', nombre: 'Paco', flags: 10 },
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
      { spritesheet: 'chaval', nombre: 'Clásico', flags: null },
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
      { spritesheet: 'guiri', nombre: 'Clásico', flags: null },
    ],
  },
  {
    id: 'cunaos',
    name: 'Los cuñaos',
    description: '¿Los tipicos que saben de todo? Pues esos.\nEllos lo hacen mejor y más barato',
    sprite: 'char-cunaos',
    stats: { peso: 4, equilibrio: 2, altura: 4, edad: 6 },
    available: true,
    skins: [
      { spritesheet: 'rafi', nombre: 'Rafi', flags: null },
      { spritesheet: 'fali', nombre: 'Fali', flags: null },
      { spritesheet: 'rafi-pelicula', nombre: 'El mundo es suyo ...', flags: 5 },
      { spritesheet: 'fali-pelicula', nombre: '...y es suyo', flags: 5 },
      { spritesheet: 'rafi-equipo', nombre: 'Manquepierda', flags: 10 },
      { spritesheet: 'fali-equipo', nombre: 'Hasta la muerte', flags: 10 },
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
      { spritesheet: 'retro02', nombre: 'Mario', flags: null },
      { spritesheet: 'retro01', nombre: 'Abu Simbel', flags: 5 },
      { spritesheet: 'retro03', nombre: 'Dan', flags: 10 },
    ],
  },
]
