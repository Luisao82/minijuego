# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

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
