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

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container')
})
