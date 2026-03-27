# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Nuevo premio "El Llamador" (`reward_llamador`, probabilidad 0.15) con imagen `premios/llamador.png`.
- Soporte del campo opcional `descripcion` en `rewards.json`: si un premio lo incluye, se muestra debajo del nombre en `RewardScene` y en el detalle de `CollectionScene`.

- `public/assets/characters-unlock.json`: fichero de configuración de condiciones de desbloqueo de personajes. Soporta dos tipos: `specific_reward` (se desbloquea al obtener un premio concreto) y `total_rewards` (se desbloquea al acumular N premios en total). Pensado para ser editado sin tocar código: añadir una entrada por personaje con su `characterId`, `type`, `rewardId`/`count` y `hint` visible al jugador.
- `src/game/services/UnlockService.js`: servicio singleton de gestión de desbloqueos. Persiste el estado en `localStorage` (`cucana_unlocked_characters`). Métodos: `setConditions()`, `isUnlocked()`, `checkNewUnlocks()`, `saveUnlocks()`, `getHint()`, `getTotalRewards()`, `clear()`. Los personajes `trianero` y `flamenca` están siempre desbloqueados por defecto.
- `src/game/scenes/CharacterUnlockScene.js`: nueva escena de revelación de personaje desbloqueado. Muestra panel completo con sprite (animación Back.easeOut desde escala 0), nombre, descripción y barras de stats. Soporta múltiples desbloqueos consecutivos con botón "SIGUIENTE ▶". Al finalizar presenta las opciones habituales "VOLVER A JUGAR" / "VER PREMIOS".

### Changed

- `src/game/config/gameConfig.js`: añadida clave `CHARACTER_UNLOCK: 'CharacterUnlockScene'` al objeto `SCENES`.
- `src/game/scenes/PreloadScene.js`: carga `characters-unlock.json` e inicializa `unlockService` con las condiciones en cuanto el fichero está disponible.
- `src/game/scenes/RewardScene.js`: tras guardar el premio obtenido, comprueba si hay nuevos desbloqueos. Si los hay, los guarda y redirige los botones "VOLVER A JUGAR" / "VER PREMIOS" a través de `CharacterUnlockScene` antes del destino final.
- `src/game/scenes/CharacterSelectScene.js`: los personajes `available: true` pero no desbloqueados se muestran en gris con candado y texto de pista de desbloqueo. El botón JUGAR queda bloqueado para estos personajes.
- `src/game/components/CharacterCard.js`: nuevo parámetro `isLocked` y `hint`. Cuando `isLocked: true` el sprite recibe tint gris, se dibuja un icono de candado pixel art y se muestra el texto de pista en lugar de las stats.
- `src/game/main.js`: registrada `CharacterUnlockScene` en la lista de escenas de Phaser.
- `src/game/services/UnlockService.js`: migración automática por versión. Al arrancar, si `cucana_version` en localStorage es inferior a `0.3.0`, se borran los premios y desbloqueos acumulados para garantizar un estado limpio con el nuevo sistema. Trianero y flamenca siempre se restauran como defaults. Esto ocurre una sola vez por navegador al actualizar a v0.3.0.
- `package.json`: versión actualizada a `0.3.0`.

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
