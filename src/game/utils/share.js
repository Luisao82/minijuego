// Helpers de compartir — Web Share API con fallback al portapapeles.
//
// canShareImage()  → true si el dispositivo puede compartir archivos por Web Share API
// shareImage(blob, text, fileName) → abre el menú nativo de compartir.
//   Devuelve { ok: true, method: 'share' } si se compartió,
//             { ok: true, method: 'clipboard' } si se usó el fallback,
//             { ok: false, reason } si falló o el usuario canceló.

const isSecureCtx = () => typeof window !== 'undefined' && window.isSecureContext

export function canShareImage() {
  if (!isSecureCtx()) return false
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false
  try {
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export function canShareText() {
  return isSecureCtx() && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

async function copyToClipboard(text) {
  if (!isSecureCtx() || !navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function shareImage(blob, text, fileName = 'cucana-trianera.png') {
  if (canShareImage()) {
    try {
      const file = new File([blob], fileName, { type: blob.type || 'image/png' })
      await navigator.share({ files: [file], text })
      return { ok: true, method: 'share' }
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, reason: 'cancelled' }
      // Si el navegador rechaza archivos pero acepta texto, intentamos solo texto
      if (canShareText()) {
        try {
          await navigator.share({ text })
          return { ok: true, method: 'share-text' }
        } catch (err2) {
          if (err2 && err2.name === 'AbortError') return { ok: false, reason: 'cancelled' }
        }
      }
    }
  } else if (canShareText()) {
    try {
      await navigator.share({ text })
      return { ok: true, method: 'share-text' }
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, reason: 'cancelled' }
    }
  }

  // Fallback: copiar texto al portapapeles
  const copied = await copyToClipboard(text)
  if (copied) return { ok: true, method: 'clipboard' }
  return { ok: false, reason: 'unsupported' }
}
