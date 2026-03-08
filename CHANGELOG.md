# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- `HistoryScene`: rediseño completo al estilo RPG. Cuadro de diálogo en la parte inferior (178 px, full-width), narrador pixel art a la izquierda con animación de boca (4 frames: normal / m_open / open / eyes) y parpadeo aleatorio. Texto dividido en 5 bloques temáticos con páginas de 3 líneas; el jugador avanza pulsando el cuadro o ESPACIO. Imagen histórica centrada en pantalla (una por bloque) con fade al cambiar de bloque. Al finalizar aparece botón "¡A JUGAR!" directo a selección de personaje. Fallbacks completos mientras se crean los assets.
- Botón "📜  HISTORIA" en `MenuScene`, posicionado bajo "PULSA PARA EMPEZAR". Navega a `HistoryScene` sin interferir con el click global de inicio.
- Carga de `bg-history`, 4 frames del narrador (`narrator.png`, `narrator_m_open.png`, `narrator_open.png`, `narrator_eyes.png`) y 5 imágenes históricas en `PreloadScene`.
- Constante `SCENES.HISTORY` en `gameConfig.js`.

- `CollectionScene`: vista ampliada al pulsar una ficha conseguida — overlay oscuro con panel 520×660 px, imagen 220 px, contador "x{N} conseguidos", estrellas animadas y "Toca para cerrar". Se activa con `showRewardDetail()`. Sin confeti (solo aparece al ganar por primera vez).
- `CollectionScene`: botón "VOLVER A JUGAR" junto a "VOLVER AL MENÚ" en la barra inferior, permitiendo reiniciar con el mismo personaje directamente desde la colección.
- Confeti pixel art (cuadraditos de colores) en `RewardScene` **únicamente la primera vez** que se obtiene cada premio (comprobación via `isFirstWin` antes de `addReward`).

### Changed

- `RewardScene`: imagen del premio ampliada de 128 px a **380 px**, ocupando casi todo el alto disponible del panel para mayor impacto visual en móvil.
- `CollectionScene`: los premios no conseguidos muestran "???" en lugar del nombre real, manteniendo el suspense.
- `CollectionScene`: fichas conseguidas son ahora interactivas (efecto hover + pulsar para ampliar). La vista ampliada no muestra confeti.

- `RewardStorageService` (`services/RewardStorageService.js`): capa de abstracción para persistencia de premios. Patrón Adaptador — backend intercambiable sin tocar el resto del juego. Implementación v1 en `localStorage`.
- `CollectionScene`: pantalla "Mis Premios" con carrusel de fichas estilo CharacterSelectScene. Muestra 4 fichas a la vez (nombre arriba, imagen centrada, contador `x{N}` abajo), con navegación ◀▶, swipe táctil y dots. Accesible desde game over y pantalla de premio.
- Botón "VER PREMIOS" en el panel de game over (`GameScene`).
- Botón "VER PREMIOS" en `RewardScene`, junto a "VOLVER A JUGAR" (dos botones en fila dentro del panel).
- Constante `SCENES.COLLECTION` en `gameConfig.js`.
- Sistema de premios: fichero `rewards.json` (en `public/assets/`) con estructura `id`, `nombre`, `imagen` y `probabilidad`. Cinco premios temáticos de Triana.
- `RewardScene`: pantalla de resultado de victoria con "¡Enhorabuena, has conseguido...", imagen del premio (o placeholder pixel art), nombre del premio y botones de acción.
- Carga dinámica de imágenes de premios en `PreloadScene` a partir del JSON (encadenando `filecomplete-json-rewards`).
- Constante `SCENES.REWARD` en `gameConfig.js`.
- Selección aleatoria de premio al coger la bandera: `GameScene.startRewardScreen()`.

### Changed

- Al coger la bandera, el juego transiciona a `RewardScene` en lugar de mostrar un panel inline de victoria.
- Panel de game over expandido para incluir el botón "VER PREMIOS".
- `RewardScene` guarda el premio en `localStorage` vía `rewardStorage.addReward()` al inicializarse (`init()`).
- GDD en Notion actualizado con el diseño de persistencia por capas (sección "Persistencia — Diseño por capas").

- Fase 1 — Impulso ("La carrera"): barra de poder con aceleración progresiva, zonas roja/amarilla/verde y máximo 3 pasadas.
- Entidad `PowerBar` (entities/PowerBar.js): modelo puro de la barra de poder con posición, velocidad, zonas e impulso.
- Sistema `ImpulseSystem` (systems/ImpulseSystem.js): lógica de negocio para la mecánica de impulso (aceleración, reset, parada y cálculo de resultado).
- Constantes de Fase 1 en `gameConfig.js` (`PHASE1`): velocidad base, aceleración, factor de peso, zonas y dimensiones de la barra.
- Influencia del peso del personaje en la dificultad de la barra (más peso = más aceleración = más difícil).
- Movimiento del personaje tras el impulso: avanza por el palo de derecha a izquierda con desaceleración progresiva.
- Caída al agua con efecto splash cuando el personaje se queda sin impulso.
- Colisión con la bandera: el personaje coge la bandera al llegar al final del palo.
- Animación de caída con bandera: el personaje cae al agua sujetando la bandera en un brazo levantado.
- Celebración en el agua: el personaje saca la cabeza y agita la bandera con el brazo tras caer.
- Mecánica de salto: el jugador puede pulsar durante la carrera para lanzarse hacia delante con trayectoria parabólica (~1.5 cuerpos de avance extra).
- Colisión con bandera durante el salto: si el personaje alcanza la bandera saltando, la coge en el aire.
- Pose de salto (brazos estirados hacia delante tipo superman) y pose de salto con bandera.
- Constantes `JUMP` en `gameConfig.js` (EXTRA_DISTANCE, VY0, GRAVITY) configurables para futura stat del personaje.
- Fase 2 — Equilibrio: se activa al empezar a correr tras el impulso. El jugador debe mantener el equilibrio con ◀ ▶ mientras el personaje avanza por el palo.
- Entidad `BalanceBar` (entities/BalanceBar.js): modelo puro de la barra de equilibrio con posición, velocidad, fuerzas y límites.
- Sistema `BalanceSystem` (systems/BalanceSystem.js): lógica de drift aleatorio, dificultad progresiva e influencia de la stat de equilibrio.
- Constantes `BALANCE` en `gameConfig.js`: drift, aceleración, fricción, límites, duración y dimensiones de UI.
- Botones táctiles ◀ ▶ en el panel inferior para controlar el equilibrio (mobile-first).
- Soporte de flechas izquierda/derecha del teclado para el equilibrio en escritorio.
- Barra visual de equilibrio con línea verde central, marcas de límite rojas y cursor rojo móvil.
- Temporizador visual del tiempo en equilibrio durante la carrera.
- Auto-grab de la bandera: el personaje coge la bandera automáticamente al llegar (corriendo o saltando), sin necesidad de pulsar.
- Cabeza del personaje asomando del agua tras caer sin bandera.
- Pantalla de victoria (`¡BANDERA!`) diferenciada de la pantalla de fallo (`¡AL AGUA!`).
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
- Bandera separada como gráfico independiente del palo para permitir ocultarla al ser cogida.
- Barra de impulso reubicada dentro del panel de control inferior.
- Palo y barco reposicionados más a la izquierda con proporción 7:8 (palo 7m, barco 8m).
- Reajuste completo de dimensiones según referencia visual: barco escala ×1.25, palo como prolongación horizontal del casco, posición Y al 50%.
- Fase 2 rediseñada: el equilibrio ahora es simultáneo a la carrera (antes era una fase separada tras coger la bandera).
- El personaje ya no cae al agua al terminar la carrera si no llega a la bandera; se queda en el palo manteniendo equilibrio y puede saltar.
- Los taps en la zona del panel inferior no disparan el salto (previene conflicto con botones de equilibrio).
- Fase 2 — Equilibrio: reescrito el modelo de física con sistema unificado de aceleraciones (F=ma). Drift e input del jugador actúan sobre la misma velocity, creando un efecto péndulo natural con riesgo de overshoot.
- Límites de equilibrio reducidos de 0.85 a 0.5 (más cerca del centro = más tensión visual y mecánica).
- Dificultad progresiva suavizada (de 10%/s a 3%/s).
- Constantes de equilibrio reorganizadas: DRIFT_ACCELERATION, INPUT_FORCE y DAMPING reemplazan DRIFT_BASE, INPUT_ACCELERATION, INPUT_MAX_SPEED y FRICTION.

### Removed

- Mecánica de agarre preciso (precision grab): la bandera vuelve a cogerse automáticamente (el reto ahora es mantener el equilibrio).
- Fase `balancing` separada del `update()` loop (la lógica de equilibrio ahora vive dentro de `updateRunning()`).
- Condición de victoria por tiempo en el equilibrio (`hasWon`/`DURATION`). El equilibrio está activo toda la carrera.
- Aplicación directa de drift a la posición (`applyDrift`). Todo pasa por velocity ahora.
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
