# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Monitorización de errores en producción con Sentry (`@sentry/browser`). Se inicializa solo en producción vía `VITE_SENTRY_DSN` (configurada en Vercel Dashboard). Sentry gestiona `window.onerror` y `onunhandledrejection` automáticamente. Source maps hidden activados en el build de producción para stack traces legibles en Sentry.
- `.env.example` como plantilla documentada para variables de entorno del proyecto.
- Efectos de sonido: `sfx-victoria` al coger la bandera, `sfx-hit` al perder el equilibrio, `sfx-chapuzon` al caer al agua, `sfx-click` en todos los botones NavButton.
- `weightedRandom()` en `utils/math.js` — selección ponderada por `probabilidad`. Los premios ahora siguen los pesos definidos en `rewards.json` (Giraldillo 30%, Pali/Curro 25%, Llamador 15%, raros 10%).
- PWA: `manifest.json` con nombre, orientación landscape, pantalla completa y colores del juego. Service worker (`sw.js`) con estrategia network-first para HTML y cache-first para assets estáticos. Meta tags para iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`). El juego puede instalarse como app nativa en Android y iOS.
- SEO: meta tags `description`, `keywords`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter/X Card (`twitter:card`, `twitter:image`) para preview enriquecida al compartir el enlace. Desbloqueo del AudioContext en el primer toque del menú para compatibilidad con iOS/Android.
- Capacitor iOS: proyecto Xcode generado para empaquetar el juego como app nativa iOS. Configuración de firma, orientación landscape y soporte desde iOS 15.
- Skin `trianera` para el personaje Flamenca.

### Changed

- Sprite `flamenca.png` actualizado.
- Skin por defecto de Flamenca cambiada a `trianera`.

---

## [0.6.0] - 2026-04-11

### Added

- `GameStatsService` — servicio de persistencia de partidas en localStorage (`cucana_game_stats`). Cada partida registra: timestamp, characterId, skinKey, perspectiveId, success, rewardId, greasePercent, polePercent, impulseValue, durationSecs, hasJumped. Adaptador intercambiable para migración futura a BD.
- `StatsCalculator` — sistema de cálculo puro (sin Phaser) sobre los registros de partidas. Métodos: `totalGames`, `totalWins`, `winRate`, `totalRewards`, `avgPolePercent`, `consecutiveWins`, `topSkinsByWins`, `topRewards`, `bestCharacter`. Ampliable añadiendo un método y una línea en `getSummary()`.
- `StatsScene` — pantalla de estadísticas pixel art con dos columnas: estadísticas generales + mejor personaje (izq.) y pódium top 3 skins con sprite real del skin / top 4 premios con imágenes (der.). Accesible desde el menú con el botón "RÉCORDS".
- Botón "RÉCORDS" en `MenuScene`, centrado entre HISTORIA y TUTORIAL.
- Captura de `greasePercent` en `grabFlag()` antes del reset del aceite, garantizando el valor real en el momento de coger la bandera.
- Estadística de racha máxima de victorias consecutivas (`consecutiveWins`).

### Changed

- `RESET_BELOW_VERSION` actualizado a `0.6.0`: al arrancar con datos de versiones anteriores se limpian todos los localStorage del juego, incluyendo el nuevo `cucana_game_stats`, para empezar con estadísticas limpias.

---

## [0.5.0] - 2026-04-09

### Added

- Desbloqueo automático de skins por banderas: al conseguir N banderas con un personaje se muestra la pantalla `SkinUnlockScene` con el skin recién desbloqueado.
- Progreso de banderas pixel art en skins bloqueados: iconos de bandera (blancas las conseguidas, oscuras las restantes) mostrando solo el tramo del paso actual (diferencia entre el umbral anterior y el requerido); contador "X / Y banderas" dinámico.
- Badge "¡NUEVO!" pulsante sobre el skin recién desbloqueado al volver a la pantalla de selección de skin.
- Skins bloqueados muestran "???" como nombre en lugar del nombre real.
- Migración automática de datos a v0.5.0: al detectar una versión anterior en localStorage se limpian también `cucana_character_rewards` y `cucana_skins`, garantizando un estado limpio compatible con el nuevo sistema de skins.

### Fixed

- Skins que nunca se desbloqueaban: `RewardScene._checkSkinUnlocks()` buscaba `skin.condicion` pero el campo en `characters.js` es `skin.flags`. Corregido.

### Changed

- Campo `como` en skins de `characters.js` renombrado a `flags` (indica el número de banderas necesarias para desbloquear el skin).
- Botones de navegación ◀▶ (selección de personaje, skin y premios) reemplazados por sprites PNG pixel art con estado stand/press (`left-stand.png`, `left-press.png`, `right-stand.png`, `right-press.png`).
- CollectionScene: layout unificado con CharacterSelectScene — BAND_Y=120, BAND_H=440, CARDS_Y=200, header en Y=55, botones de acción centrados en Y=600; cards visibles reducidas de 4 a 3; botones de nav movidos a x=40 para evitar desbordamiento de pantalla.
- ViewSelectScene: rediseñada con el mismo patrón de carrusel que CharacterSelectScene — banda BAND_Y=120/BAND_H=440, header Y=55, flechas ◀▶ PNG en x=40 con estado stand/press, puntos indicadores, botón "SELECCIONAR VISTA" pulsante centrado en Y=600.
- SkinSelectScene: layout unificado con CharacterSelectScene — BAND_Y=120, BAND_H=440, header en Y=55 (halfWidth=280), botones centrados en Y=600.

---

## [0.4.0] - 2026-03-29

### Added

- **Sistema de vistas desbloqueable**: las perspectivas de juego pasan a gestionarse como contenido desbloqueable. La vista Sevilla requiere conseguir 3 premios en total; futuras vistas se añaden únicamente editando `perspectives.json`.
- `public/assets/perspectives.json`: fuente de verdad de todas las perspectivas. Cada entrada define `id`, `label`, `backgroundKey`, `direction` (`ltr`/`rtl`), `scale`, `yOffset` y, opcionalmente, `condition` de desbloqueo. Añadir una nueva perspectiva no requiere tocar código.
- `src/game/services/PerspectiveUnlockService.js`: singleton análogo a `UnlockService` para perspectivas. Persiste desbloqueos en `localStorage` (`cucana_unlocked_perspectives`). La vista Triana siempre está disponible. Métodos: `setData()`, `getById()`, `getAll()`, `isUnlocked()`, `checkNewUnlocks()`, `saveUnlocks()`, `getHint()`.
- `src/game/scenes/PerspectiveUnlockScene.js`: escena de revelación de vista desbloqueada. Muestra un panel con thumbnail animado (Back.easeOut desde escala 0), estrellas y el nombre de la vista. Soporta múltiples desbloqueos consecutivos con botón "SIGUIENTE ▶" y encadena con `CharacterUnlockScene` si también hay personajes nuevos.
- `ViewSelectScene`: las vistas bloqueadas se muestran con thumbnail grisado, icono de candado y texto de pista. Solo las desbloqueadas son seleccionables. Layout dinámico: el número de fichas se genera desde el JSON.
- Selector de perspectiva **Triana / Sevilla**: nueva pantalla `ViewSelectScene` que aparece al pulsar JUGAR, con fichas que muestran una miniatura del fondo correspondiente.
- Vista **Sevilla**: fondo `fondo_b.png`, barco a la izquierda, palo de izquierda a derecha. La escena entera (palo, barco, personaje, aceite, salpicadura) se agrupa en un `Phaser.Container` y se transforma proporcionalmente — escala, espejo y offset — sin necesidad de ajustes manuales por elemento.
- Nuevo premio "El Llamador" (`reward_llamador`, probabilidad 0.15) con imagen `premios/llamador.png`.
- Soporte del campo opcional `descripcion` en `rewards.json`: si un premio lo incluye, se muestra debajo del nombre en `RewardScene` y en el detalle de `CollectionScene`.
- `public/assets/characters-unlock.json`: condiciones de desbloqueo de personajes (`specific_reward` / `total_rewards`). Editable sin tocar código.
- `src/game/services/UnlockService.js`: singleton de desbloqueo de personajes. Persiste en `localStorage` (`cucana_unlocked_characters`). Trianero y flamenca siempre desbloqueados.
- `src/game/scenes/CharacterUnlockScene.js`: escena de revelación de personaje desbloqueado con sprite animado, stats y soporte de múltiples desbloqueos consecutivos.

### Changed

- `GameScene`: toda la escena de juego (palo, barco, bandera, personaje, overlay de aceite, salpicadura) se agrupa en un `Phaser.Container` (`gameWorld`). La perspectiva activa transforma el container completo, garantizando que todas las proporciones (incluida la distancia de caída al agua) sean automáticamente correctas.
- `src/game/config/perspectiveConfig.js`: simplificado a helpers de `localStorage` (`getStoredPerspective`, `storePerspective`). La config visual de cada perspectiva vive ahora en `perspectives.json`.
- `RewardScene`: tras guardar el premio, encadena las escenas de desbloqueo en orden: vistas → personajes → destino final. Si no hay desbloqueos, navega directamente.
- `src/game/components/Narrator.js`: migrado a spritesheet único por personaje.
- `src/game/scenes/PreloadScene.js`: carga `perspectives.json` e inicializa `perspectiveUnlockService`; carga `characters-unlock.json` e inicializa `unlockService`.
- `src/game/scenes/CharacterSelectScene.js`: personajes bloqueados muestran candado y pista de desbloqueo.
- `src/game/components/CharacterCard.js`: nuevo parámetro `isLocked` / `hint`.
- `src/game/services/UnlockService.js`: migración automática a `0.4.0` — borra premios, desbloqueos de personajes y desbloqueos de vistas acumulados en versiones anteriores para garantizar un estado limpio.
- `package.json`: versión actualizada a `0.4.0`.

### Removed

- Assets individuales de narradores: `narrator.png`, `narrator_m_open.png`, `narrator_open.png`, `narrator_eyes.png` y sus equivalentes de tutorial.
- Constantes `SEVILLA_SCALE` y `SEVILLA_Y_OFFSET` del código JS — sus valores viven ahora en `perspectives.json` como `scale` y `yOffset`.

---

## [0.2.0] - 2026-03-23

### Added

- `src/game/components/BalanceDebugPanel.js`: panel de debug en tiempo real para la mecánica de equilibrio. Muestra posición, velocidad (con indicador `◄CAP` al tocar el tope), dirección y fuerza del drift, multiplicador de aceite, input activo, límite del personaje, y bloque de **aceleraciones** (drift / input / damping / total en u/s²). Incluye mini-barra visual de posición (con zonas de peligro en rojo y líneas de límite) y mini-barra de velocidad (relleno proporcional a la velocidad terminal teórica). Solo se instancia cuando `DEBUG.BALANCE_PANEL = true` en `gameConfig.js`. En modo debug el personaje **no cae** al alcanzar el límite (rebota y anula la velocidad) para facilitar las pruebas.
- `gameConfig.js` — bloque `DEBUG`: objeto de flags de depuración centralizado. Por ahora contiene `BALANCE_PANEL` (boolean). Para activar el panel de debug del equilibrio, cambiar a `true`; para ocultarlo en producción, `false`.
  ```js
  // src/game/config/gameConfig.js
  export const DEBUG = {
    BALANCE_PANEL: false,  // true → panel visible + personaje inmortal en límites
  }
  ```
- `gameConfig.js` — `BALANCE.VELOCITY_CAP`: límite absoluto de velocidad del cursor (u/s). Evita acumulación descontrolada independientemente de la aceleración. Ajustable para calibrar la sensación de control.

- `src/game/config/spriteConfig.js`: configuración central del spritesheet de personajes. Define `SPRITE_CONFIG` (dimensiones de frame: 16×24 px, escala ×2) y `SPRITE_FRAMES` (9 frames: STAND, WALK, JUMP, STAND_FLAG, JUMP_FLAG, CELEB_A, CELEB_B, FALL, WATER).
- `src/game/components/OilIndicator.js`: componente pixel art de gota de grasa. Teardrop de 8×9 píxeles (escala ×3) con borde negro, fondo oscuro y relleno dinámico que sube desde la base según el % total de grasa (rojo→marrón→verde). Etiqueta de porcentaje bajo la gota, visible sobre el panel de control durante la fase de equilibrio.
- `src/game/systems/OilSystem.js`: sistema de grasa del palo. Divide el palo en 10 zonas, cada una con un nivel de grasa (0-100%) que se desgasta mientras el personaje pasa por ella. La grasa amplifica el drift del equilibrio (multiplicador configurable en `OIL.DRIFT_MULTIPLIER`). Persiste en `sessionStorage` entre reinicios; se resetea al 100% al coger la bandera o cerrar el navegador.
- `gameConfig.js` — bloque `OIL`: constantes del sistema de grasa (`NUM_ZONES`, `WEAR_RATE`, `DRIFT_MULTIPLIER`, `OVERLAY_ALPHA`).
- `GameScene`: overlay negro sobre la mitad superior del palo que se aclara zona a zona según se desgasta la grasa. Gota `OilIndicator` en la esquina superior izquierda del HUD.
- `src/game/components/NavButton.js`: componente compartido `makeNavButton()` — botón de navegación estilo **Cartelón de Feria**: fondo dorado sólido `0xd4a520`, texto casi negro `#1a0800` (contraste WCAG AAA ~7:1), borde marrón `0x5c2d00`, efecto 3D con línea de brillo superior y sombra inferior, sombra exterior desplazada 3 px. Hover a dorado vivo `0xffcc00`. Fuente Jersey 10 26 px. Devuelve `Phaser.Geom.Rectangle` para exclusiones de input.
- `HistoryScene`: rediseño completo al estilo RPG. Cuadro de diálogo en la parte inferior (178 px, full-width), narrador pixel art a la izquierda con animación de boca (4 frames) y parpadeo aleatorio. Texto dividido en 14 páginas individuales; el jugador avanza pulsando el cuadro o ESPACIO. Imagen histórica centrada en pantalla (una por bloque) con fade al cambiar de bloque.
- Botón "📜  HISTORIA" en `MenuScene`, posicionado bajo "PULSA PARA EMPEZAR".
- `CollectionScene`: vista ampliada al pulsar una ficha conseguida — overlay oscuro con panel 520×660 px, imagen 220 px, contador "x{N} conseguidos", estrellas animadas y "Toca para cerrar".
- `CollectionScene`: botón "VOLVER A JUGAR" junto a "VOLVER AL MENÚ".
- Confeti pixel art en `RewardScene` únicamente la primera vez que se obtiene cada premio.
- `RewardStorageService` (`services/RewardStorageService.js`): patrón Adaptador para persistencia de premios, backend intercambiable sin tocar el resto del juego. Implementación v1 en `localStorage`.
- `CollectionScene`: pantalla "Mis Premios" con carrusel de fichas estilo CharacterSelectScene. Accesible desde game over y pantalla de premio.
- Sistema de premios: `rewards.json` con estructura `id`, `nombre`, `imagen` y `probabilidad`. Cinco premios temáticos de Triana.
- `RewardScene`: pantalla de resultado de victoria con imagen del premio, nombre y botones de acción.
- Fase 2 — Equilibrio: mecánica completa con `BalanceBar`, `BalanceSystem`, botones táctiles ◀ ▶ y soporte de teclado.
- Fase 1 — Impulso: `PowerBar`, `ImpulseSystem`, zonas roja/amarilla/verde, máximo 3 pasadas.
- `src/game/entities/Player.js`: clase `Player` con estados NORMAL/JUMPING/JUMPING_FLAG/FLAG/FALLING, celebración y cabeza asomando del agua.
- `src/game/components/Narrator.js`: narrador animado config-driven.
- `src/game/components/CharacterCard.js` y `RewardCard.js`: factories de fichas reutilizables.
- `src/game/utils/backgroundUtils.js`: utilidades compartidas de fondo y cabecera.

### Changed

- **`BalanceSystem.js` — nuevo modelo de drift basado en velocidad:** la dirección del drift ahora sigue el signo de la `velocity` actual (`velocity > 0` → drift derecha, `velocity < 0` → drift izquierda), amplificando la inercia existente. El jugador debe frenar activamente la dirección en la que va. La fuerza del drift crece cuando la velocidad cambia de signo. Se elimina el modelo anterior basado en cruces del centro (posición = 0).
- **`BalanceBar.js` — corrección de bug de timing + velocity cap:** el input activo ahora se captura en el momento exacto del cruce de centro (`this._inputAtCross = this.inputDirection` dentro de `update()`), evitando evaluaciones erróneas cuando el jugador suelta el botón entre frames. Añadido cap de velocidad absoluta tras el amortiguamiento. Modo debug: cuando `DEBUG.BALANCE_PANEL` es `true`, al llegar al límite la posición se clampea y la velocidad se anula en lugar de marcar `failed`.
- **`gameConfig.js` — `BALANCE`: reajuste completo de parámetros de jugabilidad:**

  | Parámetro | Antes | Ahora | Motivo |
  |---|---|---|---|
  | `DRIFT_MIN` | `0.6` | `0.3` | Inicio más suave |
  | `DRIFT_MAX` | `2.2` | `1.2` | Techo más bajo, progresión gradual |
  | `DRIFT_GROWTH_PER_CROSS` | `0.15` | `0.06` | Ramp-up más lento |
  | `INPUT_FORCE` | `8` | `2.5` | Proporcional al nuevo drift; garantía: `2.5 > 1.2 × 1.5 = 1.8` |
  | `DAMPING` | `0.65` | `0.35` | Más inercia; velocity acumulada dura más |
  | `VELOCITY_CAP` | — | `5` | Nuevo: límite absoluto de velocidad |

- **`gameConfig.js` — `OIL.DRIFT_MULTIPLIER`:** reducido de `1.7` a `0.5` (drift × 1.5 como máximo con aceite al 100%, antes × 2.7). Margen de control con aceite máximo: `2.5 − 1.8 = 0.7` garantizado.
- `GameScene.js`: añadidos `this.balanceDebugPanel`, `this._lastOilMult` al estado de init. El panel de debug se crea al inicio de la fase de equilibrio y se destruye con `cleanBalanceUI()`. `updateRunning()` guarda `_lastOilMult` para pasarlo al panel cada frame.
- `Player.js`: refactorizado para usar un único `Phaser.GameObjects.Sprite` con `setFrame()`. Añadido estado `FALLING` y método `setFalling()`.
- `GameScene.js`: añadido `preload()` para carga dinámica del spritesheet del personaje con filtro NEAREST.
- `OilIndicator.js`: rediseño completo con forma de gota pixel art, borde dorado y porcentaje dinámico.
- Botones de navegación: rediseño completo a estilo **Cartelón de Feria** en todas las escenas.
- `RewardScene`: imagen del premio ampliada a 380 px.
- `CollectionScene`: premios no conseguidos muestran "???" en lugar del nombre.

### Fixed

- **`BalanceSystem` / `BalanceBar`:** corregido bug donde el drift no cambiaba de dirección a pesar de que el jugador estaba contrarrestando activamente. El `inputDirection` se leía un frame después del cruce, momento en que el jugador ya podía haber soltado el botón. Solucionado guardando el input en el momento exacto del cruce.
- `BalanceSystem`: eliminado el timer de cambio aleatorio de dirección del drift (ocurría cada ~0.8s con 70% de probabilidad), que causaba saltos bruscos e impredecibles.
- `GameScene`: eliminado doble-destroy del `OilIndicator`.

---

## [0.1.0] - 2026-02-26

### Added

- Configuración inicial del proyecto con Phaser 3.90.0 + Vite 6.3.1.
- README.md con descripción del juego, tradición de la Cucaña y documentación técnica.
- CLAUDE.md con directrices de desarrollo, arquitectura y convenciones.
- CHANGELOG.md siguiendo el estándar Keep a Changelog.
