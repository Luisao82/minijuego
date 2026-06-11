import * as Sentry from '@sentry/browser'
import StartGame from './game/main'

// Sentry solo se inicializa en producción
// DSN configurado en Vercel Dashboard → Environment Variables → VITE_SENTRY_DSN
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
  })
}

// Nota: Sentry gestiona window.onerror y onunhandledrejection automáticamente
// tras Sentry.init(). No redefinir aquí o se sobreescribe su handler.

// Espera a que las fuentes self-hosted (Jersey 10, Press Start 2P) estén
// listas ANTES de arrancar Phaser. Sin esto, en la primera visita el canvas
// rasteriza los textos con la fuente fallback del sistema (`cursive` /
// `monospace`) y se queda así — Phaser no redibuja al llegar la fuente.
// `document.fonts.ready` se resuelve cuando todos los @font-face del CSS
// han terminado (con éxito o con fallo). Si la API no existe (navegadores
// muy antiguos) o falla, arrancamos igualmente para no quedarnos en blanco.
async function bootstrap() {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
  } catch (_) {
    // ignoramos: arrancar con fallback es mejor que no arrancar
  }
  StartGame('game-container')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
