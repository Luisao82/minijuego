import { CameraController } from '../../src/game/render3d/CameraController'
import { GAME3D } from '../../src/game/config/game3dConfig'

const EYE_BASE = GAME3D.POLE_Y + GAME3D.EYE_HEIGHT

// Estado base de partida para los tests — cada test pisa lo que necesita
const baseState = {
  phase: 'running',
  balancePosition: 0,
  runElapsed: 0,
  runDuration: 4,
  initialSpeed: 10,
  distance: 0,
  jumpEyeY: EYE_BASE,
}

describe('CameraController', () => {
  describe('fase de impulso', () => {
    it('respira alrededor de la altura de ojos, sin roll', () => {
      const cam = new CameraController()
      const pose = cam.update(0.016, { ...baseState, phase: 'impulse' })
      expect(pose.roll).toBe(-0)
      expect(pose.x).toBe(0)
      expect(pose.z).toBe(0)
      expect(Math.abs(pose.y - EYE_BASE)).toBeLessThanOrEqual(GAME3D.CAMERA.BREATH_AMP)
    })
  })

  describe('fase de carrera', () => {
    it('el roll de cámara ES la posición de la barra de equilibrio', () => {
      const cam = new CameraController()
      const pose = cam.update(0.016, { ...baseState, balancePosition: 1 })
      expect(pose.roll).toBeCloseTo(-GAME3D.CAMERA.MAX_ROLL * GAME3D.CAMERA.ROLL_APPLY)
    })

    it('con la barra centrada no hay roll ni desplazamiento lateral', () => {
      const cam = new CameraController()
      const pose = cam.update(0.016, { ...baseState, balancePosition: 0 })
      expect(pose.roll).toBe(-0)
      expect(pose.x).toBe(0)
    })

    it('avanza por el palo: z = -distancia', () => {
      const cam = new CameraController()
      const pose = cam.update(0.016, { ...baseState, distance: 12 })
      expect(pose.z).toBe(-12)
    })
  })

  describe('fase de salto', () => {
    it('usa la altura que dicta JumpSystem e inclina la cámara hacia abajo', () => {
      const cam = new CameraController()
      const pose = cam.update(0.016, { ...baseState, phase: 'jumping', jumpEyeY: 2.4 })
      expect(pose.y).toBe(2.4)
      expect(pose.pitch).toBeCloseTo(GAME3D.CAMERA.PITCH + GAME3D.CAMERA.JUMP_PITCH)
    })
  })

  describe('caída al agua', () => {
    it('desciende acelerando y avisa al tocar el agua', () => {
      const cam = new CameraController()
      cam.update(0.016, baseState)
      cam.startFall()

      let pose = cam.update(0.1, { ...baseState, phase: 'falling' })
      const firstY = pose.y
      expect(firstY).toBeLessThan(EYE_BASE)
      expect(pose.hitWater).toBe(false)

      // Tras suficiente tiempo de caída siempre acaba en el agua
      for (let i = 0; i < 100 && !pose.hitWater; i++) {
        pose = cam.update(0.05, { ...baseState, phase: 'falling' })
      }
      expect(pose.hitWater).toBe(true)
      expect(pose.y).toBe(GAME3D.CAMERA.WATER_EYE_Y)
    })

    it('gira hacia el lado al que se estaba inclinado', () => {
      const cam = new CameraController()
      // Inclinada a la derecha (balance positivo) al perder el equilibrio
      cam.update(0.016, { ...baseState, balancePosition: 0.5 })
      cam.startFall()
      const before = cam.update(0.016, { ...baseState, phase: 'falling' })
      const after = cam.update(0.5, { ...baseState, phase: 'falling' })
      // El roll aplicado es -roll interno: girando a la derecha se hace más negativo
      expect(after.roll).toBeLessThan(before.roll)
    })
  })

  describe('resultado (splash_done / done)', () => {
    it('nivela el roll despacio hacia 0', () => {
      const cam = new CameraController()
      cam.update(0.016, { ...baseState, balancePosition: 1 })
      const tilted = Math.abs(cam.update(0.016, { ...baseState, phase: 'splash_done' }).roll)
      const later = Math.abs(cam.update(0.2, { ...baseState, phase: 'splash_done' }).roll)
      expect(later).toBeLessThan(tilted)
    })

    it('sube el ojo por encima del oleaje para que no cruce el horizonte', () => {
      const cam = new CameraController()
      cam.update(0.016, baseState)
      cam.startFall()
      let pose
      for (let i = 0; i < 100; i++) {
        pose = cam.update(0.05, { ...baseState, phase: 'falling' })
        if (pose.hitWater) break
      }
      expect(pose.y).toBe(GAME3D.CAMERA.WATER_EYE_Y)
      for (let i = 0; i < 200; i++) {
        pose = cam.update(0.05, { ...baseState, phase: 'splash_done' })
      }
      expect(pose.y).toBeCloseTo(GAME3D.CAMERA.REST_EYE_Y, 2)
    })
  })

  describe('pausa', () => {
    it('congela la pose de cámara', () => {
      const cam = new CameraController()
      const before = cam.update(0.016, { ...baseState, balancePosition: 0.4, distance: 5 })
      const paused = cam.update(1, { ...baseState, phase: 'paused' })
      expect(paused.x).toBe(before.x)
      expect(paused.y).toBe(before.y)
      expect(paused.z).toBe(before.z)
    })
  })
})
