// UIScene — escena HUD persistente.
// Se lanza UNA SOLA VEZ desde PreloadScene y nunca se detiene.
// Corre en paralelo a cualquier otra escena activa y se autoeleva
// al top de la pila de render cada frame → siempre visible encima de todo.
//
// Contenido actual:
//   • Botón de silencio de música (♪ / ♩) — esquina superior derecha.

import { Scene } from 'phaser'
import { SCENES, GAME_WIDTH } from '../config/gameConfig'
import { musicService } from '../services/MusicService'

// Posición y tamaño del botón
const BTN_SIZE = 38
const BTN_X    = GAME_WIDTH - BTN_SIZE - 10   // 10px desde el borde derecho
const BTN_Y    = 10                             // 10px desde el borde superior

// Colores
const COL_ACTIVE  = 0xffd700   // dorado — música activada
const COL_MUTED   = 0x555555   // gris   — música silenciada
const COL_BG      = 0x0a0a1e   // fondo oscuro del botón

export class UIScene extends Scene {

  constructor() {
    super({ key: SCENES.UI, active: false })
  }

  create() {
    this._buildMuteButton()
  }

  update() {
    // Garantizar que UIScene siempre renderiza por encima de todas las demás.
    // bringToTop() es una operación de array O(n) con n ≈ 15 escenas → coste despreciable.
    this.scene.bringToTop()
  }

  // ── Botón de silencio ──────────────────────────────────────────

  _buildMuteButton() {
    // Fondo del botón (cuadrado pixel art)
    this._btnGfx = this.add.graphics().setDepth(10)

    // Símbolo de nota musical — ♪ cuando activo, ♩ cuando silenciado
    this._btnNote = this.add.text(
      BTN_X + BTN_SIZE / 2,
      BTN_Y + BTN_SIZE / 2,
      '♪',
      {
        fontFamily: 'monospace',
        fontSize:   '22px',
        color:      '#ffd700',
      },
    ).setOrigin(0.5).setDepth(11)

    this._redraw()

    // Zona interactiva — ligeramente más grande que el visual para facilitar el tap
    const hitArea = new Phaser.Geom.Rectangle(BTN_X - 4, BTN_Y - 4, BTN_SIZE + 8, BTN_SIZE + 8)
    this._btnGfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)

    let pressed = false
    this._btnGfx.on('pointerdown',  () => { pressed = true })
    this._btnGfx.on('pointerout',   () => { pressed = false })
    this._btnGfx.on('pointerup',    () => {
      if (!pressed) return
      pressed = false
      musicService.toggleMute()
      this._redraw()
    })

    // Efecto hover sutil
    this._btnGfx.on('pointerover', () => { this._btnNote.setScale(1.15) })
    this._btnGfx.on('pointerout',  () => { this._btnNote.setScale(1) })
  }

  _redraw() {
    const muted = musicService.isMuted
    const color = muted ? COL_MUTED : COL_ACTIVE

    this._btnGfx.clear()

    // Sombra
    this._btnGfx.fillStyle(0x000000, 0.4)
    this._btnGfx.fillRect(BTN_X + 2, BTN_Y + 2, BTN_SIZE, BTN_SIZE)

    // Fondo oscuro
    this._btnGfx.fillStyle(COL_BG, 0.88)
    this._btnGfx.fillRect(BTN_X, BTN_Y, BTN_SIZE, BTN_SIZE)

    // Borde pixel art (dorado o gris según estado)
    this._btnGfx.lineStyle(2, color, 1)
    this._btnGfx.strokeRect(BTN_X, BTN_Y, BTN_SIZE, BTN_SIZE)

    // Símbolo y color de la nota
    this._btnNote.setText(muted ? '♩' : '♪')
    this._btnNote.setColor(muted ? '#555555' : '#ffd700')
  }
}
