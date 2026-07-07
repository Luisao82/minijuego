import { BaseScene } from './BaseScene'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { COLOR_GOLD, COLOR_GOLD_LIGHT, COLOR_ORANGE } from '../config/fonts'
import { headingStyle, uiLabelStyle } from '../config/textStyles'
import { makeNavButton } from '../components/NavButton'
import privacyMarkdown from '../../../PRIVACY.md?raw'

// Política de privacidad dentro de la app.
//
// El markdown fuente (`PRIVACY.md`, único documento de verdad) se importa
// en tiempo de build con `?raw` de Vite y queda embebido en el bundle:
// la escena no depende de red ni de un hosting externo. Un mini-parser de
// markdown lo convierte en objetos gráficos de Phaser con scroll táctil
// y por rueda.

// ── Panel ─────────────────────────────────────────────────────
const AMBER = 0xd4a520
const PANEL_BG = 0x0d0600
const PANEL_DIM = 0x000000

const M = 16
const PANEL_X = M
const PANEL_Y = 112
const PANEL_W = GAME_WIDTH - M * 2
const PANEL_H = GAME_HEIGHT - PANEL_Y - M

const CONTENT_MARGIN_X = 36
const CONTENT_MARGIN_Y = 24
const CONTENT_X = PANEL_X + CONTENT_MARGIN_X
const CONTENT_Y_TOP = PANEL_Y + CONTENT_MARGIN_Y
const CONTENT_W = PANEL_W - CONTENT_MARGIN_X * 2
const CONTENT_H = PANEL_H - CONTENT_MARGIN_Y * 2

// ── Estilos de texto (override de stroke '#000000' vs PIXEL_STROKE_DARK) ──
const STYLE_H2 = { ...uiLabelStyle(18, COLOR_GOLD, 4), stroke: '#000000', letterSpacing: 3 }
const STYLE_H3 = { ...uiLabelStyle(14, COLOR_GOLD_LIGHT, 3), stroke: '#000000', letterSpacing: 2 }
const STYLE_META = {
  ...headingStyle(20, COLOR_GOLD_LIGHT, 2),
  stroke: '#000000',
  fontStyle: 'italic',
}
const STYLE_TEXT = {
  ...headingStyle(22, '#f0d99a', 2),
  stroke: '#000000',
  wordWrap: { width: CONTENT_W },
  lineSpacing: 4,
}
const STYLE_LIST = { ...STYLE_TEXT, wordWrap: { width: CONTENT_W - 24 } }
const STYLE_HR_COLOR = AMBER

// Espaciados verticales tras cada tipo de elemento (px).
const GAP_AFTER_H2 = 12
const GAP_AFTER_H3 = 10
const GAP_AFTER_META = 20
const GAP_AFTER_PARAGRAPH = 14
const GAP_AFTER_LIST_ITEM = 4
const GAP_AFTER_LIST = 14
const GAP_AFTER_HR = 22

// Velocidad del scroll con rueda (px por tick).
const WHEEL_SCROLL_SPEED = 30

export class PrivacyScene extends BaseScene {
  constructor() {
    super(SCENES.PRIVACY)
  }

  create() {
    this.drawBackground()
    this.drawHeader()
    this.drawPanel()
    this.buildScrollableContent()
    this.drawBackButton()
    this.setupInput()
  }

  drawBackground() {
    if (this.textures.exists('bg-menu') && this.textures.get('bg-menu').key !== '__MISSING') {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu')
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height))
    } else {
      this.add.graphics().fillStyle(0x0a0800, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }
    this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  drawHeader() {
    this.add
      .text(GAME_WIDTH / 2, 24, 'La Cucaña Trianera', headingStyle(40, COLOR_ORANGE, 5))
      .setOrigin(0.5, 0)
      .setDepth(3)

    this.add
      .text(GAME_WIDTH / 2, 72, 'POLÍTICA DE PRIVACIDAD', {
        ...uiLabelStyle(18, COLOR_GOLD, 4),
        stroke: '#000000',
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(3)
  }

  drawPanel() {
    const g = this.add.graphics().setDepth(1)
    g.fillStyle(PANEL_DIM, 0.5)
    g.fillRect(PANEL_X + 4, PANEL_Y + 4, PANEL_W, PANEL_H)
    g.fillStyle(PANEL_BG, 0.82)
    g.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    g.lineStyle(3, AMBER, 1)
    g.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
    g.lineStyle(1, AMBER, 0.22)
    g.strokeRect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, PANEL_H - 10)

    const cLen = 14
    const corners = [
      [PANEL_X + 3, PANEL_Y + 3, 1, 1],
      [PANEL_X + PANEL_W - 3, PANEL_Y + 3, -1, 1],
      [PANEL_X + 3, PANEL_Y + PANEL_H - 3, 1, -1],
      [PANEL_X + PANEL_W - 3, PANEL_Y + PANEL_H - 3, -1, -1],
    ]
    g.lineStyle(2, AMBER, 0.95)
    corners.forEach(([cx, cy, sx, sy]) => {
      g.lineBetween(cx, cy, cx + cLen * sx, cy)
      g.lineBetween(cx, cy, cx, cy + cLen * sy)
    })
  }

  // ── Contenido con scroll ────────────────────────────────────
  //
  // Se construye un container que agrupa todos los objetos del markdown
  // renderizado y se le aplica una máscara al recorte visible del panel.
  // El pointer/rueda mueven el `y` del container.
  buildScrollableContent() {
    this._contentContainer = this.add.container(0, 0).setDepth(2)

    const blocks = parseMarkdown(privacyMarkdown)
    const contentHeight = this.renderBlocks(this._contentContainer, blocks)

    // Máscara: recorta el container al área interior del panel.
    const maskShape = this.make
      .graphics({ x: 0, y: 0, add: false })
      .fillStyle(0xffffff)
      .fillRect(CONTENT_X - 10, CONTENT_Y_TOP - 6, CONTENT_W + 20, CONTENT_H + 12)
    this._contentContainer.setMask(maskShape.createGeometryMask())

    // Scroll: se guarda el máximo desplazamiento permitido.
    this._scrollY = 0
    this._scrollMax = Math.max(0, contentHeight - CONTENT_H)

    // Interacción sobre el área del panel — arrastre táctil / drag de ratón.
    const hit = this.add
      .zone(PANEL_X, PANEL_Y, PANEL_W, PANEL_H)
      .setOrigin(0)
      .setInteractive({ draggable: true })
    let dragStartY = 0
    let dragStartScroll = 0
    hit.on('pointerdown', (pointer) => {
      dragStartY = pointer.y
      dragStartScroll = this._scrollY
    })
    hit.on('pointermove', (pointer) => {
      if (!pointer.isDown) return
      const delta = pointer.y - dragStartY
      this.setScroll(dragStartScroll - delta)
    })

    // Scroll por rueda (útil en web / trackpads).
    this.input.on('wheel', (_pointer, _objs, _dx, dy) => {
      this.setScroll(this._scrollY + Math.sign(dy) * WHEEL_SCROLL_SPEED)
    })

    // Indicador visual del scroll a la derecha del panel.
    this._scrollHint = this.add.graphics().setDepth(4)
    this.redrawScrollHint()
  }

  setScroll(y) {
    this._scrollY = Math.max(0, Math.min(this._scrollMax, y))
    this._contentContainer.y = -this._scrollY
    this.redrawScrollHint()
  }

  redrawScrollHint() {
    if (!this._scrollHint || this._scrollMax <= 0) {
      this._scrollHint?.clear()
      return
    }
    const trackX = PANEL_X + PANEL_W - 14
    const trackY = CONTENT_Y_TOP
    const trackH = CONTENT_H
    const knobH = Math.max(30, (CONTENT_H / (this._scrollMax + CONTENT_H)) * CONTENT_H)
    const knobY = trackY + (this._scrollY / this._scrollMax) * (trackH - knobH)
    this._scrollHint.clear()
    this._scrollHint.fillStyle(0x000000, 0.4).fillRect(trackX, trackY, 4, trackH)
    this._scrollHint.fillStyle(AMBER, 0.9).fillRect(trackX, knobY, 4, knobH)
  }

  // Renderiza la lista de bloques markdown como objetos Phaser
  // dentro del container. Devuelve la altura total ocupada.
  renderBlocks(container, blocks) {
    let y = CONTENT_Y_TOP
    for (const block of blocks) {
      switch (block.type) {
        case 'h1':
          // El H1 del documento es el título de la escena — se ignora.
          break
        case 'h2': {
          const t = this.add.text(CONTENT_X, y, block.text.toUpperCase(), STYLE_H2)
          container.add(t)
          y += t.height + GAP_AFTER_H2
          break
        }
        case 'h3': {
          const t = this.add.text(CONTENT_X, y, block.text.toUpperCase(), STYLE_H3)
          container.add(t)
          y += t.height + GAP_AFTER_H3
          break
        }
        case 'meta': {
          const t = this.add.text(CONTENT_X, y, block.text, STYLE_META)
          container.add(t)
          y += t.height + GAP_AFTER_META
          break
        }
        case 'paragraph': {
          const t = this.add.text(CONTENT_X, y, block.text, STYLE_TEXT)
          container.add(t)
          y += t.height + GAP_AFTER_PARAGRAPH
          break
        }
        case 'list': {
          for (const item of block.items) {
            const bullet = this.add.text(CONTENT_X, y, '•', STYLE_TEXT)
            const text = this.add.text(CONTENT_X + 22, y, item, STYLE_LIST)
            container.add([bullet, text])
            y += Math.max(bullet.height, text.height) + GAP_AFTER_LIST_ITEM
          }
          y += GAP_AFTER_LIST
          break
        }
        case 'hr': {
          const line = this.add.graphics()
          line.lineStyle(1, STYLE_HR_COLOR, 0.35)
          line.lineBetween(CONTENT_X, y, CONTENT_X + CONTENT_W, y)
          container.add(line)
          y += GAP_AFTER_HR
          break
        }
      }
    }
    return y - CONTENT_Y_TOP
  }

  drawBackButton() {
    makeNavButton(this, 12, 12, 200, 58, 'VOLVER', () => this.scene.start(SCENES.LICENSES), {
      depth: 5,
    })
  }

  setupInput() {
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.LICENSES))
  }
}

// ── Mini-parser de markdown ─────────────────────────────────
//
// Convierte el markdown de PRIVACY.md en una lista simple de bloques.
// Solo cubre lo que usamos en el documento: h1/h2/h3, párrafos, listas
// con guiones, separador ---, negritas (**), énfasis (_..._), código
// inline (`...`) y links [texto](url). La riqueza tipográfica se
// simplifica a texto plano — para no complicar el render Phaser — pero
// se preserva la estructura.
function parseMarkdown(src) {
  const lines = src.split('\n')
  const blocks = []
  let i = 0
  let paragraph = []
  let list = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({ type: 'paragraph', text: flattenInline(paragraph.join(' ').trim()) })
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    blocks.push(list)
    list = null
  }

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()

    if (line === '') {
      flushParagraph()
      flushList()
      i++
      continue
    }

    if (line === '---') {
      flushParagraph()
      flushList()
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    let m
    if ((m = line.match(/^# +(.+)$/))) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h1', text: flattenInline(m[1]) })
      i++
      continue
    }
    if ((m = line.match(/^## +(.+)$/))) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h2', text: flattenInline(m[1]) })
      i++
      continue
    }
    if ((m = line.match(/^### +(.+)$/))) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h3', text: flattenInline(m[1]) })
      i++
      continue
    }

    // "**Última actualización:** ..." al inicio del documento — meta.
    if (line.match(/^\*\*(?:Última actualización|Versión).*\*\* +(.+)$/)) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'meta', text: flattenInline(line) })
      i++
      continue
    }

    if ((m = line.match(/^- +(.+)$/))) {
      flushParagraph()
      if (!list) list = { type: 'list', items: [] }
      // Continuación de item multi-línea: mientras siguiente línea empiece con "  ", unirla.
      let itemText = m[1]
      while (i + 1 < lines.length && lines[i + 1].match(/^\s{2,}\S/)) {
        i++
        itemText += ' ' + lines[i].trim()
      }
      list.items.push(flattenInline(itemText))
      i++
      continue
    }

    // Línea de párrafo — si veníamos de una lista, la cerramos primero.
    flushList()
    paragraph.push(line)
    i++
  }
  flushParagraph()
  flushList()
  return blocks
}

// Convierte las marcas inline (negritas, énfasis, links, código inline)
// a texto plano. Preservar el rich text con Phaser Text es caro; para el
// caso de una política de privacidad basta con dejar el contenido claro.
function flattenInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **negrita**
    .replace(/_(.+?)_/g, '$1') // _cursiva_
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // [texto](url)
    .replace(/<([^>]+)>/g, '$1') // <url>
    .replace(/`([^`]+)`/g, '$1') // `código`
}
