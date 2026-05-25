// MusicService — gestiona la música de fondo de forma global.
// El objeto de sonido vive en el SoundManager global de Phaser y persiste
// independientemente de qué escena esté activa.
// El estado "silenciado" se guarda en localStorage para recordarlo entre sesiones.

const STORAGE_KEY = 'cucana_music_muted'
const MUSIC_VOL   = 0.4

class MusicService {
  constructor() {
    this._sound  = null
    this._muted  = this._loadMuted()
  }

  _loadMuted() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch (_) { return false }
  }

  _saveMuted(val) {
    try { localStorage.setItem(STORAGE_KEY, String(val)) } catch (_) {}
  }

  // Crea el objeto de sonido la primera vez que se llama (desde MenuScene).
  // Las llamadas sucesivas son no-ops: el sonido ya existe y sigue reproduciendo.
  init(scene) {
    if (this._sound) return

    this._sound = scene.sound.add('music-menu', {
      loop:   true,
      volume: this._muted ? 0 : MUSIC_VOL,
    })

    // Intentar reproducir inmediatamente.
    // Si el AudioContext está suspendido (móvil) se llama tryPlay() tras el primer toque.
    this._tryAutoPlay(scene)
  }

  // Llama esto cuando el AudioContext se reanuda tras un gesto del usuario (móvil).
  tryPlay(scene) {
    if (!this._sound || this._muted) return
    if (!this._sound.isPlaying) this._sound.play()
  }

  get isMuted() { return this._muted }

  // Alterna silencio. Devuelve el nuevo estado (true = silenciado).
  toggleMute() {
    this._muted = !this._muted
    this._saveMuted(this._muted)

    if (this._sound) {
      if (this._muted) {
        // Bajar volumen a 0 sin detener la reproducción → al volver el sonido
        // continúa exactamente desde donde estaba, sin salto ni reinicio.
        this._sound.setVolume(0)
      } else {
        this._sound.setVolume(MUSIC_VOL)
        if (!this._sound.isPlaying) this._sound.play()
      }
    }

    return this._muted
  }

  _tryAutoPlay(scene) {
    const ctx = scene?.sound?.context
    if (!ctx || ctx.state !== 'suspended') {
      if (!this._sound.isPlaying) this._sound.play()
    }
    // Si está suspendido, MenuScene.setupInput se encarga de llamar tryPlay()
    // tras el primer toque del usuario.
  }
}

export const musicService = new MusicService()
