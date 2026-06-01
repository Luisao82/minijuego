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

### [ ] 6. Sin CI/CD ni pipeline de despliegue
- No hay GitHub Actions, ni tests automáticos, ni verificación pre-deploy.
- **Fix:** Crear workflow básico: lint → build → deploy.

### [ ] 7. Sin tests
- Cero tests. Ni framework de test configurado.
- **Fix:** Añadir Vitest. Empezar por services (`GameStatsService`, `UnlockService`, `SkinService`) y systems (`BalanceSystem`, `ImpulseSystem`).

### [ ] 8. Sin linting ni formatting
- No hay ESLint ni Prettier configurados. El estilo es consistente pero no se aplica automáticamente.
- **Fix:** Añadir ESLint + Prettier + script en `package.json`.

---

## HALLAZGOS MENORES (recomendaciones)

### [~] 9. Sin analytics ni monitorización (parcialmente resuelto) ✅ _Sentry: 2026-04-17_
- ~~No hay tracking de errores, métricas de uso, ni monitorización en producción.~~
- **Sentry (errores):** Resuelto en #3. `@sentry/browser` activo en producción vía `VITE_SENTRY_DSN`.
- **Pendiente:** Analytics de uso/abandono. Decisión aplazada — `PRIVACY.md` declara que no se recogen datos, por lo que añadir analytics requeriría revisar la política.

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

### [ ] 13. Duplicación de estilos de texto
- 25+ instancias de `this.add.text()` con estilos repetidos.
- Recomendación: Crear un `TextFactory` o constantes de estilos compartidas.

### [x] 14. `.DS_Store` en el repositorio ✅ _completado 2026-05-27_
- ~~19 archivos `.DS_Store` trackeados (ya ignorados para futuro).~~
- **Implementado:** `.DS_Store` añadido a `.gitignore` y archivos eliminados del índice. `git ls-files | grep ds_store` no devuelve resultados.

### [x] 15. Licencia incorrecta ✅ _completado 2026-05-28_
- ~~`LICENSE` dice "Phaser Studio Inc (2025)" — viene del template, no del proyecto.~~
- **Implementado:** `LICENSE` reescrita como licencia propietaria de Luisao (Copyright 2026). `package.json` apunta a "SEE LICENSE IN LICENSE".

---

## LO QUE ESTÁ BIEN

| Área | Estado |
|------|--------|
| Sin secretos expuestos | Limpio — ni API keys, ni tokens, ni credenciales |
| Sin XSS/eval/innerHTML | Limpio — no hay vectores de inyección |
| localStorage seguro | Solo datos de juego, con try-catch, sin datos sensibles |
| PWA bien configurada | Manifest completo, SW con estrategias correctas |
| SEO/Open Graph | Completo — OG, Twitter Cards, meta tags |
| Service Worker | Origin validation, cache versionado, limpieza de cache viejo |
| Capacitor/iOS | Setup estándar, sin deeplinks inseguros |
| Build optimizado | Terser 2-pass, Phaser en chunk separado, 115KB de código |
| Sin console.log | Cero logs de debug en producción |
| Sin TODOs/FIXMEs | Código limpio de deuda técnica marcada |
| CHANGELOG bien mantenido | Keep a Changelog v1.0.0, SemVer |
| Documentación | README, CLAUDE.md, GDD.md completos |
| Arquitectura | Buena separación en entities/systems/services/scenes |
| Dependencias mínimas | Solo 5 deps, sin bloat |

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
