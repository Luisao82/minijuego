# Auditoría completa — La Cucaña Trianera

**Fecha:** 2026-04-16  
**Versión auditada:** 0.6.0  
**Última revisión:** 2026-05-31 (v1.1.0)  
**Tipo:** Seguridad + Producción + Calidad de código

---

## HALLAZGOS CRÍTICOS (bloquean producción)

### [x] 1. Memory leaks — 13/14 escenas sin `shutdown` ✅ _completado 2026-04-19_

- ~~Ninguna escena limpiaba tweens, timers ni listeners al cambiar de escena.~~
- **Implementado:** `BaseScene` — clase base que todas las escenas heredan. Registra automáticamente en `shutdown`: `tweens.killAll()`, `time.removeAllEvents()`, `input.removeAllListeners()`. Hook `_onShutdown()` para limpieza específica por escena (Narrator en HistoryScene/TutorialScene, sistemas activos en GameScene). Helper `_label()` para texto pixel art consistente. Breadcrumb de Sentry en cada navegación (solo producción). Las 16 escenas actualizadas.

### [x] 2. Vulnerabilidades en dependencias (7 high-severity) ✅ _completado 2026-04-19_

- ~~**Vite 6.3.2:** 6 vulnerabilidades (path traversal, arbitrary file read vía WebSocket, fs.deny bypass).~~
- ~~**Rollup 4.40.0:** Arbitrary file write via path traversal.~~
- ~~**Picomatch 4.0.2:** ReDoS via method injection.~~
- **Implementado:** `npm audit fix` — vite → 6.4.2, rollup → 4.60.2, picomatch → 4.0.4. `npm audit` reporta 0 vulnerabilidades. Son dependencias de build, sin impacto en el bundle de producción.

### [x] 3. Sin manejo global de errores ✅ _completado 2026-04-17_

- ~~No hay `window.onerror` ni `window.onunhandledrejection`.~~
- ~~Errores en producción pasan silenciosos — sin forma de diagnosticar problemas de usuarios.~~
- **Implementado:** Sentry (`@sentry/browser`) inicializado en producción vía `VITE_SENTRY_DSN`. Handlers globales `window.onerror` y `window.onunhandledrejection` en `src/main.js`. Source maps hidden activados en `vite/config.prod.mjs`.

---

## HALLAZGOS IMPORTANTES (muy recomendados)

### [x] 4. Assets sin optimizar — ~31MB de build ✅ _completado 2026-04-19_

- ~~PNGs de fondo de 1.4-1.6MB cada uno. `preview.png` pesa 3MB.~~
- ~~3 archivos `*_old.png` innecesarios (~40MB extra en repo).~~
- **Implementado:** 30MB → 6.5MB (78% de reducción). Borrados 8 ficheros `_old`/duplicados (~7MB). 23 PNGs convertidos a WebP con `cwebp` (fondos, premios, tutorial, preview social): ahorro medio del 90-95% por imagen. Referencias actualizadas en `PreloadScene.js`, `rewards.json` e `index.html`.

### [x] 5. Sin cabeceras de seguridad HTTP ✅ _completado 2026-05-31_

- ~~No hay Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, ni HSTS configurados.~~
- ~~Google Fonts cargado sin SRI (Subresource Integrity).~~
- **Implementado** (branch `audit/http-headers`):
  - `vercel.json` con CSP estricta (`default-src 'self'`, sin `'unsafe-inline'` en `script-src`, whitelist específico de Sentry en `connect-src`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS con preload, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denegando cámara/micro/geo/pago/USB/FLoC, y caché específico para `/sw.js` e `/assets/fonts/*`.
  - **Fuentes self-hosted** en lugar de SRI: Jersey 10 y Press Start 2P descargadas de Google Fonts y servidas localmente desde `public/assets/fonts/` con `@font-face` en `public/style.css`. Evita la fragilidad del SRI sobre el CSS de Google Fonts (que cambia sin aviso) y mejora el funcionamiento offline.
  - Script inline del service worker extraído a `public/register-sw.js` para que CSP no necesite `'unsafe-inline'` en `script-src`.

### [x] 6. Sin CI/CD ni pipeline de despliegue ✅ _completado 2026-06-11_

- ~~No hay GitHub Actions, ni tests automáticos, ni verificación pre-deploy.~~
- **Implementado** (rama `audit/finalize-pending` para el workflow, `audit/close-ci-cd` para el cierre documental):
  - **CI** — `.github/workflows/ci.yml` corre en cada PR contra `main` y en cada push a `main`. Ubuntu latest, Node 24 (paridad con Vercel), `actions/checkout@v4`, `actions/setup-node@v4` con cache de npm, `npm ci` (lockfile-pinned), y los steps `npm run lint`, `npm run format:check`, `npm run build` ordenados del más barato al más caro. Tiempo medio ~35 s con cache caliente. Tests pendientes de añadirse al pipeline cuando se cierre el #7.
  - **Branch Protection en `main`** — Ruleset "Protect main" en modo `Active` sin bypass list. Reglas: `Restrict deletions`, `Require linear history` (solo rebase/squash), `Require a pull request before merging` (0 approvals, `Require conversation resolution`), `Require status checks to pass` con `validate` como check obligatorio y "branches up to date" activo, `Block force pushes`. Verificado en vivo: un push directo a `main` es rechazado con `GH013: Repository rule violations`.
  - **CD — Modelo A (deliberado)** — Vercel mantiene su integración nativa con GitHub y sigue `main` directamente. Como Branch Protection garantiza que a `main` solo entra código que pasó CI, en la práctica Vercel solo despliega bundles validados. Se elige A frente a B (Actions despliega con `vercel deploy --prod`) porque conserva los preview deploys automáticos por PR y evita gestionar un token de Vercel adicional. Si en el futuro aparecen divergencias entre la build de CI y la de Vercel, migrar a B es un cambio aislado.
  - **Flujo de trabajo documentado:** rama de feature → push → PR contra `main` → CI corre sobre la rama del PR + Vercel preview deploy en paralelo → ambas verdes → merge (rebase para PRs con commits estructurados, squash para los exploratorios) → CI re-corre sobre `main` como red de seguridad → Vercel deploya a producción.

### [ ] 7. Sin tests

- Cero tests. Ni framework de test configurado.
- **Fix:** Añadir Vitest. Empezar por services (`GameStatsService`, `UnlockService`, `SkinService`) y systems (`BalanceSystem`, `ImpulseSystem`).

### [x] 8. Sin linting ni formatting ✅ _completado 2026-05-31_

- ~~No hay ESLint ni Prettier configurados. El estilo es consistente pero no se aplica automáticamente.~~
- **Implementado** (branch `audit/finalize-pending`):
  - **ESLint 10 flat config** (`eslint.config.js`) en capas — `@eslint/js` recomendado + reglas del CLAUDE.md (`no-var`, `prefer-const`, `eqeqeq` como errores; `no-unused-vars` con `^_` para args/vars/caughtErrors; `no-console` permitiendo warn/error; `no-empty` con `allowEmptyCatch`). Globals por zona: `src/` browser + Phaser, `vite/`/`scripts/`/`*.config.*` Node. `eslint-config-prettier` como capa final desactiva las reglas de formato.
  - **Prettier 3** (`.prettierrc.json` + `.prettierignore`) — sin punto y coma, comillas simples, 100 chars, 2 espacios, trailing comma `es5`, LF.
  - **Limpieza completa de warnings:** 31 problemas reportados inicialmente → 0 errores / 0 warnings. Renombrados `catch (e)` no usados a `(_)`, eliminados imports no usados (`COLORS`, `GAME_HEIGHT`), constantes huérfanas (`AMBER`, `FILL_START`, 6 constantes COL\_\* de debug) y asignaciones muertas a `y` en `LicensesScene`.
  - **Reformat masivo** aplicado en commit aislado (`style: apply Prettier formatting to entire codebase`) sobre los 79 archivos bajo dominio de Prettier.
  - **Pendiente para mayor calidad de vida del equipo** (no bloqueante): `.vscode/extensions.json` + `.vscode/settings.json` con `formatOnSave`, Husky + lint-staged como pre-commit hook, y steps de `lint`/`format:check` en CI cuando exista (depende del #6).

---

## HALLAZGOS MENORES (recomendaciones)

### [x] 9. Sin analytics ni monitorización — decisión deliberada ✅ _cerrado 2026-06-11_

- ~~No hay tracking de errores, métricas de uso, ni monitorización en producción.~~
- **Monitorización de errores (error tracking) — implementado en #3.** `@sentry/browser` activo en
  producción vía `VITE_SENTRY_DSN`. `window.onerror` y `window.onunhandledrejection` cubiertos por
  el handler global de Sentry. Source maps `hidden` activados en `vite/config.prod.mjs` para que los
  reports de Sentry lleguen con línea/columna del código fuente. Breadcrumb de navegación de escena
  en `BaseScene` para reconstruir el camino del usuario hasta el crash.
- **Analytics de uso de producto — descartado para la versión inicial. Aplazado a post-publicación.**
  - **Por qué no se añade ahora:**
    1. **Falta la pregunta concreta.** Analytics es una herramienta para responder preguntas
       específicas ("¿dónde abandonan los jugadores?", "¿qué fase frustra más?"). Esas preguntas
       todavía no existen en bruto — surgirán al ver comportamiento real tras publicar.
    2. **Sentry ya cubre el escenario crítico** ("está rota la app en producción y no me entero"),
       que es lo que de verdad bloquea publicar. La parte "cómo lo usan" no es bloqueante.
    3. **Coherencia con `PRIVACY.md`.** El documento declara que no se recogen datos. Añadir
       analytics ahora obligaría a actualizarlo y justificar el cambio. Mejor mantener esa promesa
       en la versión inicial y revisarla con un caso de uso concreto si surge.
  - **Opciones consideradas y por qué se descartan en esta versión:**
    - **Plausible / Umami / Vercel Analytics** (privacy-friendly, sin cookies, no requieren
      consentimiento RGPD). Excelentes candidatos cuando haya pregunta concreta; no aportan valor
      sin esa pregunta y añaden complejidad operativa (otra dep, otra cuenta, otro dashboard).
    - **Google Analytics / Mixpanel / PostHog** (analytics tradicional con identificadores).
      Descartado: requeriría consentimiento explícito, banner de cookies, actualización profunda de
      `PRIVACY.md`. Desproporcionado para un juego pequeño hecho con cariño.
  - **Criterio para retomarlo:** cuando, tras publicar, aparezca una pregunta concreta sobre uso
    real que solo pueda responder un evento medido (ej. "¿qué porcentaje de jugadores completa la
    fase 2?"). En ese momento la decisión correcta será **Plausible o Vercel Analytics** (orden de
    preferencia), con eventos personalizados acotados a la pregunta — no instrumentación generalista.
  - **Cambios en `PRIVACY.md` que requeriría:** mencionar el proveedor elegido, declarar que no se
    almacenan IPs ni identificadores persistentes, indicar el dominio del recolector (`plausible.io`
    o `vercel.com`) en CSP `connect-src`. Migración estimada: ~30 minutos.

### [x] 10. Accesibilidad limitada ✅ _completado 2026-05-31_

- ~~Keyboard parcial (SPACE, flechas, ESC), pero sin ARIA labels, sin `prefers-reduced-motion`, sin soporte screen reader.~~
- **Implementado** (branch `audit/finalize-pending`):
  - `index.html`: `role="application"` y `aria-label` descriptivo en `#game-container`.
  - Helper `src/game/utils/accessibility.js` con `prefersReducedMotion()`.
  - `BaseScene.prefersReducedMotion` (getter) disponible para todas las escenas.
  - Aplicado en `SkinMarquee`: con el flag activo los sprites quedan estáticos (sin desplazamiento lateral ni alternancia STAND/WALK). Resto de tweens del juego son funcionales y se mantienen sin cambios.

### [x] 11. GameScene es demasiado grande (895 líneas) ✅ _completado 2026-04-18_

- ~~Actúa como "god object". Lógica de UI, input, salto, caída, todo mezclado.~~
- **Implementado** (branch `refactor/gamescene-clean-architecture`): GameScene reducida de 895 → ~600 líneas. Extraídos 4 archivos nuevos:
  - `systems/JumpSystem.js` — física balística pura (sin Phaser)
  - `systems/FallSystem.js` — animación de caída + partículas de splash
  - `components/PowerBarUI.js` — UI Fase 1 completa con ciclo de vida propio
  - `components/BalanceUI.js` — UI Fase 2 completa + estado de input direccional

### [x] 12. Sin source maps en producción ✅ _completado 2026-04-17_

- ~~Errores en producción serán imposibles de depurar sin source maps.~~
- **Implementado:** `sourcemap: 'hidden'` activado en `vite/config.prod.mjs`. Los `.map` se generan pero no se enlazan públicamente en el bundle.

### [~] 13. Duplicación de estilos de texto — fase 1 ✅ _piloto: 2026-06-11_

- ~~25+ instancias de `this.add.text()` con estilos repetidos.~~ (Auditoría original
  subestimó el problema: el escaneo real encontró **102** declaraciones de
  `fontFamily` repartidas en 20+ archivos.)
- **Fase 1 implementada** (rama `feat/text-factory`):
  - **Layer 1 — `src/game/config/fonts.js`** (foundations): decisiones de marca
    centralizadas (`FONT_BRAND`, `FONT_UI`, `FONT_SYS`), receta `PIXEL_SHADOW`
    congelada, `PIXEL_STROKE_DARK` y paleta semántica (`COLOR_GOLD`,
    `COLOR_GOLD_LIGHT`, `COLOR_ORANGE`, `COLOR_REWARD`, `COLOR_MUTED`).
  - **Layer 2 — `src/game/config/textStyles.js`** (helpers de uso): seis funciones
    role-based — `titleStyle`, `headingStyle`, `uiLabelStyle`, `uiLabelLight`,
    `mutedStyle`, `warningStyle`. Devuelven el blob `style` para
    `scene.add.text()` y soportan spread+override para matices puntuales.
  - **Piloto `MenuScene`** migrado a los helpers: 4 textos refactorizados,
    `-33 / +12 = -21 líneas netas`. Comportamiento visual idéntico verificado en
    preview deploy de Vercel antes del merge a `main`. Desviaciones legítimas
    respecto a la marca (`stroke: '#000000'` en lugar de `PIXEL_STROKE_DARK` en
    el prompt y la versión; `shadow` con `offsetX/Y: 3` en el subtítulo) ahora
    están **explícitas como overrides** — antes eran ruido silencioso.
- **Fase 2 pendiente** (no bloqueante para publicación):
  - Migrar las ~98 declaraciones restantes en 15 escenas / componentes
    (`RewardScene`, `CollectionScene`, `StatsScene`, `LicensesScene`,
    `GameScene`, `*UnlockScene`, `*SelectScene`, `MapScene`, `TutorialScene`,
    `HistoryScene`, `CreditsScene`, `CharacterCard`, `RewardCard`,
    `OilIndicator`, `PowerBarUI`).
  - Patrón a aplicar: por cada `this.add.text(...)` con `fontFamily` literal,
    importar el helper correspondiente y usar `spread + override` para
    matices específicos (el piloto deja la pauta).
  - Tras la migración completa: ejecutar un grep `fontFamily:` por `src/` y
    confirmar que el único hit legítimo es `BaseScene._label()` (que usa
    `monospace` por defecto para el helper de debug y queda fuera de marca).
  - Decisión diferida para una pasada de **normalización de marca** posterior:
    ¿unificamos los strokes `#000000` a `PIXEL_STROKE_DARK`? ¿uniformizamos la
    sombra a `4,4`? Esos cambios sí alteran píxeles — requieren revisión visual.

### [x] 14. `.DS_Store` en el repositorio ✅ _completado 2026-05-27_

- ~~19 archivos `.DS_Store` trackeados (ya ignorados para futuro).~~
- **Implementado:** `.DS_Store` añadido a `.gitignore` y archivos eliminados del índice. `git ls-files | grep ds_store` no devuelve resultados.

### [x] 15. Licencia incorrecta ✅ _completado 2026-05-28_

- ~~`LICENSE` dice "Phaser Studio Inc (2025)" — viene del template, no del proyecto.~~
- **Implementado:** `LICENSE` reescrita como licencia propietaria de Luisao (Copyright 2026). `package.json` apunta a "SEE LICENSE IN LICENSE".

---

## LO QUE ESTÁ BIEN

| Área                     | Estado                                                       |
| ------------------------ | ------------------------------------------------------------ |
| Sin secretos expuestos   | Limpio — ni API keys, ni tokens, ni credenciales             |
| Sin XSS/eval/innerHTML   | Limpio — no hay vectores de inyección                        |
| localStorage seguro      | Solo datos de juego, con try-catch, sin datos sensibles      |
| PWA bien configurada     | Manifest completo, SW con estrategias correctas              |
| SEO/Open Graph           | Completo — OG, Twitter Cards, meta tags                      |
| Service Worker           | Origin validation, cache versionado, limpieza de cache viejo |
| Capacitor/iOS            | Setup estándar, sin deeplinks inseguros                      |
| Build optimizado         | Terser 2-pass, Phaser en chunk separado, 115KB de código     |
| Sin console.log          | Cero logs de debug en producción                             |
| Sin TODOs/FIXMEs         | Código limpio de deuda técnica marcada                       |
| CHANGELOG bien mantenido | Keep a Changelog v1.0.0, SemVer                              |
| Documentación            | README, CLAUDE.md, GDD.md completos                          |
| Arquitectura             | Buena separación en entities/systems/services/scenes         |
| Dependencias mínimas     | Solo 5 deps, sin bloat                                       |

---

## PLAN DE ACCIÓN RECOMENDADO

### Fase 1 — Bloqueos de producción

1. Añadir `shutdown` handlers a las 13 escenas
2. `npm audit fix` para parchar vulnerabilidades
3. Añadir error handler global (`window.onerror` + `onunhandledrejection`)

### Fase 2 — Seguridad y rendimiento

4. Crear `vercel.json` con cabeceras de seguridad (CSP, X-Frame-Options, etc.)
5. Añadir SRI a Google Fonts
6. Eliminar `*_old.png` del repositorio
7. Convertir PNGs grandes a WebP
8. Corregir `LICENSE` con datos del proyecto

### Fase 3 — Calidad de código

9. Configurar ESLint + Prettier
10. Configurar Vitest + tests para services/systems
11. Habilitar source maps hidden en prod
12. Limpiar `.DS_Store` del repo

### Fase 4 — Mejoras opcionales

13. Añadir CI/CD (GitHub Actions)
14. Integrar Sentry para error tracking
15. Refactorizar GameScene (extraer lógica)
16. Crear TextFactory para estilos compartidos
17. Mejoras de accesibilidad
