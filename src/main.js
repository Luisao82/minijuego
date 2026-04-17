import * as Sentry from '@sentry/browser'
import StartGame from './game/main'

// Inicializar Sentry solo en producción
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
  })
}

// Handler global: errores síncronos no capturados
window.onerror = (mensaje, archivo, linea, columna, error) => {
  if (import.meta.env.DEV) {
    console.error('[ERROR GLOBAL]', mensaje, `→ ${archivo}:${linea}`)
  }
}

// Handler global: promesas rechazadas sin .catch()
window.onunhandledrejection = (evento) => {
  if (import.meta.env.DEV) {
    console.error('[PROMESA NO GESTIONADA]', evento.reason)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container')
})
