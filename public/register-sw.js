if ('serviceWorker' in navigator) {
  // En desarrollo (servidor Vite en puerto no estándar) el service worker es
  // cache-first y serviría módulos desactualizados tras cada cambio de código,
  // pudiendo corromper el arranque del juego. Se desregistra y se limpian sus
  // cachés para sanear navegadores que ya lo tuvieran instalado.
  if (window.location.port) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    })
    if (window.caches) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key))
      })
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }
}
