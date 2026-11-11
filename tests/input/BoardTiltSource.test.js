import { BoardTiltSource } from '../../src/game/input/BoardTiltSource'

const packet = (overrides = {}) => ({
  tilt: 0,
  sensorError: false,
  presses: 0,
  flagPresent: true,
  grabs: 0,
  ...overrides,
})

describe('BoardTiltSource — bandera física', () => {
  it('avisa cuando sube el contador de banderas cogidas, no con el primer paquete', () => {
    const onFlagGrab = vi.fn()
    const board = new BoardTiltSource({ onFlagGrab })
    board._handlePacket(packet({ grabs: 4 }), 0)
    expect(onFlagGrab).not.toHaveBeenCalled()
    board._handlePacket(packet({ grabs: 5 }), 20)
    expect(onFlagGrab).toHaveBeenCalledTimes(1)
  })

  it('sin firmware de bandera (grabs null) nunca avisa', () => {
    const onFlagGrab = vi.fn()
    const board = new BoardTiltSource({ onFlagGrab })
    board._handlePacket(packet({ grabs: null }), 0)
    board._handlePacket(packet({ grabs: null }), 20)
    expect(onFlagGrab).not.toHaveBeenCalled()
  })

  it('solo hay bandera física con la característica, datos recientes y el palo puesto', () => {
    const board = new BoardTiltSource()
    board.connection.flagChar = {}
    board._handlePacket(packet({ flagPresent: true }), performance.now())
    expect(board.hasPhysicalFlag()).toBe(true)

    board._handlePacket(packet({ flagPresent: false }), performance.now())
    expect(board.hasPhysicalFlag()).toBe(false)

    board.connection.flagChar = null
    board._handlePacket(packet({ flagPresent: true }), performance.now())
    expect(board.hasPhysicalFlag()).toBe(false)
  })
})
