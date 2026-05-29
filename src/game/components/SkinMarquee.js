import { SPRITE_CONFIG, SPRITE_FRAMES } from '../config/spriteConfig'

// ============================================================
// SkinMarquee — Fila infinita de skins desplazándose lateralmente
// ============================================================
// Cada sprite alterna los frames STAND (0) y WALK (1) para simular
// que está caminando. Cuando un sprite sale por un extremo, se
// reposiciona en el opuesto con un skin aleatorio del array
// `skinKeys`, generando un bucle infinito con mezcla.
//
// Uso:
//   const top = createSkinMarquee(scene, {
//     y: 160,
//     direction: -1,                 // -1 = derecha → izquierda
//     speed: 35,                     // px/seg
//     skinKeys: ['sprite-trianero', 'sprite-flamenca', ...],
//     scale: 2,                      // 16×24 → 32×48
//   })
//
// Para limpiar al salir de la escena:
//   top.destroy()
//
// (No es estrictamente necesario: el listener se da de baja con el
//  shutdown de la escena vía BaseScene.)

const FRAME_DELAY = 240        // ms entre cambios STAND ↔ WALK
const SPACING_RATIO = 0.5      // separación entre sprites = medio sprite
const FRAME_JITTER = 60        // ms de variación para desincronizar
const MAX_REPEAT_LOOKBACK = 2  // cuántos vecinos consultar para evitar repetición inmediata

export function createSkinMarquee(scene, {
  y,
  direction = -1,
  speed = 35,
  skinKeys,
  scale = 2,
  depth = 0,
  mask = null,
} = {}) {

  if (!Array.isArray(skinKeys) || skinKeys.length === 0) {
    return { sprites: [], destroy: () => {} }
  }

  const W        = scene.scale.width
  const spriteW  = SPRITE_CONFIG.frameWidth  * scale
  const spriteH  = SPRITE_CONFIG.frameHeight * scale
  const spacing  = Math.round(spriteW * (1 + SPACING_RATIO))

  // Buffer: un sprite extra a cada lado para que las transiciones sean fluidas
  const count = Math.ceil(W / spacing) + 2

  // Para evitar que aparezcan dos iguales seguidos en una fila pequeña
  // de skins desbloqueados. Si solo hay 1 skin desbloqueado, no se puede
  // evitar la repetición — el marquee mostrará el mismo skin.
  const pickKey = (recent) => {
    if (skinKeys.length === 1) return skinKeys[0]
    for (let attempt = 0; attempt < 4; attempt++) {
      const candidate = skinKeys[Math.floor(Math.random() * skinKeys.length)]
      if (!recent.includes(candidate)) return candidate
    }
    return skinKeys[Math.floor(Math.random() * skinKeys.length)]
  }

  // Creación inicial: ordenados de izquierda a derecha, sin huecos.
  const sprites = []
  const recent  = []
  for (let i = 0; i < count; i++) {
    const x   = -spacing + i * spacing
    const key = pickKey(recent.slice(-MAX_REPEAT_LOOKBACK))
    recent.push(key)

    const sprite = scene.add.sprite(x, y, key, SPRITE_FRAMES.STAND)
      .setDisplaySize(spriteW, spriteH)
      .setOrigin(0.5, 1)
      .setDepth(depth)

    // Flip horizontal según la dirección de avance.
    // Los sprites del juego están dibujados mirando hacia la izquierda
    // por defecto, así que cuando direction = 1 (avanza a la derecha)
    // hay que voltearlos para que miren hacia donde se mueven.
    sprite.setFlipX(direction === 1)

    if (mask) sprite.setMask(mask)

    sprites.push(sprite)
  }

  // Animación de caminar: cada sprite tiene su propio timer con jitter
  // para que no parezcan robots sincronizados.
  const frameTimers = []
  sprites.forEach((s, i) => {
    let frame = i % 2 === 0 ? SPRITE_FRAMES.STAND : SPRITE_FRAMES.WALK
    s.setFrame(frame)
    const timer = scene.time.addEvent({
      delay:    FRAME_DELAY + Math.floor(Math.random() * FRAME_JITTER),
      loop:     true,
      callback: () => {
        frame = frame === SPRITE_FRAMES.STAND ? SPRITE_FRAMES.WALK : SPRITE_FRAMES.STAND
        s.setFrame(frame)
      },
    })
    frameTimers.push(timer)
  })

  // Update: mueve y reposiciona sprites cuando salen por un extremo.
  const update = (_time, deltaMs) => {
    const dx = speed * direction * (deltaMs / 1000)
    for (const s of sprites) {
      s.x += dx

      if (direction === -1 && s.x < -spacing) {
        const recentKeys = sprites.map(o => o.texture.key).slice(-MAX_REPEAT_LOOKBACK)
        const newKey = pickKey(recentKeys)
        const currentFrame = s.frame.name
        s.setTexture(newKey)
        s.setFrame(currentFrame)
        // Reaparecer pegado al sprite más a la derecha + spacing
        const rightmost = sprites.reduce((max, o) => o.x > max ? o.x : max, -Infinity)
        s.x = rightmost + spacing
      } else if (direction === 1 && s.x > W + spacing) {
        const recentKeys = sprites.map(o => o.texture.key).slice(-MAX_REPEAT_LOOKBACK)
        const newKey = pickKey(recentKeys)
        const currentFrame = s.frame.name
        s.setTexture(newKey)
        s.setFrame(currentFrame)
        const leftmost = sprites.reduce((min, o) => o.x < min ? o.x : min, Infinity)
        s.x = leftmost - spacing
      }
    }
  }

  scene.events.on('update', update)

  const destroy = () => {
    scene.events.off('update', update)
    frameTimers.forEach(t => t.destroy())
    sprites.forEach(s => s.destroy())
  }

  return { sprites, destroy }
}
