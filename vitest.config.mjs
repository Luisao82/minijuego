import { defineConfig } from 'vitest/config'

// Configuración de Vitest.
//
// Comparte el toolchain de Vite (resolvers, plugins, imports) — por eso
// los imports tipo `import { version } from '../../../package.json'`
// que usan los servicios funcionan tal cual en los tests, sin extra setup.
//
// `environment: 'happy-dom'` proporciona `localStorage`, `sessionStorage`,
// `window` y demás APIs del navegador en memoria. Más rápido que jsdom
// y suficiente para nuestros tests, que solo tocan storage y globals.
//
// `globals: true` habilita `describe`/`it`/`expect`/`beforeEach` como
// globales — mismo patrón que Jest. Evita repetir el import en cada
// archivo de test.
//
// `clearMocks` + `restoreMocks` resetean automáticamente cualquier
// `vi.spyOn` o `vi.mock` entre tests para evitar contaminación cruzada.

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    include: ['tests/**/*.test.js'],
  },
})
