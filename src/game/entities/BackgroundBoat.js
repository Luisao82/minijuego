// BackgroundBoat — barquito animado que cruza la escena en línea recta:
// entra desde un lado, "planta" la bandera bajo el palo y continúa hasta
// salir por el lado opuesto oscilando su balanceo. No hay vuelta atrás:
// startX y exitX pueden estar en lados distintos de stopX. Diseñado como
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
const FRAME_PLANTED = 5 // Frame 6 — bandera colocada (frame "en reposo")
const FRAME_LEAVE_ALT = 4 // Frame 5 — alterna con FRAME_PLANTED mientras se aleja "engrasando" el palo

export class BackgroundBoat {
  constructor(
    scene,
    {
      textureKey = 'boat-small',
      startX,
      y,
      scale = 3,
      depth = 0,
      flipX = false, // Voltea el sprite horizontalmente (por si un futuro barco viene con orientación distinta)
      enterSpeedPxPerSec = 320,
      leaveSpeedPxPerSec = 260,
      plantFrameDelayMs = 130,
      leaveAltFrameMs = 200, // Duración del frame "trabajando"
      leaveFinalFrameMs = 500, // Duración del frame "en reposo" (más largo)
      leaveFadeMs = 400, // Fundido al final del trayecto de salida
      onClick = null,
      parent = null, // Container padre opcional (para heredar transformaciones)
    }
  ) {
    this.scene = scene
    this.enterSpeedPxPerSec = enterSpeedPxPerSec
    this.leaveSpeedPxPerSec = leaveSpeedPxPerSec
    this.plantFrameDelayMs = plantFrameDelayMs
    this.leaveAltFrameMs = leaveAltFrameMs
    this.leaveFinalFrameMs = leaveFinalFrameMs
    this.leaveFadeMs = leaveFadeMs
    this.onClick = onClick

    this.state = 'IDLE'
    this._activeTween = null
    this._fadeTween = null
    this._activeTimer = null
    this._leaveOscillationEvent = null
    this._onDone = null
    this._destroyed = false

    this.sprite = scene.add
      .sprite(startX, y, textureKey, FRAME_IDLE)
      .setScale(scale)
      .setFlipX(flipX)
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

    // Alternancia 6↔5 durante la salida — evoca al barquero "engrasando"
    // el palo mientras avanza. El frame 6 (en reposo, bandera plantada)
    // se mantiene más tiempo que el frame 5 (trabajando) para que la
    // animación no resulte nerviosa.
    const cycle = () => {
      if (this._destroyed) return
      this.sprite.setFrame(FRAME_PLANTED)
      this._leaveOscillationEvent = this.scene.time.delayedCall(this.leaveFinalFrameMs, () => {
        if (this._destroyed) return
        this.sprite.setFrame(FRAME_LEAVE_ALT)
        this._leaveOscillationEvent = this.scene.time.delayedCall(this.leaveAltFrameMs, cycle)
      })
    }
    cycle()

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

    // Fundido opcional al final del recorrido. Con leaveFadeMs = 0 el
    // barquito desaparece de golpe al llegar a exitX (corte seco, útil
    // cuando la escena arranca inmediatamente después).
    if (this.leaveFadeMs > 0) {
      const fadeDelay = Math.max(0, duration - this.leaveFadeMs)
      this._fadeTween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: this.leaveFadeMs,
        delay: fadeDelay,
        ease: 'Quad.easeIn',
      })
    }
  }

  _cancelActive() {
    this._activeTween?.stop()
    this._activeTween = null
    this._fadeTween?.stop()
    this._fadeTween = null
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
