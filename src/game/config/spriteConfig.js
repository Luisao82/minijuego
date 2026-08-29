// Configuración del spritesheet de personajes.
// Cada personaje tiene un único fichero PNG con todos sus frames.
// Convención de nombre: public/assets/sprites/characters/{characterId}.png
// Si el fichero no existe, se usa 'sprite-default' como fallback.

export const SPRITE_CONFIG = {
  frameWidth: 16,
  frameHeight: 24,
  scale: 3, // renderizado a 48×72 px en juego
  scalePreview: 8, // renderizado a 128×192 px en SkinSelectScene
}

// Índices de frame dentro del spritesheet (tira horizontal).
// Orden y posición deben respetarse al crear cada spritesheet.
//
//  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
//  │  0   │  1   │  2   │  3   │  4   │  5   │  6   │  7   │  8   │  9   │  10  │
//  │STAND │ WALK │ JUMP │STAND │ JUMP │CELEB │CELEB │ FALL │WATER │PUSH  │PUSH  │
//  │      │      │      │_FLAG │_FLAG │  _A  │  _B  │      │      │  _A  │  _B  │
//  │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │
//  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
//  ← 176px total (11 × 16px) ──────────────────────────────────────────────────→
//
// Reutilización de frames por estado:
//   FALLING_FLAG (caída con bandera cogida sin saltar) → usa STAND_FLAG (3)
//   No existe un frame dedicado para caída con bandera; STAND_FLAG es la
//   pose más representativa en ese contexto (personaje erguido con bandera).
//
// Frames PUSH_A / PUSH_B: personaje agarrado al brazo de un compañero para
// coger carrerilla — se alternan durante la fase de impulso. Al soltar la
// barra, PUSH_A hace de frame de transición antes de arrancar la carrera
// (STAND ↔ WALK). Ver Player.setPushing().
export const SPRITE_FRAMES = {
  STAND: 0, // de pie, estático o corriendo lento
  WALK: 1, // paso de carrera (alterna con STAND)
  JUMP: 2, // en el aire sin bandera
  STAND_FLAG: 3, // de pie sujetando la bandera — también usado en FALLING_FLAG
  JUMP_FLAG: 4, // en el aire sujetando la bandera (solo al saltar con bandera)
  CELEB_A: 5, // celebración A — cabeza fuera del agua, brazo abajo
  CELEB_B: 6, // celebración B — cabeza fuera del agua, brazo arriba
  FALL: 7, // cayendo sin haber saltado (gesto de susto)
  WATER: 8, // en el agua sin bandera — solo la cabeza asomando
  PUSH_A: 9, // empuje A — agarrado al brazo (alterna con PUSH_B)
  PUSH_B: 10, // empuje B — agarrado al brazo (alterna con PUSH_A)
}
