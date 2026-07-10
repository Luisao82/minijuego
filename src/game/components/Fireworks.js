// Fireworks — fuegos artificiales pixel art generados 100 % por código.
//
// Componente reutilizable y autocontenido: cohetes que ascienden desde una
// línea de lanzamiento y explotan en partículas cuadradas (píxeles) con
// tamaño, color, radio y cadencia aleatorios. Sin texturas: todo son
// rectángulos de Phaser, así que respeta la estética retro por construcción.
//
// Uso:
//   const fireworks = createFireworks(scene, { launchY: 280, sfxKey: 'sfx-chapuzon' })
//   fireworks.start()
//   ...
//   fireworks.destroy() // en _onShutdown de la escena
//
// Todas las opciones tienen valores por defecto sensatos; ver DEFAULTS.

const rand = (min, max) => min + Math.random() * (max - min)
const randInt = (min, max) => Math.floor(rand(min, max + 1))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function createFireworks(scene, opts = {}) {
  const W = scene.scale.width
  const H = scene.scale.height

  const cfg = {
    // Zona de lanzamiento y de explosión (px en coordenadas de pantalla)
    xMin: opts.xMin ?? 60,
    xMax: opts.xMax ?? W - 60,
    launchY: opts.launchY ?? Math.round(H * 0.36),
    burstYMin: opts.burstYMin ?? Math.round(H * 0.08),
    burstYMax: opts.burstYMax ?? Math.round(H * 0.32),
    // Aspecto de las explosiones
    colors: opts.colors ?? [0xffd700, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xff69b4, 0xffeaa7, 0xffffff],
    pixelSizeMin: opts.pixelSizeMin ?? 2,
    pixelSizeMax: opts.pixelSizeMax ?? 5,
    particlesMin: opts.particlesMin ?? 22,
    particlesMax: opts.particlesMax ?? 44,
    gravity: opts.gravity ?? 130, // px/s² — caída de las chispas
    // Cadencia de lanzamiento
    intervalMinMs: opts.intervalMinMs ?? 350,
    intervalMaxMs: opts.intervalMaxMs ?? 900,
    depth: opts.depth ?? 2,
    // Sonido de explosión (opcional)
    sfxKey: opts.sfxKey ?? null,
    sfxVolume: opts.sfxVolume ?? 0.45,
  }

  let running = false
  let timer = null
  const alive = new Set() // rects vivos, para poder destruirlos todos

  const explode = (x, y) => {
    const color = pick(cfg.colors)
    // Un 35 % de las explosiones mezclan un segundo color
    const secondary = Math.random() < 0.35 ? pick(cfg.colors) : color
    const count = randInt(cfg.particlesMin, cfg.particlesMax)
    const size = randInt(cfg.pixelSizeMin, cfg.pixelSizeMax)
    const speed = rand(90, 220) * (size >= 4 ? 1.15 : 1) // las gordas expanden más
    const lifeMs = rand(700, 1100)

    if (cfg.sfxKey && scene.cache.audio.exists(cfg.sfxKey)) {
      scene.sound.play(cfg.sfxKey, {
        volume: cfg.sfxVolume * rand(0.8, 1),
        detune: randInt(-250, 250),
      })
    }

    const parts = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + rand(-0.12, 0.12)
      const v = speed * rand(0.55, 1)
      const rect = scene.add
        .rectangle(x, y, size, size, i % 3 === 0 ? secondary : color)
        .setDepth(cfg.depth)
      alive.add(rect)
      parts.push({ rect, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v })
    }

    // Un único tween por explosión: mueve todas las chispas con física
    // balística (posición redondeada a píxel) y parpadeo retro al morir
    const proxy = { t: 0 }
    scene.tweens.add({
      targets: proxy,
      t: 1,
      duration: lifeMs,
      onUpdate: () => {
        const t = proxy.t * (lifeMs / 1000)
        const dying = proxy.t > 0.65
        const blink = Math.floor(proxy.t * 20) % 2 === 0
        for (const p of parts) {
          p.rect.x = Math.round(x + p.vx * t)
          p.rect.y = Math.round(y + p.vy * t + 0.5 * cfg.gravity * t * t)
          p.rect.alpha = dying && !blink ? 0.2 : 1
        }
      },
      onComplete: () => {
        for (const p of parts) {
          alive.delete(p.rect)
          p.rect.destroy()
        }
      },
    })
  }

  const launch = () => {
    if (!running) return

    const x = randInt(cfg.xMin, cfg.xMax)
    const targetY = randInt(cfg.burstYMin, cfg.burstYMax)
    const rocket = scene.add.rectangle(x, cfg.launchY, 2, 7, 0xfff2c0).setDepth(cfg.depth)
    alive.add(rocket)

    scene.tweens.add({
      targets: rocket,
      y: targetY,
      x: x + randInt(-30, 30),
      duration: rand(450, 750),
      ease: 'Sine.easeOut',
      onUpdate: () => {
        rocket.x = Math.round(rocket.x)
        rocket.y = Math.round(rocket.y)
      },
      onComplete: () => {
        const bx = rocket.x
        const by = rocket.y
        alive.delete(rocket)
        rocket.destroy()
        explode(bx, by)
      },
    })

    timer = scene.time.delayedCall(randInt(cfg.intervalMinMs, cfg.intervalMaxMs), launch)
  }

  return {
    start() {
      if (running) return
      running = true
      launch()
    },

    stop() {
      running = false
      timer?.remove()
      timer = null
    },

    destroy() {
      this.stop()
      alive.forEach((rect) => rect.destroy())
      alive.clear()
    },
  }
}
