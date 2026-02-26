# CLAUDE.md — Directrices de desarrollo para La Cucaña Trianera

Este documento define las reglas, convenciones y directrices que debe seguir el asistente (Claude) durante todo el desarrollo del proyecto.

---

## Fuentes de verdad

1. **Este documento (CLAUDE.md)** — Reglas de desarrollo, arquitectura y convenciones.
2. **Notion — Cucaña Trianera** — Diseño del juego, mecánicas, pantallas y visión del producto. Consultar siempre antes de tomar decisiones de diseño.
3. **README.md** — Descripción general del proyecto y su tradición.

Si algo no está definido en estos documentos, **preguntar al usuario antes de asumir**.

---

## Registro de cambios (CHANGELOG)

Se sigue el estándar [Keep a Changelog v1.0.0](https://keepachangelog.com/es-ES/1.0.0/):

- Cada cambio debe registrarse en `CHANGELOG.md`.
- Categorías permitidas: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Mantener siempre una sección `[Unreleased]` en la parte superior para cambios en curso.
- Al publicar una versión, mover los cambios de `[Unreleased]` a una nueva sección con el número de versión y fecha en formato ISO 8601 (`YYYY-MM-DD`).
- Orden cronológico inverso (lo más reciente arriba).
- La versión en `CHANGELOG.md` debe coincidir **siempre** con el campo `version` de `package.json`.

### Versionado Semántico (SemVer)

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR** — Cambios incompatibles o hitos importantes del juego.
- **MINOR** — Nueva funcionalidad (nueva pantalla, mecánica, personaje...).
- **PATCH** — Correcciones de bugs, ajustes de balance, pulido visual.

El proyecto arranca en versión `0.1.0` (desarrollo inicial, pre-release).

---

## Arquitectura y código

### Clean Architecture

El proyecto sigue los principios de Clean Architecture adaptados a un juego Phaser:

```
src/
├── main.js                     # Bootstrap de la aplicación
├── game/
│   ├── main.js                 # Configuración de Phaser y arranque
│   ├── config/                 # Constantes y configuración del juego
│   │   └── gameConfig.js       # Dimensiones, física, escalado...
│   ├── scenes/                 # Escenas de Phaser (capa de presentación)
│   │   ├── BootScene.js        # Precarga mínima y arranque
│   │   ├── PreloadScene.js     # Carga de todos los assets
│   │   ├── MenuScene.js        # Pantalla de inicio
│   │   ├── CharacterSelectScene.js  # Selección de personaje
│   │   ├── GameScene.js        # Pantalla de juego principal
│   │   └── GameOverScene.js    # Pantalla final
│   ├── entities/               # Entidades del dominio (lógica pura, sin Phaser)
│   │   ├── Player.js           # Modelo del jugador (stats, estado)
│   │   └── Pole.js             # Modelo del palo (zonas, aceite, física)
│   ├── systems/                # Sistemas de juego (lógica de negocio)
│   │   ├── BalanceSystem.js    # Sistema de equilibrio
│   │   ├── PhysicsSystem.js    # Física del palo y movimiento
│   │   └── OilSystem.js        # Gestión de zonas de aceite/desgaste
│   ├── components/             # Componentes UI reutilizables
│   │   ├── Button.js           # Botón táctil genérico
│   │   └── StatBar.js          # Barra de estadísticas RPG
│   └── utils/                  # Utilidades puras
│       └── math.js             # Funciones matemáticas auxiliares
└── assets/                     # (en public/assets, no aquí)
```

### Principios a seguir

**SOLID:**

- **S (Single Responsibility):** Cada clase/módulo tiene una única responsabilidad. Las escenas solo orquestan; la lógica vive en entities y systems.
- **O (Open/Closed):** El código está abierto a extensión (nuevos personajes, mecánicas) y cerrado a modificación del core.
- **L (Liskov Substitution):** Cualquier personaje nuevo debe ser intercambiable con el existente sin romper el juego.
- **I (Interface Segregation):** Los sistemas exponen solo los métodos que cada consumidor necesita.
- **D (Dependency Inversion):** Las escenas dependen de abstracciones (systems), no de implementaciones concretas.

**Reglas adicionales:**

- **Separar lógica de presentación:** Las entidades (`entities/`) no importan Phaser. Son lógica pura y testeable.
- **Las escenas son orquestadoras:** Conectan entidades, sistemas y componentes UI, pero no contienen lógica de negocio.
- **Modularidad:** Cada archivo exporta una sola cosa con responsabilidad clara. Si un archivo crece por encima de ~150 líneas, considerar dividirlo.
- **No duplicar código:** Si algo se repite más de dos veces, extraer a utils o a un componente.

---

## Convenciones de código

### Nombrado

- **Archivos:** `PascalCase.js` para clases/escenas, `camelCase.js` para utilidades y configuración.
- **Clases:** `PascalCase` — `MenuScene`, `BalanceSystem`, `Player`.
- **Funciones y variables:** `camelCase` — `getPlayerStats()`, `oilLevel`.
- **Constantes:** `UPPER_SNAKE_CASE` — `MAX_BALANCE`, `POLE_LENGTH`.
- **Archivos de config/constantes:** Agrupar en `config/` y exportar como objetos nombrados.

### Estilo

- JavaScript moderno (ES modules, `import`/`export`).
- No usar `var`. Preferir `const`; usar `let` solo cuando sea necesario mutar.
- Funciones flecha para callbacks. Métodos de clase con sintaxis estándar.
- Sin punto y coma al final de las sentencias (semicolon-free) — seguir el estilo del template existente.
- Comillas simples para strings.

### Comentarios

- Solo cuando la lógica no sea autoexplicativa.
- No añadir comentarios obvios ni JSDoc a funciones simples.
- Comentarios en español (el proyecto es en español).

---

## Assets y diseño visual

### Pixel art obligatorio en TODO el juego

**Todo elemento visual del juego debe respetar la estética pixel art.** Esto incluye, sin excepción:

- **Sprites y fondos:** Resolución 16x16 o 32x32 px, estilo SNES/Mega Drive.
- **Botones y UI:** Diseñados como sprites pixel art o dibujados con gráficos Phaser respetando bordes pixelados. Nada de botones HTML/CSS modernos ni bordes suaves.
- **Textos y números:** Usar siempre **fuentes bitmap pixel art** (cargadas como spritesheet o BitmapFont). Nunca fuentes del sistema, Google Fonts ni CSS `font-family` genéricas.
- **Barras de vida/stats:** Dibujadas píxel a píxel, sin gradientes suaves ni bordes redondeados CSS.
- **Menús y overlays:** Todo elemento de interfaz dentro del canvas de Phaser con estética retro. Evitar HTML/CSS superpuesto sobre el juego.
- **CSS global (`style.css`):** Solo se usa para el contenedor del juego (centrado, fondo). Nunca para estilizar elementos dentro del juego. Si es necesario algún estilo CSS fuera del canvas, debe seguir la estética pixel art (bordes duros, colores planos, sin sombras suaves ni gradientes).
- **Escalado de imágenes:** Usar `pixelArt: true` en la configuración de Phaser para evitar suavizado. Todas las texturas deben escalarse con `NEAREST` (sin antialiasing).

**Regla general:** Si algo se ve en pantalla, debe parecer que salió de una consola de 16 bits.

### Organización de assets

- Assets estáticos en `public/assets/`, organizados por tipo:
  ```
  public/assets/
  ├── sprites/        # Personajes y objetos animados
  ├── backgrounds/    # Fondos de las escenas
  ├── ui/             # Elementos de interfaz (botones, barras)
  ├── audio/          # Música y efectos de sonido
  └── fonts/          # Fuentes pixel art (bitmap fonts)
  ```
- Los assets se cargan siempre desde `PreloadScene`, nunca desde las escenas de juego.
- Naming de assets: `kebab-case` — `player-idle.png`, `bg-river.png`, `btn-start.png`.

---

## Configuración de Phaser

- Resolución base: definida en `config/gameConfig.js` (orientación **landscape**).
- Escalado: `Scale.FIT` con `Scale.CENTER_BOTH` para adaptarse a cualquier pantalla.
- Diseñar pensando en **mobile-first** con soporte táctil (touch events).
- Las dimensiones del juego y constantes de física se centralizan en `config/`.

---

## Flujo de trabajo

1. Antes de implementar algo nuevo, consultar Notion y este documento.
2. Si hay duda sobre diseño, mecánica o decisión técnica → **preguntar al usuario**.
3. Implementar siguiendo la arquitectura definida.
4. Registrar los cambios en `CHANGELOG.md` bajo `[Unreleased]`.
5. Cuando el usuario indique que se cierra versión, mover cambios a nueva sección con versión y fecha, y actualizar `package.json`.

---

## Lo que NO hacer

- No tomar decisiones de diseño del juego sin consultar Notion o preguntar.
- No meter lógica de negocio en las escenas.
- No crear archivos innecesarios. Preferir editar los existentes.
- No hardcodear valores mágicos. Usar constantes en `config/`.
- No instalar dependencias sin aprobación del usuario.
- No hacer commits automáticos sin que el usuario lo pida.
