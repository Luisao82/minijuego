// Configuración del sistema de compartir
//
// Si GAME_URL queda vacío, el enlace NO se incluye en el texto ni en la imagen.
// Rellenar cuando el juego tenga dominio público.

export const GAME_URL = 'https://minijuego-lilac.vercel.app'

export const SHARE_IMAGE_SIZE = 1080  // Cuadrado, óptimo para WhatsApp/Instagram

// Plantillas de texto. Usa {name} como placeholder del nombre del premio/skin/personaje.
// El enlace se añade automáticamente al final si GAME_URL no está vacío.
export const SHARE_TEXTS = {
  REWARD_NEW:        '¡NUEVO PREMIO! He conseguido {name} en La Cucaña Trianera 🏳️',
  REWARD_COLLECTION: 'Mira el {name} que tengo en La Cucaña Trianera 🏳️',
  SKIN_NEW:          '¡NUEVO SKIN! He desbloqueado {name} en La Cucaña Trianera 🏳️',
  SKIN_COLLECTION:   'Mira el skin {name} que tengo en La Cucaña Trianera 🏳️',
  CHARACTER_NEW:     '¡NUEVO PERSONAJE! He desbloqueado {name} en La Cucaña Trianera 🏳️',
}

// Branding que aparece en la imagen generada
export const SHARE_BRANDING = {
  TITLE:    'LA CUCAÑA TRIANERA',
  SUBTITLE: {
    REWARD_NEW:        '¡NUEVO PREMIO!',
    REWARD_COLLECTION: 'PREMIO CONSEGUIDO',
    SKIN_NEW:          '¡NUEVO SKIN!',
    SKIN_COLLECTION:   'SKIN DESBLOQUEADO',
    CHARACTER_NEW:     '¡NUEVO PERSONAJE!',
  },
}

// Devuelve el texto compuesto listo para Web Share API
export function buildShareText(templateKey, name) {
  const tpl  = SHARE_TEXTS[templateKey] ?? ''
  const base = tpl.replace('{name}', name)
  return GAME_URL ? `${base}\n${GAME_URL}` : base
}
