// Helpers de compartir — Capacitor Share + Filesystem en nativo, Web Share
// API en web.
//
// En nativo (iOS y Android) escribimos el blob a un fichero temporal en
// caché con @capacitor/filesystem y le pasamos su URI a @capacitor/share.
// Esto arregla dos bugs conocidos:
//
//   1) iOS "preparing..." en el segundo share — el Web Share API dentro
//      del WKWebView de Capacitor no libera bien el estado del sheet entre
//      llamadas. Usando el plugin nativo se elimina el problema.
//   2) Android sin imagen — @capacitor/share necesita un file path local
//      (no acepta Blob directamente). Con Filesystem lo escribimos primero.
//
// En navegador seguimos con el Web Share API estándar (funciona bien fuera
// de Capacitor) y con clipboard como fallback si no hay navigator.share.
//
// API pública:
//   canShareImage()  → true si el dispositivo puede compartir con imagen.
//   shareImage(blob, text, fileName?) → { ok, method, reason? }
//     method: 'share' | 'share-text' | 'clipboard'

import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

const isNative = () => Capacitor.isNativePlatform()
const isSecureCtx = () => typeof window !== 'undefined' && window.isSecureContext

export function canShareImage() {
  if (isNative()) return true
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
  if (isNative()) return true
  return isSecureCtx() && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

// ── helpers privados ────────────────────────────────────────────

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result = "data:image/png;base64,XXXX" — extraemos solo la parte tras la coma
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function writeTempImage(blob, fileName) {
  const base64 = await blobToBase64(blob)
  // Escribimos siempre en Cache (se limpia solo por el SO) para no llenar
  // Documents. Sobrescribimos el mismo nombre en cada share — no acumulamos.
  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })
  return written.uri // URI local absoluta lista para Share.share({ files: [...] })
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

// Guarda para evitar dos shares simultáneos (si el usuario da doble tap
// rápido). No impide el share consecutivo — solo el solapado.
let _sharingInFlight = false

// ── API pública ─────────────────────────────────────────────────

export async function shareImage(blob, text, fileName = 'cucana-trianera.png') {
  if (_sharingInFlight) return { ok: false, reason: 'busy' }
  _sharingInFlight = true

  try {
    // ── NATIVO (iOS + Android) ───────────────────────────────
    if (isNative()) {
      try {
        const uri = await writeTempImage(blob, fileName)
        await Share.share({ text, files: [uri] })
        return { ok: true, method: 'share' }
      } catch (err) {
        if (err?.message === 'Share canceled' || err?.name === 'AbortError') {
          return { ok: false, reason: 'cancelled' }
        }
        // Si el share con imagen falla por otra razón, degradamos a solo texto.
        try {
          await Share.share({ text })
          return { ok: true, method: 'share-text' }
        } catch (err2) {
          if (err2?.message === 'Share canceled' || err2?.name === 'AbortError') {
            return { ok: false, reason: 'cancelled' }
          }
          return { ok: false, reason: 'native-share-failed' }
        }
      }
    }

    // ── WEB (Web Share API si está + files, si no solo texto, si no clipboard) ──
    if (canShareImage()) {
      try {
        const file = new File([blob], fileName, { type: blob.type || 'image/png' })
        await navigator.share({ files: [file], text })
        return { ok: true, method: 'share' }
      } catch (err) {
        if (err?.name === 'AbortError') return { ok: false, reason: 'cancelled' }
        // Degradamos a solo texto si el share con files falla.
        if (canShareText()) {
          try {
            await navigator.share({ text })
            return { ok: true, method: 'share-text' }
          } catch (err2) {
            if (err2?.name === 'AbortError') return { ok: false, reason: 'cancelled' }
          }
        }
      }
    } else if (canShareText()) {
      try {
        await navigator.share({ text })
        return { ok: true, method: 'share-text' }
      } catch (err) {
        if (err?.name === 'AbortError') return { ok: false, reason: 'cancelled' }
      }
    }

    const copied = await copyToClipboard(text)
    if (copied) return { ok: true, method: 'clipboard' }
    return { ok: false, reason: 'unsupported' }
  } finally {
    _sharingInFlight = false
  }
}
