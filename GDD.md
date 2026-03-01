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

## 🎨 Diseño Visual de la Pantalla de Juego

### Escena general

| Parámetro | Detalle |
|---|---|
| Perspectiva | Horizontal — vista lateral desde la Calle Betis (Triana) |
| Dirección del personaje | De derecha a izquierda |
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