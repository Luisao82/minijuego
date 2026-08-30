# Reto GPS — Brief de desarrollo

Documento de referencia para la implementación de los **retos del mapa**:
mecánica opcional que agrupa los puntos de interés (POIs) en bloques temáticos
y los revela progresivamente, con **doble modo de desbloqueo** — por visita
física con GPS o por metros recorridos en el palo.

---

## 1. Objetivo

Añadir al mapa una serie de **bloques temáticos** ("Triana Misteriosa",
"Sevilla de Noche", etc.), cada uno con varios POIs repartidos por Sevilla.
El jugador va completando los bloques por uno de dos caminos exclusivos:

- **Modo GPS** — visita físicamente los sitios y hace check-in.
- **Modo metros** — acumula metros recorridos en el palo, cada partida cuenta.

Un **bloque por defecto** siempre visible garantiza contenido cultural
accesible desde el primer arranque, sin necesidad de elegir modo.

No hay premios materiales — la "recompensa" es desbloquear el siguiente
bloque. El objetivo es que la mecánica crezca en el tiempo añadiendo bloques
nuevos solo tocando JSON e imágenes, sin cambios de código.

---

## 2. Modelo de bloques

Los POIs del mapa se agrupan en **bloques**. Cada bloque tiene:

- `id` — identificador único (kebab-case).
- `title` — nombre visible.
- `order` — orden en la progresión (número entero).
- `unlockDistance` — metros necesarios para desbloquearlo por modo metros.
- `contentAlwaysVisible` — `true` en el bloque introductorio (Sevilla
  Esencial): permite ver foto y texto de sus POIs sin condición.
  Ausente/`false` en los demás: el contenido solo se ve cuando el bloque
  está desbloqueado y activo.
- `badgeGps`, `badgeMeters` — rutas a las imágenes de los sellos (creados
  por el equipo en pixel art).
- `icon` — opcional. Ruta a un icono pixel art para el bloque. Si no
  está, se omite en el selector.
- `pois[]` — lista de POIs del bloque, cada uno con `lat`/`lon` reales.

**Un solo tipo de bloque, con un flag diferenciador:**

Todos los bloques participan en la cadena de progresión y todos exigen
completar sus POIs (por check-in o por metros). La única diferencia es que
el bloque con `contentAlwaysVisible: true` permite explorar sus fotos y
textos aunque no hayas hecho check-in — pensado para dar contenido
cultural inmediato al no-Sevillano.

**Progresión:**

1. Al elegir modo, se desbloquea el primer bloque (`order: 0` — Sevilla
   Esencial).
2. Al completar sus POIs (por check-in GPS o por acumular `unlockDistance`
   metros) → se marca como completado y se desbloquea el siguiente.
3. Al completar el último bloque disponible → mensaje *"¡Has completado
   todos los retos! Pronto habrá más…"*.

**Modelo de POI — solo lat/lon, la pieza se deriva:**

El POI declara únicamente su coord GPS real; su posición en píxeles del
mapa ilustrado, y la pieza a la que pertenece, las calcula el código a
partir de las 4 esquinas del mapa (`mapBounds`). Fuente única de verdad:
la coord real. Al afinar las 4 esquinas durante pruebas, todos los POIs
se recolocan automáticamente sin tocar sus entradas.

**División de contenido para el arranque:**

Los 5 POIs actuales se reparten entre dos bloques para poder probar el
flujo completo desde el primer día:

- **"Sevilla Esencial"** (`order: 0`, `contentAlwaysVisible: true`) —
  3 POIs de referencia turística. Contenido siempre visible como guía
  cultural, y también actúa como primer bloque de la cadena (sus
  check-ins/metros desbloquean el siguiente):
  - Giralda
  - Torre del Oro
  - Relojería de Sierpes
- **"Triana de barrio"** (`order: 1`) — 2 POIs de descubrimiento local:
  - Bar Curioso
  - El Torero Roto

Nota: al inicio, los 2 POIs de "Triana de barrio" están geográficamente
en el centro histórico (piezas 2-1 y 3-1 del mapa ilustrado), no en Triana.
Es un reparto de prueba para validar la mecánica. Cuando el equipo tenga
contenido real de Triana, esos POIs se moverán y el bloque se rellenará
con fotos coherentes con su tema.

Nuevos bloques de reto ("Sevilla de Noche", etc.) se irán añadiendo tocando
solo el JSON, sin cambios de código.

---

## 3. Reglas de juego

### Modo de desbloqueo — GPS vs metros

- La primera vez que el usuario entra al mapa se le muestra el **tutorial
  del mapa** (ver §7), al final del cual elige modo: **GPS** o **metros**.
- Los modos son **exclusivos**: solo el modo seleccionado desbloquea bloques.
- Ambos contadores siguen acumulándose en el fondo. Al **cambiar de modo**,
  se usa lo ya acumulado del nuevo modo para seguir desbloqueando.
- Cambiar de modo **no revierte** los bloques ya desbloqueados — lo
  desbloqueado se queda desbloqueado.
- Se distingue con un **sello diferente** cómo se completó cada bloque —
  imágenes pixel art que el equipo diseña (referencia inicial:
  🥇 estrella para GPS / 🎮 mando para metros). En el JSON cada bloque
  reserva campos `badgeGps` y `badgeMeters` con rutas a los sprites.

### Cambio de modo

- Un solo botón *"CAMBIAR MODO"* en la barra inferior del mapa hace
  **toggle directo** GPS ↔ metros (sin modal de confirmación).
- Al pulsarlo se refresca al momento la lista de bloques (la columna
  cambia de "N de M visitas" a "quedan X metros" o viceversa).
- Se muestra un toast pixel-art breve *"Modo cambiado a GPS"* / *"Modo
  cambiado a metros"* durante ~2 segundos.
- Es reversible con el mismo botón — no se pierde nada al cambiar.

### Contador de metros

- Empieza a **0 con esta actualización** (no se importan partidas previas).
- El total histórico de partidas se sigue guardando aparte (compat. con
  contador de skins).
- Cada partida suma `distanceTraveled` **sin descuento** al contador — un
  intento fallido de 3m suma 3m enteros.
- El contador se **pausa** cuando no hay más bloques por desbloquear.
- Al añadir un bloque nuevo en el futuro, el contador **se reanuda desde 0**
  — las partidas jugadas durante la pausa no cuentan.

### Modo GPS — reglas de check-in

- Solo se pueden visitar POIs de **piezas del mapa ya desbloqueadas** (con
  MAX POWER). Si el POI cae en una pieza aún no conseguida, no se muestra
  ni se puede marcar.
- La posición del usuario solo se muestra sobre piezas desbloqueadas. Fuera
  de ellas (o fuera de Sevilla), el avatar no aparece.
- Radio de tolerancia inicial: **50 metros** (a ajustar probando).
- Los POIs tienen coordenadas GPS del **punto de vista de la foto**, no del
  monumento. Al llegar, el usuario ve la misma escena que la foto.
- Marcar un POI como visitado es acción manual — botón "Estoy aquí" en el
  modal del POI, visible solo cuando estás dentro del radio.

### Bloque con `contentAlwaysVisible: true` (Sevilla Esencial)

- Sus POIs se pueden **explorar** siempre — foto y texto abiertos sin
  condición.
- Aun así participa en la cadena: sus check-ins (modo GPS) o su
  `unlockDistance` (modo metros) desbloquean el siguiente bloque.
- Al completarlo, recibe su sello igual que cualquier otro bloque.

---

## 4. Estados persistidos (`localStorage`)

Ampliar el estado actual de `MapService`:

```
{
  unlocked: [...],                // ya existe — piezas del mapa
  seen: [...],                    // ya existe — piezas con badge dorado ya vistas
  visitedInPerson: [...],         // NUEVO — IDs de POIs con check-in físico
  unlockMode: 'gps'|'meters'|null,// NUEVO — modo elegido por el usuario
  unlockDistanceCounter: number,  // NUEVO — metros acumulados desde el último desbloqueo
  activeBlockId: string|null,     // NUEVO — bloque de reto actualmente en progreso
  completedBlocks: [              // NUEVO — bloques completados con cómo se completaron
    { id: string, mode: 'gps'|'meters', completedAt: string }
  ],
  mapTutorialSeen: boolean        // NUEVO — usuario ya vio el tutorial del mapa
}
```

El permiso GPS del sistema no lo persistimos — se consulta al SO en cada
arranque. Es la fuente de verdad.

---

## 5. Cambios visuales (pixel art, dentro del canvas)

### Layout del mapa con selector

El mapa se **desplaza a la derecha** de la escena para dejar sitio en la
mitad izquierda al selector de bloques (label superior con el modo activo
+ lista vertical de bloques).

### Selector de bloques (nuevo componente)

- Aparece en la mitad izquierda de la vista global del mapa.
- Label arriba: *"Modo GPS"* o *"Modo metros"*.
- Debajo, lista vertical de bloques. Cada bloque muestra a la izquierda su
  nombre y a la derecha uno de estos indicadores según su estado:
  - **Completado** → medalla/sello diferenciado según modo con el que se
    cerró (`badgeGps` o `badgeMeters` del JSON).
  - **Activo (en progreso)** → marco de esquinas L rodeando el bloque
    entero + texto de progreso a la derecha (en modo GPS: *"N de M
    visitas"*; en modo metros: *"quedan X metros"*).
  - **Bloqueado** → aparece con el mismo estilo pero grisado.
- Al pulsar un bloque completado o activo, sus POIs se muestran en el mapa;
  los de otros bloques se ocultan. Solo un bloque puede tener las esquinas L
  a la vez (el "activo" visualmente en la escena).
- **Se refresca al momento** cuando el usuario cambia de modo o cuando se
  desbloquea un bloque nuevo.

### Barra inferior de botones

Tres botones estilo pixel art (con la tipografía consistente del juego):
`VOLVER`, `CAMBIAR MODO`, `TUTORIAL`.

### En `MapScene` (vista global)

- Avatar del jugador (punto azul pulsante) sobre su posición, solo si:
  - Modo GPS activo.
  - Está dentro de una pieza desbloqueada.
  - El bloque activo es de reto (no aplica al bloque por defecto).
- En el selector, cada bloque de reto muestra su progreso según el modo.
- El cambio de modo se hace exclusivamente desde el botón inferior
  `CAMBIAR MODO` (ver §3).

### En vista zoom de una pieza

- Solo se muestran los POIs pertenecientes al bloque seleccionado en ese
  momento.
- Avatar azul del jugador sobre la pieza (si aplica al modo GPS).
- POIs ya visitados: círculo con tick verde en lugar del rojo pulsante.

### En modal de POI

- Si el bloque es de reto en modo GPS Y el usuario está a <50m → botón
  *"Estoy aquí"*.
- Si ya está visitado → sello *"✓ Visitado en persona"* en el modal.
- Animación + sonido al marcar por primera vez.
- Si el bloque es el por defecto, el modal es solo lectura.

### Modales y feedback pixel-art

- Tutorial del mapa (ver §7).
- Selector inicial de modo (GPS o metros) al final del tutorial.
- Permiso GPS denegado: mensaje + botón "Abrir ajustes" / "Cambiar a modo
  metros".
- Toast de cambio de modo (no modal — mensaje efímero de ~2s).
- Bloque completado — mensaje de enhorabuena + preview del siguiente
  desbloqueado + sello correspondiente al modo.
- Último bloque completado — *"Has completado todos los retos disponibles.
  Pronto habrá más…"*.

---

## 6. Cambios en código (arquitectura)

### Nuevos archivos

- `src/game/services/GeoService.js` — envuelve la API de geolocalización.
  Métodos: `checkPermission()`, `requestPermission()`, `getCurrentPosition()`,
  `watchPosition(cb)`, `stopWatch()`, `openNativeSettings()`. Único punto que
  toca Capacitor / `navigator.geolocation`.
- `src/game/utils/geo.js` — funciones puras:
  `haversineDistance(lat1, lon1, lat2, lon2)`,
  `latLonToPixel(lat, lon, bounds)`, `isInBounds(lat, lon, bounds)`,
  `pixelToPiece(x, y)` (deriva `{row, col}` desde el pixel global del
  mapa).
- `src/game/config/mapBounds.js` — coordenadas GPS de las 4 esquinas del
  mapa completo.
- `src/game/components/PlayerMarker.js` — el avatar pulsante reutilizable.
- `src/game/components/BlockSelector.js` — selector de bloques según diseño
  pendiente.
- `src/game/scenes/MapTutorialScene.js` — tutorial del mapa siguiendo el
  mismo patrón visual de `TutorialScene` (narrador + diálogo + imagen).
  Puede compartir componentes con `TutorialScene` o reutilizar la escena
  existente con contenido inyectado (a decidir en implementación).
- `src/game/config/mapTutorialContent.js` — array de bloques narrativos
  del tutorial (título, imagen, texto). Mismo formato que
  `tutorialContent.js`.

### Ampliar existentes

- `MapService` — añadir gestión de bloques, visitados, modo y contador:
  `getBlocks()`, `getActiveBlock()`, `setActiveBlock(id)`,
  `isBlockCompleted(id)`, `getBlockCompletionMode(id)`,
  `isBlockUnlocked(id)`, `markVisitedInPerson(poiId)`,
  `isVisitedInPerson(poiId)`, `getVisitedCount(blockId)`,
  `getUnlockMode()`, `setUnlockMode(mode)`,
  `getUnlockDistanceCounter()`, `addDistance(meters)`,
  `checkBlockCompletion(blockId, mode)`,
  `hasSeenMapTutorial()`, `markMapTutorialSeen()`.
- `BaseGameScene` — al finalizar la partida (éxito o fracaso) invocar
  `mapService.addDistance(this.distanceTraveled)` **si**
  `unlockMode === 'meters'` y hay bloques pendientes. Si el contador
  alcanza el umbral del próximo bloque, disparar `checkBlockCompletion`.
- `MapScene` — orquesta:
  - Al entrar por primera vez → `MapTutorialScene` → selector de modo.
  - En modo GPS: pide posición al `GeoService` (con `watchPosition`) al
    entrar y desuscribe en `shutdown`. Convierte lat/lon a píxeles con
    `geo.js` y pinta el `PlayerMarker`.
  - Integra el `BlockSelector` y responde a cambios de bloque activo.
  - Gestiona los modales del reto (cambio de modo, permiso denegado,
    bloque completado).
- `public/assets/map/map-data.json` — nueva estructura con `blocks[]`. Cada
  POI declara solo `lat`/`lon` (sin `x`/`y`/`row`/`col`); su pieza y su
  posición en píxeles del mapa se derivan al vuelo. Cada POI referencia su
  foto por ruta relativa dentro de la carpeta de su bloque.
- `PrivacyScene` — añadir sección explicando el uso del GPS.

### Sin sistema de recompensa material

Ni `RewardScene`, ni `CharacterRewardService`, ni skins asociadas. La única
"recompensa" es el desbloqueo del siguiente bloque y el sello diferenciado.

---

## 7. Tutorial del mapa

**Objetivo:** explicar al usuario cómo funciona el mapa, los bloques, los
dos modos de desbloqueo (GPS vs metros), los check-ins de POIs, los sellos
y la relación con las piezas del mapa.

**Diseño:** mismo patrón visual que `TutorialScene` — narrador pixel art a
la izquierda, imagen grande arriba, cuadro de diálogo abajo con texto en
máquina de escribir. Paleta e interacción idénticas.

**Cuándo se muestra:**

- **Primera vez** que el usuario entra al mapa con ≥1 pieza desbloqueada.
- **Bajo demanda** desde un botón/opción en el mapa (para revisarlo).

**Flujo:** al terminar el último bloque narrativo del tutorial → aparece un
selector de modo (GPS o metros). La elección se persiste como `unlockMode`.

**Contenido (borrador aprobado, a ajustar en implementación):**

1. **El mapa de Sevilla** (`map-tut-01`) — *"¡Aquí lo tienes! El Mapa de
   Sevilla. Está dividido en 15 piezas que se van desbloqueando conforme
   consigas la bandera con el MAX POWER. ¡Ya conoces cómo!"*
2. **Los retos** (`map-tut-02`) — *"Además, el mapa esconde RETOS. Cada
   reto es una colección de fotos de sitios especiales de Sevilla que debes
   ir descubriendo. Al completar uno, se te desbloquea el siguiente."*
3. **Sevilla Esencial** (`map-tut-03`) — *"El bloque 'Sevilla Esencial'
   es tuyo desde el principio, sin condiciones. Contiene los sitios más
   emblemáticos. Puedes verlos y leer su historia cuando quieras."*
4. **Modo GPS** (`map-tut-04`) — *"Los demás retos se desbloquean visitando
   los sitios EN PERSONA. Tu móvil detecta cuándo estás cerca (a 50 metros
   o menos) y podrás marcar la foto como visitada. ¡Este es el MODO GPS!"*
5. **Modo metros** (`map-tut-05`) — *"¿No estás en Sevilla o prefieres no
   usar el GPS? ¡Sin problema! En MODO METROS, cada partida cuenta. Los
   metros que recorras en el palo, aunque no cojas la bandera, te acercan
   al siguiente reto."*
6. **Elige tu modo** (`map-tut-06`) — *"Cada modo tiene su propio sello.
   Puedes cambiar de uno a otro cuando quieras. ¿Cómo prefieres empezar?"*
   → botones [MODO GPS] [MODO METROS]

**Narrador:** mismo `Narrator` que `TutorialScene`, reutilizando el
spritesheet `narrator-tutorial` (mismo personaje).

**Assets nuevos:** `map-tut-01.webp` … `map-tut-06.webp` — los provee el
equipo cuando el guion esté confirmado.

---

## 8. Configuración de plataforma

**Nuevas dependencias:**

```
@capacitor/geolocation
@capacitor-community/native-settings (o equivalente para abrir ajustes)
```

**iOS (`ios/App/App/Info.plist`):**

- Añadir `NSLocationWhenInUseUsageDescription` con texto en español
  explicando el uso.

**Android (`android/app/src/main/AndroidManifest.xml`):**

- Añadir permisos `ACCESS_COARSE_LOCATION` y `ACCESS_FINE_LOCATION`.

**Web / PWA:**

- No requiere config extra. Necesita HTTPS (ya lo tenemos por Vercel).

---

## 9. Organización de assets

Fotos organizadas por bloque, cada uno en su propia carpeta:

```
public/assets/map/photos/
├── sevilla-esencial/
│   ├── giralda.webp
│   ├── torreDelOro.webp
│   └── relojeria.webp
├── triana-de-barrio/
│   ├── bar.webp
│   └── torero-roto.webp
└── <futuros-bloques>/
    └── ...
```

Las 5 imágenes actuales (`bar.webp`, `escultura_torero_roto.webp`,
`giralda.webp`, `relojeria.webp`, `torreDelOro.webp`) se moverán a las
subcarpetas correspondientes. `escultura_torero_roto.webp` se renombra a
`torero-roto.webp` para consistencia kebab-case.

Sellos:

```
public/assets/map/badges/
├── badge-gps.webp
└── badge-meters.webp
```

Imágenes del tutorial del mapa:

```
public/assets/tutorial/
├── tut-01.webp … tut-06.webp    (existentes, del tutorial del juego)
├── map-tut-01.webp
├── map-tut-02.webp
└── ...
```

Añadir un bloque nuevo = crear carpeta + añadir entrada en el JSON. Cero
código.

---

## 10. Configuración inicial

### Coordenadas de las 4 esquinas del mapa (estimación inicial)

Estimadas por la posición de referencias visibles en la screenshot original
del mapa de Sevilla (Guadalquivir vertical, Parque de María Luisa en la
esquina inferior derecha):

| Esquina | Latitud | Longitud | Zona real aproximada |
|---------|---------|----------|----------------------|
| NW | 37.4100 | -6.0100 | Norte de Triana / La Cartuja oeste |
| NE | 37.4100 | -5.9780 | Macarena / La Barzola |
| SW | 37.3700 | -6.0100 | Sur de Los Remedios / Tablada |
| SE | 37.3700 | -5.9780 | Parque de María Luisa / Bermejales |

Estas coord se irán ajustando durante las pruebas reales sobre el terreno.

### Bloques iniciales (JSON)

```json
{
  "mapBounds": {
    "nw": { "lat": 37.4100, "lon": -6.0100 },
    "ne": { "lat": 37.4100, "lon": -5.9780 },
    "sw": { "lat": 37.3700, "lon": -6.0100 },
    "se": { "lat": 37.3700, "lon": -5.9780 }
  },
  "blocks": [
    {
      "id": "sevilla-esencial",
      "title": "Sevilla Esencial",
      "order": 0,
      "contentAlwaysVisible": true,
      "unlockDistance": 50,
      "badgeGps": "badges/badge-gps.webp",
      "badgeMeters": "badges/badge-meters.webp",
      "pois": [
        {
          "id": "giralda",
          "title": "La Giralda",
          "text": "La Giralda, símbolo de Sevilla.",
          "photo": "sevilla-esencial/giralda.webp",
          "lat": 37.38590,
          "lon": -5.99300
        },
        {
          "id": "torre-oro",
          "title": "Torre del Oro",
          "text": "Torre del Oro, famosa torre de Sevilla.",
          "photo": "sevilla-esencial/torreDelOro.webp",
          "lat": 37.38260,
          "lon": -5.99630
        },
        {
          "id": "relojeria",
          "title": "Relojería",
          "text": "Relojería típica de la calle Sierpes.",
          "photo": "sevilla-esencial/relojeria.webp",
          "lat": 37.39100,
          "lon": -5.99400
        }
      ]
    },
    {
      "id": "triana-de-barrio",
      "title": "Triana de barrio",
      "order": 1,
      "unlockDistance": 200,
      "badgeGps": "badges/badge-gps.webp",
      "badgeMeters": "badges/badge-meters.webp",
      "pois": [
        {
          "id": "bar-curioso",
          "title": "Bar Curioso",
          "text": "Bar con una de las fotos más curiosas de Sevilla.",
          "photo": "triana-de-barrio/bar.webp",
          "lat": 37.38950,
          "lon": -5.99331
        },
        {
          "id": "torero-roto",
          "title": "El Torero Roto",
          "text": "Escultura del torero roto.",
          "photo": "triana-de-barrio/torero-roto.webp",
          "lat": 37.38539,
          "lon": -6.00286
        }
      ]
    }
  ]
}
```

**Valores de arranque a calibrar en pruebas reales:**

- `unlockDistance` de cada bloque (50 en Sevilla Esencial como onboarding
  corto, 200 en Triana de barrio como primer reto real).
- `mapBounds` — las 4 esquinas son estimadas. Al probar en Sevilla con el
  móvil se afinarán, y todos los POIs se recolocan automáticamente en el
  mapa ilustrado sin tocar sus `lat`/`lon`.
- `lat`/`lon` de la Relojería es aproximada (calle Sierpes en general);
  se afinará con la coord real del punto de vista de la foto cuando el
  equipo la pase.

### Campo `icon` opcional por bloque

Se reserva en el schema para el futuro. Si un bloque incluye
`"icon": "path/al/icono.webp"`, el selector lo pinta a la izquierda del
nombre. Si no está, se omite. Al principio ningún bloque lleva icono.

### Pendiente de aportar

- Sellos `badge-gps.webp` / `badge-meters.webp` (referencia: estrella /
  mando) — imágenes pixel art creadas por el equipo.
- Imágenes del tutorial `map-tut-01.webp` … `map-tut-06.webp`.
- Coord real de la Relojería (punto de vista de la foto).
- Bloques futuros (título, `order`, `unlockDistance`, POIs con
  `lat`/`lon`).

---

## 11. Flujos cubiertos

### Estado inicial

- Usuario sin piezas: ve el mapa vacío con el hint actual de "MAX POWER".
  Selector de bloques y botón de modo **no aparecen**.
- Con al menos una pieza desbloqueada: al entrar al mapa por primera vez
  → tutorial del mapa → selector de modo.

### Flujos del reto GPS (una vez elegido modo GPS)

- **A**: Aceptar permiso → primer bloque de reto se desbloquea con
  animación.
- **B**: Rechazar permiso → modal explicando que necesita el permiso o
  cambiar a modo metros. Sigue en pantalla la elección de modo.
- **C**: Segundo intento tras rechazo → modal con "Abrir ajustes".
- **D**: Modo GPS activo fuera de Sevilla → avatar no aparece, POIs del
  bloque activo visibles pero sin botón "Estoy aquí" alcanzable.
- **E**: En Sevilla sobre pieza no desbloqueada → avatar no aparece.
- **F**: En pieza desbloqueada pero lejos del POI → avatar sí, botón
  "Estoy aquí" no.
- **G**: Cambio de modo a metros → conserva bloques desbloqueados;
  empieza a usar los metros ya acumulados.
- **H**: Permiso revocado desde ajustes del móvil → detectado al reentrar
  al mapa, ofrece "Abrir ajustes" o "Cambiar a modo metros".

### Flujos del modo metros

- Cada partida (éxito o fracaso) suma `distanceTraveled` al
  `unlockDistanceCounter` sin descuento.
- Al alcanzar `unlockDistance` del próximo bloque → se desbloquea,
  contador vuelve a 0.
- Contador se pausa cuando todos los bloques están desbloqueados.
- Al añadir un bloque nuevo (futura release) el contador se reanuda desde 0.

### Progresión entre bloques

- Completar un bloque → modal de enhorabuena con el sello del modo → se
  marca como completado → el siguiente se desbloquea → se convierte en
  activo.
- Completar el último → mensaje *"pronto habrá más…"*.

### Tutorial

- Primera entrada al mapa (con piezas) → `MapTutorialScene` completa →
  selector de modo → guarda `mapTutorialSeen: true`.
- Botón "Ver tutorial" desde el mapa para revisarlo sin resetear estado.

---

## 12. Fuera de alcance (por ahora)

- Ningún tracking GPS en segundo plano — solo mientras `MapScene` está
  activa.
- Ningún mapa cartográfico real — seguimos con el mapa ilustrado 3×5.
- Ningún anti-cheat contra GPS spoofing — asumido y aceptado dado que no
  hay premios materiales.
- Ninguna `SettingsScene` — la gestión del reto vive dentro del propio
  mapa. Si en el futuro añadimos más ajustes globales, se moverá allí.
- Ningún atajo para desbloquear bloques sin usar uno de los dos modos —
  el bloque por defecto es la única puerta abierta sin compromiso.
- Ningún sistema de premios materiales, skins, ni tarjetas compartibles
  asociado al reto — se puede añadir en el futuro sin bloquear la mecánica.

---

## 13. Registro en CHANGELOG

Al arrancar la implementación → entrada en `[Unreleased]` bajo `Added`.
Al cerrar versión → bump MINOR (nueva mecánica).
