// Configuración del sistema de compartir.
//
// URLs de descarga de la app en cada tienda. Aparecen al pie del texto
// compartido para que quien reciba pueda instalar el juego con un tap.

export const IOS_APP_URL = 'https://apps.apple.com/app/id6789896027'
export const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.cucana.trianera'

export const SHARE_IMAGE_SIZE = 1080 // Cuadrado, óptimo para WhatsApp/Instagram

// Plantillas de texto. Usa {name} como placeholder del nombre del premio/skin/personaje.
export const SHARE_TEXTS = {
  REWARD_NEW: '¡NUEVO PREMIO! He conseguido {name} en La Cucaña Trianera 🏳️',
  REWARD_COLLECTION: 'Mira el {name} que tengo en La Cucaña Trianera 🏳️',
  SKIN_NEW: '¡NUEVO SKIN! He desbloqueado {name} en La Cucaña Trianera 🏳️',
  SKIN_COLLECTION: 'Mira el skin {name} que tengo en La Cucaña Trianera 🏳️',
  CHARACTER_NEW: '¡NUEVO PERSONAJE! He desbloqueado {name} en La Cucaña Trianera 🏳️',
}

// Branding que aparece en la imagen generada
export const SHARE_BRANDING = {
  TITLE: 'LA CUCAÑA TRIANERA',
  SUBTITLE: {
    REWARD_NEW: '¡NUEVO PREMIO!',
    REWARD_COLLECTION: 'PREMIO CONSEGUIDO',
    SKIN_NEW: '¡NUEVO SKIN!',
    SKIN_COLLECTION: 'SKIN DESBLOQUEADO',
    CHARACTER_NEW: '¡NUEVO PERSONAJE!',
  },
}

const DOWNLOAD_FOOTER = `\n\n📱 Descárgalo gratis:\n🍎 iOS → ${IOS_APP_URL}\n🤖 Android → ${ANDROID_APP_URL}`

// Devuelve el texto compuesto listo para compartir (mensaje + pie de descarga).
export function buildShareText(templateKey, name) {
  const tpl = SHARE_TEXTS[templateKey] ?? ''
  const base = tpl.replace('{name}', name)
  return `${base}${DOWNLOAD_FOOTER}`
}
