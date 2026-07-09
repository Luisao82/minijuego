# Auditoría de contenido con riesgo IP / edad

Última revisión: 2026-07-09 · Referencia: v1.5.3.

Documento operativo para trazar cada elemento del juego que puede generar
problemas de propiedad intelectual, marcas registradas o rating de edad
(alcohol / tabaco) antes del submit real a App Store o Google Play.

Cada entrada incluye: **qué es**, **riesgo**, **acción sugerida** y
**estado**.

Convención de riesgo:

- 🔴 **Alto** — marca viva, personaje con derechos de imagen, IP muy
  reconocible, alcohol explícito.
- 🟠 **Medio** — homenaje póstumo, patrimonio comercializado, referencia
  reconocible pero difícil de reclamar.
- 🟢 **Bajo** — patrimonio público, referencia genérica, sin dueño
  privado identificable.

---

## 1. Rewards (`public/assets/rewards.json`)

Los `id` se mantienen en todas las entradas para no romper el localStorage
de jugadores existentes ni los tests. Se cambia solo el `nombre` y la
`descripcion` visibles. Las imágenes las revisará Luisao aparte.

| id                  | Riesgo | Motivo original                                                | Acción                                                                                        | Estado                  |
| ------------------- | ------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| `reward_cerveza`    | 🔴     | Alcohol explícito + imagen de vaso de Cruzcampo                | Renombrar sin alcohol; descripción neutra. Imagen pendiente de Luisao.                        | ✅ aplicado             |
| `reward_vaso`       | 🔴     | Referencia al vaso del rockero de Sevilla en concierto         | Neutralizar a objeto de artesanía trianera.                                                   | ✅ aplicado             |
| `reward_gambrinus`  | 🔴     | Cadena de cervecerías (marca viva) + implica alcohol           | Neutralizar a peluche genérico de la Velá.                                                    | ✅ aplicado             |
| `reward_curro`      | 🔴     | Mascota Expo 92 (Heinz Edelmann), IP protegida                 | Renombrar a pin genérico. Imagen pendiente.                                                   | ✅ aplicado             |
| `reward_maradona`   | 🔴     | Derechos de imagen del futbolista (herederos)                  | Neutralizar a "camiseta clásica del 10".                                                      | ✅ aplicado             |
| `reward_sombrero`   | 🔴     | Finidi George — jugador vivo, derechos de imagen               | Neutralizar a "sombrero cordobés".                                                            | ✅ aplicado             |
| `reward_sugus`      | 🔴     | Marca registrada activa                                        | Neutralizar a "caramelo de fruta".                                                            | ✅ aplicado             |
| `reward_vajilla`    | 🟠     | La Cartuja de Sevilla (Pickman) — marca activa                 | Neutralizar a "vajilla de porcelana sevillana".                                               | ✅ aplicado             |
| `reward_llamador`   | 🟠     | Descripción menciona el "pograma" (El Llamador, Canal Sur)     | El llamador es objeto tradicional cofradiero: reescribir descripción sin alusión al programa. | ✅ aplicado             |
| `reward_triana`     | 🟠     | Homenaje al grupo Triana (rock andaluz), descripción lo aclara | Reenfocar al barrio de Triana, quitar mención al "legado musical".                            | ✅ aplicado             |
| `reward_hispalis`   | 🟠     | Referencia al grupo musical                                    | Mantener por decisión explícita del autor (2026-07-09).                                       | 🔒 mantenido a petición |
| `reward_pali`       | 🟠     | Homenaje al cantautor sevillano (fallecido)                    | Neutralizar a "llavero del cantautor trianero" para minimizar riesgo con herederos.           | ✅ aplicado             |
| `reward_pacogandia` | 🟠     | Homenaje al humorista (fallecido)                              | Neutralizar a "cinta de chistes andaluces" para minimizar riesgo con herederos.               | ✅ aplicado             |
| `reward_wendolin`   | 🟢     | Referencia cultural difusa                                     | Mantener; no se identifica marca ni titular explícito.                                        | 🟢 sin cambios          |
| `reward_giraldillo` | 🟢     | Símbolo patrimonial de Sevilla                                 | Mantener; sin dueño privado.                                                                  | 🟢 sin cambios          |

---

## 2. Retratos de personaje (`public/assets/sprites/characters/*.png`)

Son PNG estáticos 300×300. Cambio de texto **no basta** para estos casos:
la imagen sigue mostrando el objeto problemático. Requieren edición
gráfica (Luisao) o generación externa con inpainting.

| id         | Riesgo | Elemento problemático                    | Acción sugerida                                                      | Estado                 |
| ---------- | ------ | ---------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `trianero` | 🔴     | Jarra de cerveza                         | Sustituir por loncha de jamón serrano (foto de referencia recibida). | ⏳ pendiente de Luisao |
| `flamenca` | 🔴     | Copa de vino / champán                   | Sustituir por abanico o clavel.                                      | ⏳ pendiente           |
| `guiri`    | 🔴     | Sangría en jarra + cartel "BAR" al fondo | Sustituir bebida por refresco / helado; borrar el cartel BAR.        | ⏳ pendiente           |
| `cunaos`   | 🔴     | Dos martinis brindando                   | Sustituir bebidas por refrescos o café.                              | ⏳ pendiente           |
| `abuela`   | 🟢     | Retrato limpio                           | Sin acción.                                                          | 🟢 OK                  |
| `chaval`   | 🟢     | Retrato limpio                           | Sin acción.                                                          | 🟢 OK                  |

---

## 3. Personajes RETRO (`characters.js` → id `retro01`)

Este personaje tiene múltiples skins con potencial de conflicto:

| Skin                   | Riesgo | Notas                                                                    | Acción sugerida                                               |
| ---------------------- | ------ | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `retro02` "Mario"      | 🔴     | Nombre y probablemente diseño → Nintendo IP                              | Renombrar y verificar que el sprite no sea reconocible.       |
| `retro01` "Abu Simbel" | 🟢     | Videojuego español clásico (Chicken House / Dinamic).                    | Verificar autoría del sprite; probablemente OK como homenaje. |
| `retro03` "Dan"        | 🟠     | Ambiguo — puede ser referencia a algo específico. Revisar.               | Verificar y ajustar si aplica.                                |
| `larry`                | 🔴     | Nombre coincide con Leisure Suit Larry (Sierra) → IP + contenido adulto. | Renombrar y verificar sprite. **Ojo con rating de edad.**     |

**Estado:** 🔴 sin cambios en esta pasada — requiere decisión de Luisao
sobre cada skin (rediseño vs eliminación).

---

## 4. Skins de otros personajes

`Trianero`, `Flamenca`, `Chaval` y `Cuñaos` tienen skins temáticas (Nazareno,
Costalero, Armao, Feriante, Mantilla, Manquepierda, etc.). Todas son
referencias culturales genéricas de Sevilla y no identifican una persona ni
una marca. **Riesgo bajo, sin cambios.**

Las skins `rafi-pelicula` / `fali-pelicula` ("El mundo es suyo … y es suyo")
son citas de un chiste típico. Sin marca detrás. **Bajo riesgo.**

Las skins `rafi-equipo` / `fali-equipo` (Manquepierda / Hasta la muerte) son
lemas del Real Betis. **Riesgo medio-bajo**: lemas populares pero
apropiados por el club. Revisar si Betis los ha registrado.

---

## 5. Música

Ver [`email-music-authorization.md`](email-music-authorization.md) y
`CREDITS.md` sección Audio. Riesgo asumido por Luisao (2026-07-09).

---

## 6. Recomendación al autor

Antes del submit a App Store, en orden de prioridad:

1. **Retratos con alcohol** (`trianero`, `flamenca`, `guiri`, `cunaos`) —
   son visibles nada más entrar al juego. Un reviewer los verá seguro.
2. **Skin "Larry"** — nombre coincide con IP de adultos, doble problema.
3. **Skin "Mario"** — IP Nintendo, muy reconocible.
4. **Imágenes de rewards** (jarra de cerveza, martini de Gambrinus, camiseta
   con "10", pin de Curro) — se ven en `CollectionScene` y en
   `RewardScene`.

Los textos ya están limpios tras esta pasada. Las imágenes son el siguiente
paso y dependen de generación externa.
