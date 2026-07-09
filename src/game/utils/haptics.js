// Feedback háptico (vibración corta) en pulsaciones táctiles.
//
//  • En Capacitor nativo (iOS/Android): usa @capacitor/haptics con impacto
//    ligero — sensación de "click" sin ser intrusivo. En iOS se traduce a
//    UIImpactFeedbackGenerator(.light).
//  • En web: no-op. El navegador no expone hápticos reales y el fallback de
//    `navigator.vibrate` no está disponible en iOS Safari.
//
// El import de Capacitor y del plugin son dinámicos para que el bundle web
// no cargue código que no puede usar.
//
// Uso: `hapticTap()` desde el handler `pointerup` (no `pointerdown`) para
// que la vibración acompañe al SFX de confirmación de pulsación.

let _capacitorPromise = null
let _hapticsPromise = null
let _disabled = false

async function _load() {
  if (_disabled) return null
  try {
    if (!_capacitorPromise) _capacitorPromise = import('@capacitor/core')
    const { Capacitor } = await _capacitorPromise
    if (!Capacitor.isNativePlatform()) {
      _disabled = true
      return null
    }
    if (!_hapticsPromise) _hapticsPromise = import('@capacitor/haptics')
    return await _hapticsPromise
  } catch {
    _disabled = true
    return null
  }
}

export async function hapticTap() {
  const mod = await _load()
  if (!mod) return
  try {
    await mod.Haptics.impact({ style: mod.ImpactStyle.Light })
  } catch {
    // Silencioso — un fallo háptico no debe romper la interacción.
  }
}
