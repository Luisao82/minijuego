// Abre una URL externa en el navegador del sistema.
//
//  • En Capacitor nativo (iOS/Android): usa @capacitor/browser, que en iOS
//    lanza SFSafariViewController (barra de progreso, botón de compartir,
//    "Hecho" para volver a la app sin interrumpir el juego).
//  • En web: window.open con `_blank` y `noopener` para nueva pestaña.
//
// El import de Capacitor y del plugin son dinámicos para no encarecer el
// bundle inicial ni romper builds cuando no se está en un entorno nativo.

export async function openExternalUrl(url) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    }
  } catch {
    // Fallback: si el import falla (build web sin Capacitor resolvible),
    // caemos al comportamiento estándar del navegador.
  }
  window.open(url, '_blank', 'noopener')
}
