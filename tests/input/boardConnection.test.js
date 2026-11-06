import { parsePacket } from '../../src/game/input/boardConnection'

const packet = (bytes) => new DataView(new Uint8Array(bytes).buffer)

// seq 1 · tilt -2,5° · flags · presses 3 · echo 7 · millis
const BASE = [1, 0, 0x06, 0xff, 0, 3, 7, 0, 0, 0, 0, 0]

describe('parsePacket', () => {
  it('lee el paquete de 12 bytes de la tabla sin bandera', () => {
    const p = parsePacket(packet(BASE))
    expect(p.seq).toBe(1)
    expect(p.tilt).toBe(-2.5)
    expect(p.presses).toBe(3)
    expect(p.echo).toBe(7)
    expect(p.grabs).toBeNull()
    expect(p.flagPresent).toBe(false)
  })

  it('lee los bits y el contador de la bandera del paquete de 13 bytes', () => {
    const bytes = [...BASE, 5]
    bytes[4] = 0x01 | 0x04 | 0x08
    const p = parsePacket(packet(bytes))
    expect(p.buttonDown).toBe(true)
    expect(p.sensorError).toBe(false)
    expect(p.flagPresent).toBe(true)
    expect(p.flagCycling).toBe(true)
    expect(p.grabs).toBe(5)
  })
})
