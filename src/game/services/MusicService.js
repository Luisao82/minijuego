// MusicService — persiste el estado de silencio entre visitas al menú.
// La gestión del objeto de sonido es responsabilidad de MenuScene.

const STORAGE_KEY = 'cucana_music_muted'

class MusicService {
  constructor() {
    this._muted = this._load()
  }

  _load() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch (_) { return false }
  }

  _save(val) {
    try { localStorage.setItem(STORAGE_KEY, String(val)) } catch (_) {}
  }

  get isMuted() { return this._muted }

  toggleMute() {
    this._muted = !this._muted
    this._save(this._muted)
    return this._muted
  }
}

export const musicService = new MusicService()
