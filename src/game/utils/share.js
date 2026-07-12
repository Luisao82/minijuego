// Helpers de compartir — Capacitor Share en nativo Android, Web Share API en iOS/web.
//
// En Android nativo, WKWebView de Chrome/Android no expone Web Share API dentro
// de la app Capacitor. Usamos el plugin @capacitor/share que lanza un Intent
// nativo. Solo enviamos texto (no imagen) porque Share.share con imagen requiere
// escribir el blob a disco primero — ver TODO más abajo.
//
// canShareImage()  → true si el dispositivo puede compartir archivos con imagen
// shareImage(blob, text, fileName) → abre el menú nativo de compartir.
//   Devuelve { ok: true, method: 'share' } si se compartió con imagen,
//             { ok: true, method: 'share-text' } si se compartió solo texto,
//             { ok: true, method: 'clipboard' } si se usó el fallback,
//             { ok: false, reason } si falló o el usuario canceló.

import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

const isSecureCtx = () => typeof window !== 'undefined' && window.isSecureContext

const isAndroidNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export function canShareImage() {
  // Android nativo: el plugin no acepta blobs sin escribirlos a disco → solo texto.
  if (isAndroidNative()) return false
  if (!isSecureCtx()) return false
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false
  try {
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', {
      type: 'image/png',
    })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export function canShareText() {
  if (isAndroidNative()) return true
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
  if (isAndroidNative()) {
    try {
      await Share.share({ text })
      return { ok: true, method: 'share-text' }
    } catch (err) {
      if (err && (err.message === 'Share canceled' || err.name === 'AbortError')) {
        return { ok: false, reason: 'cancelled' }
      }
    }
  } else if (canShareImage()) {
    try {
      const file = new File([blob], fileName, { type: blob.type || 'image/png' })
      await navigator.share({ files: [file], text })
      return { ok: true, method: 'share' }
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, reason: 'cancelled' }
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

  const copied = await copyToClipboard(text)
  if (copied) return { ok: true, method: 'clipboard' }
  return { ok: false, reason: 'unsupported' }
}
