# Reto GPS — Brief de desarrollo

Documento de referencia para la implementación de los **retos GPS del mapa**:
mecánica opcional que agrupa los puntos de interés (POIs) en bloques temáticos
y los revela progresivamente según el jugador los visita en persona.

---

## 1. Objetivo

Añadir al mapa una serie de **bloques temáticos** ("Triana Misteriosa",
"Sevilla de Noche", etc.), cada uno con varios POIs repartidos por Sevilla. El
jugador va completando los bloques visitando físicamente los sitios (verificado
por GPS), y al completar un bloque se desbloquea el siguiente. Un **bloque por
defecto** siempre visible garantiza que los no-Sevillanos y los que no activen
GPS tengan contenido cultural accesible.

No hay premios materiales — la "recompensa" es desbloquear el siguiente bloque.
El objetivo es que la mecánica crezca en el tiempo añadiendo nuevos bloques
solo tocando JSON e imágenes, sin cambios de código.

---

## 2. Modelo de bloques

Los POIs del mapa se agrupan en **bloques**. Cada bloque tiene:

- `id` — identificador único (kebab-case).
- `title` — nombre visible ("Sevilla Esencial", "Triana Misteriosa"…).
- `order` — orden en la progresión (número entero).
- `requiresGps` — `true` para bloques de reto, `false` para el bloque por
  defecto.
- `pois[]` — lista de POIs del bloque.

**Dos tipos de bloque:**

| Tipo | `requiresGps` | Estado | Contenido | Check-in físico |
|------|--------------|--------|-----------|-----------------|
| Por defecto ("Sevilla Esencial") | `false` | Siempre desbloqueado | Curado, generalista (greatest hits de Sevilla) | No aplica — solo lectura |
| De reto ("Triana Misteriosa", "Sevilla de Noche"…) | `true` | Progresión secuencial | Descubrimiento local / oculto | Obligatorio |

**Progresión de los bloques de reto:**

1. Todos están bloqueados hasta que el usuario active el GPS por primera vez.
2. Al activar GPS → se desbloquea el bloque de reto de menor `order`.
3. Al visitar en persona todos los POIs de ese bloque → se marca completado y
   se desbloquea el siguiente.
4. Al completar el último bloque disponible → mensaje *"¡Has completado todos
   los retos! Pronto habrá más…"*. Añadir bloques nuevos es solo tocar el JSON.

**División de contenido:**

- El **bloque por defecto** contiene los POIs actualmente ya definidos en el
  juego (Giralda, Torre del Oro, Relojería, Bar Curioso, El Torero Roto). No
  se mueven — se quedan tal como están, pero pasan a formar parte del bloque
  `sevilla-esencial`.
- Los **bloques de reto** se irán poblando con contenido nuevo (más específico
  y local) según el equipo vaya haciendo fotos.

**Trade-off aceptado:** los bloques de reto son inaccesibles sin GPS. No hay
botón de escape. El no-Sevillano se queda con el bloque por defecto como guía
cultural. Es una decisión consciente de producto: Cucaña Trianera es un
producto trianero primero, turístico segundo.

---

## 3. Reglas de juego

- El reto GPS es **opcional** y **opt-in explícito**.
- Solo se pueden visitar POIs de **piezas del mapa ya desbloqueadas** (con
  MAX POWER). Si el POI cae en una pieza aún no conseguida, no se muestra ni
  se puede marcar — el bloque queda en progreso parcial hasta que consigas
  esa pieza.
- La posición del usuario solo se muestra sobre piezas desbloqueadas. Fuera
  de ellas (o fuera de Sevilla), el avatar no aparece.
- Radio de tolerancia inicial: **50 metros** (a ajustar probando).
- Los POIs tienen coordenadas GPS del **punto de vista de la foto**, no del
  monumento. Al llegar, el usuario ve la misma escena que la foto.
- Marcar un POI como visitado es acción manual — botón "Estoy aquí" en el
  modal del POI, visible solo cuando estás dentro del radio.
- El bloque por defecto **no** tiene botón "Estoy aquí" ni contador — es solo
  lectura.

---

## 4. Estados persistidos (`localStorage`)

Ampliar el estado actual de `MapService`:

```
{
  unlocked: [...],            // ya existe — piezas del mapa
  seen: [...],                // ya existe — piezas con badge dorado ya vistas
  visitedInPerson: [...],     // NUEVO — IDs de POIs marcados con check-in físico
  challengeEnabled: boolean,  // NUEVO — usuario ha activado el reto GPS
  activeBlockId: string|null, // NUEVO — bloque de reto actualmente en progreso
  completedBlocks: [...]      // NUEVO — IDs de bloques de reto ya completados
}
```

El permiso GPS del sistema no lo persistimos — se consulta al SO en cada
arranque. Es la fuente de verdad.

---

## 5. Cambios visuales (pixel art, dentro del canvas)

**Selector de bloques (nuevo componente — diseño pendiente):**

- Aparece en la vista global del mapa.
- Muestra todos los bloques con su estado: **por defecto** (siempre abierto),
  **activo** (en progreso), **completado** (con sello), **bloqueado** (con
  candado + hint *"Completa 'X' para desbloquear"*).
- Al pulsar un bloque desbloqueado, sus POIs se muestran en el mapa; los de
  otros bloques se ocultan.
- **Se refresca al momento** cuando el usuario activa el GPS por primera vez,
  con una animación de *"nuevo bloque disponible"* sobre el primer bloque de
  reto.

**En `MapScene` (vista global):**

- Botón *"🎯 Activar reto trianero"* visible solo si hay ≥1 pieza desbloqueada
  y el reto no está activo. Al activarse, el botón se transforma en un
  indicador discreto *"🎯 Reto activo"* + aparece el selector de bloques.
- Al tocar el indicador → modal "Seguir jugando / Desactivar".
- Avatar del jugador (punto azul pulsante) sobre su posición, solo dentro de
  piezas desbloqueadas Y si el bloque activo es de reto.
- En el selector, cada bloque de reto muestra su progreso *"n/m visitados"*.

**En vista zoom de una pieza:**

- Solo se muestran los POIs pertenecientes al bloque seleccionado en ese
  momento.
- Avatar azul del jugador sobre la pieza (si aplica).
- POIs ya visitados: círculo con tick verde en lugar del rojo pulsante.

**En modal de POI:**

- Si el bloque es de reto Y el reto está activo Y el usuario está a <50m →
  botón *"Estoy aquí"* debajo del texto.
- Si ya está visitado → sello/insignia *"✓ Visitado en persona"* en el modal.
- Animación + sonido al marcar por primera vez.
- Si el bloque es el por defecto, el modal es solo lectura.

**Modales pixel-art nuevos:**

- Introducción al reto (primera vez que aparece el botón "Activar reto").
- Permiso GPS denegado: mensaje + botón "Abrir ajustes".
- Confirmar desactivación del reto.
- Bloque completado — mensaje de enhorabuena + preview del siguiente que se
  desbloquea.
- Último bloque completado — *"Has completado todos los retos disponibles.
  Pronto habrá más…"*.

---

## 6. Cambios en código (arquitectura)

**Nuevos archivos:**

- `src/game/services/GeoService.js` — envuelve la API de geolocalización.
  Métodos: `checkPermission()`, `requestPermission()`, `getCurrentPosition()`,
  `watchPosition(cb)`, `stopWatch()`, `openNativeSettings()`. Único punto que
  toca Capacitor / `navigator.geolocation`.
- `src/game/utils/geo.js` — funciones puras:
  `haversineDistance(lat1, lon1, lat2, lon2)`,
  `latLonToPixel(lat, lon, bounds)`, `isInBounds(lat, lon, bounds)`.
- `src/game/config/mapBounds.js` — coordenadas GPS de las 4 esquinas del mapa
  completo. Fuente única para la conversión lat/lon → píxel.
- `src/game/components/PlayerMarker.js` — el avatar pulsante reutilizable en
  vista global y zoom.
- `src/game/components/BlockSelector.js` — selector de bloques según el
  diseño que aporte el equipo.

**Ampliar existentes:**

- `MapService` — añadir gestión de bloques y visitados:
  `getBlocks()`, `getActiveBlock()`, `setActiveBlock(id)`,
  `isBlockCompleted(id)`, `isBlockUnlocked(id)`,
  `markVisitedInPerson(poiId)`, `isVisitedInPerson(poiId)`,
  `getVisitedCount(blockId)`, `getChallengeEnabled()`,
  `setChallengeEnabled(bool)`, `checkBlockCompletion(blockId)` (para disparar
  el desbloqueo del siguiente).
- `MapScene` — orquesta:
  - Pide posición al `GeoService` (con `watchPosition`) al entrar y desuscribe
    en `shutdown`.
  - Convierte lat/lon a píxeles con `geo.js` y pinta el `PlayerMarker`.
  - Integra el `BlockSelector` y responde a cambios de bloque activo.
  - Gestiona los modales del reto (introducción, permiso denegado,
    desactivación, bloque completado).
- `public/assets/map/map-data.json` — nueva estructura con `blocks[]` en
  lugar de `pieces[].points[]` directamente. Cada POI referencia su foto por
  ruta relativa dentro de la carpeta de su bloque.
- `PrivacyScene` — añadir sección explicando el uso del GPS.

**Sistema de recompensa:** no aplica. Sin `RewardScene`, sin
`CharacterRewardService`. La única "recompensa" es que el `MapService`
desbloquea el siguiente bloque tras `checkBlockCompletion`.

---

## 7. Configuración de plataforma

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

## 8. Organización de assets

Fotos organizadas por bloque, cada uno en su propia carpeta:

```
public/assets/map/photos/
├── sevilla-esencial/
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

En `map-data.json` cada POI referencia su ruta con `map/photos/<block-id>/<foto>.webp`.
Añadir un bloque nuevo = crear carpeta + añadir entrada en el JSON. Cero
código.

---

## 9. Contenido que aporta el equipo

- **Coordenadas de las 4 esquinas del mapa** (NW, NE, SW, SE) en lat/lon
  reales de Sevilla.
- **Para cada POI**:
  - `blockId` al que pertenece.
  - Coordenadas GPS del punto de vista de la foto.
  - Foto (webp) desde ese punto de vista, en la carpeta del bloque.
  - Título y texto descriptivo.
- **Bloques nuevos**: título, `order`, y sus POIs. Un bloque puede añadirse
  sin release de código — solo tocar el JSON.

---

## 10. Flujos cubiertos

**Estado inicial (usuario sin piezas):**

- Ve el mapa vacío con el hint actual de "MAX POWER".
- El selector de bloques y el botón de reto **no aparecen**. No tiene sentido
  ofrecerlos sin piezas del mapa.

**Con al menos una pieza desbloqueada, GPS no activado:**

- Aparece el selector de bloques con solo el bloque por defecto abierto.
- Aparece el botón *"🎯 Activar reto trianero"*.
- Puede navegar el bloque por defecto y ver sus POIs libremente.

**Flujos del reto GPS (una vez activado):**

- **A**: Aceptar permiso → primer bloque de reto se desbloquea con animación.
- **B**: Rechazar permiso → botón sigue disponible, sin bloque de reto nuevo.
- **C**: Segundo intento tras rechazo → modal con "Abrir ajustes".
- **D**: Reto activo fuera de Sevilla → avatar no aparece, POIs del bloque
  activo visibles pero sin botón "Estoy aquí" alcanzable.
- **E**: En Sevilla sobre pieza no desbloqueada → avatar no aparece.
- **F**: En pieza desbloqueada pero lejos del POI → avatar sí, botón "Estoy
  aquí" no.
- **G**: Desactivar reto desde el juego → conserva permiso, oculta
  funcionalidad (bloques de reto vuelven a esconderse; el bloque por defecto
  sigue visible).
- **H**: Permiso revocado desde ajustes del móvil → detectado al reentrar al
  mapa, volvemos al Caso B/C.

**Progresión entre bloques:**

- Completar todos los POIs de un bloque → modal de enhorabuena → el bloque
  se marca como completado en el selector → el siguiente bloque se desbloquea
  con animación → se convierte en activo.
- Completar el último bloque disponible → mensaje *"pronto habrá más…"*.

---

## 11. Fuera de alcance (por ahora)

- Ningún tracking GPS en segundo plano — solo mientras `MapScene` está activa.
- Ningún mapa cartográfico real — seguimos con el mapa ilustrado 3×5.
- Ningún anti-cheat contra GPS spoofing — asumido y aceptado dado que no hay
  premios materiales.
- Ninguna `SettingsScene` — la gestión del reto vive dentro del propio mapa.
  Si en el futuro añadimos más ajustes globales, se moverá allí.
- Ningún atajo para saltar los bloques de reto sin GPS — el contenido oculto
  es exclusivo por diseño. El bloque por defecto es la única puerta abierta
  para el no-Sevillano.
- Ningún sistema de premios materiales, skins, ni tarjetas compartibles
  asociado al reto — se puede añadir en el futuro sin bloquear la mecánica.

---

## 12. Registro en CHANGELOG

Al arrancar la implementación → entrada en `[Unreleased]` bajo `Added`.
Al cerrar versión → bump MINOR (nueva mecánica).
