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