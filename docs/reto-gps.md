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
- `requiresGps` — `true` para bloques de reto, `false` para el bloque por
  defecto.
- `unlockDistance` — metros necesarios para desbloquearlo por modo metros
  (solo aplica a bloques de reto; se define por bloque en el JSON, sin
  fórmula escalonada).
- `pois[]` — lista de POIs del bloque.

**Dos tipos de bloque:**

| Tipo | `requiresGps` | Estado | Contenido | Desbloqueo |
|------|--------------|--------|-----------|------------|
| Por defecto | `false` | Siempre desbloqueado | Curado, generalista (los 5 POIs actuales) | N/A — siempre visible |
| De reto | `true` | Progresión secuencial | Descubrimiento local | GPS o metros según modo del usuario |

**Progresión de los bloques de reto:**

1. Todos están bloqueados hasta que el usuario elija modo (GPS o metros).
2. Elección: se desbloquea el primero automáticamente en modo GPS, o al
   alcanzar `unlockDistance` en modo metros.
3. Al completar un bloque → se marca como completado y se desbloquea el
   siguiente.
4. Al completar el último → mensaje *"¡Has completado todos los retos!
   Pronto habrá más…"*.

**División de contenido:**

- El **bloque por defecto** contiene los POIs ya definidos actualmente en el
  juego (Giralda, Torre del Oro, Relojería, Bar Curioso, El Torero Roto). Se
  quedan tal cual, pasan a formar parte del bloque por defecto.
- Los **bloques de reto** se irán poblando con contenido nuevo según el
  equipo vaya haciendo fotos.

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
- Se distingue con un **sello diferente** cómo se completó cada bloque:
  🥇 *"Completado en persona"* (GPS) / 🎮 *"Completado jugando"* (metros).

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

### Bloque por defecto

- Siempre visible desde el primer arranque, sin necesidad de haber elegido
  modo ni activado GPS.
- Sus POIs son solo lectura — sin check-in, sin contador, sin sello.

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

### Selector de bloques (nuevo componente — diseño pendiente)

- Aparece en la vista global del mapa.
- Muestra todos los bloques con su estado: **por defecto** (siempre abierto),
  **activo** (en progreso), **completado** (con sello diferenciado según
  modo), **bloqueado** (con condición del modo actual).
- Al pulsar un bloque desbloqueado, sus POIs se muestran en el mapa; los de
  otros bloques se ocultan.
- **Se refresca al momento** cuando el usuario activa el GPS por primera vez,
  con animación de *"nuevo bloque disponible"* sobre el primer bloque de
  reto.
- Para un bloque bloqueado, el texto de la condición depende del modo:
  - Modo GPS: *"🎯 Visita 5 sitios en persona"* (con contador visitados/total).
  - Modo metros: *"🎮 Te quedan 340 metros"* (basado en `unlockDistanceCounter`).

### En `MapScene` (vista global)

- Botón/indicador *"🎯 Reto activo"* discreto una vez el usuario ha elegido
  modo. Al tocarlo → modal con opciones: *"Cambiar modo"*, *"Ver tutorial
  otra vez"*, *"Cerrar"*.
- Avatar del jugador (punto azul pulsante) sobre su posición, solo si:
  - Modo GPS activo.
  - Está dentro de una pieza desbloqueada.
  - El bloque activo es de reto (no aplica al bloque por defecto).
- En el selector, cada bloque de reto muestra su progreso según el modo.

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

### Modales pixel-art nuevos

- Tutorial del mapa (ver §7).
- Selector inicial de modo (GPS o metros) al final del tutorial.
- Permiso GPS denegado: mensaje + botón "Abrir ajustes".
- Confirmar cambio de modo.
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
  `latLonToPixel(lat, lon, bounds)`, `isInBounds(lat, lon, bounds)`.
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
  POI referencia su foto por ruta relativa dentro de la carpeta de su
  bloque.
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

**Contenido (a redactar con el usuario):** aproximadamente 6-8 bloques
cubriendo:

1. Presentación del mapa y las piezas.
2. Cómo se consiguen las piezas (recordatorio del MAX POWER).
3. Qué son los bloques temáticos.
4. El bloque por defecto (siempre disponible).
5. Cómo se desbloquean los bloques de reto — modo GPS.
6. Cómo se desbloquean los bloques de reto — modo metros.
7. Los sellos diferenciados por modo.
8. Elige tu modo.

**Assets:** `map-tut-01`, `map-tut-02`, … con la misma naming convention
que las del tutorial actual (`tut-01`, …).

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
├── <id-bloque-por-defecto>/    (nombre pendiente)
│   ├── giralda.webp
│   ├── torre-oro.webp
│   ├── relojeria.webp
│   ├── bar-curioso.webp
│   └── torero-roto.webp
├── triana-misteriosa/
│   └── ...
└── sevilla-de-noche/
    └── ...
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

## 10. Contenido que aporta el equipo

- **Coordenadas de las 4 esquinas del mapa** (NW, NE, SW, SE) en lat/lon
  reales de Sevilla.
- **Para cada POI**:
  - `blockId` al que pertenece.
  - Coordenadas GPS del punto de vista de la foto.
  - Foto (webp) desde ese punto de vista, en la carpeta del bloque.
  - Título y texto descriptivo.
- **Bloques nuevos**: título, `order`, `unlockDistance`, y sus POIs.
- **Textos e imágenes** del tutorial del mapa (`map-tut-XX`).
- **Nombre definitivo** del bloque por defecto.
- **Diseños** del selector de bloques y del selector de modo.

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
