// BackgroundBoat — barquito animado que entra por la izquierda, "planta" la
// bandera bajo el palo y se aleja oscilando su balanceo. Diseñado como
// componente autónomo para poder tener varios barcos independientes en el
// fondo (cada uno con su spritesheet, ritmo, profundidad y callbacks).
//
// Máquina de estados: IDLE → ENTERING → PLANTING → LEAVING → DONE
//
// El orquestador (la escena) decide cuándo llamar a play() y qué hacer en
// los callbacks (onFlagPlanted, onDone). skip() aborta el resto de la
// secuencia y llama a onDone inmediatamente — el resultado visual final lo
// aplica el orquestador (ej. mostrar la bandera del palo).

const FRAME_IDLE = 0 // Frame 1 en la referencia del usuario
const FRAMES_PLANT = [1, 2, 3, 4, 5] // Frames 2→6 (planta la bandera)
const FRAME_PLANTED = 5 // Frame 6 — bandera colocada
const FRAME_LEAVE_ALT = 4 // Oscila 6↔5 mientras se aleja

export class BackgroundBoat {
  constructor(
    scene,
    {
      textureKey = 'boat-small',
      startX,
      y,
      scale = 3,
      depth = 0,
      enterSpeedPxPerSec = 320,
      leaveSpeedPxPerSec = 260,
      plantFrameDelayMs = 130,
      leaveOscillationMs = 220,
      onClick = null,
      parent = null, // Container padre opcional (para heredar transformaciones)
    }
  ) {
    this.scene = scene
    this.enterSpeedPxPerSec = enterSpeedPxPerSec
    this.leaveSpeedPxPerSec = leaveSpeedPxPerSec
    this.plantFrameDelayMs = plantFrameDelayMs
    this.leaveOscillationMs = leaveOscillationMs
    this.onClick = onClick

    this.state = 'IDLE'
    this._activeTween = null
    this._activeTimer = null
    this._leaveOscillationEvent = null
    this._onDone = null
    this._destroyed = false

    this.sprite = scene.add
      .sprite(startX, y, textureKey, FRAME_IDLE)
      .setScale(scale)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true })

    this.sprite.on('pointerdown', (_pointer, _lx, _ly, event) => {
      // Evita que el tap propague al listener global de skip.
      event?.stopPropagation?.()
      this.onClick?.()
    })

    if (parent) parent.add(this.sprite)
  }

  // Reproduce la secuencia completa: entra → planta (dispara onFlagPlanted en
  // el frame final) → se aleja → onDone. targetX es donde se detiene bajo el
  // palo; exitX es la coordenada a la que se aleja antes de desaparecer.
  play({ targetX, exitX, onFlagPlanted, onDone }) {
    this._onDone = onDone
    this._enter(targetX, () => {
      this._plant(() => {
        onFlagPlanted?.()
        this._leave(exitX, () => this._finish())
      })
    })
  }

  // Aborta la secuencia y ejecuta onDone. El orquestador debe aplicar el
  // estado final visible (mostrar bandera del palo, etc.) porque el barquito
  // solo garantiza limpiar sus propios recursos.
  skip() {
    if (this.state === 'DONE') return
    this._cancelActive()
    this._finish()
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this._cancelActive()
    this.sprite?.destroy()
    this.sprite = null
  }

  // ─── Interno ─────────────────────────────────────────────────────────────

  _enter(targetX, onArrived) {
    this.state = 'ENTERING'
    const distance = Math.abs(targetX - this.sprite.x)
    const duration = (distance / this.enterSpeedPxPerSec) * 1000
    this._activeTween = this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this._activeTween = null
        onArrived()
      },
    })
  }

  _plant(onDone) {
    this.state = 'PLANTING'
    let i = 0
    const tick = () => {
      if (this._destroyed) return
      if (i >= FRAMES_PLANT.length) {
        this._activeTimer = null
        onDone()
        return
      }
      this.sprite.setFrame(FRAMES_PLANT[i++])
      this._activeTimer = this.scene.time.delayedCall(this.plantFrameDelayMs, tick)
    }
    tick()
  }

  _leave(exitX, onGone) {
    this.state = 'LEAVING'

    // Oscilación 6↔5 durante el viaje de vuelta — refuerza la sensación
    // de balanceo sobre las olas.
    this._leaveOscillationEvent = this.scene.time.addEvent({
      delay: this.leaveOscillationMs,
      loop: true,
      callback: () => {
        if (this._destroyed) return
        const curr = this.sprite.frame.name
        this.sprite.setFrame(curr === String(FRAME_PLANTED) ? FRAME_LEAVE_ALT : FRAME_PLANTED)
      },
    })

    const distance = Math.abs(exitX - this.sprite.x)
    const duration = (distance / this.leaveSpeedPxPerSec) * 1000
    this._activeTween = this.scene.tweens.add({
      targets: this.sprite,
      x: exitX,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this._activeTween = null
        onGone()
      },
    })
  }

  _cancelActive() {
    this._activeTween?.stop()
    this._activeTween = null
    this._activeTimer?.remove(false)
    this._activeTimer = null
    this._leaveOscillationEvent?.remove(false)
    this._leaveOscillationEvent = null
  }

  _finish() {
    this.state = 'DONE'
    const cb = this._onDone
    this._onDone = null
    this.destroy()
    cb?.()
  }
}
