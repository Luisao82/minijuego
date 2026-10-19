// Panel LAB — calibración de los modos de control en vivo.
// SOLO existe en la build de laboratorio (__LAB__): src/main.js lo importa
// dentro de un `if (__LAB__)` que Vite elimina en producción, así que este
// archivo no llega al juego publicado.
//
// Excepción consciente a la regla de pixel art: es una herramienta interna
// que ningún jugador verá, hecha con HTML para poder ajustar cómodamente en
// el móvil entre partida y partida.

import { CONTROL_MODES, CONTROL_MODELS } from '../config/controlConfig'
import { controlSettingsService as settings } from '../services/ControlSettingsService'
import { controlInput } from '../input/ControlInput'
import { DeviceTiltSource } from '../input/DeviceTiltSource'
import { BoardTiltSource } from '../input/BoardTiltSource'
import { mapTiltToInput } from '../systems/AnalogBalanceSystem'

const REFRESH_MS = 100

const { FORCE, VELOCITY } = CONTROL_MODELS
const BOTH = [FORCE, VELOCITY]

// models: en qué tipo de control tiene efecto cada ajuste
const SLIDERS = [
  { key: 'deadZoneDeg', label: 'Zona muerta (°)', min: 0, max: 4, step: 0.25, models: BOTH },
  {
    key: 'maxTiltDeg',
    label: 'Inclinación para el máximo (°)',
    min: 3,
    max: 25,
    step: 0.5,
    models: BOTH,
  },
  { key: 'curve', label: 'Curva (1 = lineal)', min: 1, max: 3, step: 0.1, models: BOTH },
  {
    key: 'limitScale',
    label: 'Margen entre límites (×)',
    min: 1,
    max: 1.6,
    step: 0.05,
    models: BOTH,
  },
  { key: 'speed', label: 'Velocidad del cursor', min: 0.3, max: 3, step: 0.1, models: [VELOCITY] },
  {
    key: 'driftSpeed',
    label: 'Fuerza del drift',
    min: 0,
    max: 1.2,
    step: 0.05,
    models: [VELOCITY],
  },
  {
    key: 'driftChange',
    label: 'Cambios de sentido del drift',
    min: 0.2,
    max: 3,
    step: 0.1,
    models: [VELOCITY],
  },
  {
    key: 'driftGrowth',
    label: 'Aumento del drift por segundo',
    min: 0,
    max: 0.1,
    step: 0.005,
    models: [VELOCITY],
  },
  {
    key: 'driftScale',
    label: 'Fuerza del drift (×)',
    min: 0.2,
    max: 1.5,
    step: 0.05,
    models: [FORCE],
  },
  {
    key: 'growthScale',
    label: 'Aumento por cambio de lado (×)',
    min: 0,
    max: 1.5,
    step: 0.05,
    models: [FORCE],
  },
  { key: 'dampingExtra', label: 'Amortiguación extra', min: 0, max: 4, step: 0.1, models: [FORCE] },
  { key: 'sway', label: 'Vaivén del palo', min: 0, max: 4, step: 0.1, models: [FORCE] },
  {
    key: 'gravity',
    label: 'Gravedad (tira hacia fuera)',
    min: 0,
    max: 4,
    step: 0.05,
    models: BOTH,
  },
]

const MODE_LABELS = {
  [CONTROL_MODES.BUTTONS]: 'Botones',
  [CONTROL_MODES.DEVICE_TILT]: 'Girar el móvil',
  [CONTROL_MODES.BOARD]: 'Tabla (Bluetooth)',
}

const STYLE = `
#lab-toggle { position: fixed; top: 6px; left: 50%; transform: translateX(-50%); z-index: 1000;
  font: bold 13px monospace; background: #f2b33d; color: #1b1426; border: 3px solid #f4e9d8; padding: 4px 10px; }
#lab-panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(360px, 92vw); z-index: 1001;
  overflow-y: auto; background: #2a2040; color: #f4e9d8; border-left: 3px solid #f4e9d8;
  font: 13px monospace; padding: 10px; box-sizing: border-box; }
#lab-panel[hidden] { display: none; }
#lab-panel h2 { font-size: 14px; color: #f2b33d; margin: 0 0 8px; display: flex; justify-content: space-between; }
#lab-panel h3 { font-size: 12px; color: #a99bc2; margin: 12px 0 6px; text-transform: uppercase; }
#lab-panel button { font: inherit; background: #f2b33d; color: #1b1426; border: 2px solid #f4e9d8; padding: 5px 8px; margin: 2px 4px 2px 0; }
#lab-panel label { display: block; margin: 4px 0; }
#lab-panel input[type=range] { width: 100%; accent-color: #f2b33d; }
#lab-panel .live { display: flex; gap: 12px; }
#lab-panel .live b { color: #f2b33d; }
#lab-panel .msg { color: #a99bc2; min-height: 1em; }
#lab-panel textarea { width: 100%; height: 150px; font: 12px monospace; box-sizing: border-box; }
`

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props)
  children.forEach((child) => node.append(child))
  return node
}

export function mountLabPanel() {
  document.head.append(el('style', { textContent: STYLE }))

  const toggle = el('button', { id: 'lab-toggle', textContent: 'LAB' })
  const panel = el('div', { id: 'lab-panel', hidden: true })
  document.body.append(toggle, panel)
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden
    if (!panel.hidden) {
      syncModeRadios()
      refreshTuning()
    }
  })

  const message = el('div', { className: 'msg' })
  const say = (text) => (message.textContent = text)

  // ---------- Modo ----------
  const enableDeviceTilt = async () => {
    try {
      await controlInput.deviceTilt.enable()
      say('Sensor del móvil activo')
    } catch (err) {
      say(`Sensor: ${err.message}`)
    }
  }

  const modeRadios = Object.values(CONTROL_MODES).map((mode) => {
    const radio = el('input', { type: 'radio', name: 'lab-mode', value: mode })
    radio.checked = settings.getMode() === mode
    // El cambio de modo es un gesto del usuario: iOS permite pedir el permiso aquí
    radio.addEventListener('change', () => {
      settings.setMode(mode)
      if (mode === CONTROL_MODES.DEVICE_TILT) enableDeviceTilt()
      refreshTuning()
      say(`Modo: ${MODE_LABELS[mode]} (se aplica en la siguiente fase de equilibrio)`)
    })
    return el('label', {}, [radio, ` ${MODE_LABELS[mode]}`])
  })

  const syncModeRadios = () =>
    modeRadios.forEach((label) => {
      const radio = label.querySelector('input')
      radio.checked = radio.value === settings.getMode()
    })

  const sensorBtn = el('button', { textContent: 'Activar sensor del móvil' })
  sensorBtn.addEventListener('click', enableDeviceTilt)
  if (!DeviceTiltSource.isSupported()) sensorBtn.disabled = true

  const boardBtn = el('button', { textContent: 'Conectar tabla' })
  const boardStatus = el('span', { textContent: ' Desconectada' })
  boardBtn.addEventListener('click', async () => {
    try {
      await controlInput.board.connect()
    } catch (err) {
      say(`Tabla: ${err.message}`)
    }
  })
  if (!BoardTiltSource.isSupported()) {
    boardBtn.disabled = true
    boardStatus.textContent = ' Este navegador no tiene Bluetooth web (en iPhone no existe)'
  }

  const centerBtn = el('button', { textContent: 'Centrar ahora' })
  centerBtn.addEventListener('click', () => {
    if (controlInput.mode === CONTROL_MODES.DEVICE_TILT) controlInput.deviceTilt.calibrate()
    if (controlInput.mode === CONTROL_MODES.BOARD) controlInput.board.calibrate()
    say('Posición actual = recto')
  })

  // ---------- Lectura en vivo ----------
  const tiltOut = el('b', { textContent: '—' })
  const inputOut = el('b', { textContent: '—' })

  // ---------- Ajustes (de cada modo analógico por separado) ----------
  const tuningTitle = el('h3')
  const tuningSection = el('div')

  const modelRadios = [
    [FORCE, 'Fuerza (como los botones, con inercia)'],
    [VELOCITY, 'Velocidad (sin inercia, para el cuerpo)'],
  ].map(([model, label]) => {
    const radio = el('input', { type: 'radio', name: 'lab-model', value: model })
    radio.addEventListener('change', () => {
      settings.setTuning({ model })
      refreshTuning()
      say('Tipo de control cambiado (se aplica en la siguiente partida)')
    })
    return el('label', {}, [radio, ` ${label}`])
  })

  const sliderRows = SLIDERS.map(({ key, label, min, max, step, models }) => {
    const output = el('b')
    const input = el('input', { type: 'range', min, max, step })
    const row = el('label', {}, [`${label}: `, output, input])
    input.addEventListener('input', () => {
      settings.setTuning({ [key]: Number(input.value) })
      output.textContent = input.value
    })
    const refresh = (tuning) => {
      input.value = tuning[key]
      output.textContent = tuning[key]
      row.hidden = !models.includes(tuning.model)
    }
    return { row, refresh }
  })

  const invert = el('input', { type: 'checkbox' })
  invert.addEventListener('change', () => settings.setTuning({ invert: invert.checked }))

  function refreshTuning() {
    const analog = controlInput.isAnalog()
    tuningSection.hidden = !analog
    tuningTitle.textContent = analog
      ? `Calibración de: ${MODE_LABELS[settings.getMode()]}`
      : 'Elige "Girar el móvil" o "Tabla" para calibrar'
    if (!analog) return
    const tuning = settings.getTuning()
    modelRadios.forEach((label) => {
      const radio = label.querySelector('input')
      radio.checked = radio.value === tuning.model
    })
    sliderRows.forEach((s) => s.refresh(tuning))
    invert.checked = tuning.invert
  }

  const exportBox = el('textarea', { readOnly: true, hidden: true })
  const exportBtn = el('button', { textContent: 'Exportar' })
  exportBtn.addEventListener('click', async () => {
    exportBox.value = settings.exportTuning()
    exportBox.hidden = false
    try {
      await navigator.clipboard.writeText(exportBox.value)
      say('Copiado al portapapeles')
    } catch {
      exportBox.select()
      say('Selecciona el texto y cópialo')
    }
  })

  const resetBtn = el('button', { textContent: 'Restablecer este modo' })
  resetBtn.addEventListener('click', () => {
    settings.resetTuning()
    refreshTuning()
    say('Valores de config/controlConfig.js')
  })

  tuningSection.append(
    el('h3', { textContent: 'Tipo de control' }),
    ...modelRadios,
    el('h3', { textContent: 'Ajustes' }),
    ...sliderRows.map((s) => s.row),
    el('label', {}, [invert, ' Invertir sentido']),
    el('p', {
      className: 'msg',
      textContent:
        'La respuesta a la inclinación cambia al momento; la física, en la siguiente partida.',
    }),
    el('h3', { textContent: 'Guardar' }),
    exportBtn,
    resetBtn,
    exportBox
  )

  const closeBtn = el('button', { textContent: '✕' })
  closeBtn.addEventListener('click', () => (panel.hidden = true))

  panel.append(
    el('h2', {}, ['LAB · calibración', closeBtn]),
    message,
    el('h3', { textContent: 'Modo de control' }),
    ...modeRadios,
    sensorBtn,
    el('div', {}, [boardBtn, boardStatus]),
    el('h3', { textContent: 'En vivo' }),
    el('div', { className: 'live' }, [
      el('span', {}, ['Inclinación ', tiltOut]),
      el('span', {}, ['Fuerza ', inputOut]),
    ]),
    centerBtn,
    tuningTitle,
    tuningSection
  )
  refreshTuning()

  // Android no pide permiso: si el modo guardado es el del móvil, se activa solo
  const deviceTilt = controlInput.deviceTilt
  if (settings.getMode() === CONTROL_MODES.DEVICE_TILT) {
    if (DeviceTiltSource.isSupported() && !deviceTilt.needsPermission()) enableDeviceTilt()
    else say('Pulsa "Activar sensor del móvil" para empezar')
  }

  setInterval(() => {
    if (panel.hidden) return
    if (controlInput.isAnalog()) {
      // Fuera de la fase de equilibrio también se ve cómo respondería
      const tilt = controlInput.getTiltDeg()
      tiltOut.textContent = `${tilt.toFixed(1)}°`
      inputOut.textContent = mapTiltToInput(tilt, settings.getTuning()).toFixed(2)
    } else {
      tiltOut.textContent = '—'
      inputOut.textContent = controlInput.lastInput.toFixed(2)
    }
    if (BoardTiltSource.isSupported()) boardStatus.textContent = ` ${controlInput.board.statusText}`
  }, REFRESH_MS)
}
