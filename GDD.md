# 🎮 Cucaña Trianera — Game Design Document (GDD)

> Guía de referencia para el desarrollo del juego. Se irá ampliando fase a fase.

---

## 📋 Información general

- **Nombre del juego:** Cucaña Trianera
- **Género:** Minijuego arcade / casual móvil
- **Estilo visual:** Pixel art retro 16-bit
- **Motor:** Phaser.js + JavaScript
- **Inspiración cultural:** La Cucaña de la Velá de Santa Ana (Triana, Sevilla)
- **Plataforma objetivo:** Móvil (táctil)

---

## 🎯 Concepto del juego

El jugador debe atravesar un palo engrasado sobre el río Guadalquivir para alcanzar la bandera al final. La experiencia se divide en fases secuenciales que simulan el desafío real de la cucaña tradicional trianera.

---

## 🕹️ Sistema de juego — Fases

---

### FASE 1 — Impulso inicial ("La carrera")

**Descripción:**
Antes de que el personaje empiece a avanzar por la cucaña, el jugador debe pulsar un botón para detener una barra de poder horizontal. El valor donde se detenga determina la **velocidad/distancia inicial** del personaje en la cucaña.

**Mecánica de la barra:**

| Parámetro | Detalle |
|---|---|
| Orientación | Horizontal (izquierda → derecha) |
| Comportamiento | Empieza lenta y va **acelerando progresivamente** |
| Reset | Al llegar al final, vuelve a empezar desde cero (y vuelve a acelerar) |
| Límite de intentos | **Máximo 3 pasadas**. Si el jugador no pulsa, el tiempo se acaba |
| Interacción | El jugador pulsa **1 vez** para detener la barra |

**Zonas de la barra:**

| Zona | Color | Posición | Resultado |
|---|---|---|---|
| Mala | 🔴 Rojo | Inicio (izquierda) | Poca distancia, difícil llegar a la bandera |
| Regular | 🟡 Amarillo | Centro | Distancia media |
| Óptima | 🟢 Verde | Final (derecha) | Máxima distancia, mejor oportunidad de llegar |

> ⚠️ La zona verde está al final, lo que obliga al jugador a **arriesgarse** dejando pasar las zonas roja y amarilla mientras la barra acelera.

**Influencia del peso del personaje:**

| Peso del personaje | Efecto en la barra |
|---|---|
| Ligero | La barra acelera más despacio → más tiempo para reaccionar |
| Pesado | La barra acelera más rápido → más difícil parar en la zona verde |

**Presentación visual:**
- El personaje ya es **visible en pantalla** al inicio de esta fase
- La cucaña y el fondo del río Guadalquivir con Triana son visibles de fondo
- La barra de poder se muestra superpuesta en la parte inferior o central de la pantalla

**Resultado de la fase:**
El valor donde el jugador detenga la barra se convierte en el parámetro **velocidad inicial**, que determina hasta dónde puede llegar el personaje en la cucaña antes de que intervengan las demás mecánicas.

---

### FASE 2 — Travesía por el palo ("El equilibrio")

**Descripción:**
Una vez obtenido el impulso inicial, el personaje empieza a avanzar por la cucaña. El jugador debe mantener el equilibrio pulsando dos botones (izquierda y derecha) para evitar caer al río. La distancia máxima alcanzable depende del impulso de la Fase 1.

**Mecánica de la barra de equilibrio:**

| Parámetro | Detalle |
|---|---|
| Orientación | Horizontal, centrada en pantalla |
| Centro | Marca de equilibrio perfecto |
| Comportamiento | La barra se desvía sola hacia un lado u otro aleatoriamente |
| Control | Botón izquierda / botón derecha para corregir la desviación |
| Restricción | **No se pueden mantener los dos botones pulsados a la vez** |

**Lógica de control:**
- Si la barra se desvía hacia la derecha → el jugador debe pulsar **izquierda** para corregir
- Si el jugador pulsa demasiado tiempo un botón → la barra empieza a desviarse en esa dirección
- El objetivo es mantener la barra lo más cerca posible del centro

**Sistema de límites (zona segura):**

| Marca | Descripción |
|---|---|
| ⚪ Centro | Equilibrio perfecto — el personaje avanza sin problema |
| 🟠 Límite izquierdo | Punto de caída si la barra llega aquí |
| 🟠 Límite derecho | Punto de caída si la barra llega aquí |

> La **distancia entre el centro y los límites** depende del atributo **equilibrio** del personaje. Alto equilibrio = zona segura más amplia. Bajo equilibrio = límites muy cerca del centro.

**Consecuencia:** Si la barra toca cualquiera de los dos límites → el personaje **cae al río** inmediatamente.

**Sistema de impulso ("La gasolina"):**

El impulso de la Fase 1 actúa como gasolina durante la travesía. No hay barra visible — el jugador lo percibe por la velocidad del personaje.

| Estado del impulso | Comportamiento del personaje |
|---|---|
| Impulso alto | Avanza rápido por el palo |
| Impulso medio | Avanza a velocidad moderada |
| Impulso bajo | Avanza muy despacio, casi parado |
| Impulso = 0 | Se queda parado unos segundos → cae al río |

> El personaje desacelera progresivamente conforme consume el impulso. Si se agota antes de llegar a la bandera, se detiene, aguanta unos segundos y cae al agua — aunque vaya perfecto de equilibrio.

**Causas de caída al río en Fase 2:**
- La barra de equilibrio toca uno de los límites laterales
- El impulso llega a 0 y el personaje se queda parado

**Relación impulso → dificultad de equilibrio:**

| Resultado Fase 1 | Efecto en Fase 2 |
|---|---|
| Zona verde (óptima) | Va más rápido → barra se desestabiliza más rápido → más difícil |
| Zona amarilla (regular) | Velocidad media → dificultad media |
| Zona roja (mala) | Va lento → más fácil el equilibrio, pero puede no llegar a la bandera |

**Sistema de aceite:**

Afecta de dos formas simultáneas:
1. **La barra de equilibrio se desvía más rápido** (más resbaladizo)
2. **El personaje avanza más rápido** por el palo (menos tiempo de reacción)

| Parámetro | Detalle |
|---|---|
| Estado inicial | 100% de aceite |
| Consumo | Disminuye con cada intento |
| Recarga | Automática cuando baja del **20%** |
| Indicador visual | Nivel de aceite visible en pantalla en todo momento |

**Atributos del personaje que intervienen:**

| Atributo | Efecto |
|---|---|
| Equilibrio | Amplitud de la zona segura (distancia centro-límites) |
| Peso | Velocidad de desestabilización de la barra |

**Presentación visual:**
- Barra de equilibrio centrada con marca central y límites visibles
- Botones izquierda y derecha accesibles con los pulgares
- Indicador de nivel de aceite visible
- El personaje se ve avanzando (y frenando) sobre el palo sobre el río

**Resultado de la fase:**
El jugador llega a la posición máxima según su impulso si mantiene el equilibrio. Si cae por desequilibrio o por agotar el impulso, la distancia es menor. Esta posición determina si hay opción de llegar a la bandera.

---

### FASE 3 — El salto final ("La bandera")

**Descripción:**
En cualquier momento durante la travesía, el jugador puede pulsar el botón de salto. El salto es **irreversible** — en cuanto se pulsa, el personaje abandona el palo y cae al agua sí o sí, salvo que agarre la bandera.

> 🎭 Nota cultural: En la cucaña real, todo el mundo acaba en el agua — con bandera o sin ella. El juego respeta esta tradición: **siempre se cae al río**, la victoria es caer con la bandera en la mano.

**Mecánica del salto:**

| Parámetro | Detalle |
|---|---|
| Activación | Pulsar y mantener el botón de salto |
| Irreversibilidad | En cuanto se pulsa, el personaje suelta el palo — no hay vuelta atrás |
| Éxito | Soltar el botón dentro de la ventana de acierto cuando el personaje toca la bandera |
| Fallo (muy pronto) | Salta demasiado lejos → no llega a la bandera → cae al río |
| Fallo (timing) | Suelta antes o después de la ventana de acierto → no agarra → cae al río |
| Feedback visual | La bandera **parpadea o se ilumina** cuando el personaje la toca |

**Formas de coger la bandera:**

| Forma | Descripción |
|---|---|
| Con salto | El jugador pulsa salto cerca de la bandera y suelta en el momento exacto |
| Sin salto | El personaje llega a la bandera con el impulso y equilibrio → la coge al pasar |

En ambos casos el personaje **cae al agua con la bandera** → ¡victoria!

**Variables de balanceo (ajustar en fase de pruebas):**

```js
// Distancia del salto como % de la distancia total de la cucaña
const JUMP_DISTANCE_PERCENTAGE = 0.15; // valor inicial: 15%

// Ventana de tiempo para soltar y agarrar la bandera con éxito
const JUMP_SUCCESS_WINDOW_MS = 300; // valor inicial: 300ms
```

**Influencia del peso en el salto:**

| Peso del personaje | Distancia del salto |
|---|---|
| Ligero | Salto más largo → mayor margen para alcanzar la bandera |
| Pesado | Salto más corto → necesita estar más cerca para poder agarrarla |

**Flujo completo de una partida:**

1. **Fase 1** → El jugador para la barra → obtiene impulso (rojo / amarillo / verde)
2. **Fase 2** → El jugador mantiene el equilibrio mientras el personaje avanza y frena progresivamente
3. **Fase 3 (opción A)** → El personaje llega a la bandera por impulso → la coge → cae al agua con ella → ¡victoria!
4. **Fase 3 (opción B)** → El jugador pulsa salto cerca de la bandera → suelta en el momento exacto → cae al agua con ella → ¡victoria!
5. **Derrota** → El personaje cae al agua sin bandera (por desequilibrio, impulso agotado, o salto fallido)

**Presentación visual:**
- Botón de salto visible en pantalla durante toda la Fase 2 (siempre disponible)
- Animación de salto del personaje hacia la bandera
- La bandera parpadea / se ilumina en la ventana de acierto
- Animación de victoria: personaje cae al agua con la bandera 🎉
- Animación de derrota: personaje cae al agua sin bandera 💦

---

## 👁️ Selector de perspectiva (Triana / Sevilla)

Antes de elegir personaje, el jugador puede escoger desde qué orilla ver la cucaña.

### Flujo de pantallas actualizado

```
MenuScene → [JUGAR] → ViewSelectScene → CharacterSelectScene → GameScene
```

Si la partida se reinicia sin pasar por `ViewSelectScene` (p.ej. desde Game Over directo), se usa la última perspectiva guardada en `localStorage` (clave: `cucana_perspective`).

### Las dos perspectivas

| Parámetro             | Triana                          | Sevilla                          |
|-----------------------|---------------------------------|----------------------------------|
| Fondo                 | `fondo_a.png`                   | `fondo_b.png`                    |
| Barco                 | Orilla derecha                  | Orilla izquierda                 |
| Dirección del palo    | Derecha → izquierda             | Izquierda → derecha              |
| Escala elementos      | 100%                            | 80% (sensación de distancia)     |
| Posición vertical     | Normal                          | Ligeramente más arriba           |
| Sprites (flipX)       | Normal                          | Espejados horizontalmente        |
| Controles             | Sin cambios                     | Sin cambios (lógica idéntica)    |

### Parámetros ajustables (`perspectiveConfig.js`)

```js
const SEVILLA_SCALE    = 0.80   // tamaño de elementos respecto a Triana
const SEVILLA_Y_OFFSET = -30    // px hacia arriba (negativo = sube)
```

### ViewSelectScene — Pantalla de selección

- Título: "ELIGE TU VISTA"
- Dos fichas estilo CharacterCard:
  - **Triana** → thumbnail de `fondo_a.png`
  - **Sevilla** → thumbnail de `fondo_b.png`
- La ficha de la perspectiva guardada aparece pre-seleccionada
- Al elegir → guarda en `localStorage` → pasa a `CharacterSelectScene`

---

## 🎨 Diseño Visual de la Pantalla de Juego

### Escena general

| Parámetro | Detalle |
|---|---|
| Perspectiva | Horizontal — vista lateral desde la Calle Betis (Triana) o desde Sevilla |
| Dirección del personaje | Derecha → izquierda (Triana) / Izquierda → derecha (Sevilla) |
| Momento del día | Día soleado, cielo azul mediterráneo |
| Cámara | Fija — toda la escena visible desde el inicio |
| Estética | Pixel art con paleta de colores limitada (estilo libre) |

### Fondo (imagen estática)

El fondo es una **imagen estática en pixel art** creada manualmente. Representa la vista desde la Calle Betis mirando hacia Sevilla, con:
- 🏛️ La Giralda visible en el horizonte
- 🐂 La Plaza de Toros
- 🌊 El río Guadalquivir — animación suave del agua generada en código
- ⛵ Un barco estático a la derecha — plataforma base de la cucaña
- 🌅 Cielo azul mediterráneo

**Proporciones de referencia:**
- Cucaña: ~6-7 metros de largo
- Barco base: ~8-9 metros

### La cucaña (palo)

- Generada **en código** (no como imagen)
- Oscilación suave animada para simular el movimiento real
- Horizontal, de derecha a izquierda (desde el barco hacia la bandera)

### Personaje principal

| Parámetro | Detalle |
|---|---|
| Tamaño sprite | ~32x32 px (estilo NES/SNES) |
| Generación | Dinámico — objeto independiente creado en código |

**Personajes definidos:**

| Personaje | Rasgos visuales |
|---|---|
| El Trianero | Traje chaqueta |
| La Abuela | Pelo blanco, vestido negro |
| El Chaval | Canijo, sin camiseta |
| Otros | Definibles por objeto de configuración |

**Animaciones del personaje:**

| Animación | Cuándo se activa |
|---|---|
| `walk` | Avanzando por el palo |
| `wobble` | Desequilibrio |
| `fall` | Caída al agua |
| `jump` | Salto hacia la bandera |
| `celebrate` | Coge la bandera |

> En v0.1 todas las animaciones se generan en código (sin imágenes externas) para afinar la jugabilidad antes de invertir en arte.

**Efecto de caída:** salpicadura animada en código al tocar el agua.

### Espectadores

- **Primer plano:** a ambos lados de la orilla, de espaldas a la cámara
- **Fondo:** detrás del barco, en la orilla opuesta
- Número **aleatorio** por partida
- Varios tipos de personaje diferentes
- Movimiento suave y no llamativo
- Cada espectador es un **objeto independiente**
- Zonas de aparición se definirán durante el desarrollo

> 💡 Idea futura: barquito con espectadores pasando por el río

---

## 🏗️ Arquitectura del Código

### Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `GameScene.js` | Escena principal Phaser — orquesta todo |
| `GameLogic.js` | Lógica del juego (fases, físicas, estado) |
| `Renderer.js` | Todo lo visual (fondo, animaciones, efectos) |
| `CharacterManager.js` | Gestión de personajes y espectadores |
| `GDD.md` | Guía de referencia del desarrollo |

### Principio clave

> **La lógica no sabe nada del visual, y el visual no decide nada de la lógica.**
> `GameLogic.js` calcula el estado. `Renderer.js` lo pinta. `CharacterManager.js` gestiona los objetos personaje.

### Estrategia de versiones

| Versión | Objetivo |
|---|---|
| v0.1 | Jugabilidad funcionando — gráficos simples (rectángulos, colores básicos) |
| v0.2 | Personajes con sprites pixel art definidos |
| v0.3 | Fondo pixel art integrado + animaciones pulidas |
| v1.0 | Versión completa con arte final y balanceo ajustado |

---

> 🔧 *Pantalla de resultados por definir...*

---

## 🏆 Pantalla de Resultados

### Dos estados posibles

---

#### Estado A — Derrota (no coge la bandera)

**Cuándo aparece:** El personaje cae al agua sin bandera (por desequilibrio, impulso agotado o salto fallido).

**Contenido de la pantalla:**
- Mensaje tipo "¡Lo siento! Vuelve a intentarlo"
- Listado de premios conseguidos durante la sesión actual
- Botón **"Volver a jugar"**

La pantalla se queda esperando hasta que el jugador pulse el botón.

---

#### Estado B — Victoria (coge la bandera)

**Cuándo aparece:** El personaje cae al agua con la bandera (con o sin salto).

**Contenido de la pantalla:**
- Mensaje tipo "¡Enhorabuena, lo has conseguido!"
- **Premio ganado destacado** (imagen grande + nombre)
- Listado pequeño de premios anteriores acumulados en la sesión
- Botón **"Volver a jugar"**

La pantalla se queda esperando hasta que el jugador pulse el botón.

---

### Sistema de premios

**Fuente de datos:** fichero `premios.json` — creado y mantenido manualmente.

**Estructura del JSON:**

```json
[
  {
    "id": "premio_01",
    "nombre": "Turrón de Triana",
    "imagen": "assets/premios/turron.png",
    "probabilidad": 0.3
  },
  {
    "id": "premio_02",
    "nombre": "Mantecado Sevillano",
    "imagen": "assets/premios/mantecado.png",
    "probabilidad": 0.2
  }
]
```

> La probabilidad es opcional en v1 pero se deja en el JSON para uso futuro. Por ahora la selección es **aleatoria** entre todos los premios disponibles.

**Selección del premio:**
- Totalmente aleatoria entre todos los premios del JSON
- Puede repetirse un mismo premio en la misma sesión

**Evolución futura:**
- Panel de control para gestionar premios sin editar el JSON manualmente
- Uso real de la probabilidad para premios más o menos frecuentes

---

### Persistencia de premios (v1)

| Parámetro | Detalle |
|---|---|
| Almacenamiento | Solo en memoria de sesión (sin base de datos ni usuarios) |
| Duración | Se mantiene mientras no se refresque ni cierre el navegador |
| Persistencia real | No implementada en v1 — siguiente paso en el roadmap |

> Los premios se acumulan durante la sesión y se muestran en pantalla, pero no se guardan físicamente en ningún sitio en esta versión.

---

### Flujo completo de pantallas

```
Inicio → Selección de personaje → Juego (Fases 1-2-3)
    ↓                                      ↓
  [Victoria]                          [Derrota]
    ↓                                      ↓
Pantalla victoria               Pantalla derrota
(premio + lista)                (lista premios)
    ↓                                      ↓
         ← ← Volver a jugar → →
```

---

## 👤 Personajes

Definidos en `src/game/config/characters.js`. Todos aparecen en el carrusel de selección. El estado de desbloqueo lo gestiona `UnlockService` vía `localStorage`.

**Trianero y Flamenca están siempre desbloqueados** por defecto, incluso en navegadores nuevos sin historial previo.

### Tabla de personajes

| # | ID         | Nombre            | Peso | Equilibrio | Altura | Edad | Estado inicial   |
|---|------------|-------------------|------|------------|--------|------|------------------|
| 1 | `trianero` | EL TRIANERO       | 5    | 4          | 5      | 5    | Siempre activo   |
| 2 | `flamenca` | LA FLAMENCA       | 4    | 6          | 5      | 5    | Siempre activo   |
| 3 | `abuela`   | LA AGÜELA         | 10   | 8          | 4      | 9    | Bloqueado        |
| 4 | `chaval`   | ER CHAVAL         | 3    | 4          | 3      | 2    | Bloqueado        |
| 5 | `guiri`    | EL GUIRI          | 4    | 1          | 5      | 5    | Bloqueado        |
| 6 | `retro01`  | Retro 01          | 2    | 9          | 3      | 9    | Bloqueado        |
| 7 | `retro02`  | Retro 02          | 2    | 9          | 3      | 9    | Bloqueado        |
| 8 | `retro03`  | Retro 03          | 2    | 9          | 3      | 9    | Bloqueado        |

### Comportamiento en carrusel

- Los personajes bloqueados se muestran **solo con candado y pista**. No se muestra su imagen ni nombre hasta que se desbloquean.
- Al desbloquearse, se muestra la ficha del personaje (`CharacterUnlockScene`) antes de volver al juego.

---

## 🔓 Sistema de desbloqueo de personajes

Configurado en `public/assets/characters-unlock.json`.

### Tipos de condición

| Tipo              | Descripción                                                          |
|-------------------|----------------------------------------------------------------------|
| `specific_reward` | Se desbloquea al conseguir un premio concreto (`rewardId`)           |
| `total_rewards`   | Se desbloquea al acumular N premios en total, de cualquier tipo      |

### Condiciones actuales

| Personaje  | Tipo              | Condición                                           | Pista mostrada                      |
|------------|-------------------|-----------------------------------------------------|-------------------------------------|
| `abuela`   | `specific_reward` | Conseguir `reward_vajilla`                          | "Consigue la Vajilla de La Cartuja" |
| `guiri`    | `total_rewards`   | Acumular 20 premios en total                        | "Consigue 20 premios en total"      |
| `chaval`   | *(pendiente)*     | Condición pendiente de definir                      | "Consigue 10 premios en total"      |
| `retro01`  | `specific_reward` | Premio pendiente (`reward_pending`)                 | "???"                               |
| `retro02`  | `specific_reward` | Premio pendiente (`reward_pending`)                 | "???"                               |
| `retro03`  | —                 | Sin condición definida todavía                      | —                                   |

### Flujo de desbloqueo

1. El jugador termina una partida victoriosamente y obtiene un premio.
2. Se muestra la tarjeta del premio (`RewardCard`).
3. `UnlockService.checkNewUnlocks()` evalúa si alguna condición se cumple.
4. Si hay personajes nuevos desbloqueados, se muestra su ficha en `CharacterUnlockScene`.
5. Los botones finales son **"ELEGIR PERSONAJE"** (→ `CharacterSelectScene`) y **"VOLVER A JUGAR"** (→ `GameScene`).

### Migración por versión

`UnlockService` almacena en `localStorage` la versión con la que se jugó. Si es inferior a la constante `RESET_BELOW_VERSION` del código, se borran los premios acumulados y los desbloqueos (los personajes por defecto se restauran automáticamente). Permite forzar un reset limpio al publicar versiones con cambios de sistema, simplemente actualizando la constante.

---

## 🏆 Premios (datos actuales)

Definidos en `public/assets/rewards.json`. Se otorgan al completar una partida ganando la bandera. Los assets están en `public/assets/premios/`.

### Tabla de premios

| ID                  | Nombre                                          | Probabilidad (peso) |
|---------------------|-------------------------------------------------|---------------------|
| `reward_giraldillo` | Pisacorbatas del Giraldillo                     | 0.30                |
| `reward_pali`       | Llavero del Pali                                | 0.25                |
| `reward_curro`      | Pin del Curro                                   | 0.25                |
| `reward_wendolin`   | La Wendolin                                     | 0.10                |
| `reward_sombrero`   | El Sombrero de Finidi                           | 0.10                |
| `reward_gambrinus`  | Peluche de Gambrinus                            | 0.10                |
| `reward_maradona`   | La camiseta del 10                              | 0.10                |
| `reward_pacogandia` | La cinta de los mejores chistes de Paco Gandía  | 0.10                |
| `reward_vajilla`    | Vajilla completa de La Cartuja                  | 0.10                |

> Los pesos son relativos, no porcentajes estrictos. Se pueden repetir premios entre partidas. Los premios acumulados se muestran en `CollectionScene`.

---

## 🎮 Spritesheet — Especificación técnica

Cada personaje tiene un único PNG en `public/assets/sprites/characters/{id}.png`.
Fallback: `sprite-default`. Si tampoco existe, renderizado pixel art procedural con Graphics.

### Dimensiones

| Parámetro       | Valor                          |
|-----------------|-------------------------------|
| Frame           | 16 × 24 px                    |
| Total frames    | 9 (tira horizontal)           |
| Ancho total PNG | 144 px                        |
| Escala en juego | ×3 → 48 × 72 px renderizados  |
| Escalado Phaser | `pixelArt: true` (NEAREST)    |

### Mapa de frames

```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  0   │  1   │  2   │  3   │  4   │  5   │  6   │  7   │  8   │
│STAND │ WALK │ JUMP │STAND │ JUMP │CELEB │CELEB │ FALL │WATER │
│      │      │      │_FLAG │_FLAG │  _A  │  _B  │      │      │
│16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │16×24 │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
←────────────────── 144 px total ─────────────────────────────→
```

| Frame | Constante    | Descripción                                           |
|-------|--------------|-------------------------------------------------------|
| 0     | `STAND`      | De pie, estático o corriendo lento                    |
| 1     | `WALK`       | Paso de carrera (alterna con STAND en animación)      |
| 2     | `JUMP`       | En el aire sin bandera                                |
| 3     | `STAND_FLAG` | De pie sujetando la bandera                           |
| 4     | `JUMP_FLAG`  | En el aire sujetando la bandera (al saltar con ella)  |
| 5     | `CELEB_A`    | Celebración A — cabeza fuera del agua, brazo abajo    |
| 6     | `CELEB_B`    | Celebración B — cabeza fuera del agua, brazo arriba   |
| 7     | `FALL`       | Cayendo sin bandera (gesto de susto)                  |
| 8     | `WATER`      | Cabeza asomando del agua sin bandera (game over)      |

### Reutilización de frames

No existe frame dedicado para "caída con bandera". El estado `FALLING_FLAG` usa el frame `STAND_FLAG` (3), por ser la pose más representativa cuando el personaje cae habiendo cogido la bandera sin saltar.

---

## 🕺 Estados del jugador

Definidos en `src/game/entities/Player.js` como `PLAYER_STATE`.

| Estado          | Constante       | Frame usado  | Cuándo ocurre                                              |
|-----------------|-----------------|--------------|------------------------------------------------------------|
| `normal`        | `NORMAL`        | STAND / WALK | Corriendo sobre el palo sin bandera                        |
| `jumping`       | `JUMPING`       | JUMP         | Saltando sin bandera                                       |
| `jumping-flag`  | `JUMPING_FLAG`  | JUMP_FLAG    | Saltando con bandera                                       |
| `flag`          | `FLAG`          | STAND_FLAG   | En el palo tras coger la bandera sin saltar                |
| `falling`       | `FALLING`       | FALL         | Cayendo al agua sin bandera                                |
| `falling-flag`  | `FALLING_FLAG`  | STAND_FLAG   | Cayendo al agua habiendo cogido la bandera sin saltar      |

### Diagrama de transiciones

```
NORMAL ──salto──────────────► JUMPING
NORMAL ──coge bandera───────► FLAG
JUMPING ──coge bandera──────► JUMPING_FLAG
JUMPING ──aterriza──────────► NORMAL
JUMPING_FLAG ──aterriza─────► FLAG
FLAG ──cae──────────────────► FALLING_FLAG   ← frame: STAND_FLAG (3)
JUMPING ──cae───────────────► FALLING
JUMPING_FLAG ──cae──────────► FALLING_FLAG
NORMAL ──cae────────────────► FALLING
```

### API pública de Player

| Método                           | Efecto                                                            |
|----------------------------------|-------------------------------------------------------------------|
| `setJumping(isJumping, hasFlag)` | Cambia entre JUMPING / JUMPING_FLAG / NORMAL / FLAG              |
| `setFlag(hasFlag)`               | Activa/desactiva bandera conservando si está saltando             |
| `setFalling()`                   | Detecta internamente si tenía bandera → FALLING o FALLING_FLAG    |
| `redraw()`                       | Repositiona el sprite o redibuja el fallback pixel art            |
| `showHead(waterY)`               | Muestra la cabeza asomando del agua (game over sin bandera)       |
| `startCelebration(waterY, cb)`   | Animación de celebración en el agua (ganó con bandera)            |
| `destroy()`                      | Limpia sprite, timers y graphics                                  |

---

## 🎨 Sistema de Skins

Cada personaje puede tener múltiples apariencias visuales (skins). Un skin es un spritesheet alternativo para el personaje. El portrait/ficha en `CharacterSelectScene` **no cambia** con el skin — solo cambia el sprite en juego.

### Definición de skins

Los skins se definen dentro de cada personaje en `src/game/config/characters.js`, en el campo `skins[]`:

```javascript
skins: [
  {
    spritesheet: 'trianero',        // nombre del fichero (sin .png) en .../spritesheet/
    nombre:      'Clásico',         // nombre mostrado en SkinSelectScene
    como:        null,              // null = siempre desbloqueado (skin por defecto)
  },
  {
    spritesheet: 'trianero_02',
    nombre:      'Trianero Festivo',
    como:        '10 premios con El Trianero',          // texto para el jugador
    condicion:   { tipo: 'premios_personaje', cantidad: 10 },  // lógica de desbloqueo
  },
]
```

El **primer skin del array** es siempre el skin por defecto (nunca bloqueado).

### Flujo de navegación

```
CharacterSelectScene  →  [SELECCIONAR]  →  SkinSelectScene  →  [JUGAR]  →  GameScene
                                                             →  [VOLVER] →  CharacterSelectScene
```

### SkinSelectScene

- Muestra **un skin a la vez**, a gran escala (`SPRITE_CONFIG.scalePreview`).
- Anima alternando los frames `STAND` (0) y `WALK` (1) cada `400ms` — sensación de fase de equilibrio sin palo.
- Botones de navegación `◀` / `▶` si hay más de un skin.
- **Skin desbloqueado:** muestra nombre + sprite animado.
- **Skin bloqueado:** muestra candado + texto de `como` (sin mostrar el nombre).
- Botones: `JUGAR` (va a `GameScene` con el skin seleccionado) y `VOLVER` (regresa al carrusel de personajes).

### Escala configurable

| Constante              | Valor | Uso                                   |
|------------------------|-------|---------------------------------------|
| `SPRITE_CONFIG.scale`  | 3     | Tamaño del sprite en `GameScene`      |
| `SPRITE_CONFIG.scalePreview` | 8 | Tamaño del sprite en `SkinSelectScene` |

Ambas constantes están en `src/game/config/spriteConfig.js` y son independientes entre sí.

### Desbloqueo de skins

- **Condición:** acumular N premios **con ese personaje específico** (no premios globales).
- **Tipo de condición:** `{ tipo: 'premios_personaje', cantidad: N }`
- La comprobación ocurre en `RewardScene` al finalizar cada partida.
- Los nuevos skins se desbloquean silenciosamente y están disponibles en la siguiente visita a `SkinSelectScene`.

### Persistencia — localStorage

**Clave:** `cucana_skins`

**Estructura:**
```json
{
  "trianero": {
    "unlocked": ["trianero", "trianero_02"],
    "active":   "trianero_02"
  },
  "flamenca": {
    "unlocked": ["flamenca"],
    "active":   "flamenca"
  }
}
```

- Si un personaje no tiene entrada, se usa el primer skin de su `skins[]` como fallback.
- El skin activo se persiste al pulsar `JUGAR` en `SkinSelectScene`.
- Gestionado por `SkinService` (`src/game/services/SkinService.js`).

### Premios por personaje — localStorage

**Clave:** `cucana_character_rewards`

**Estructura:**
```json
{ "trianero": 5, "flamenca": 12 }
```

Gestionado por `CharacterRewardService` (`src/game/services/CharacterRewardService.js`), independiente de `RewardStorageService` (que trackea premios globales).

### Ficheros implicados

| Fichero | Rol |
|---------|-----|
| `src/game/config/characters.js` | Define los skins de cada personaje |
| `src/game/config/spriteConfig.js` | Constantes `scale` y `scalePreview` |
| `src/game/scenes/SkinSelectScene.js` | Pantalla de selección de skin |
| `src/game/services/SkinService.js` | Desbloqueos y skin activo en localStorage |
| `src/game/services/CharacterRewardService.js` | Premios acumulados por personaje |
| `src/game/scenes/RewardScene.js` | Detecta y persiste nuevos desbloqueos |
| `src/game/scenes/GameScene.js` | Carga el spritesheet del skin activo |
| `src/game/entities/Player.js` | Acepta `spriteKey` para usar el skin correcto |
| `public/assets/sprites/characters/spritesheet/` | Ficheros PNG de los spritesheets |

---

## 🗺️ Mapa de Sevilla — Sistema de logros territorial

Meta-progresión paralela a los premios individuales. El jugador reconstruye un mapa pixel art de Sevilla dividido en **15 trozos (3 columnas × 5 filas, orientación vertical)**. Cada trozo se desbloquea al clavar un impulso "perfecto" en Fase 1 y conseguir la bandera en la misma partida. Cada trozo contiene uno o varios puntos clickables que muestran una foto real (retocada con estilo pixel art) + texto sobre un lugar de Sevilla. Objetivo: convertir el juego en una mini-guía cultural.

### Disposición del mapa

| Parámetro | Valor |
|---|---|
| Total de trozos | 15 |
| Grid | 3 columnas × 5 filas |
| Orientación | Vertical (más alto que ancho) |
| Dimensiones de cada trozo | 200 × 200 px (imagen original) |
| Dimensiones totales del mapa original | 600 × 1000 px |

> Las dimensiones son las del arte original. En pantalla se escalan según la vista (general o ampliada) manteniendo proporciones.

### Vistas y navegación

**Vista general:**
- Mapa completo visible (3×5) a escala reducida para caber en pantalla.
- Trozos **no conseguidos** → oscuros / silueta apagada (sin detalle visible).
- Trozos **conseguidos** → iluminados con su arte.
- Trozos **conseguidos pero no vistos aún** (`seen === false`) → marco amarillo destacado **solo en vista general**.
- Pulsar cualquier trozo (conseguido u oscuro) → entra en vista ampliada de ese trozo.

**Vista ampliada (un trozo a pantalla completa):**
- Muestra el trozo escalado ocupando la zona principal.
- Si el trozo está conseguido → se ven sus puntos clickables.
- Si el trozo no está conseguido → se muestra oscuro y sin puntos.
- Flechas de navegación **arriba / abajo / izquierda / derecha** para moverse a trozos adyacentes del grid. En los bordes del grid, la flecha correspondiente se deshabilita o se oculta.
- Botón **"Volver"** para regresar a la vista general.
- Entrar en un trozo (por pulsación o navegación) marca automáticamente `seen = true`.

**Qué pasa al pulsar un trozo oscuro desde vista general:**
Se abre en vista ampliada oscuro y sin puntos. El jugador puede seguir navegando desde ahí con las flechas. Esto es intencional: evita la inconsistencia de permitir navegar por oscuros dentro de la vista ampliada pero no abrirlos desde la general.

### Condición de desbloqueo de trozo

**Trigger doble obligatorio en la misma partida:**
1. Detener la barra de impulso de Fase 1 en el rango **99%-100%** (configurable).
2. Conseguir la bandera al final de la partida (con o sin salto).

Si solo se cumple 1 → no hay trozo.
Si solo se cumple 2 → no hay trozo (se otorga premio normal como siempre).
Si se cumplen ambos → **además** del premio normal, se otorga un trozo de mapa aleatorio entre los aún no conseguidos.

**Aleatoriedad sin reposición:** cada nuevo trozo sale de entre los **no conseguidos todavía**. No se repite ninguno hasta completar el mapa. Garantiza progresión en 15 partidas "perfectas" como mínimo.

**Cuando ya se tienen los 15 trozos:** la señal de impulso perfecto sigue mostrándose igual (feedback consistente), pero no otorga nada adicional.

### Feedback "¡POWER!" — Impulso perfecto

Se dispara en el instante en que el jugador detiene la barra de Fase 1 dentro del rango perfecto, **antes** de la Fase 2.

| Elemento | Detalle |
|---|---|
| Texto | "¡POWER!" (o término a decidir) en tipografía pixel art grande |
| Animación | Pop-in con rebote, se mantiene ~0.4-0.6s, fade out |
| Posición | Fuera de zonas críticas (no tapar barra de equilibrio ni al jugador) |
| Sonido | SFX corto retro tipo chispazo / ding |
| Requisito | **Ambos** elementos (visual + sonido) son obligatorios; el juego debe ser comprensible sin audio |

Variables a exponer en configuración (archivo `mapConfig.js`):
- Rango de impulso perfecto (por defecto 99-100).
- Duración del pop-in.
- Posición del texto en pantalla.

### Feedback al final de la partida

En `RewardScene` (o equivalente), tras mostrar el premio ganado, si en esa partida se cumplió la condición del trozo:
- Secuencia: primero se muestra el premio normal, **luego** aparece un mensaje adicional tipo *"Has conseguido un trozo del mapa"*.
- El jugador debe ir a la pantalla de premios y pulsar el botón **"Mapa"** para verlo.
- No se muestra cuál es el trozo en ese momento: la sorpresa se guarda para cuando abra el mapa y vea el marco amarillo.

### Acceso e integración

- **Botón "Mapa"** en la pantalla de premios (`CollectionScene` o equivalente). Abre `MapScene`.
- **Porcentaje de mapa desbloqueado** en `StatsScene` como estadística adicional (`mapProgress = conseguidos / 15`).

### Estructura de datos — `map.json`

Fichero mantenido manualmente. El jugador (desarrollador) añadirá los puntos a mano, porque las coordenadas se calculan visualmente sobre cada trozo.

```json
{
  "pieces": [
    {
      "id": "piece_01",
      "row": 0,
      "col": 0,
      "image": "assets/map/pieces/piece_01.png",
      "points": [
        {
          "id": "piece_01_point_01",
          "x": 60,
          "y": 90,
          "photo": "assets/map/photos/giralda.png",
          "title": "La Giralda",
          "text": "Antiguo alminar almohade, símbolo de Sevilla."
        },
        {
          "id": "piece_01_point_02",
          "x": 140,
          "y": 30,
          "photo": "assets/map/photos/catedral.png",
          "title": "Catedral de Sevilla",
          "text": "La mayor catedral gótica del mundo."
        }
      ]
    }
  ]
}
```

**Reglas del JSON:**
- `id` de trozo y de punto únicos en todo el fichero.
- `row` 0-4 (filas de arriba abajo), `col` 0-2 (columnas de izquierda a derecha).
- Las coordenadas `x` / `y` de cada punto son **en píxeles de la imagen original del trozo** (dominio 0-200, 0-200). **Nunca** se escriben en coordenadas de pantalla ni escaladas.
- `points` puede estar vacío (`[]`) si un trozo no tiene lugares destacados.
- Pueden existir trozos definidos en el JSON antes de tener la imagen real o las fotos: el juego debe tolerar assets faltantes mostrando placeholders.

### Posicionamiento de puntos — Nota técnica crítica

El problema: Phaser escala la imagen del trozo para adaptarse a la pantalla (tanto en vista general como en vista ampliada). Los puntos clickables deben permanecer **exactamente sobre el lugar correspondiente de la foto**, sin desalinearse al ampliar.

**Solución:**
1. Crear un `Phaser.Container` por trozo que contenga la imagen + los círculos de los puntos.
2. Colocar cada círculo en las coordenadas `{ x, y }` del JSON (relativas a la imagen original, 0-200).
3. Aplicar escala **al container completo**, no a imagen y puntos por separado. Al escalar el container, Phaser escala todos sus hijos proporcionalmente y los puntos quedan perfectamente alineados.
4. `pixelArt: true` sigue activo para mantener `NEAREST` sin suavizado.

**Hitarea táctil (móvil):**
- El círculo visual del punto puede ser pequeño (p.ej. 6-8 px de radio en coordenadas originales).
- El área clickable debe ser más amplia: en pantalla final (tras escalado) debe llegar a ≥ 44×44 px para ser cómoda con el dedo.
- Exponer en `mapConfig.js` dos constantes independientes: `POINT_VISUAL_RADIUS` (radio del círculo que se ve) y `POINT_HIT_RADIUS` (radio del área táctil). Así se puede ampliar el hitarea sin cambiar el aspecto.

### Estructura de carpetas — Assets

```
public/assets/map/
├── pieces/                  # Trozos del mapa (200x200 px cada uno)
│   ├── piece_01.png
│   ├── piece_02.png
│   └── ... piece_15.png
├── photos/                  # Fotos reales retocadas pixel art (lugares)
│   ├── giralda.png
│   ├── catedral.png
│   ├── plaza-espana.png
│   └── ...
└── ui/                      # Elementos propios de la UI del mapa (opcional)
    ├── frame-unseen.png     # Marco amarillo para trozos no vistos
    ├── arrow-nav.png
    └── point-marker.png     # Sprite del círculo clickable
```

### Persistencia — `localStorage` con Clean Architecture

**Clave localStorage:** `cucana_map`

**Estructura:**
```json
{
  "unlocked": ["piece_03", "piece_07", "piece_12"],
  "seen":     ["piece_03", "piece_07"]
}
```

- `unlocked`: IDs de trozos conseguidos.
- `seen`: IDs de trozos ya visualizados al menos una vez por el jugador (vista ampliada). Subconjunto de `unlocked`.

**Arquitectura (Clean Architecture — preparado para migración futura a BD):**

| Capa | Fichero | Responsabilidad |
|---|---|---|
| Entidad / modelo | `src/game/entities/MapPiece.js` | Objeto puro: id, row, col, image, points, isUnlocked, isSeen. Sin Phaser. |
| Caso de uso / servicio | `src/game/services/MapService.js` | Reglas de negocio: desbloquear trozo aleatorio no conseguido, marcar como visto, calcular progreso %, comprobar si puede desbloquear en una partida dada. |
| Puerto (interfaz) | `src/game/services/ports/MapStoragePort.js` | Contrato: `load()`, `save(state)`, `clear()`. |
| Adaptador | `src/game/services/adapters/MapLocalStorageAdapter.js` | Implementación con `localStorage`. En el futuro se sustituye por `MapApiAdapter` sin tocar el servicio. |
| Config | `src/game/config/mapConfig.js` | Rango de impulso perfecto, duración de POWER, radios de punto, etc. |
| Escena | `src/game/scenes/MapScene.js` | Orquesta vistas (general / ampliada), navegación, render de puntos. |

`MapService` nunca toca `localStorage` directamente: depende del puerto. Así mañana el adaptador pasa a ser una llamada HTTP a BD sin que cambie nada más.

**Sigue la misma pauta ya usada en:**
- `GameStatsService` (estadísticas con adaptador intercambiable).
- `UnlockService`, `SkinService`, `CharacterRewardService`.

### Desarrollo incremental — Scaffolding sin arte

Dado que el arte (mapa pixel art + fotos retocadas) llevará tiempo, cuando se empiece la implementación se debe **crear toda la estructura aunque no existan imágenes**:

1. `map.json` con los 15 trozos definidos (row/col/id), con `points: []` o con placeholders.
2. `MapScene` funcional con placeholders de color sólido (cuadrados pixel art) en lugar de las imágenes reales.
3. Sistema de desbloqueo e impulso perfecto integrado y funcional.
4. Persistencia completa.
5. Pantalla de premios con botón "Mapa" activo.
6. % en `StatsScene`.

Los assets reales se irán sustituyendo uno a uno sin tocar código. El juego debe detectar assets faltantes y mostrar el placeholder correspondiente.

### Checklist de decisiones cerradas

- ✅ Grid 3×5 vertical, trozos 200×200.
- ✅ Vista general + vista ampliada con flechas de navegación.
- ✅ Trozos oscuros navegables y abribles desde vista general.
- ✅ Desbloqueo aleatorio sin reposición entre pendientes.
- ✅ Trigger: impulso 99-100% (configurable) + bandera en la misma partida.
- ✅ Sin bandera → no desbloquea aunque acertase el impulso.
- ✅ Con los 15 ya conseguidos → señal POWER sigue saliendo sin recompensa extra.
- ✅ Feedback visual "¡POWER!" pixel art grande pop-in + SFX.
- ✅ Feedback final de partida: mensaje tras el premio, sin revelar qué trozo.
- ✅ Flag `seen` por trozo → marco amarillo solo en vista general.
- ✅ Botón "Mapa" en pantalla de premios.
- ✅ % de mapa desbloqueado en `StatsScene`.
- ✅ Persistencia en `localStorage` con Clean Architecture (puerto + adaptador).
- ✅ Desarrollo con scaffolding completo aunque falten imágenes.