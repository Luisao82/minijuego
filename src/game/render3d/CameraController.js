import { GAME3D } from '../config/game3dConfig'

// Cámara en primera persona de la vista 3D — traduce el estado de la partida
// a posición y rotación de cámara. La inclinación (roll) ES la barra de
// equilibrio: la posición del cursor se mapea directamente al roll.
// Lógica pura: sin Phaser ni three.js — la escena aplica el resultado
// al mundo 3D (World3D.applyCamera) y decide las transiciones de fase.

export class CameraController {
  constructor() {
    const C = GAME3D.CAMERA
    this._eyeBase = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT
    this._pos = { x: 0, y: this._eyeBase, z: 0 }
    this._pitch = C.PITCH
    this._roll = 0
    this._breathT = 0
    this._fallT = 0
    this._fallDir = 1
    this._eyeY = this._eyeBase
  }

  // Arranca la caída al agua: gira hacia el lado al que se estaba inclinado
  // (o uno aleatorio si se estaba en perfecto equilibrio)
  startFall() {
    this._fallT = 0
    this._fallDir = this._roll !== 0 ? Math.sign(this._roll) : Math.random() < 0.5 ? -1 : 1
    this._eyeY = this._eyeBase
  }

  // Avanza un frame y devuelve la pose de cámara:
  // { x, y, z, pitch, roll, hitWater } — hitWater avisa de que la caída tocó el agua
  update(dt, state) {
    const C = GAME3D.CAMERA
    let hitWater = false

    switch (state.phase) {
      // Antes y durante el impulso: respiración en la salida
      case null:
      case 'impulse': {
        this._breathT += dt
        this._pos = {
          x: 0,
          y: this._eyeBase + Math.sin(this._breathT * C.BREATH_FREQ) * C.BREATH_AMP,
          z: 0,
        }
        this._pitch = C.PITCH
        this._roll = 0
        break
      }

      case 'running': {
        this._roll = (state.balancePosition ?? 0) * C.MAX_ROLL
        const speedRatio =
          state.runDuration > 0 ? Math.max(0, 1 - state.runElapsed / state.runDuration) : 0
        const speed = state.initialSpeed * speedRatio
        const bob =
          Math.sin(state.runElapsed * (C.BOB_BASE_FREQ + speed)) *
          C.BOB_AMP *
          Math.min(speed, C.BOB_SPEED_CAP)
        this._pos = {
          x: Math.sin(this._roll) * C.ROLL_SWAY,
          y: this._eyeBase + bob,
          z: -state.distance,
        }
        this._pitch = C.PITCH
        break
      }

      // La altura del salto la dicta JumpSystem (la escena la pasa en jumpEyeY)
      case 'jumping': {
        this._pos = {
          x: Math.sin(this._roll) * C.ROLL_SWAY,
          y: state.jumpEyeY,
          z: -state.distance,
        }
        this._pitch = C.PITCH + C.JUMP_PITCH
        break
      }

      case 'falling': {
        const F = C.FALL
        this._fallT += dt
        this._roll += dt * this._fallDir * F.ROLL_SPEED
        this._eyeY -= dt * (F.BASE_SPEED + this._fallT * F.ACCEL)
        if (this._eyeY <= C.WATER_EYE_Y) {
          this._eyeY = C.WATER_EYE_Y
          hitWater = true
        }
        this._pos = {
          x: Math.sin(this._roll) * F.SWAY,
          y: this._eyeY,
          z: -state.distance,
        }
        break
      }

      // Partida pausada (modal de salida): la cámara se congela
      case 'paused':
        break

      // Resultado: la cámara descansa donde cayó, nivelándose despacio
      default: {
        this._roll *= 1 - Math.min(1, dt * C.LEVEL_OUT_SPEED)
        break
      }
    }

    return {
      x: this._pos.x,
      y: this._pos.y,
      z: this._pos.z,
      pitch: this._pitch,
      roll: -this._roll * C.ROLL_APPLY,
      hitWater,
    }
  }
}
