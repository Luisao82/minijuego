# La Cucaña Trianera

Minijuego retro en estilo **pixel art 16 bits** inspirado en la Cucaña de Triana, la tradicional prueba de equilibrio de la Velá de Santa Ana en Sevilla.

---

## La tradición de la Cucaña en Triana

Cada mes de julio, el barrio de Triana en Sevilla celebra la **Velá de Santa Ana**, una de las fiestas populares más antiguas y queridas de la ciudad. Entre farolillos, casetas, música y el olor a pescaíto frito, el río Guadalquivir se convierte en escenario de una de las pruebas más divertidas y esperadas: **la Cucaña**.

La Cucaña consiste en un largo palo de madera colocado en horizontal sobre el río, engrasado con sebo o jabón, que parte desde una barcaza. Los participantes deben recorrerlo manteniendo el equilibrio hasta alcanzar una bandera clavada en el extremo. Lo que parece sencillo se convierte en un desafío casi imposible: el palo resbala, se balancea con cada paso y la caída al Guadalquivir está asegurada para la mayoría.

Es una tradición que lleva generaciones formando parte del verano trianero, donde niños y mayores se lanzan a intentarlo entre los aplausos y las risas del público que observa desde la orilla y el puente. Más que una competición, es un espectáculo que representa el espíritu festivo, valiente y desenfadado de Triana.

---

## Sobre el juego

**La Cucaña Trianera** traslada esta tradición a la pantalla. El jugador debe avanzar por el palo engrasado sobre el Guadalquivir, manteniendo el equilibrio hasta alcanzar la bandera en el extremo. Sencillo de entender, difícil de conseguir.

### Pantallas principales

1. **Pantalla de Inicio** - Fondo pixel art del río Guadalquivir con el Puente de Triana. Título retro y texto parpadeante "Pulse para empezar".
2. **Selección de Personaje** - Elige tu personaje con estadísticas estilo RPG retro (peso, equilibrio, altura, edad). En el MVP solo estará disponible "El Trianero".
3. **Pantalla de Juego** - La acción principal: el personaje avanza por el palo con controles táctiles para mantener el equilibrio.
4. **Pantalla Final** - Resultado de la partida, tanto si llegas a la bandera como si caes al agua.

### Mecánicas de juego

- **Impulso inicial (timing):** Minijuego de timing para coger carrerilla antes de subir al palo.
- **Avance por el palo:** Avance hacia la bandera con física de oscilación. Cuanto más cerca del extremo, más inestable.
- **Sistema de equilibrio dinámico:** Hay que mantener el equilibrio de forma activa. Si se desestabiliza demasiado, caída al agua.
- **Zonas de aceite y desgaste:** El palo tiene zonas con distintos niveles de aceite. Las zonas más usadas tienen más agarre; las vírgenes son más resbaladizas.
- **Salto final:** Al llegar al extremo, salto para alcanzar la bandera. Si el timing o el equilibrio fallan, caída justo antes de conseguirlo.

### Sistema de personajes

Cada personaje tiene estadísticas que afectan a la partida:

| Stat           | Efecto                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Peso**       | Afecta a la física del palo. Más peso = más inercia, pero también más estabilidad en condiciones normales |
| **Equilibrio** | Determina el margen antes de caer. Más equilibrio = más tiempo de reacción                                |
| **Altura**     | Centro de gravedad más alto (más difícil de equilibrar), pero brazos más largos para alcanzar la bandera  |
| **Edad**       | Afecta a la velocidad de movimiento y la resistencia                                                      |

**Personaje inicial: "El Trianero"** - Stats medios en todo. El personaje equilibrado para aprender las mecánicas.

### Diseño visual

- Estética **pixel art 16 bits**, estilo SNES/Mega Drive
- Escenario: el palo sobre el Guadalquivir, ambientado en la Velá de Santa Ana
- Sprites dibujados a mano en baja resolución (16x16 o 32x32 px)
- Animaciones de movimiento, equilibrio y caída al agua

### Vistas del escenario

El jugador elige la perspectiva de la partida en la pantalla **Elige tu vista**:

- **Triana** — vista lateral clásica desde la orilla de Triana (disponible desde el inicio).
- **Sevilla** — vista lateral espejada desde la orilla de Sevilla (se desbloquea con 8 premios).
- **3D** — vista en **primera persona** estilo retro-Doom, renderizada con three.js a baja
  resolución con filtrado NEAREST para respetar el pixel art. El jugador recorre el palo
  sobre el Guadalquivir con el caserío de Triana a la izquierda, la orilla de Sevilla a la
  derecha y el Puente de Triana al fondo. Mismas mecánicas que las vistas 2D: impulso,
  equilibrio con los botones rojo/azul, grasa, salto, bandera, premios y estadísticas.

---

## Stack tecnológico

| Tecnología                    | Uso                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| **Phaser 3**                  | Motor del juego (v3.90)                                                                          |
| **three.js**                  | Renderizado de la vista 3D en primera persona (v0.185)                                           |
| **Vite**                      | Bundler y servidor de desarrollo (v6.3)                                                          |
| **JavaScript** (ES2022)       | Lenguaje base — módulos ES, sin transpilación adicional                                          |
| **Capacitor** (iOS + Android) | Empaquetado nativo del juego para App Store y Google Play (v8)                                   |
| Plugins Capacitor             | `@capacitor/share`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/browser`         |
| **GitHub Actions**            | CI/CD — workflow `ios-release.yml` compila y sube a App Store Connect al pushear un tag `v*.*.*` |
| **Vercel**                    | Despliegue web con auto-deploy desde `main`                                                      |
| **Sentry**                    | Monitorización y captura de errores en producción (breadcrumbs de navegación entre escenas)      |
| **Vitest**                    | Tests unitarios                                                                                  |
| **Prettier + ESLint**         | Formato y linting (validados en CI en cada PR)                                                   |
| **LibreSprite / Aseprite**    | Sprites y pixel art dibujados a mano                                                             |
| **BeepBox / jsfxr**           | Música y efectos de sonido, hechos a mano                                                        |
| **ChatGPT / Gemini**          | Generación de imágenes de fondos y premios con prompts JSON compartidos por coherencia visual    |
| **Claude Code**               | Copiloto de desarrollo (código, arquitectura, refactor, debugging, docs)                         |

---

## Comandos disponibles

| Comando         | Descripción                                       |
| --------------- | ------------------------------------------------- |
| `npm install`   | Instalar dependencias                             |
| `npm run dev`   | Servidor de desarrollo en `http://localhost:8080` |
| `npm run build` | Build de producción en carpeta `dist`             |

## Estructura del proyecto

```
├── index.html                     # HTML principal
├── package.json
├── capacitor.config.json          # Configuración Capacitor (appId, appName, webDir)
├── public/
│   ├── assets/                    # Sprites, audio, fondos, rewards, personajes
│   ├── favicon.png
│   └── style.css                  # Estilos globales del contenedor
├── src/
│   ├── main.js                    # Bootstrap web + init NativeStorageBridge
│   └── game/
│       ├── main.js                # Configuración y arranque de Phaser
│       ├── config/                # Constantes y configuración del juego
│       ├── scenes/                # Escenas de Phaser (capa de presentación)
│       ├── entities/              # Modelo del dominio (lógica pura sin Phaser)
│       ├── systems/               # Sistemas de juego (equilibrio, impulso, física)
│       ├── components/            # Componentes UI reutilizables
│       ├── services/              # Servicios (persistencia nativa, etc.)
│       └── utils/                 # Utilidades puras (share, math, haptics…)
├── android/                       # Proyecto nativo Android (Capacitor)
├── ios/                           # Proyecto nativo iOS (Capacitor)
├── docs/                          # Documentación técnica de release e IP
├── vite/                          # Configuración de Vite (dev, prod)
├── .github/
│   └── workflows/                 # CI/CD (ci.yml, ios-release.yml)
├── CHANGELOG.md                   # Historial de versiones (Keep a Changelog)
├── GDD.md                         # Game Design Document
├── CREDITS.md                     # Créditos y agradecimientos
├── PRIVACY.md                     # Política de privacidad publicada
├── LICENSE                        # Licencia
└── CLAUDE.md                      # Directrices para el copiloto IA
```

Sigue los principios de **Clean Architecture**: las escenas son orquestadoras (sin lógica de negocio), las entidades y sistemas contienen la lógica pura del juego, y los componentes UI son reutilizables. Detalle completo en el `CLAUDE.md`.

---

## Estado actual

- ✅ **Web pública** (PWA con Service Worker) — [https://minijuego-lilac.vercel.app/](https://minijuego-lilac.vercel.app/)
- ✅ **App iOS** empaquetada con Capacitor, publicada en **TestFlight**, revisión de App Store en curso
- ✅ **App Android** empaquetada con Capacitor, AAB firmado y APK probados en dispositivo real, esperando verificación de cuenta developer en Google Play
- ✅ **CI/CD** con GitHub Actions: workflow `ios-release.yml` que compila con Xcode 26 y sube a App Store Connect al pushear un tag `v*.*.*`
- ✅ **Observabilidad en producción** con Sentry — captura automática de errores y `unhandledrejection`, con breadcrumbs de navegación entre escenas para reproducir el camino que llevó al fallo

## Visión a futuro

- Más personajes con distintos stats que cambien la experiencia de juego
- Modo con bots en cola: otros jugadores IA suben antes que tú y desgastan el aceite del palo
- Compartir **imagen** del premio en Android (actualmente solo texto — requiere `@capacitor/filesystem` para escribir el blob en disco antes de invocar el share nativo)
- Ampliar el mapa de Sevilla más allá de los trozos actuales
- Workflow `android-release.yml` para automatizar el AAB (pendiente hasta que Google Play desbloquee la cuenta developer)

---

## 📚 Sobre este proyecto — TFM del Máster de Desarrollo con IA

Este juego es mi Trabajo Fin de Máster del **Máster de Desarrollo con IA** de MoureDev / BIG School, pero para mí es mucho más que eso.

### Por qué La Cucaña Trianera

Soy **trianero de adopción y de corazón**. Cuando empecé a explorar el desarrollo con IA me di cuenta de que podía atreverme con cosas que antes no. Quería hacer un minijuego pixel art propio, pero no me salían ideas que no estuvieran ya cogidas. En algún momento caí en una de las tradiciones más antiguas y curiosas de Triana: la **cucaña de la Velá de Santa Ana**. De niño mis padres me llevaban a verla, y siempre me quedó el ambiente, el bullicio del río y el momento en que alguien conseguía coger la bandera al final del palo engrasado.

Empezó como algo mínimo — mantener el equilibrio, no caerse — y fue creciendo: personajes de Sevilla, premios muy sevillanos, un mapa por trozos, la vista 3D final… hasta convertirse en un pequeño homenaje a la tradición.

### Qué significa para mí

Este juego no es solo un TFM: es una **criatura hecha 100% a mano** en el tiempo que me dejaba mi trabajo. Las fotos son mías, hechas con mi cámara y pixeladas después. Los skins de los personajes están dibujados píxel a píxel. Ha sido una inversión enorme de horas y de ilusión.

### Lo que he aprendido construyéndolo

Más allá del componente sentimental, ha sido un ejercicio real de aplicar los conocimientos del máster a un proyecto vivo:

- **Frameworks nuevos** — Phaser 3 y Three.js, ninguno de los dos los había usado antes.
- **Arquitectura** — Clean Architecture adaptada a un juego (entidades, sistemas, componentes, utils).
- **CI/CD real** — workflows separados de iOS y Android con GitHub Actions.
- **Observabilidad en producción** — Sentry integrado en la web para capturar errores reales y trazar la navegación previa a cada fallo.
- **Seguridad y secretos** — gestión de keystores fuera del repo, API keys en secrets, `.gitignore` bien pensado.
- **Versionado semántico** y CHANGELOG mantenido en cada release.
- **Uso guiado y consciente de la IA** — sección aparte más abajo.

### La fecha real: Velá de Santa Ana

Además del plazo del máster, me impuse una fecha propia: **publicar la app en App Store y Google Play antes de la Velá de Santa Ana** (cuando se celebra esta tradición en Triana, en julio). Trabajar con una fecha real, con las consecuencias reales de no cumplirla, es una lección que en el aula no se enseña del todo. Este palo me lo he trabajado por mi cuenta y ha sido tan didáctico como el resto.

### Aprender qué es "shipping"

Publicar en producción es la fase más ignorada por los cursos y una de las más reales del oficio. Este proyecto me ha metido de lleno en:

- Cuentas de developer reales (**Apple Developer** + **Google Play Console**).
- Verificación de identidad, política de privacidad, revisión de tiendas.
- Firma de apps, **keystores**, gestión segura de secretos.
- **TestFlight**, revisiones de App Store, cuestionarios IARC.
- **CI/CD** con GitHub Actions (workflows separados iOS/Android, secrets en el repo, macOS runners porque Apple exige Xcode 26 y mi MacBook Air topa en Xcode 16).

Y bloqueantes que me han obligado a ser resolutivo:

- CocoaPods reventando por encoding — `LANG=en_US.UTF-8` al rescate.
- Google Play exigiendo verificar un móvil Android físico para publicar (no tengo uno, resuelto con móvil prestado).
- Migración de `compileSdk` 36 y AGP 8.9.1 con conflicto de duplicate classes en Kotlin stdlib.
- IPs y música de terceros: **soy consciente del riesgo asumido** (documentado en `docs/ip-content-audit.md`), decisión de autor con plan de sustitución si aparece reclamación.

### Por qué publicarlo antes de entregar

Además de por el TFM, quería que la app **existiera de verdad**. Dos motivos:

1. **Escaparate personal.** Es una forma de enseñar lo que soy capaz de hacer. Si alguien la juega y le gusta, sabe dónde encontrarme.
2. **Ilusión pura.** El sueño es cruzar Triana un día y ver a alguien con el móvil diciendo _"¡tomaaa, he conseguido al Nazareno!"_. Eso, más que cualquier nota, es lo que me mueve.

### Herramientas y creación de contenido

He usado **varias herramientas distintas** para construir cada tipo de contenido del juego, no una sola IA para todo. La intención era que cada pieza saliera de la herramienta más adecuada, no del atajo más rápido:

- **Código:** Claude Code como copiloto (más abajo).
- **Imágenes de fondos y premios:** **ChatGPT** y **Gemini**, alimentados con **prompts en formato JSON** compartidos entre imágenes para mantener la coherencia visual (paleta, estilo, escala, encuadre). Sin ese "contrato" de prompt, cada generación divergía y no cuadraba con el resto del set.
- **Sprites y skins de personajes:** dibujados **píxel a píxel a mano** en LibreSprite / Aseprite. Aquí no hay IA que te dé lo que ves en pantalla — cada personaje me ha llevado sus horas.
- **Fotografías base:** hechas con **mi cámara** en Triana y después pixeladas para incorporarse al mapa y al 3D.
- **Música y efectos de sonido:** **BeepBox** y **jsfxr**, hechos a mano. Es la parte donde soy menos experto — el resultado es funcional pero mejorable, y sé que se nota. Aprendizaje pendiente para futuras versiones.

Que el proyecto se apoye en más de una IA (y en herramientas artesanales) no es casualidad: forma parte de aprender **para qué sirve cada una** y no encajar todo a martillazos con la que ya conoces.

### Cómo he trabajado con la IA (Claude Code)

Este proyecto está construido con **Claude Code como copiloto**, pero con **yo siempre al volante**. La regla ha sido clara: antes de dejarle escribir código, entender el porqué. Preguntaba una y otra vez, y me lo explicaba con paciencia hasta que lo entendía.

Donde más me ha ayudado:

- **Arquitectura** — Clean Architecture aplicada a un juego Phaser.
- **Refactor** y limpieza de código repetitivo.
- **Explicaciones docentes** al entrar en terreno nuevo (keystores, gradle, Xcode CI, plataformas).
- **Debugging** de errores oscuros en cadenas de builds nativos.

Hemos discrepado a veces — soluciones que yo veía de otra manera y prevalecía la mía. La IA nunca ha sido el autor del proyecto: ha sido un colaborador senior con quien discutía diseño y aparcaba dudas. Es la única forma sana de usarla, para mí: **para amplificar lo que sé, no para tapar lo que no**.

Si tuviera que dar un consejo a alguien que empieza con estas herramientas, sería uno solo: **no dejes que escriba nada que no puedas explicar tú a un colega**. Ese filtro te obliga a aprender y protege tu proyecto de decisiones que no entiendes.

### Enlaces del proyecto

- 🌐 **Juega ahora (web):** [https://minijuego-lilac.vercel.app/](https://minijuego-lilac.vercel.app/)
- 🍎 **App Store iOS:** _pendiente de revisión_
- 🤖 **Google Play Android:** _pendiente de verificación de cuenta developer_
- 📽️ **Presentación (slides):** _se añadirá cuando esté publicada_
- 📖 **Documentación técnica adicional:** carpeta [`docs/`](docs/) (release iOS, workflow Android, contenido/IP, App Store checklist)
- 📝 **Historial de cambios:** [`CHANGELOG.md`](CHANGELOG.md)
