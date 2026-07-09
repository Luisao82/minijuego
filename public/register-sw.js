if ('serviceWorker' in navigator) {
  // Casos en los que NO queremos el service worker (cache-first) instalado:
  //
  //  • Desarrollo (servidor Vite en puerto no estándar): serviría módulos
  //    desactualizados tras cada cambio de código y puede corromper el arranque
  //    del juego.
  //  • Capacitor nativo (iOS/Android): el WebView ya carga el bundle desde el
  //    filesystem local, así que el SW solo aportaría una capa extra de caché
  //    capaz de servir JS obsoleto entre versiones de la app. Además, en iOS
  //    los SW en WKWebView tienen soporte limitado y comportamientos raros.
  //
  // En cualquiera de esos casos se desregistra el SW previo y se limpian las
  // cachés para dejar el navegador/WebView en un estado sano.
  const isNative =
    typeof window.Capacitor !== 'undefined' &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()

  if (window.location.port || isNative) {
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
