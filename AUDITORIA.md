# Auditoría completa — La Cucaña Trianera

**Fecha:** 2026-04-16  
**Versión auditada:** 0.6.0  
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

### [ ] 4. Assets sin optimizar — ~31MB de build
- PNGs de fondo de 1.4-1.6MB cada uno. `preview.png` pesa 3MB.
- 3 archivos `*_old.png` innecesarios (~40MB extra en repo).
- **Fix:** Convertir a WebP (ahorro 25-35%), eliminar `*_old.png`.

### [ ] 5. Sin cabeceras de seguridad HTTP
- No hay Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, ni HSTS configurados.
- Google Fonts cargado sin SRI (Subresource Integrity).
- **Fix:** Añadir `vercel.json` con headers de seguridad + SRI a Google Fonts.

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

### [ ] 9. Sin analytics ni monitorización
- No hay tracking de errores, métricas de uso, ni monitorización en producción.
- Recomendación: Sentry (errores) + analytics básico (uso, abandono).

### [ ] 10. Accesibilidad limitada
- Keyboard parcial (SPACE, flechas, ESC), pero sin ARIA labels, sin `prefers-reduced-motion`, sin soporte screen reader.
- Recomendación: Añadir ARIA al canvas, respetar `prefers-reduced-motion`.

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

### [ ] 14. `.DS_Store` en el repositorio
- 19 archivos `.DS_Store` trackeados (ya ignorados para futuro).
- Fix: `git rm --cached **/.DS_Store`.

### [ ] 15. Licencia incorrecta
- `LICENSE` dice "Phaser Studio Inc (2025)" — viene del template, no del proyecto.
- Fix: Actualizar con los datos correctos del proyecto.

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
