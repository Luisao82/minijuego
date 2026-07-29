# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [1.9.1] - 2026-07-29

### Fixed

- **Android — iconos de la barra de estado ya no se superponen a los botones "MENÚ" y "FICHA TÉCNICA".** Los flags `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` y demás que usaba `MainActivity.java` están deprecados desde Android 11 y en Android 15+ (targetSdk 36) directamente se ignoran, dejando la status bar visible por encima del juego aunque el fondo fuese transparente. Reescrito para usar `WindowInsetsControllerCompat.hide(systemBars())` con `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`, más `WindowCompat.setDecorFitsSystemWindows(false)` y `layoutInDisplayCutoutMode = SHORT_EDGES` para que el juego ocupe toda la pantalla incluyendo el área de notch. `styles.xml` ampliado con `statusBarColor` y `navigationBarColor` transparentes y `windowLayoutInDisplayCutoutMode="shortEdges"` para reforzar desde el tema.

### Changed

- **Versión bumpeada a 1.9.1** en `package.json` y `android/app/build.gradle` (`versionName "1.9.1"`, `versionCode 6`). **iOS se mantiene en 1.9.0** porque el fix es Android-only y no procede regenerar un TestFlight nuevo.

## [1.9.0] - 2026-07-27

### Added

- **Nuevo personaje "Guasinei"** (`src/game/config/characters.js`) — situado justo después de Triana Campeón en la selección. Stats: peso 5, equilibrio 4, altura 6, edad 5. Portrait en `public/assets/sprites/characters/javi_guasinei.png`. **Se desbloquea al conseguir el premio "Bandera de Guasinei, que arte por dio"** — condición `specific_reward` en `public/assets/characters-unlock.json`. Tres skins: `guasi_rosa` ("Camiseta Rosa", default), `guasi_La_Cava` ("La Cava", desbloquea a 3 banderas) y `guasi_Azulejo` ("Azulejo", 9 banderas). Progresión intermedia entre `chaval` (2 skins, 5) y `retro01` (4 skins, 3/9/15).
- **Nuevo premio "Bandera de Guasinei, que arte por dio"** (`public/assets/rewards.json`) — id `reward_bandera_guasinei`, imagen `premios/guasibandera.webp`, probabilidad `0.25`.

### Changed

- **Versión bumpeada a 1.9.0** en `package.json`, `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION` Debug y Release) y `android/app/build.gradle` (`versionName "1.9.0"`, `versionCode 5`). Este es el primer bump de Android desde `1.7.6` — se salta 1.8.0/1.8.1 (releases que solo fueron a TestFlight iOS).
- **`public/sw.js` — `CACHE_NAME` bumpeado a `cucana-v1.9.0`** para invalidar la caché del service worker en Vercel.

## [1.8.1] - 2026-07-26

### Fixed

- **`src/game/scenes/CharacterUnlockScene.js` — retrato del personaje se salía del panel de la ficha** con retratos > 260 px de lado (visible en `flamenca`, `retro01`, `el_barba`, `triana_campeon`, todos 672×672). El sprite se creaba con `setDisplaySize(SPRITE_SIZE, SPRITE_SIZE)` para calcular el scale de ajuste, pero acto seguido `setScale(0)` descartaba ese cálculo y el tween de entrada apuntaba a `scaleX/Y: 1` → la imagen terminaba a tamaño nativo. Ahora se guarda el scale objetivo antes del reset a 0 y el tween interpola hasta ese valor.
- **`public/sw.js` — `CACHE_NAME` bumpeado a `cucana-v1.8.1`** para invalidar la caché del service worker en Vercel.

### Changed

- **Versión bumpeada a 1.8.1** en `package.json` e `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION` Debug y Release). Android se mantiene en `1.7.6` (release solo para TestFlight).

## [1.8.0] - 2026-07-26

### Added

- **Nuevo personaje "EL BARBA"** (`src/game/config/characters.js`) — estadísticas equilibradas al 50% (peso 5, equilibrio 5, altura 5, edad 5). Descripción: "No te puedes perder los mejores churros de Triana.". Portrait en `public/assets/sprites/characters/el_barba.png` y spritesheet en `public/assets/sprites/characters/spritesheet/el_barba.png` (144×24, 9 frames de 16×24 siguiendo `SPRITE_CONFIG`). **Se desbloquea al conseguir el premio "Calentitos de El Barba"** — condición `specific_reward` en `public/assets/characters-unlock.json`.
- **3 skins nuevos para "EL BARBA"** en `public/assets/sprites/characters/spritesheet/`: `el_barba_2.png` ("El Barbas II", desbloquea a 3 banderas), `el_barba_3.png` ("El Barbas III", 9 banderas) y `el_barba_4.png` ("El Barbas IV", 15 banderas). Misma progresión que `retro01`.
- **Nuevo premio "Calentitos de El Barba"** (`public/assets/rewards.json`) — id `reward_calentitos`, imagen `premios/calentitos.webp`, probabilidad `0.3`.
- **Nuevo personaje "TRIANA CAMPEÓN"** (`src/game/config/characters.js`) — mismas stats que Trianero (peso 5, equilibrio 4, altura 5, edad 5). Situado justo después de El Barba en la selección. Portrait en `public/assets/sprites/characters/triana_campeon.png`. **Se desbloquea al conseguir el premio "Camiseta del Triana"** — condición `specific_reward` en `public/assets/characters-unlock.json`. Dos skins: `cucurella` ("Cucurella Trianero", default) y `niko` ("Niko de Triana", desbloquea a 5 banderas — misma progresión que `chaval`).
- **Nuevo premio "Camiseta del Triana"** (`public/assets/rewards.json`) — id `reward_camiseta_triana`, imagen `premios/camiseta-triana.webp`, probabilidad `0.2`.

### Changed

- **Versión bumpeada a 1.8.0** en `package.json` e `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION` en Debug y Release). Android se mantiene en `1.7.6` (esta release solo va a TestFlight; el próximo build Android bumpeará su `versionName`/`versionCode` cuando toque).

### Fixed

- **`public/sw.js` — `CACHE_NAME` bumpeado a `cucana-v1.8.0`** para invalidar la caché del service worker en cada release: la estrategia cache-first sobre assets estáticos (incluidos `rewards.json` y `characters-unlock.json`) hacía que usuarios recurrentes no vieran cambios de configuración en Vercel hasta forzar recarga.

## [1.7.6] - 2026-07-18

### Fixed

- **Android bloqueado a orientación landscape.** `android/app/src/main/AndroidManifest.xml` — añadido `android:screenOrientation="sensorLandscape"` en la `MainActivity` para impedir que el juego se pueda jugar en vertical. Permite las dos orientaciones horizontales (izquierda/derecha) para que el usuario pueda girar el móvil 180º. iOS ya estaba bloqueado a landscape vía `UISupportedInterfaceOrientations` en `Info.plist`.

### Changed

- **Versión bumpeada a 1.7.6** en `package.json` y `android/app/build.gradle` (`versionName "1.7.6"`, `versionCode 4`). **iOS se mantiene en 1.7.5** porque este release solo contiene un fix específico de Android; iOS ya está bloqueado a landscape vía `Info.plist` y no requiere nueva build. La próxima release iOS bumpeará su `MARKETING_VERSION` cuando haya cambios iOS-relevantes.

## [1.7.5] - 2026-07-17

### Changed

- **Música del menú sustituida por una versión original propia (`public/assets/audio/intro.wav`)** para eliminar el riesgo de derechos de autor sobre la interpretación anterior. La nueva pista es una composición/adaptación regrabada por Carlos Pérez cedida para el proyecto, y sustituye al archivo antiguo bajo la misma clave `music-menu` cargada en `PreloadScene`; no requiere cambios de código de carga o reproducción.
- **`src/game/scenes/LicensesScene.js` — bloque "MÚSICA DEL MENÚ" reescrito** para reflejar la nueva pista. Se retiran las líneas "Adaptación BeepBox de sevillana / popular interpretada por / Los del Río." y el aviso "⚠ Uso pendiente de autorización de los titulares." Se sustituyen por un único agradecimiento: "Agradecimiento a Carlos Pérez". Se elimina el helper `_warning()` y el estilo `ENTRY_WARNING` que quedaban sin uso tras el cambio.
- **Versión bumpeada a 1.7.5** en `package.json`, `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION` en Debug y Release) y `android/app/build.gradle` (`versionName`). `versionCode` Android sube a `3`.

## [1.7.4] - 2026-07-15

### Changed

- **Rediseñada la fila inferior de las tres pantallas de selección (`ViewSelectScene`, `CharacterSelectScene`, `SkinSelectScene`) para evitar confusiones de acción.** El layout anterior tenía un texto dorado pulsante ("SELECCIONAR VISTA" / "SELECCIONAR" / "SELECCIONAR" para skins) encima de un botón amarillo tipo cartelón centrado ("INICIO" / "CAMBIAR VISTA" / "VOLVER"), y los usuarios pulsaban el botón amarillo creyendo que confirmaba la selección. Ahora ambas acciones son botones amarillos idénticos en la misma fila: **secundario a la izquierda** y **primario a la derecha**. Etiquetas cortas para reforzar que son navegación entre pantallas: **MENÚ / VISTA / PERSONAJES** (izquierda) y **SELECCIONAR / SELECCIONAR / JUGAR** (derecha; "JUGAR" en la pantalla de skin es más literal que "SELECCIONAR" al ser la acción final antes de la partida). Se retiraron el texto pulsante y sus tweens; ambos botones usan `makeNavButton` con `measureNavButtonSize` para autotamaño. Layout compartido: `MARGIN_X = 40`, `CENTER_Y = BAND_Y + BAND_H + 70`.

### Fixed

- **`src/game/scenes/HistoryScene.js` — la última página de la historia ya no se auto-sobrescribe.** Antes, al terminar de teclear la última página del último bloque ("¡Échale coraje...!" en "Tu Misión"), `onPageComplete()` llamaba directamente a `onHistoryEnd()`, reemplazando el texto por "¡Eso es todo, mi arma! ¡A por la bandera!" sin dar tiempo a leerlo. Ahora `onPageComplete()` siempre espera input mostrando el indicador ▼, y la transición al texto final se dispara en `advanceDialog()` cuando el usuario toca la caja.
- **`src/game/config/historyContent.js` — corregidas dos erratas del primer párrafo de la historia.** "¡Escúcha miarma!" → "¡Escucha miarma!" (es-CU-cha es palabra llana terminada en vocal, no lleva tilde). "Te lo voy a contar una historia" → "Te voy a contar una historia" (el "lo" era residuo de una edición previa).

### Added

- **`docs/google-play-listing-copy.md`** — hoja operativa para rellenar la ficha de Google Play (paridad con `docs/app-store-listing-copy.md`), con textos adaptados a los límites de Play Store (descripción corta 80 chars, descripción completa 4000, novedades 500), respuestas al cuestionario IARC (PEGI 12 esperado por la referencia a alcohol en un reward), declaración de "Data safety" incluyendo Sentry, orden sugerido de setup, notas para el revisor y territorios de distribución. Elaborado para el primer submit v1.7.3 en la Play Console.
- **Sección "Sobre este proyecto — TFM" al final del `README.md`** con la historia personal del autor (por qué La Cucaña Trianera, qué significa el proyecto), lo aprendido en el desarrollo, la fecha real autoimpuesta (Velá de Santa Ana), la experiencia de "shipping" y los bloqueantes reales resueltos, motivación para publicar antes de entregar, y reflexión sobre el trabajo con IA como copiloto guiado. Incluye subsección **"Herramientas y creación de contenido"** que documenta el uso combinado de Claude Code (código), ChatGPT + Gemini (imágenes de fondos y premios con prompts JSON para coherencia), LibreSprite/Aseprite (sprites a mano), cámara propia (fotografías base pixeladas) y BeepBox + jsfxr (música y SFX). Preparación para la entrega del TFM del Máster de Desarrollo con IA (MoureDev / BIG School).

### Changed

- **`README.md` — bloque "Visión a futuro" reemplazado por dos secciones**: nueva "Estado actual" que refleja lo ya publicado (web PWA, iOS TestFlight, Android AAB + APK probado, CI/CD con GitHub Actions), y "Visión a futuro" actualizada con lo que sigue realmente pendiente (compartir imagen en Android, ampliación del mapa, workflow `android-release.yml` bloqueado por Google).
- **`README.md` — tabla "Stack tecnológico" ampliada** para reflejar la realidad completa del proyecto: Capacitor (iOS + Android) + sus plugins, GitHub Actions, Vercel, Vitest, Prettier + ESLint, BeepBox / jsfxr para sonido, ChatGPT / Gemini para generación de imágenes, y Claude Code como copiloto.
- **`README.md` — "Estructura del proyecto" actualizada**: añadidas carpetas y ficheros que existían pero no aparecían (`android/`, `ios/`, `docs/`, `.github/workflows/`, `capacitor.config.json`, `CHANGELOG.md`, `GDD.md`, `CREDITS.md`, `PRIVACY.md`, `LICENSE`, `CLAUDE.md`) y detalle de subcarpetas de `src/game/` (config, entities, systems, components, services, utils). Con nota final sobre Clean Architecture.
- **`README.md` — "enjabonado" → "engrasado"** en la descripción de la tradición, más fiel al término tradicional.
- **`README.md` — Sentry mencionado** en tres sitios: fila en la tabla de "Stack tecnológico", bullet en "Estado actual" ("Observabilidad en producción con captura de errores y breadcrumbs de navegación"), y bullet en la sección TFM "Lo que he aprendido construyéndolo". Sentry ya estaba integrado (`src/main.js` con init condicional a `import.meta.env.PROD`, `BaseScene.js` con `Sentry.addBreadcrumb` en cada cambio de escena) pero se había omitido en la refresh anterior del README.

## [1.7.3] — 2026-07-12

### Added

- **Plugin `@capacitor/share` instalado y usado en Android nativo** (`src/game/utils/share.js`) — el botón de "compartir premio/skin" no hacía nada en la app Android porque el WebView de Capacitor no expone `navigator.share`. Ahora `shareImage()` detecta con `Capacitor.getPlatform() === 'android'` en modo nativo y usa `Share.share({ text })` del plugin, que lanza el Intent nativo de Android. En iOS y en la web sigue usando `navigator.share` (con imagen) porque ya funcionaba. Limitación conocida: en Android solo se comparte el texto, no la imagen — para compartir imagen habría que escribir el blob a disco con `@capacitor/filesystem` primero, se deja como mejora futura.
- **Firma de release Android configurada en `android/app/build.gradle`** — nuevo bloque `signingConfigs.release` que lee `android/keystore.properties` (gitignored) con `storeFile`, `storePassword`, `keyAlias`, `keyPassword`, y se aplica a `buildTypes.release` para generar el AAB firmado listo para Google Play. El keystore vive fuera del repo (`~/AndroidKeystores/cucana-release.jks`, formato PKCS12, alias `cucana`) por seguridad. La config está envuelta en `if (keystorePropertiesFile.exists())` para que builds sin el archivo (ej. futuro workflow CI que inyecte secrets por env vars) no rompan.
- **`.gitignore` — nueva entrada `RELEASE_GUIDE.md`** — chuleta personal del autor con el flujo de release (Vercel + iOS + Android) por si necesita publicar sin ayuda del asistente. Es un archivo local, fuera del repo por decisión.

### Changed

- **Android SDK y Gradle Plugin bumpeados** (`android/variables.gradle`, `android/build.gradle`): `compileSdkVersion` y `targetSdkVersion` 35 → 36, Android Gradle Plugin 8.7.2 → 8.9.1. Requerido por la dependencia transitiva `androidx.browser:browser:1.9.0` que trae algún plugin de Capacitor; el build de release fallaba con `checkReleaseAarMetadata` exigiendo `compileSdk 36` y AGP `≥ 8.9.1`. Gradle wrapper 8.11.1 ya es compatible con AGP 8.9.1, no hace falta tocarlo. No afecta a iOS.
- **Modo pantalla completa activado en Android** (`android/app/src/main/res/values/styles.xml`, `android/app/src/main/java/com/cucana/trianera/MainActivity.java`). El tema `AppTheme.NoActionBar` ahora incluye `android:windowFullscreen=true` para ocultar la barra de estado, y `MainActivity` sobreescribe `onCreate` y `onWindowFocusChanged` para aplicar `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` + flags de fullscreen y ocultado de navegación → oculta también la barra de navegación inferior y se mantiene oculta aunque el usuario deslice desde los bordes. Equivalente al `UIRequiresFullScreen=true` que ya teníamos en iOS.
- **Versión bumpeada a 1.7.3** en `package.json`, `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION` en Debug y Release) y `android/app/build.gradle` (`versionName`). `versionCode` Android se mantiene en `1` porque es el primer upload real a Google Play — subirá a `2` en la próxima release.

### Fixed

- **`android/build.gradle` — resuelto conflicto de `kotlin-stdlib-jdk7`/`kotlin-stdlib-jdk8` con `kotlin-stdlib` moderno.** Al subir a AGP 8.9.1 el build fallaba con `checkReleaseDuplicateClasses` porque `kotlin-stdlib:1.8.22` ya incluye las clases de los stdlib jdk7/jdk8 (fusionados desde Kotlin 1.8), pero algunos plugins Capacitor siguen requiriendo las variantes legacy `kotlin-stdlib-jdk7:1.6.21` y `kotlin-stdlib-jdk8:1.6.21`. Añadido `exclude` global en el `allprojects` block que descarta esas dos, dejando que el `kotlin-stdlib` moderno cubra todas las APIs. No afecta a runtime, es solo resolución de dependencias.

## [1.7.2] — 2026-07-12

### Changed

- **Rewards revertidos parcialmente a nombres no-neutralizados por decisión del autor** (`public/assets/rewards.json`). Los `id` NO cambian (compatibilidad con localStorage). Nombres afectados: `reward_pali` → "Llavero del Pali", `reward_curro` → "Pin del Curro", `reward_sombrero` → "Sombrero de Finidi", `reward_gambrinus` → "Peluche del Gambrinus", `reward_pacogandia` → "El chiste de los garbanzos", `reward_vajilla` → "Vajilla de la Cartuja", `reward_cerveza` → "Una caña fresquita", `reward_vaso` → "El vaso de tubo de Silvio". **Riesgo IP/rating asumido explícitamente** por el autor (mismo patrón que la música del menú): se publica sin autorización de titulares vivos ni herederos; si aparece reclamación, se sustituye. Nota sobre rating: "caña fresquita" es alcohol explícito → puede disparar 4+ → 12+ en App Store; pendiente si se sube el rating declarado en App Store Connect. Documentado en `docs/ip-content-audit.md`.
- **Descripciones de todos los rewards eliminadas** de `public/assets/rewards.json` — el texto no encajaba bien en la escena de premio ni en la colección. La UI ya manejaba el campo opcional (`if (reward.descripcion)` en `RewardScene.js` y `CollectionScene.js`), no requiere cambios de código.
- **Screenshots 02 y 05 sustituidos por versiones 2D** (`public/assets/store/screenshots/iphone-6.7/`, `iphone-6.5/`, `iphone-6.5-alt/`, `ipad-13/`). Antes mostraban la vista 3D (que está bloqueada hasta el 100 % en el juego real), lo que daba una impresión falsa del producto. Ahora `02-juego` muestra La Flamenca en el palo con la vista 2D del río, y `05-equilibrio` reutiliza la pantalla de tutorial 2D. Recuperados del commit `d934670` (v1.0 original) y redimensionados con `sips` a los tamaños oficiales de cada slot.
- **Nuevas carpetas de screenshots `public/assets/store/screenshots/iphone-6.5/` (2778×1284) y `iphone-6.5-alt/` (2688×1242)** — Apple sigue exigiendo el tamaño histórico 6.5" para iPhone y no acepta los 6.7" originales. Se generan como derivados de los 6.7" con `sips -z`.

## [1.7.1] — 2026-07-11

### Changed

- **`src/game/config/shareConfig.js` — `GAME_URL` vaciado (`''`)** para que el enlace de Vercel (`https://minijuego-lilac.vercel.app`) deje de aparecer en el texto compartido y en la imagen generada por la `ShareableCard`. El dominio de Vercel es efímero y no queremos anunciarlo desde una app publicada en App Store. Cuando exista un dominio público definitivo, rellenar de nuevo esta constante. La lógica ya estaba preparada: `buildShareText` y `ShareableCard` omiten el link cuando la URL está vacía.

## [1.7.0] — 2026-07-11

### Added

- **Workflow de release iOS en GitHub Actions (`.github/workflows/ios-release.yml`)** — compila la app en runners `macos-latest` (Xcode 26 preinstalado) y la sube a App Store Connect al pushear un tag `v*.*.*`. Necesario porque el MacBook Air 2018 del autor tope en macOS Sonoma / Xcode 16, y Apple exige Xcode 26 / SDK iOS 26 desde 2026-04. Firma automática vía App Store Connect API Key (`-allowProvisioningUpdates`), build number derivado de `github.run_number` para no colisionar entre runs, upload con `xcrun altool`. Documentación completa del flujo (setup one-time, publicación por release, troubleshooting) en `docs/ios-release-workflow.md`.
- **`UIRequiresFullScreen = true` en `ios/App/App/Info.plist`** — Apple rechazaba el bundle porque las orientaciones landscape-only no cubrían el multitasking de iPad. Marcarlo como fullscreen exime del requisito de soportar portrait sin comprometer la orientación fija del juego.
- **Escena final del juego (`src/game/scenes/FinaleScene.js`)** — al alcanzar el 100 % de completado, tras la última pantalla de desbloqueo, se muestra un final: paneo hacia el cielo nocturno de Triana, fuegos artificiales pixel art tras las casas, texto retro "CONGRATULATION", mensaje configurable y botón VOLVER. Se auto-muestra **una sola vez** por cada vez que se alcanza el 100 %; conseguir más banderas estando ya al 100 % no la vuelve a disparar.
- **Componente reutilizable `src/game/components/Fireworks.js`** — `createFireworks(scene, opts)` genera cohetes y explosiones 100 % por código (rectángulos pixel art, sin texturas) con tamaño, color, radio y cadencia aleatorios, física balística con caída y parpadeo retro al morir. API: `start()`, `stop()`, `destroy()`. Todos los parámetros son configurables por opciones.
- **`public/assets/finale.json`** — configuración editable de la escena final: `message` (texto bajo CONGRATULATION), fondo, tiempos de paneo y espera, sonido y volumen de explosión, y parámetros de los fuegos (colores, ratios de altura, cadencia, tamaños, nº de partículas).
- **`src/game/services/CompletionService.js`** — punto único que reúne el estado de todos los servicios de progresión y llama al calculador puro. Expone `getCompletion(rewardsCount)` e `isGameComplete(completion)` (comparación exacta de totales: `percent` redondea 99,6 % a 100 y no vale para desbloqueos). `StatsScene` se refactoriza para usarlo.
- **`src/game/services/FinaleService.js`** — decide cuándo auto-mostrar el final. Persiste el **total de objetivos** con el que se vio (`cucana_finale_seen_total`), no un booleano: si una actualización añade contenido el total cambia y el final vuelve a auto-mostrarse solo al re-conquistar el 100 %. Suite de 11 tests en `tests/services/FinaleService.test.js`.
- **`src/game/utils/finaleGate.js`** — `startWithFinaleCheck(scene, target, data)`: todas las navegaciones que cierran la cadena post-partida (RewardScene, PerspectiveUnlockScene, CharacterUnlockScene, SkinUnlockScene) pasan por esta puerta, que intercala FinaleScene antes del destino cuando corresponde.
- **Botón "VER FUEGOS ARTIFICIALES" en Estadísticas** — con el juego al 100 %, la fila COMPLETADO sustituye la barra por un botón que relanza la escena final (vuelve a Estadísticas al salir). Si el porcentaje baja de 100 por contenido nuevo, reaparece la barra.
- **Carga del fondo nocturno `bg-finale`** (`public/assets/backgrounds/fondo_b-noche.webp`) en PreloadScene; si el archivo no existe, FinaleScene usa `bg-game-sevilla` como fallback.
- **Plataforma Android** (`@capacitor/android`, carpeta `android/` versionada en el repo) creada con `npx cap add android`. El puente de storage y el resto de plugins (`@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/browser`) quedan registrados en Gradle automáticamente. La carpeta antes estaba excluida en `.gitignore`; ahora se versiona igual que iOS. Se excluyen solo los derivados: bundle web sincronizado (`android/app/src/main/assets/public/`), keystore local (`*.keystore`, `*.jks`, `android/keystore.properties`) y todo lo que ya cubre el `android/.gitignore` estándar (build/, .gradle/, local.properties). ESLint también ignora `android/**` como ya hacía con `ios/**`.
- **Iconos y splash regenerados para las tres plataformas** con `@capacitor/assets` a partir del máster `public/assets/store/icon-1024.png`. Android: 74 archivos (mipmap-mdpi..xxxhdpi + adaptive icons + splash). iOS: 7 archivos (app icon + splash claro/oscuro). PWA: 7 iconos (48-512 en webp) bajo `public/assets/icons/`. El máster de origen queda en `assets/icon.png` para futuras regeneraciones.
- **`docs/android-workflow.md`** — guía de referencia rápida: instalación de Android Studio, ciclo diario, regeneración de iconos, build de release (.aab firmado) y versionado.
- **Persistencia nativa duradera: `src/game/services/NativeStorageBridge.js` + `@capacitor/preferences`** — en la app nativa (iOS/Android), el progreso del jugador (claves `cucana_*` de localStorage) se espeja automáticamente en Preferences (UserDefaults / SharedPreferences), que sobrevive a las purgas de WebView de iOS y a actualizaciones de la app. Al arrancar restaura en localStorage lo que falte y migra el progreso previo de jugadores existentes. En web no hace nada. Los servicios no cambian: siguen usando localStorage síncrono; el puente parchea el prototipo de Storage una sola vez desde `src/main.js`, antes de arrancar Phaser. Suite de 5 tests en `tests/services/NativeStorageBridge.test.js`.

### Changed

- **Los fuegos artificiales de la escena final se recortan a la franja del cielo** con una máscara de geometría compartida (`skyBottomY` en `Fireworks.js`, `skyLineRatio` en `finale.json`): los cohetes emergen por detrás de los tejados y las chispas que caen desaparecen tras las casas, dando profundidad. El mensaje de completado se mueve bajo el caserío, sobre el agua, donde se lee sin pisar el fondo.
- **La vista 3D pasa a estar bloqueada** (`public/assets/perspectives.json`, condición nueva de tipo `completion` con hint "Completa el juego al 100%"). Se desbloquea automáticamente al alcanzar el 100 % de completado — RewardScene la desbloquea y la muestra en PerspectiveUnlockScene como el resto de vistas. El desbloqueo es **permanente**: aunque futuras actualizaciones añadan contenido y el porcentaje baje, la 3D no se vuelve a bloquear. La 3D ya estaba excluida del denominador del porcentaje, así que el cálculo no se auto-referencia.
- **Guarda de migración para la perspectiva guardada**: `startGame` y `GameScene` ignoran la perspectiva almacenada si está bloqueada (jugadores que tenían la 3D seleccionada antes de este cambio caen a la partida 2D con la vista Triana).

## [1.6.0] — 2026-07-10

### Added

- **Nueva stat "COMPLETADO" en la pantalla de estadísticas** (`src/game/scenes/StatsScene.js`). Sustituye a la anterior "REC. MEDIO" (recorrido medio del palo) por un porcentaje de completado global del juego, con una barra pixel art estilo Cartelón de Feria en la misma fila para no descuadrar la sección. El porcentaje agrega en un único número: personajes desbloqueables desbloqueados (excluye Trianero y Flamenca, que están por defecto), skins con condición desbloqueados (los `flags: null` no cuentan), premios distintos obtenidos, piezas del mapa de Sevilla descubiertas y la perspectiva "Sevilla". La perspectiva 3D queda fuera intencionadamente para no auto-referenciar el porcentaje (se desbloquea al 100 %). El easter egg también queda fuera.
- **Nuevo sistema puro `src/game/systems/CompletionCalculator.js`** con `computeCompletion({...})` (más `computeTotals` y `computeObtained` internos). Recibe todo por parámetro (personajes, contadores, IDs desbloqueados por el jugador) para poder testearse sin Phaser ni `localStorage`. Devuelve `{ totals, obtained, percent }` con un `percent` entero saturado a `[0, 100]`.
- **`ALL_PIECES` exportado desde `src/game/services/MapService.js`** para que el calculador pueda consultar el total sin acoplarse a la implementación interna.
- **Suite de 21 tests unitarios** para `CompletionCalculator` (`tests/systems/CompletionCalculator.test.js`) cubriendo: totales con y sin defaults, exclusiones (defaults, hidden, `available: false`), estado inicial (`0 %`), estado completo (`100 %`), estados parciales y protección contra divisiones por cero y datos inconsistentes.
- **Dos nuevos premios en la colección** (`public/assets/rewards.json`): **Avellanas verde** (`reward_avellana`) — "Picoteo tradicional en la velá, con una fresquita, espectacular"; y **Palodu** (`reward_palodu`) — "'Chuchería natural' que no puede faltar en la tradición sevillana. Cómprate un manojito chiquillo". Probabilidad 0.4 cada uno. Imágenes originales del autor en `public/assets/premios/avellana.webp` y `palodu.webp` (WebP 512×512, generadas por Pillow a partir de los PNG 1024×1024 originales).
- **`public/support.html`** — página de soporte pública para App Store Connect (campo obligatorio). Reutiliza la paleta y tipografías de `privacy.html` (Jersey 10 + Press Start 2P sobre fondo azul noche) para mantener la estética pixel art coherente. Incluye contacto principal (`luisaodeben@gmail.com`) y ocho preguntas frecuentes cubriendo el modelo gratuito, la privacidad, incidencias, pérdida de progreso, offline, cómo se juega, idiomas, sugerencias, reporte de bugs y ubicación de créditos in-app.
- **`docs/app-store-listing-copy.md`** — hoja operativa con todos los textos de la ficha de App Store Connect listos para pegar: subtítulo (29 char), promotional text (157 char), descripción larga (~1250 char), keywords (96 char), release notes, review notes, categorías, orden sugerido para rellenar. Complementa `app-store-privacy-checklist.md`.
- **`docs/ip-content-audit.md`** — auditoría exhaustiva del contenido con riesgo de propiedad intelectual, marcas registradas o rating de edad (alcohol). Cubre los 15 rewards, los retratos de personaje, los skins problemáticos (Mario, Larry, etc.) y una recomendación priorizada de acciones antes del submit real. Sirve como fuente de verdad para saber qué está limpio, qué está pendiente y por qué se tomó cada decisión.

### Changed

- **Nombres de skins del personaje RETRO neutralizados** (`src/game/config/characters.js`). Los `spritesheet` (que apuntan a los sprites en disco) se mantienen para no romper la carga de assets; sólo cambian los `nombre` visibles: "Mario" → **"El Fontanero"**, "Abu Simbel" → **"El Faraón"**, "Larry" → **"El Detective"**. "Dan" se conserva por ser un nombre común sin marca identificada. Los sprites en sí pueden seguir siendo reconocibles y necesitan revisión gráfica aparte (queda anotado en `docs/ip-content-audit.md`).
- **Rewards textualmente limpios de marcas comerciales y alcohol** (`public/assets/rewards.json`). Se mantienen los `id` para no romper el localStorage de jugadores existentes ni los tests; sólo cambian los `nombre` y `descripcion` visibles. Cambios concretos: cerveza fresquita → **cucurucho de altramuces**; vaso mítico del rockero → **vaso de artesanía trianera**; peluche de Gambrinus → **peluche de la Velá**; pin del Curro (Expo 92) → **pin del canario**; camiseta de Maradona → **camiseta clásica del 10**; sombrero de Finidi → **sombrero cordobés**; sugus → **caramelo de fruta**; vajilla de La Cartuja → **vajilla de porcelana sevillana**; descripción de El Llamador sin alusión al programa de Canal Sur; "Grande Triana" reenfocado al barrio, no al grupo musical; llavero del Pali y cinta de Paco Gandía neutralizados para minimizar riesgo con herederos. Se mantienen sin cambios: `reward_hispalis` (decisión explícita del autor), `reward_giraldillo` (patrimonio), `reward_wendolin` (sin marca identificada). Las **imágenes** de los rewards siguen siendo las originales por ahora — el rediseño gráfico se hará aparte.
- **Créditos musicales actualizados** en `CREDITS.md` y en la `LicensesScene` in-app: la sevillana adaptada como música del menú principal ya no se atribuye a _Cantores de Híspalis_ sino a **_Los del Río_** («Sevilla tiene un color especial»), reflejo del cambio de la pista base. La advertencia "⚠ Uso pendiente de autorización" se mantiene: la composición sigue teniendo derechos de autor y sigue sin licencia expresa.
- **`docs/email-cantores-hispalis.md` renombrado a `docs/email-music-authorization.md`** y su contenido actualizado al nuevo intérprete/obra. El template sigue siendo válido si en el futuro se decide contactar con la SGAE o con el editor musical.
- **`TODO.md`** — la entrada de "bloqueante de publicación" se reformula como "riesgo de publicación asumido": la app se publica sin autorización expresa; si aparece reclamación, sustituir por una composición original.
- **`reward_hispalis`** ("Vinilo de Los cantores de Hispalis") en `public/assets/rewards.json` se mantiene sin cambios por decisión del autor.

### Removed

- **Stat "REC. MEDIO"** (media del porcentaje del palo recorrido por partida) en la pantalla de estadísticas. La función `avgPolePercent()` de `StatsCalculator` se conserva por si otros consumidores la necesitan en el futuro; simplemente ya no se pinta en `StatsScene`.

## [1.5.3] — 2026-07-09

### Fixed

- **Assets del tutorial y de la tienda regenerados SIN el overlay de scanlines CRT** (`public/assets/tutorial/`, `public/assets/store/screenshots/`). En la 1.5.2 las capturas se hicieron con `CRTScene` activa, que dibuja líneas negras cada 3 px con alpha 0.35 sobre todo el canvas — muy visible al escalar a 2×, sobre todo en la ficha de tienda. El nuevo pipeline las regenera parando `CRTScene` justo antes del `canvas.toDataURL()`, lo que da una imagen limpia sin scanlines. Todo el resto se conserva: mismas escenas, mismo storyboard, mismas flechas del tutorial (02-impulso → cursor de la barra INTENTO, 03-equilibrio → botones rojo/azul, 04-grasa → indicador de grasa), mismas dimensiones (tutorial 642×487 / 522×397 WebP; store iPhone 6.7"/6.9" 2796×1290, iPad 13" 2752×2064, Play/PWA 1920×1080).

## [1.5.2] — 2026-07-09

### Added

- **`docs/app-store-privacy-checklist.md`:** hoja de respuestas operativa para rellenar la sección **App Privacy** de App Store Connect. Documenta la Privacy Policy URL, qué categorías marcar (**Diagnostics → Crash Data** y **Other Diagnostic Data** por Sentry), qué purposes elegir (**App Functionality**) y por qué la app queda como "Data Not Linked to You / No tracking". Sirve de guía cuando se rellene el formulario en App Store Connect sin tener que redescubrir las respuestas cada vez.

### Changed

- **Imágenes del tutorial refrescadas con el estado actual de la 1.5.1** (`public/assets/tutorial/01-bienvenido.webp` … `06-listo.webp`): capturas nuevas del propio juego renderizado que muestran los componentes actuales — menú con botón INFO y versión 1.5.1, HUD de grasa con el nuevo look, botones NavButton estilo Cartelón de Feria, sprite del Trianero en el palo, botones rojo/azul de equilibrio y barra de balance actualizada. Las flechas indicativas se han redibujado sobre las nuevas capturas: **02-impulso** apunta al cursor de la barra INTENTO, **03-equilibrio** a los botones rojo (izq) y azul (der), **04-grasa** al indicador de grasa en la esquina superior izquierda. **01-bienvenido**, **05-salto** y **06-listo** no llevan flecha (igual que las originales). Dimensiones y formato conservados: 642×487 WebP para 01-05, 522×397 WebP para 06, así que ni el layout de `TutorialScene` ni el pipeline de assets necesitan cambios.
- **Assets de tienda refrescados con la 1.5.1** (`public/assets/store/screenshots/`): capturas nuevas de la vista 3D (fase impulso y equilibrio) sustituyen a las de 1.0.0 pre-vista-3D. La selección de personaje muestra sólo el personaje central (La Agüela) para evitar los retratos con alcohol de los personajes vecinos. La pantalla de premio se genera con "Pisacorbatas del Giraldillo" en vez del vaso de Cruzcampo, para eliminar marcas comerciales/alcohol de la ficha de tienda (App Store Guideline 5.2 y clasificación 4+). Storyboard final por plataforma (5 tiles): `01-intro`, `02-juego` (3D impulso), `03-seleccion` (La Agüela), `04-premio` (Giraldillo), `05-equilibrio` (3D balance). Sets generados: iPhone 6.7"/6.9" a **2796×1290**, iPad 13" a **2752×2064**, Play/PWA a **1920×1080**. **Ojo:** el juego en sí todavía contiene retratos con alcohol (El Trianero, La Flamenca, El Guiri, Cuñaos) y premios con IP protegida (Cruzcampo, Cantores de Híspalis, Sugus, Maradona, Larry, etc.) — habrá que rediseñarlos antes del submit real.

## [1.5.1] — 2026-07-09

### Added

- **Feedback háptico en pulsaciones táctiles (iOS/Android nativo):** nueva dependencia `@capacitor/haptics` y helper `src/game/utils/haptics.js` con `hapticTap()`. En Capacitor nativo dispara `Haptics.impact({ style: Light })` (en iOS → `UIImpactFeedbackGenerator(.light)`); en web es no-op. Los imports de `@capacitor/core` y `@capacitor/haptics` son dinámicos para no encarecer el bundle web. Cableado en los componentes compartidos `NavButton`, `IconButton`, `ShareButton` y `RewardCard` — cubre menús, cabeceras, botones de icono y las tarjetas de la colección. **No** se aplica a los botones de equilibrio (`BalanceUI`) porque se mantienen pulsados y provocarían spam de vibración. Reduce el riesgo de rechazo por Guideline 4.2 de App Store ("wrapped web") al aportar un mínimo de integración nativa.

### Changed

- **`register-sw.js` respeta Capacitor nativo:** además del caso de desarrollo (Vite en puerto no estándar), el service worker ahora se desregistra y se limpian sus cachés cuando `window.Capacitor.isNativePlatform()` devuelve `true`. En el WebView nativo el bundle ya se carga desde el filesystem local, así que el SW solo añadía una capa de caché capaz de servir JS obsoleto entre versiones de la app.

## [1.5.0] — 2026-07-08

### Added

- **Escena de política de privacidad dentro de la app (`PrivacyScene`):** el texto completo se embebe en el bundle importando `PRIVACY.md` con `?raw` de Vite. Un mini-parser convierte el markdown (h2/h3, párrafos, listas, negritas, enlaces) en objetos Phaser dentro de un contenedor con scroll (arrastre táctil, ratón y rueda) y un indicador ámbar a la derecha. **No depende de red ni de Vercel** — funciona sin conexión y sobrevive a un cambio de hosting. Accesible desde el menú → INFO → FICHA TÉCNICA → PRIVACIDAD.
- **Botón PRIVACIDAD dentro de `LicensesScene` (FICHA TÉCNICA):** agrupa toda la información legal / del proyecto en el mismo sitio.
- **Helper `openExternalUrl`:** abre URLs en el navegador del sistema — `SFSafariViewController` en iOS vía `@capacitor/browser` (nueva dependencia), pestaña nueva en web con `window.open`. Los imports son dinámicos para que el bundle web no pague el coste de Capacitor.
- **Proyecto nativo iOS trackeado en el repo:** `/ios` sale del `.gitignore` (menos los derivados y el bundle regenerado por `cap sync`). Con esto la configuración nativa (MainViewController, Info.plist, Podfile, iconos generados con `@capacitor/assets`) sobrevive a clones y `cap sync`.
- **`MainViewController` (Swift):** wrapper que embebe `CAPBridgeViewController` como hijo (Capacitor 8 marca varias de sus propiedades como `public` en vez de `open`, por eso no se puede subclase directamente). Overrides:
  - `prefersHomeIndicatorAutoHidden = true` — atenúa la home indicator del sistema durante el juego.
  - `preferredScreenEdgesDeferringSystemGestures = .bottom` — hacen falta dos gestos hacia arriba para salir al Home; evita fallos por swipes accidentales durante la partida.
- **Web bundle preparado para iOS a pantalla completa:** `meta name="viewport" content-fit=cover` en `index.html`, `body` y `#app` con fondo negro forzado en `style.css`, y `backgroundColor: #000000` en `capacitor.config.json`. Elimina la franja blanca que asomaba por debajo del canvas en el WKWebView.

### Changed

- Replace frontal-rio.webp background with updated artwork
- **`Info.plist` (iOS):** `UIStatusBarHidden = YES` y `UIViewControllerBasedStatusBarAppearance = NO` — la status bar del sistema se oculta durante el juego. `Main.storyboard` apuntando ahora a `MainViewController` (módulo `App`).
- **Política de privacidad (`PRIVACY.md`, `public/privacy.html`) alineada con la 1.5.0:** fecha 2026-07-06, versión 1.5.0. Sección 1 menciona Capacitor. Sección 3 aclara WKWebView y añade la perspectiva 3D. Sección 4.1 (Sentry) detalla más (IP, no envía contenido de partidas ni localStorage). Sección 4.2 (Google Fonts) aclara que en nativo se embeben. Sección 4.3 (Vercel) aclara que en nativo el bundle es local; la única llamada a Vercel sería la anterior política externa, que ya no existe (in-app). Nueva sección 4.5 Capacitor. Nueva sección 6 (Permisos del sistema en la versión nativa: ninguno). Sección 7 (Menores) añade rating 4+ / PEGI 3. Sección 9 (Cambios) enlaza a la URL oficial y al historial de Git.
- **Link "Visita mi web" en `LicensesScene`:** ahora usa `openExternalUrl` → en iOS abre Safari embebido en vez de un `window.open` que en Capacitor no siempre funciona bien.

## [1.4.5] — 2026-07-06

### Fixed

- **"Doble salto" al caer al agua en la vista 3D:** al terminar la fase `jumping`, la cámara se veía saltar por segunda vez. La causa: en 1.4.4 el `default` del `CameraController` (splash_done / done) subía `this._eyeY` hacia `REST_EYE_Y`, pero `this._eyeY` no se sincronizaba durante `jumping` (ahí solo se leía `state.jumpEyeY` para `pos.y`). Al entrar en el resting, la cámara "teletransportaba" a `1.9 m` (el valor de `_eyeY` desde el constructor) antes de bajar suavemente a `REST_EYE_Y = 0.55 m`, y esa subida abrupta se percibía como un segundo salto. Se lerpea directamente `this._pos.y` hacia `REST_EYE_Y` y `this._eyeY` se mantiene sincronizado. Test nuevo en `CameraController.test.js` que reproduce la transición sin teletransporte.

## [1.4.4] — 2026-07-05

### Fixed

- **Capa celeste oscilante detrás del jugador tras el chapuzón en la vista 3D:** al caer al agua, la cámara se quedaba apoyada a `WATER_EYE_Y = 0.15 m` sobre el nivel del río, pero el oleaje del agua (`World3D.update` mueve los vértices con `WAVE.AMP_X + WAVE.AMP_Y ≈ 0.26 m` de amplitud) subía por encima del ojo y las crestas cruzaban por delante del horizonte, dejando ver/tapar el cielo por detrás y produciendo un "sube y baja" celeste durante el game over. Nuevas constantes `CAMERA.REST_EYE_Y = 0.55 m` (por encima de la amplitud del oleaje) y `CAMERA.REST_RISE_SPEED = 2/s`: en el default del `CameraController` (fases `splash_done`/`done`), el ojo asciende suavemente al descanso mientras el roll se nivela. Test nuevo en `tests/render3d/CameraController.test.js`.

## [1.4.3] — 2026-07-05

### Changed

- **Niebla apagada en la vista 3D:** en 1.4.2 se quitó la niebla del agua para eliminar la franja celeste, pero las orillas seguían fundiéndose al cielo cerca del puente mientras el puente y el agua se veían nítidos — la unión quedaba rara. Se desactiva también la niebla en el material de las orillas y se retira `scene.fog` de la escena (junto con `FOG_NEAR`/`FOG_FAR` de la config, que ya no se usaban). Puente, orillas y agua se ven nítidos a cualquier distancia dentro del escenario visible; la profundidad la aporta la propia perspectiva (las orillas se hacen más pequeñas al alejarse hacia el puente). La unión orilla ↔ puente queda limpia.

## [1.4.2] — 2026-07-05

### Fixed

- **Franja celeste bajo el puente en la vista 3D:** la escena tiene niebla (`FOG_NEAR=90, FOG_FAR=220`) para que las orillas se fundan al fondo del cielo, y por defecto three.js aplica esa misma niebla también al material del agua. A la distancia del puente el color del agua se mezclaba con `SKY_COLOR`, dando una banda celeste entre las orillas/puente y el agua cercana. Con `fog: false` en el material del agua, el río mantiene su color desde el palo hasta el puente y la unión queda limpia. Las orillas siguen fundiéndose con el cielo al horizonte, así que la sensación de profundidad no cambia.

## [1.4.1] — 2026-07-05

### Fixed

- **Textura de las orillas 3D alineada con el puente:** las orillas se dibujan como planos con la textura del caserío 2D repetida a lo largo del río. Con el offset por defecto, en el punto donde el plano cruza `BRIDGE.Z` aparecía una zona arbitraria del caserío en lugar del final natural de Calle Betis (izquierda) o el principio del Maestranza (derecha). Se añaden `BANK_TEX_OFFSET_LEFT` (0.65) y `BANK_TEX_OFFSET_RIGHT` (0.75) en `game3dConfig.js` para que el "final" visual de cada orilla coincida con el arranque del puente, dando la sensación real de continuidad Triana → Puente → Sevilla.

## [1.4.0] — 2026-07-05

### Changed

- **Refactor Clean Architecture de las escenas de juego:** el flujo compartido de la partida (fases, input, HUD, panel de control, modal de salida, estadísticas, game over y premio) se extrae a `BaseGameScene`; `GameScene` (2D) y `Game3DScene` quedan como capas de presentación que implementan hooks. Se elimina la duplicación (~500 líneas) que la vista 3D introdujo al copiar el flujo de `GameScene`.
- **Nueva `RunSystem`:** la física de la carrera (deceleración lineal tras el impulso) sale de las escenas a un sistema puro y testeado, como `BalanceSystem`/`JumpSystem`. Ambas vistas la reutilizan (px en 2D, metros en 3D).
- **`JumpSystem` parametrizable:** acepta `gravity`/`vy0` opcionales, y la vista 3D reutiliza el mismo sistema balístico del salto 2D (en metros) en lugar de una física propia duplicada.
- **La parte 3D se separa en módulos (`src/game/render3d/`):** `World3D` (escenario three.js), `CameraController` (mapeo fase→cámara, puro y testeado) y `textureUtils` (sustitución de color de cielos). `Game3DScene` pasa de 841 a ~220 líneas y solo orquesta.
- **three.js se carga con `import()` dinámico:** su chunk (~700 kB) solo se descarga al entrar en la vista 3D; el bundle inicial baja de ~950 kB a ~240 kB.
- **Constantes 3D centralizadas en `config/game3dConfig.js`:** todos los números mágicos de la escena 3D (cámara, mundo, salto, caída, chapuzón) pasan a bloques nombrados del objeto `GAME3D`.
- **Componentes UI compartidos:** el modal de confirmación de salida (`ExitConfirmModal`) y el panel de game over (`GameOverPanel`) se extraen como componentes reutilizados por ambas vistas.
- **Punto de entrada único a la partida (`startGame`):** todas las pantallas que lanzan una partida pasan por un helper que elige `GameScene` o `Game3DScene` según la perspectiva guardada; se elimina el doble arranque por redirect que hacía `GameScene`.
- Tests nuevos: `RunSystem` y `CameraController` (185 tests en total).

### Changed

- **Puente algo más lejano (Z de -100 a -160) para recuperar sensación de profundidad:** con el plano tan cerca, las orillas quedaban muy cortadas y la Calle Betis (izquierda) apenas se veía. Al alejarlo (mismo WIDTH y Y_DECK), el puente se ve un poco más pequeño pero sigue siendo perfectamente reconocible, y las orillas recuperan recorrido delante del corte — el escenario respira.
- **Torre en plano billboard y orillas 1,5× más grandes:** con el asset actual la torre queda a la izquierda del centro (world x ≈ −35 m) y, sobre el plano frontal del puente, la combinación de esa asimetría con la cámara ligeramente pitcheada hacia abajo hacía que el fuste apareciera inclinado ~2° en pantalla. La torre pasa a un plano propio que rota cada frame para mirar a la cámara (billboard), así el fuste se ve perfectamente vertical desde cualquier punto del palo. En el plano frontal se borra su área con el azul común del escenario y en el config aparece `GAME3D.WORLD.TOWER` con el recorte del asset. También se amplían los planos de las orillas (`BANK_REPEAT_X` de 3 a 2), lo que sube el caserío a ~57 m manteniendo la línea de agua a y=0 — cuadra mejor con la unión al puente y da más presencia a los laterales.
- **Asset del Puente de Triana rehecho (`frontal-rio.webp`, 1542×1024):** la ilustración nueva ya trae las 4 columnas del puente (2 en el agua + 2 en tierra), la barandilla del tablero, los arcos con sus círculos y el remate de la torre asomando por encima del tablero. El escenario 3D pasa a pintar el puente en **un único plano frontal** cuya geometría respeta el aspecto de la banda visible del asset — así los arcos y las columnas quedan sin deformar. Se retiran el plano auxiliar de la torre, el estampado de pilares clonados y el pintado del CAP: todo esto lo aporta ya el propio asset. `game3dConfig.js` se reduce a `WIDTH/Y_DECK/Z/SRC_Y0/SRC_Y1/DECK_SRC_Y` (más `IMG_WIDTH` para derivar el aspecto); `TOWER`, `LAND_PILLAR_WORLD_X`, `PILLAR_SRC`, `HEIGHT` y `FRONTAL_CROP` desaparecen, y `stampRegion`/`drawTowerCap` salen de `textureUtils`. `SKY_COLOR_FRONTAL` se actualiza al azul del nuevo asset (0x7dc4f5, mismo que el fondo de Sevilla), que se sigue unificando al azul común del escenario 3D antes de subir la textura.

### Fixed

- **La composición del puente en la vista 3D no cuadraba con las orillas y perdía la silueta del Puente de Triana:** el plano respetaba las proporciones de la imagen y quedaba gigante, flotando muy por encima de la línea de tierra de las orillas laterales, con solo 2 columnas visibles y la Torre Sevilla cortada por arriba. Ahora el tablero queda a la altura de las orillas (es su continuación natural) y el plano es lo bastante grande y cercano para que la estructura sea inconfundible: se leen bien los arcos con sus círculos característicos, el tablero con su barandilla y las 4 columnas del puente real (2 en el agua, ya en el asset, y 2 en tierra clonadas del pilar del agua y estampadas sobre la ribera). La Torre Sevilla pasa a un plano propio detrás del puente, esbelta y con el remate dibujado sobre el asset (que la traía cortada en plano). Constantes nuevas en `GAME3D.WORLD.BRIDGE` y `GAME3D.WORLD.TOWER` (sustituyen a `FRONTAL_CROP`/`BRIDGE_WIDTH`/`BRIDGE_Z`); helpers nuevos `stampRegion` y `drawTowerCap` en `render3d/textureUtils`. Los materiales del puente y la torre usan `polygonOffset` para evitar el z-fight con las orillas coincidentes en la ribera.
- **La vista 3D no pedía confirmación al salir:** el botón "SALIR" del HUD 3D iba directo al menú perdiendo la partida, y la tecla ESC no funcionaba. Ahora comparte el modal de confirmación ("¿Seguro que quieres salir?") y el comportamiento de las vistas 2D, incluida la desactivación del botón al mostrarse el resultado.
- **Los aplausos de victoria en 3D eran más cortos que en 2D** (10 palmadas frente a 14): unificados al compartirse `_playWaterSounds`.

## [1.3.0] — 2026-07-03

### Added

- **Vista "3D" en primera persona (`Game3DScene`):** nueva perspectiva seleccionable en `ViewSelectScene` (siempre desbloqueada). Renderizado con three.js a baja resolución estilo Doom, volcado sobre una `CanvasTexture` de Phaser con filtrado NEAREST para respetar el pixel art. El mundo recrea el Guadalquivir con el caserío de Triana a la izquierda, la orilla de Sevilla a la derecha y el Puente de Triana frontal al fondo (`frontal-rio.webp`, nuevo), con los fondos recortados por su línea de agua y los cielos unificados. La partida es idéntica al resto de vistas: Fase 1 de impulso (barra de poder) y Fase 2 de equilibrio con los botones rojo/azul del panel de control original (`PowerBarUI`, `BalanceUI`, `ImpulseSystem`, `BalanceSystem`, `OilSystem`), con salto, bandera, grasa, estadísticas y premios integrados. `GameScene` redirige automáticamente a la escena 3D cuando la perspectiva almacenada es `3d`.
- Dependencia nueva: `three` (motor de renderizado 3D de la vista en primera persona). Añadida a la ficha técnica (`LicensesScene`), `CREDITS.md` y `README.md`.

### Fixed

- **El service worker corrompía el arranque en desarrollo:** `register-sw.js` registraba el SW también con el servidor Vite, y su estrategia cache-first para JS servía módulos desactualizados tras cada cambio de código — el grafo de módulos quedaba incoherente y el juego podía arrancar roto (p. ej. directamente en la ficha técnica). Ahora, en desarrollo (puerto no estándar), no se registra y además desregistra y limpia las cachés de cualquier SW previo; en producción el comportamiento no cambia.
- **HMR de Vite roto según el hostname:** el servidor de desarrollo escuchaba solo en `127.0.0.1`, así que entrando por `localhost` el websocket de HMR fallaba y el navegador no recibía los cambios. Ahora escucha en todas las interfaces (`host: true`).
- **Texto ilegible en los botones de salida/game over:** "SALIR" (HUD), el modal de confirmación ("SÍ, SALIR"/"SEGUIR") y "CAMBIAR PERSONAJE"/"VER PREMIOS" usaban fuentes de 18-20px, demasiado pequeñas en pantalla real al escalarse desde la resolución interna del juego. Se suben a 22-26px, en línea con el resto de botones del juego, y se ensanchan los paneles que los contienen para que el auto-size siga encajando sin desbordar.
- **Botón "SALIR" montaba su modal sobre el panel de game over:** si se pulsaba "SALIR" justo cuando aparecía el mensaje de fallo (o durante la celebración de victoria), el modal de confirmación de salida se abría encima del panel de resultado. Ahora "SALIR" se atenúa y se desactiva en cuanto se muestra el resultado de la partida.

- **`NavButton` ahora se auto-dimensiona al texto:** los botones de navegación añadidos en la actualización anterior (INICIO, CAMBIAR VISTA, SALIR, CAMBIAR PERSONAJE/VER PREMIOS, SÍ SALIR/SEGUIR) tenían anchos fijados a mano que no encajaban con cada etiqueta — unos quedaban demasiado grandes y tapaban fondo, otros con texto ilegible o un área de toque demasiado pequeña. `makeNavButton` mide ahora el texto real y calcula su propia caja (con un nuevo helper `measureNavButtonSize`), garantizando que el botón siempre encaje con su etiqueta y mantenga un mínimo de 44px de alto para uso táctil.

### Added

- **Navegación: botón "INICIO" en `ViewSelectScene`** → vuelve al menú principal.
- **Navegación: botón "CAMBIAR VISTA" en `CharacterSelectScene`** → vuelve a `ViewSelectScene`. Sustituye un hipotético "VOLVER", ambiguo porque esta escena se entra tanto desde la selección de vista como desde "Cambiar personaje" en el game over.
- **Navegación: botón "SALIR" durante la partida (`GameScene`)** → pausa el juego y muestra un modal de confirmación ("¿Seguro que quieres salir?") antes de volver al menú. La tecla `ESC` ahora pasa por el mismo modal en vez de salir directamente.
- **Botón "CAMBIAR PERSONAJE" en la pantalla de game over** → a la izquierda de "VER PREMIOS", lleva directamente a `CharacterSelectScene` para volver a intentarlo con otro personaje sin pasar por el menú.

### Fixed

- **Sonido de bandera ausente al cogerla saltando:** `_grabFlag()` (fase de equilibrio) y el chequeo de colisión dentro de `updateJumping()` (fase de salto) duplicaban la lógica de "coger bandera" por separado; la rama de salto nunca reproducía `sfx-flag`. Se unifica en `_onFlagGrabbed()`, compartido por ambos caminos.

### Added

- **Skin nuevo "Gorrita" (Er Chaval):** segundo skin del personaje, a 5 premios. Primer caso de prueba real del contador de progreso de skins introducido en 1.2.0.

## [1.2.0] — 2026-06-28

Doble contador de progreso por personaje para que las skins futuras no se desbloqueen retroactivamente, y nueva música de intro.

### Added

- **Contador de progreso de skins independiente de las victorias:** cada personaje ahora lleva dos contadores en `CharacterRewardService` — `victorias` (histórico, nunca se topa, alimenta estadísticas/podium) y `skin progress` (se topa en el umbral del último skin configurado). Si en el futuro se añade un skin nuevo con un umbral mayor, el contador retoma la subida desde el tope anterior, exigiendo solo las banderas nuevas desde la actualización en vez de desbloquear instantáneamente con banderas ya acumuladas antes de que el skin existiera.

### Changed

- **Música de la intro:** sustituida `intro.wav` por una nueva pista.

## [1.1.7] — 2026-06-20

Tres cambios pequeños pero notables: dos skins nuevos, la curva de grasa
pasa a cúbica (casi toda la dificultad se concentra entre 100% y 80%) y se
quita el icono `▶` de los botones de las escenas de desbloqueo (los
usuarios lo leían como "play").

### Added

- **Skin nuevo "Flamenkini" (La Flamenca):** quinto skin del roster a 25 banderas. Endgame para mains de Flamenca.
- **Skin nuevo "Larry" (Retro):** cuarto skin a 15 banderas. Sigue la curva 3 → 9 → 15.

### Changed

- **Curva de grasa cúbica:** `OIL.CURVE_POWER` 2 → 3. La diferencia entre 100% y 80% de grasa se hace mucho más dramática: a 80% el driftFactor pasa de 2.02 a 1.82; a 70% de 1.78 a 1.55; a 50% de 1.40 a 1.20. El techo a 100% sigue intacto (2.60). El alivio se concentra en el primer cuarto de gasto del palo — el resto se siente "casi limpio".
- **MAX POWER más asequible:** `PHASE1.PERFECT_IMPULSE_MIN` 0.99 → 0.97. La ventana del "impulso perfecto" pasa del último 1% al último 3% de la barra (sobre 400 px: ~12 px de ventana en lugar de ~4). 0.99 era casi imposible salvo casualidad; 0.97 sigue exigiendo puntería pero deja margen para el skill.

### Fixed

- **Botones de desbloqueo sin icono `▶`:** los labels `'SIGUIENTE ▶'` y `'CONTINUAR ▶'` de `CharacterUnlockScene`, `SkinUnlockScene` y `PerspectiveUnlockScene` pasan a `'SIGUIENTE'` y `'CONTINUAR'`. Los usuarios estaban interpretando el triángulo como un icono de "play" más que como una flecha direccional.

## [1.1.6] — 2026-06-20

Aplicar una curva no lineal a la grasa para que el tramo 100%-70% castigue
mucho y el tramo 30%-0% se sienta casi limpio. Justo lo que pide la sensación
de "el primer tercio del palo se domestica rápido, las zonas finales siguen
siendo brutales hasta que las gastes".

### Changed

- **Curva no-lineal de grasa:** nuevo `OIL.CURVE_POWER` = 2 (cuadrática). El `greaseRatio` (0..1) se eleva al cuadrado antes de aplicar `DRIFT_MULTIPLIER` y `GROWTH_MULTIPLIER`. Con grasa al 100%, los factores quedan iguales que en v1.1.5 (2.6/2.5); pero a 90% el driftFactor baja de 2.44 a 2.30, a 70% baja de 2.12 a 1.78, y a 30% baja de 1.48 a 1.14. La sensación: clavar la bandera con palo virgen sigue siendo brutal, pero gastar el palo a 30-50% se nota mucho. Recompensa progresiva real por jugar y desgastar zonas.

### Notas técnicas

- La grasa **ya se aplicaba por segmento** (30 zonas a lo largo del palo) — la novedad de v1.1.6 es solo la curva. El `greaseRatio` que recibe `BalanceSystem` sigue siendo el de la zona donde está el personaje en ese frame, no la media global.
- Test añadido en `BalanceSystem.test.js`: verifica que con curva cuadrática, el growth de cruce a 100% de grasa es **más del doble** que a 50% (con lineal era exactamente el doble). Suite: 167/167.

## [1.1.5] — 2026-06-20

Ajuste fino: el MAX POWER se hace mucho más raro a propósito. Con la
calibración de v1.1.4 (barra más rápida) la ventana del 5% sentía demasiado
generosa. Ahora la ventana es del 1% — un evento de skill real, claramente
intencional cuando ocurre.

### Changed

- **MAX POWER mucho más exigente:** `PHASE1.PERFECT_IMPULSE_MIN` 0.95 → 0.99. La ventana de "impulso perfecto" pasa del último 5% al último 1% de la barra (sobre 400 px totales: ~4 px de ventana en lugar de ~20). Sigue siendo el único camino para conseguir un trozo de mapa.

## [1.1.4] — 2026-06-20

Recalibrado profundo de dificultad. En equilibrio, las inversiones cuestan
más, el damping reduce la inercia y la grasa amplifica dos cosas a la vez
(drift máximo y crecimiento por cruce). En impulso, la barra arranca y acelera
más rápido, y la diferencia entre personajes ligeros y pesados se duplica.

### Changed

- **Fase 1 (Impulso) — más rápido y con mayor diferencia por personaje:**
  - `PHASE1.BASE_SPEED` 0.20 → 0.30
  - `PHASE1.BASE_ACCELERATION` 0.15 → 0.25
  - `PHASE1.WEIGHT_FACTOR` 0.10 → 0.20 (la diferencia entre Retro y Agüela se duplica: ahora la Agüela es realmente difícil de parar en MAX POWER)
- **Fase 2 (Equilibrio) — cursor más nervioso, más castigo en los cruces:**
  - `BALANCE.DRIFT_GROWTH_PER_CROSS` 0.06 → 0.18 (cada inversión castiga 3× más; antes hacía falta acumular 15 cruces para llegar al techo, ahora 5)
  - `BALANCE.DAMPING` 0.10 → 0.40 (la velocity decae 4× más rápido; hay que pulsar más a menudo)
  - `BALANCE.INPUT_FORCE` 5.5 → 6.5 (para mantener el invariante de control)
- **Sistema de grasa — amplifica dos cosas, no solo una:**
  - `OIL.DRIFT_MULTIPLIER` 1.3 → 1.6 (drift máximo con grasa al 100% pasa de ×2.3 a ×2.6)
  - Nuevo `OIL.GROWTH_MULTIPLIER` = 1.5: el crecimiento de fuerza por cruce escala con la grasa (×2.5 con grasa al 100%)
- **API interna:** `BalanceSystem.update()` ahora recibe `greaseRatio` (0..1) en lugar de `oilMultiplier`. Aplica internamente los dos factores de `OIL`. `OilSystem` expone `getGreaseRatio()` para esta nueva ruta y conserva `getDriftMultiplier()` para `BalanceUI` y otros consumidores.

Garantía de control: `INPUT_FORCE > DRIFT_MAX × (1 + OIL.DRIFT_MULTIPLIER) = 1.2 × 2.6 = 3.12 ✓`. Margen sin grasa **5.30**, con grasa al 100% **3.38** — pero ahora el reto real es que cada cruce con grasa cuesta 2.5× más, así que aunque haya margen, el cursor acelera más rápido de lo que el jugador puede frenar si no anticipa.

### Added

- **Tests** (5 nuevos en `OilSystem.test.js` y `BalanceSystem.test.js`): cobertura de `getGreaseRatio`, comportamiento de la nueva API y verificación del growth factor con grasa máxima. Suite: 166/166.

## [1.1.3] — 2026-06-20

Recalibrado fino de la grasa: con palo grasiento ahora cuesta de verdad coger
la bandera, y con palo limpio se "respira". Materializa el loop emergente que
ya tenía el sistema de zonas: el jugador siente que rebajar la grasa es la
ruta a ganar, lo que añade durabilidad a la sesión.

### Fixed

- **Botones fantasma en las escenas de desbloqueo en cadena (`SkinUnlockScene`, `CharacterUnlockScene`, `PerspectiveUnlockScene`):** al desbloquear varios elementos de golpe (caso típico: los Cuñaos desbloquean Rafi-pelicula + Fali-pelicula a 3 banderas), el segundo y siguientes paneles mostraban los botones del anterior solapados sobre los nuevos. Causa: las tres escenas creaban un `buttonContainer` vacío y llamaban a `makeNavButton`, que dibuja sus gráficos directamente en la escena, no en el container. Al pasar al siguiente elemento, `buttonContainer.destroy()` solo destruía un container vacío y los botones anteriores quedaban colgando. Solución: capturar `this.children.list.length` antes y después de cada llamada y mover los nuevos hijos al container, mismo patrón ya usado por `MapScene` para los botones del zoom modal.

### Changed

- **Balance — Fase 2 (Equilibrio) — contraste palo limpio vs grasiento mucho mayor:** `OIL.DRIFT_MULTIPLIER` 0.8 → 1.3 (drift máximo con grasa al 100% pasa de ×1.8 a ×2.3) y `BALANCE.INPUT_FORCE` 5.0 → 5.5. El invariante de control sigue garantizado: `INPUT_FORCE > DRIFT_MAX × (1 + OIL.DRIFT_MULTIPLIER) = 1.2 × 2.3 = 2.76`. Margen sin grasa pasa de 3.80 a **4.30**; margen con grasa al 100% pasa de 2.84 a **2.74**. El "drop" entre seco y grasiento crece de -0.96 a -1.56, ~60% más castigo. Con grasa al máximo cuesta de verdad ganar, con palo limpio el cursor se controla con facilidad — el jugador asocia "rebajar grasa = ganar".

### Added

- **Hint dinámico de progreso en personajes bloqueados:** las cards y el panel de detalle de `CharacterSelectScene` muestran "Te faltan X premios" en lugar del hint estático cuando el desbloqueo es por `total_rewards`. Para `specific_reward` se conserva el texto del JSON (ej. "Consigue La Wendolin"). Nuevo método `unlockService.getProgressHint(characterId, rewardStorage)` cubierto con 5 tests adicionales.

### Changed

- **Curva de personajes (Curva A "onboarding cariñoso"):** primer desbloqueo más rápido para enganchar, salto fuerte a mitad, endgame a largo plazo.
  - `chaval` 5 → 3 premios (primer hit en ~7-10 partidas con 30-40% de winrate)
  - `guiri` 10 → 10 (estable, fase de aprendizaje)
  - `cunaos` 15 → 22 (muralla del medio, hito de progreso real)
  - `retro` 20 → 45 (endgame de 2-3 semanas para casuales enganchados)
  - `abuela` premio específico: `reward_vajilla` → `reward_wendolin` (La Wendolin)
- **Perspectiva Sevilla:** 3 → 8 premios. Pasa de "venía casi por defecto" a "te lo has ganado".
- **Curva de skins por personaje:** primer skin alternativo se siente como un regalo rápido, último como endgame.
  - Trianero: `5, 10, 15, 20` → `3, 8, 15, 25`
  - Flamenca: `5, 10, 15` → `3, 8, 15`
  - Agüela: `5, 10` → `4, 12`
  - Cuñaos: `5, 5, 10, 10` → `3, 3, 9, 9`
  - Retro: `5, 10` → `3, 9`

Pulido pre-publicación: pista contextual en el mapa, suite de tests completa y
recalibrado de dificultad de las dos fases para que la grasa y el MAX POWER
exijan más al jugador.

### Added

- **Pista en el mapa vacío:** cuando aún no se ha desbloqueado ninguna pieza, la vista general del mapa de Sevilla muestra un panel centrado explicando cómo conseguirlas ("Para conseguir las piezas del mapa, debes conseguir la bandera con el MAX POWER de impulso"). Mismo estilo de texto que los diálogos de Historia y Tutorial.
- **Tests automatizados con Vitest (#7 cierre auditoría):** suite de 157 tests en 13 archivos sobre los servicios de persistencia (`UnlockService`, `MapService`, `SkinService`, `PerspectiveUnlockService`, `CharacterRewardService`, `RewardStorageService`, `GameStatsService`) y los sistemas puros del juego (`StatsCalculator`, `ImpulseSystem`, `BalanceSystem`, `JumpSystem`, `OilSystem`) más `weightedRandom`. `vitest.config.mjs` con `happy-dom` + `globals`. Scripts `npm test` (CI) y `npm test:watch` (desarrollo). Step `Test` añadido al workflow de CI, bloqueando merges en caso de regresión.

### Changed

- **Balance — Fase 1 (Impulso) más exigente:** `PHASE1.BASE_SPEED` 0.15 → 0.20 y `PHASE1.BASE_ACCELERATION` 0.10 → 0.15. La barra de poder arranca un 33% más rápida y acelera un 50% más, dejando menos tiempo de reacción para clavar el MAX POWER sin alterar la sensación general.
- **Balance — Fase 2 (Equilibrio) con grasa más castigadora:** `OIL.DRIFT_MULTIPLIER` 0.5 → 0.8 (el drift máximo con grasa al 100% pasa de ×1.5 a ×1.8) y `BALANCE.INPUT_FORCE` 4.5 → 5.0. Mantiene el invariante de control `INPUT_FORCE > DRIFT_MAX × (1 + OIL.DRIFT_MULTIPLIER) = 2.16`. El "drop" de margen entre palo seco y palo grasiento pasa de -0.6 a -0.96 (~60% más castigo de la grasa) sin volver el juego invencible: con grasa al 100% el margen efectivo es 2.84, similar a los 2.7 anteriores.

## [1.1.1] — 2026-06-11

Cierre de la auditoría técnica pre-publicación (12 de 13 items de `AUDITORIA.md`,
solo quedan los tests #7) y tanda de fixes de pulido visual y de UX.

### Added

- **Accesibilidad — `prefers-reduced-motion`:**
  - Helper `src/game/utils/accessibility.js` con `prefersReducedMotion()`.
  - Getter `this.prefersReducedMotion` en `BaseScene`.
  - Aplicado a `SkinMarquee` (marquees infinitos de `CreditsScene`): cuando el usuario tiene activado "Reducir movimiento" en su SO, los sprites no se desplazan ni alternan STAND/WALK — quedan estáticos en pose STAND.
- **ARIA en el canvas:** `role="application"` y `aria-label` descriptivo en `#game-container` para lectores de pantalla.
- **Cabeceras de seguridad HTTP (`vercel.json`):** Content-Security-Policy estricta (`default-src 'self'`, sin `'unsafe-inline'` en scripts), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` con preload, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denegando cámara/micro/geo/pago/USB/FLoC. Cabeceras específicas para `/sw.js` (no-cache) y `/assets/fonts/*` (immutable, 1 año).
- **Fuentes self-hosted (`public/assets/fonts/`):** Jersey 10 y Press Start 2P descargadas localmente desde Google Fonts y servidas con `@font-face` en `public/style.css`. Funcionan offline, sin dependencia externa, sin riesgos de SRI.
- **`public/register-sw.js`:** script de registro del service worker extraído del `index.html` inline para permitir CSP estricta sin `'unsafe-inline'` en `script-src`.
- **ESLint 10 + Prettier 3:** flat config por capas (`eslint.config.js`) alineada con las normas de CLAUDE.md, `.prettierrc.json` + `.prettierignore`, scripts `lint`/`lint:fix`/`format`/`format:check` en `package.json`, y configuración de workspace de VS Code (`.vscode/extensions.json` + `settings.json` con formatOnSave).
- **CI con GitHub Actions (`.github/workflows/ci.yml`):** corre `lint → format:check → build` en cada PR contra `main` y cada push a `main` (Node 24, cache de npm, ~35 s). **Branch Protection** activa en `main`: sin pushes directos, PR obligatoria, check `validate` requerido, historial lineal, force-push y borrado bloqueados.
- **Sistema de estilos de texto en dos capas:** `config/fonts.js` (foundations de marca: familias, sombra pixel congelada, paleta semántica) + `config/textStyles.js` (seis helpers role-based: `titleStyle`, `headingStyle`, `uiLabelStyle`, `uiLabelLight`, `mutedStyle`, `warningStyle`).
- **Precarga de fuentes:** `<link rel="preload">` de los dos TTF en `index.html` + `await document.fonts.ready` en `src/main.js` antes de arrancar Phaser.

### Changed

- **Reformat masivo con Prettier** de los 79 archivos bajo su dominio (commit aislado, sin cambios de comportamiento).
- **Migración completa al sistema de textStyles:** 15 escenas + 6 componentes + 1 util (~102 declaraciones de `fontFamily` literales reducidas a 0 fuera del config). 308 líneas netas eliminadas. Desviaciones del estándar de marca ahora explícitas como overrides.
- **`AUDITORIA.md`** actualizada: items #5, #6, #8, #9 (aplazado deliberadamente), #10, #13, #14 y #15 cerrados con su justificación.

### Removed

- Referencias a `https://fonts.googleapis.com` y `https://fonts.gstatic.com` en `index.html` (preconnect + stylesheet).
- Script inline de registro del service worker en `index.html`.
- Constantes legacy `PIXEL_FONT`, `PIXEL_FONT_TITLE`, `PIXEL_FONT_SMALL` de `gameConfig.js` (sustituidas por los helpers de `textStyles.js`).

### Fixed

- **Tipografía en la primera carga:** el juego mostraba la fuente fallback del sistema en la primera visita (canvas no redibuja al llegar la fuente). Resuelto con preload + `document.fonts.ready`.
- **Flechas del zoom del mapa:** las flechas de arriba y abajo estaban visualmente intercambiadas (▲/▼ invertidas). La navegación funcionaba, la imagen no.
- **`triana.webp` distorsionada:** la imagen del premio era 594×420 pero la UI asume arte cuadrado. Ahora 594×594 con padding transparente centrado verticalmente.
- **`vaso.webp` actualizada:** nueva ilustración del premio (500×500, 42,5 KB).
- **Navegación fantasma del carrusel:** al volver de `SkinSelectScene` a `CharacterSelectScene` (o al re-entrar en `ViewSelectScene`), el carrusel avanzaba una posición solo segun dónde hubieras pulsado en la pantalla anterior. Causa: estado de swipe (`swipeStartX`) obsoleto que sobrevivía a la transición de escena (Phaser reusa instancias) + handler de swipe sin acotar verticalmente. Resuelto con reset en `init()`/`create()` y acotando el gesto a la banda del carrusel.

## [1.1.0] — 2026-05-28

### Added

- **Pantalla de créditos del desarrollador (`CreditsScene` rediseñada):**
  - Retrato animado del desarrollador (`narrator-tutorial` con parpadeo cada ~3,2 s).
  - Banner "LUISAO_DEV" en amarillo dorado con sombra pixel art.
  - Dos marquees infinitos de skins desbloqueados moviéndose en sentidos opuestos (arriba ←→ derecha, abajo ←→ izquierda) con **geometry mask** del panel: los sprites aparecen y desaparecen exactamente en los bordes del marco oscuro.
  - Texto motivacional centrado, copyright y URL clicable al portfolio (`https://luisao82.vercel.app`).
  - Botón `FICHA TÉCNICA` que lleva a las licencias técnicas.
  - Panel con baja opacidad (0.25) para que el puente del fondo se vea claramente.
- **`SkinMarquee`** — componente reutilizable (`src/game/components/SkinMarquee.js`): fila infinita de skins con animación STAND ↔ WALK por sprite con jitter para evitar sincronización, mezcla aleatoria evitando repeticiones inmediatas, flip horizontal según dirección, soporte opcional de mask y depth.
- **`IconButton`** — componente reutilizable (`src/game/components/IconButton.js`): botón cuadrado pixel art estilo cartelón de feria con icono central. Mismo lenguaje visual que `NavButton` pero cuadrado. API: `{ bounds, text, redraw, setIconColor }`.
- **`LicensesScene`** — pantalla técnica accesible desde la nueva `CreditsScene`. Contiene los créditos técnicos en dos columnas (motor, librerías, fuentes OFL, audio jsfxr, advertencia de música pendiente).
- **Cuarto botón "INFO"** en la fila inferior del menú (HISTORIA · RÉCORDS · TUTORIAL · INFO), todos en rejilla equidistante de 230 px de ancho.

### Changed

- **`MenuScene`** — los 3 botones inferiores pasan a 4 botones equidistantes (rejilla calculada dinámicamente). Ancho 210 → 230 px, gap entre botones calculado para repartir el espacio sobrante. Botón cuadrado "©" de la esquina superior izquierda eliminado: la entrada a créditos ahora vive en el botón `INFO`.
- **Service worker `public/sw.js`** — bumpeado de `cucana-v7` a `cucana-v20` durante el ciclo iterativo del rediseño (cache-first invalidaba constantemente).
- **`gameConfig.SCENES`** — añadida `LICENSES: 'LicensesScene'`. La clave `CREDITS` ahora apunta a la pantalla con la cara, no a las licencias técnicas.
- **`game/main.js`** — registrada `LicensesScene` junto a `CreditsScene`.

### Bloque Legal (1.0.x → 1.1.0)

Mantiene todo lo aterrizado en el ciclo anterior: política de privacidad
(`PRIVACY.md` + `public/privacy.html`), créditos canónicos en `CREDITS.md`,
plantilla de email para Cantores de Híspalis en `docs/email-cantores-hispalis.md`,
licencia propietaria en `LICENSE` y `package.json` limpio de referencias al
template de Phaser.

⚠️ **Bloqueante de publicación** sigue vigente: la música del menú (sevillana
de Cantores de Híspalis adaptada a BeepBox) requiere autorización antes de
poder publicarse en App Store / Google Play.

## [1.0.0] — 2026-05-28

Primera versión cerrada del juego. Incluye el bloque legal completo,
los assets de tiendas (iconos, capturas, feature graphic) y la primera
iteración del bloque de créditos (pantalla técnica + acceso desde el menú).

### Added

- **Bloque de créditos primera iteración (luego rediseñado en 1.1.0):**
  - **`CreditsScene` (nueva)** — pantalla principal de créditos accesible desde el menú. Muestra el sprite `developer` escalado como retrato central del desarrollador, dos marquees animados de skins desbloqueados (superior derecha→izquierda, inferior izquierda→derecha) que solo usan los frames STAND y WALK para simular caminata, un texto motivacional sobre el respeto a Triana, copyright y enlace clicable al portfolio del autor (`https://luisao82.vercel.app`). Botones `MENÚ` (vuelve al inicio) y `FICHA TÉCNICA` (lleva a las licencias).
  - **`SkinMarquee`** — componente reutilizable (`src/game/components/SkinMarquee.js`) que dibuja una fila infinita de skins desplazándose lateralmente. Configurable: `y`, `direction`, `speed`, `skinKeys`, `scale`. Cada sprite alterna STAND ↔ WALK con jitter para evitar sincronía robótica. Los sprites que salen por un extremo reaparecen por el opuesto con un skin aleatorio (evitando repeticiones inmediatas cuando hay variedad). Solo se mezclan skins de personajes desbloqueados (excluye `easter_egg` para no chafar la sorpresa).
  - **`LicensesScene`** — antigua `CreditsScene` renombrada y movida a pantalla secundaria. Mantiene el contenido técnico (motor, librerías, tipografías OFL, audio, advertencia de música) en el cartelón de dos columnas. Accesible solo desde la nueva `CreditsScene` mediante el botón `FICHA TÉCNICA`.

### Changed

- **Retoques visuales en la `LicensesScene` (ex `CreditsScene`):** título `CRÉDITOS` sustituido por `FICHA TÉCNICA`; subtítulo separado del panel oscuro (PANEL_Y subido de 92 a 112); footer con copyright y URL portfolio separados del borde inferior del panel (footerY a -64 con +26 de separación entre líneas). El email personal `luisaodeben@gmail.com` se sustituye por la URL `https://luisao82.vercel.app` (visible y clicable en la nueva `CreditsScene`).
- **Navegación dentro del bloque de créditos:** el botón `MENÚ` de la antigua escena pasa a `VOLVER` y devuelve a `CreditsScene` (la nueva). ESC también vuelve a la pantalla principal de créditos.
- **`gameConfig.SCENES`** — añadida la clave `LICENSES: 'LicensesScene'` (la antigua `CREDITS` ahora apunta a la pantalla con la cara, no a las licencias).
- **`game/main.js`** — registrada la `LicensesScene` junto a la `CreditsScene`.

- **Bloque Legal completo:**
  - `PRIVACY.md` y `public/privacy.html` — política de privacidad en español lista para alojarse en Vercel (URL pública estable). Cubre: ausencia de datos personales, almacenamiento local, servicios de terceros (Sentry, Google Fonts, Vercel), Web Share API, RGPD/LOPDGDD, derechos del usuario y contacto.
  - `CREDITS.md` — documento canónico de créditos con autoría, motor (Phaser, Vite, Capacitor, Sentry — MIT), tipografías (Jersey 10 + Press Start 2P — OFL 1.1), efectos de sonido (jsfxr, CC0) y advertencia sobre la música del menú (pendiente de autorización de los titulares de Cantores de Híspalis).
  - `CreditsScene` — nueva escena pixel art accesible desde el menú principal a través de un icono `©` discreto en la esquina superior izquierda (simétrico al icono de mute). Layout en dos columnas dentro del cartelón estilo "Cartelón de Feria" con los créditos completos, copyright y email de contacto. Tecla ESC vuelve al menú.
  - `docs/email-cantores-hispalis.md` — plantilla de email para solicitar autorización a los titulares de la sevillana adaptada como música del menú, con guía sobre SGAE y editor musical.

### Changed

- **`LICENSE`** — reemplazado el MIT del template original de Phaser Studio por una licencia propietaria "Todos los derechos reservados © 2026 Luisao" acorde con el modelo de publicación en tiendas.
- **`package.json`** — actualizado `author` a Luisao, `license` a `SEE LICENSE IN LICENSE`, añadido `"private": true` y eliminadas las referencias al repo del template Phaser (`repository`, `bugs`, `homepage`).
- **`MenuScene`** — añadido botón de créditos en la esquina superior izquierda. El filtrado de `pointerdown` ahora ignora también este botón para no encadenar la navegación al carrusel de personajes.
- **`gameConfig.SCENES`** — añadida la clave `CREDITS: 'CreditsScene'`.
- **`game/main.js`** — registrada la `CreditsScene` en el array de escenas de Phaser.
- **Icono de la app** — sustituido el master por una versión definitiva del usuario (`fondoIntro1024C.png`) con tipografía pixel art propia para "La Cucaña" integrada en el propio diseño (en lugar del overlay generado por `add-flag-text.mjs`). Los 30 derivados iOS/Android/PWA/favicon y `public/favicon.png` regenerados con `sips` desde el nuevo master.
- `scripts/build-icon-sizes.mjs` — script reutilizable que toma cualquier master 1024×1024 y produce la batería completa de derivados sin tocar el contenido (útil para iteraciones futuras del icono sin tener que recomponer texto ni bandera).

- **Feature graphic Google Play (1024×500):** imagen de cabecera con el puente panorámico de fondo, "La Cucaña" en rojo centrado con outline negro, flamenca saltando hacia el centro (izquierda) y feriante saltando hacia el centro (derecha). Generado a partir de `fondoIntro1024b.png` + sprites del juego.
- `scripts/build-feature-graphic.mjs` — compone bandera + sprites + texto pixel art sobre el fondo del puente. Reutiliza el font 5×7 del icono y los helpers de PNG decode/encode/composite con alpha.

- **Capturas de pantalla para tiendas:** 5 capturas representativas (menú, gameplay, selección de personaje, premio, tutorial) procesadas con letterbox negro centrado para 3 formatos:
  - iPhone 6.7" landscape (App Store): 2796×1290
  - iPad Pro 13" landscape (App Store): 2752×2064 — full screen, sin franjas (el aspect del juego coincide con el iPad)
  - Google Play 16:9 + PWA wide: 1920×1080
  - Archivos en `public/assets/store/screenshots/{iphone-6.7,ipad-13,play-pwa}/01-…05-….png`
- `scripts/build-screenshots.mjs` — toma capturas del juego, calcula el ajuste manteniendo aspect ratio y compone sobre lienzo negro centrado para cada formato.
- `manifest.json`: bloque `screenshots` con las 5 capturas PWA (form_factor wide) para que aparezcan en el prompt de instalación.

- **Iconos de tienda y app:** icono master 1024×1024 (Puente de Triana + bandera blanca + "La Cucaña" en rojo) y batería completa de derivados en `public/assets/store/icons/`:
  - iOS: 1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20
  - Android: 512 (Play Store), 192, 144, 96, 72, 48, 36
  - PWA: 512, 384, 192, 180, 152, 144, 128, 96
  - Favicon: 32, 16
- `scripts/build-icon.mjs` — generador de pixel art 64×64 (encoder PNG propio, sin dependencias) para iterar diseños del icono.
- `scripts/upscale-icon.mjs` — decoder PNG + nearest-neighbor upscaling para previsualizar diseños pixel art a tamaños grandes sin pérdida.
- `scripts/add-flag-text.mjs` — superpone bandera y texto "La Cucaña" en pixel art sobre el master 1024 y regenera toda la batería con `sips`.
- `index.html`: `apple-touch-icon` por tamaños (180, 167, 152, 120) y favicons separados (32, 16).
- `manifest.json`: 8 entradas de iconos PWA por tamaño en vez de reusar `favicon.png`.

- **Compartir y viralidad:** botón compartir (icono pixel art en la esquina superior derecha, estilo Cartelón de Feria mini) en `RewardScene`, `CollectionScene` (modal de detalle de premio), `SkinUnlockScene`, `SkinSelectScene` (solo skins desbloqueados) y `CharacterUnlockScene`. Usa Web Share API en móvil con fallback a portapapeles en desktop.
- `GAME_URL` configurado con la URL de Vercel (`https://minijuego-lilac.vercel.app`): el enlace aparece ahora en el texto compartido y como pie en la imagen 1080×1080.

### Fixed

- `ShareableCard`: los nombres largos de premios (p.ej. "La cinta de los mejores chiste de Paco Gandía") se salían del marco. Ahora el texto se reparte en varias líneas y se reduce el tamaño de fuente progresivamente si sigue sin caber.
- `ShareableCard`: los sprites de personaje (16×24) se compartían deformados al forzarlos a cuadrado. Ahora se respeta el aspect ratio original.
- `src/game/config/shareConfig.js` — constantes del sistema de compartir (`GAME_URL`, `SHARE_TEXTS`, `SHARE_BRANDING`, `SHARE_IMAGE_SIZE`) y helper `buildShareText`. El enlace al juego solo se incluye si `GAME_URL` no está vacío.
- `src/game/utils/share.js` — wrapper sobre Web Share API (`canShareImage`, `canShareText`, `shareImage`) con fallback automático a `navigator.clipboard`.
- `src/game/components/ShareableCard.js` — generador de imagen 1080×1080 PNG con branding "LA CUCAÑA TRIANERA", subtítulo según contexto (¡NUEVO PREMIO! / PREMIO CONSEGUIDO / etc.), imagen del premio o sprite del skin/personaje, nombre y contador opcional.
- `src/game/components/ShareButton.js` — botón cuadrado compacto reutilizable con icono pixel art de compartir.

- Sonidos de juego: `sfx-maxpower` al llegar al impulso máximo, `sfx-flag` al coger la bandera, aplausos (`sfx-win` × 5 escalonados) al caer al agua con bandera, y `sfx-fail` al caer sin bandera.
- `Narrator`: nuevo parámetro de config `talkSoundKey` / `talkSoundVol` para blip de voz RPG. Pitch aleatorio ±10% en cada blip. Activado en `HistoryScene` y `TutorialScene`.

- Nuevos premios: Cerveza fresquita, Vaso mítico, Vinilo de Los Cantores de Híspalis, Sugus, Grande Triana y Corta (imágenes en WebP listas para añadir al JSON).
- Imágenes de nuevos premios convertidas a WebP (calidad 80): `hispalis.webp`, `triana.webp`, `vaso.webp`, `sugus.webp`, `corta.webp`. PNGs originales eliminados.

- Música de fondo en el menú principal (`audio/intro.wav`, bucle). Se inicia al entrar al menú y se detiene al navegar a cualquier otra pantalla; vuelve a sonar al regresar al menú.
- Botón de silencio ♪/♩ (esquina superior derecha del menú), sin caja, solo la nota musical. Amarillo cuando la música está activa, gris cuando está silenciada. El estado persiste en localStorage entre sesiones.
- `src/game/services/MusicService.js` — persiste el estado mute en localStorage.

### Fixed

- RewardScene: cuando se ganaba un trozo del mapa y un premio en la misma partida, los textos se superponían en el panel. Ahora se muestran en secuencia: primero una pantalla dedicada "¡TROZO DEL MAPA!" con la imagen de la pieza desbloqueada, contador de progreso y botón "¡A VER EL PREMIO!", y tras pulsarlo aparece la ficha del premio sin solapamientos.

## [1.0.0] - 2026-05-21

### Added

- Puntos de interés en el mapa de Sevilla: Relojería, Bar Curioso y La Giralda en la pieza 2-1; Torre del Oro en la pieza 3-1. Cada punto incluye foto y descripción corta.
- `src/game/config/gameOverMessages.js` — tabla de expresiones y frases según distancia recorrida al caer al agua (`GAME_OVER_MESSAGES` + `getGameOverMessage(pct)`). Lógica extraída de GameScene para que el guion sea editable sin tocar código de escena.
- `src/game/config/historyContent.js` — guion completo de HistoryScene (`HISTORY_BLOCKS` + `HISTORY_END_TEXT`). Editar historia sin tocar la escena.
- `src/game/config/tutorialContent.js` — guion completo de TutorialScene (`TUTORIAL_BLOCKS`). Editar tutorial sin tocar la escena.
- Nuevas imágenes de tutorial (slides 01–06) reemplazando las anteriores.
- GDD.md: sección de arquitectura completamente actualizada con árbol de carpetas real, regla de dependencias entre capas y tabla de archivos de contenido narrativo.

### Changed

- **Tipografía — pase completo por todas las escenas:**
  - MenuScene: texto de versión 10px → 16px. Botones reposicionados.
  - HistoryScene: botón "MENÚ" sin icono ◀. Botón "¡A JUGAR!" reemplazado por NavButton estándar.
  - TutorialScene: ídem — MENÚ sin icono, "¡A JUGAR!" con NavButton.
  - StatsScene: cabeceras de módulo a 44px Jersey 10. Etiquetas de stats a 18px blanco. Pódium: nombres 16px, victorias con mini bandera pixel art, sprites animados (walk + salto al pulsar). Bronce corregido (`#cd7f32`). Top Premios: 4→3 items, imagen 60px, contador 28px.
  - CharacterSelectScene: panel descriptivo Jersey 10 22px (antes monospace 16px). Barras de stats reemplazadas por 6 segmentos pixel art con gap; etiquetas PES/EQU/ALT/EDA a 20px.
  - SkinSelectScene: contador de banderas Jersey 10 32px (antes monospace 12px).
  - ViewSelectScene: eliminado checkmark `✓` de la ficha seleccionada. Eliminado texto "ELIGE TU ESCENARIO".
  - GameScene: franja superior 36→40px para centrar verticalmente el nombre del personaje (28px). Expresiones al caer al agua (Casiiiiii!!!, Bueno…bueno…, Ooohhh!, Mare mía!!!) con colores por rango. Frase complementaria 22→28px.
  - RewardScene: textos de premio más grandes.
- Imágenes históricas estandarizadas: marco negro de 50px en las cuatro imágenes (`hist-intro`, `hist-mision`, `hist-picaresca`, `hist-leyenda`), contenido escalado a 924×924 + relleno negro hasta 1024×1024.
- `hist-picaresca.png` (1,7 MB) → `hist-picaresca.webp` (112 KB, −93%).
- `hist-leyenda.png` (1,4 MB) → `hist-leyenda.webp` (90 KB, −94%).
- `hist-mision.webp`: regenerada desde nueva fuente con marco correcto.
- `hist-intro.webp`: regenerada desde nueva fuente (42 KB → 20 KB).
- Imágenes de tutorial: todos los slides convertidos a WebP. Slides 3 y 4 con nuevo contenido y nombres actualizados (`03-equilibrio`, `04-grasa`). `06-listo.png` → `06-listo.webp`.
- PreloadScene: referencias actualizadas a los nuevos nombres/extensiones de assets.
- Modal de punto de interés del mapa: panel ampliado, imagen al 98% del ancho, texto 16px amarillo dorado.
- Fotos de puntos del mapa convertidas de PNG a WebP (4,6 MB → 0,5 MB, −90%).

### Fixed

- Título "La Cucaña" se mostraba con fuente de fallback en la primera carga. `Jersey 10` y `Press Start 2P` se cargan activamente en PreloadScene con `document.fonts.load()`. Menú solo arranca cuando han pasado los 5 s Y las fuentes están listas (`Promise.all`).
- `Press Start 2P` no estaba declarada en `index.html`.
- Al volver desde SkinSelectScene a CharacterSelectScene, el personaje seleccionado volvía al primero. NavButton usa patrón press-tracking para evitar click-through. `selectedIndex` propagado en el flujo CharacterSelect ↔ SkinSelect.
- Premio "Pisacorbatas del Giraldillo" no cargaba imagen: `giraldillo.png` no convertido a WebP pero `rewards.json` ya apuntaba a `.webp` (404 silencioso). Corregido.
- `hist-leyenda` no se mostraba en el juego: PreloadScene apuntaba a `.png` pero el archivo era `.webp`. Corregido.
- `hist-picaresca` no se mostraba en el juego: mismo problema. Corregido.
- Service worker bumpeado a `cucana-v6` para invalidar caché con assets obsoletos.

## [0.7.0] - 2026-04-23

### Added

- Mapa de Sevilla: meta-progresión 3×5 con 15 trozos desbloqueables. Trigger: impulso perfecto (≥95%) + coger la bandera en la misma partida desbloquea un trozo aleatorio sin reposición. Persistencia en `localStorage` con Clean Architecture (adaptador intercambiable para futura BD).
- `MapScene` — vista general del mapa con rejilla 3×5 (piezas bloqueadas/desbloqueadas), vista zoom por pieza con navegación en 4 direcciones (flechas arriba/abajo/izquierda/derecha), puntos de interés clicables (dot rojo animado, zona táctil 56×56 px) y modal con foto y descripción del lugar.
- `MapService` — servicio singleton con `unlockRandom()`, `markSeen()`, `isUnlocked()`, `isSeen()`, `getProgress()` y `hasUnseenPieces()`.
- Botón "VER MAPA" en `CollectionScene` junto a los botones de navegación existentes.
- Animación "¡MAX POWER!" en GameScene al alcanzar impulso perfecto: texto verde lima que sube desde el panel de control y se desvanece.
- Feedback de nuevo trozo en `RewardScene`: texto "¡TROZO DEL MAPA!" con indicación de ir a VER MAPA.
- Marco dorado pulsante en piezas recién desbloqueadas (desaparece al abrir la pieza).
- GDD: nueva sección "Mapa de Sevilla — Sistema de logros territorial". Documenta la meta-progresión del mapa 3×5 con trozos desbloqueables, puntos clickables con fotos pixel art de lugares reales, trigger de impulso perfecto (99-100%) + bandera, feedback "¡POWER!" visual + sonoro, aleatoriedad sin reposición, flag `seen` con marco amarillo, persistencia `localStorage` con Clean Architecture (puerto + adaptador intercambiable para futura BD) y estructura de carpetas de assets. Pendiente de implementación.
- `BaseScene` — clase base para todas las escenas. Registra automáticamente el handler `shutdown` (elimina tweens, timers e input al cambiar de escena, evitando memory leaks). Expone el hook `_onShutdown()` para limpieza específica por escena y el helper `_label()` para texto pixel art consistente. Incluye breadcrumb de Sentry en cada navegación (solo producción). Las 16 escenas migradas.
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
- `GameScene` refactorizada: reducida de 895 a ~600 líneas. Lógica de física, animación y UI extraída a cuatro módulos nuevos: `systems/JumpSystem.js` (física balística del salto), `systems/FallSystem.js` (animación de caída y splash), `components/PowerBarUI.js` (UI Fase 1) y `components/BalanceUI.js` (UI Fase 2 + estado de input direccional). Sin cambios de jugabilidad.

### Security

- Dependencias de build actualizadas

### Performance

- Assets optimizados: 30MB → 6.5MB (−78%). 23 imágenes convertidas de PNG a WebP (`cwebp -q 85/90`) con una reducción media del 90–95% por imagen. Eliminados 8 ficheros `_old`/duplicados sin referencia en código. Referencias actualizadas en `PreloadScene.js`, `rewards.json` e `index.html`. para eliminar 7 vulnerabilidades high-severity: vite 6.3.2 → 6.4.2, rollup 4.40.0 → 4.60.2, picomatch 4.0.2 → 4.0.4. `npm audit` reporta 0 vulnerabilidades.

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
    BALANCE_PANEL: false, // true → panel visible + personaje inmortal en límites
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
- Botón "📜 HISTORIA" en `MenuScene`, posicionado bajo "PULSA PARA EMPEZAR".
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

  | Parámetro                | Antes  | Ahora  | Motivo                                                         |
  | ------------------------ | ------ | ------ | -------------------------------------------------------------- |
  | `DRIFT_MIN`              | `0.6`  | `0.3`  | Inicio más suave                                               |
  | `DRIFT_MAX`              | `2.2`  | `1.2`  | Techo más bajo, progresión gradual                             |
  | `DRIFT_GROWTH_PER_CROSS` | `0.15` | `0.06` | Ramp-up más lento                                              |
  | `INPUT_FORCE`            | `8`    | `2.5`  | Proporcional al nuevo drift; garantía: `2.5 > 1.2 × 1.5 = 1.8` |
  | `DAMPING`                | `0.65` | `0.35` | Más inercia; velocity acumulada dura más                       |
  | `VELOCITY_CAP`           | —      | `5`    | Nuevo: límite absoluto de velocidad                            |

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
