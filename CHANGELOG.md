# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Fase 1 — Impulso ("La carrera"): barra de poder con aceleración progresiva, zonas roja/amarilla/verde y máximo 3 pasadas.
- Entidad `PowerBar` (entities/PowerBar.js): modelo puro de la barra de poder con posición, velocidad, zonas e impulso.
- Sistema `ImpulseSystem` (systems/ImpulseSystem.js): lógica de negocio para la mecánica de impulso (aceleración, reset, parada y cálculo de resultado).
- Constantes de Fase 1 en `gameConfig.js` (`PHASE1`): velocidad base, aceleración, factor de peso, zonas y dimensiones de la barra.
- Influencia del peso del personaje en la dificultad de la barra (más peso = más aceleración = más difícil).
- Movimiento del personaje tras el impulso: avanza por el palo de derecha a izquierda con desaceleración progresiva.
- Caída al agua con efecto splash cuando el personaje se queda sin impulso.
- Pantalla de game over con distancia alcanzada y opción de reinicio.
- Constantes `POLE` y `MOVEMENT` en `gameConfig.js` para posiciones del palo y parámetros de movimiento.
- Fondo pixel art (`fondo_a.png` 256×192) para la escena de juego, escalado ×4 con filtro NEAREST.
- Panel de control inferior (1/5 de pantalla, ~154px) como zona dedicada para controles del jugador.
- Constante `CONTROL_PANEL` en `gameConfig.js` con dimensiones y posiciones del panel.
- Sprite del barco (`barco.png`) reemplaza la barcaza dibujada con rectángulos.
- Constante `BOAT` en `gameConfig.js` con dimensiones, escala y posición del barco.

### Changed

- Layout del juego invertido: barcaza a la derecha, bandera a la izquierda (personaje avanza de derecha a izquierda según GDD).
- `GameScene.js`: reescrita con mecánica completa de Fase 1 (impulso + movimiento + caída). Fondo reemplazado de rectángulos por imagen pixel art.
- Personaje ahora es un objeto redibujable (se mueve por el palo en cada frame).
- El personaje arranca a correr inmediatamente al parar la barra, sin pausa de resultado intermedia (más dinamismo).
- Barra de impulso reubicada dentro del panel de control inferior.
- Palo y barco reposicionados más a la izquierda con proporción 7:8 (palo 7m, barco 8m).
- Reajuste completo de dimensiones según referencia visual: barco escala ×1.25, palo como prolongación horizontal del casco, posición Y al 50%.

### Removed

- Placeholder "EN DESARROLLO" de la pantalla de juego.

---

- Estructura de carpetas Clean Architecture (config, scenes, entities, systems, components, utils).
- Archivo de configuración centralizado `gameConfig.js` con constantes, colores y nombres de escenas.
- BootScene: escena de arranque inicial.
- PreloadScene: escena de precarga con barra de progreso pixel art.
- MenuScene (Pantalla 1): pantalla de inicio con fondo del Guadalquivir, Puente de Triana, farolillos, silueta de Triana, barcaza con la cucaña y título "La Cucaña Trianera".
- CharacterSelectScene (Pantalla 2): selección de personaje con cards, stats visuales (barras), navegación con flechas y personajes bloqueados.
- GameScene (Pantalla 3): pantalla de juego con fondo diurno, río, público, palo engrasado, HUD con barra de equilibrio y personaje placeholder.
- Flujo completo de navegación: Boot → Preload → Menú → Selección → Juego (y vuelta con ESC).
- Configuración `pixelArt: true` en Phaser para escalado sin suavizado.
- Carpetas de assets organizadas (sprites, backgrounds, ui, audio, fonts).

### Changed

- `index.html`: título actualizado a "La Cucaña Trianera", idioma a español, `user-scalable=no` para móviles.
- `src/game/main.js`: refactorizado con todas las escenas nuevas y configuración centralizada.

### Removed

- Escena `Game.js` del template original de Phaser.

## [0.1.0] - 2026-02-26

### Added

- Configuración inicial del proyecto con Phaser 3.90.0 + Vite 6.3.1.
- README.md con descripción del juego, tradición de la Cucaña y documentación técnica.
- CLAUDE.md con directrices de desarrollo, arquitectura y convenciones.
- CHANGELOG.md siguiendo el estándar Keep a Changelog.
