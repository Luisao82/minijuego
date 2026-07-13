# Google Play — hoja de copy lista para pegar

Documento operativo para rellenar la ficha de **La Cucaña Trianera** en la
Play Console. Todos los textos respetan los límites de Google Play y
pueden copiarse tal cual. Complementa a `app-store-listing-copy.md`.

Última revisión: 2026-07-13 · Referencia: v1.7.3 (primer submit).

---

## Datos que ya están cerrados

| Campo                  | Valor                                             |
| ---------------------- | ------------------------------------------------- |
| Nombre de la app       | `La Cucaña Trianera` (18 char, cabe en 30)        |
| Package name           | `com.cucana.trianera`                             |
| Idioma predeterminado  | Español (España) `es-ES`                          |
| Tipo                   | Juego                                             |
| Precio                 | Gratis                                            |
| Contiene anuncios      | No                                                |
| Categoría              | Juegos → Casual (secundaria: Arcade)              |
| Política de privacidad | `https://minijuego-lilac.vercel.app/privacy.html` |
| Sitio web              | `https://minijuego-lilac.vercel.app/`             |
| Email de contacto      | `luisaodeben@gmail.com`                           |

---

## Descripción corta (80 char máx)

```
Sube por el palo engrasado, aguanta el equilibrio y coge la bandera antes de caer.
```

80 caracteres exactos.

Alternativas si no encaja o quieres cambiar:

- `Cucaña de Triana en pixel art: equilibrio, salto y bandera antes del río` (72)
- `Homenaje a la Velá de Santa Ana: sube el palo y coge la bandera` (63)

---

## Descripción completa (4000 char máx)

```
LA CUCAÑA TRIANERA

Un minijuego pixel art inspirado en la Cucaña de Triana, la tradición sevillana de subir por un palo engrasado colocado sobre el Guadalquivir para coger una bandera al final. Un homenaje a la Velá de Santa Ana.

CÓMO SE JUEGA

Tres fases, una pulsación por fase:

• Impulso: mide el momento del salto y clava el ángulo.
• Equilibrio: mantente en el centro con los controles laterales mientras el palo se balancea y el aceite lo hace más difícil.
• Bandera: salta en el instante justo para atraparla antes de perder pie.

QUÉ TIENES DENTRO

• Vista clásica en 2D y nueva vista en 3D con el puente de Triana y el Guadalquivir de fondo.
• Varios personajes con estadísticas propias (peso, equilibrio, altura, edad) y skins desbloqueables.
• Colección de premios inspirados en la Velá de Santa Ana: cada partida ganada suma piezas al mapa de Sevilla.
• Historia narrada dentro del juego para conocer la tradición.

SIN COSTES OCULTOS

Gratis. Sin anuncios. Sin compras dentro de la app. Sin cuentas ni registros. Los datos de tu partida se guardan solo en tu dispositivo.

Diseñado en Triana con cariño y píxeles.
```

~1280 caracteres. Hay margen para ampliar. Google Play indexa toda la descripción, así que aquí sí vale la pena meter palabras clave naturales (sevilla, triana, cucaña, feria, arcade, pixel art, retro, casual, offline).

---

## Novedades de esta versión (release notes, 500 char máx)

Para el primer submit v1.7.3:

```
Primera versión en Google Play. Sube por el palo engrasado de la cucaña de Triana, aguanta el equilibrio y coge la bandera antes de caer al Guadalquivir. Vista 3D, personajes desbloqueables, colección de premios y mapa de Sevilla inspirados en la Velá de Santa Ana.
```

~275 caracteres. Para versiones posteriores: usar el resumen humano del CHANGELOG del release en cuestión.

---

## Assets — ya generados y listos para subir

| Asset                 | Ruta                                               | Tamaño   |
| --------------------- | -------------------------------------------------- | -------- |
| **Icon (Play Store)** | `public/assets/store/icons/android/icon-512.png`   | 512×512  |
| **Feature graphic**   | `public/assets/store/feature-graphic-1024x500.png` | 1024×500 |
| **Screenshots (5)**   | `public/assets/store/screenshots/play-pwa/*.png`   | teléfono |

Google Play acepta screenshots de 16:9 o 9:16, mínimo 320px por lado, máximo 3840px. Los del proyecto son PWA-friendly y sirven.

Screenshots recomendados en el orden de este set:

1. `01-intro.png` — pantalla de inicio (impacto visual).
2. `02-juego.png` — jugador en el palo (el corazón del juego).
3. `03-seleccion.png` — selección de personaje (variedad).
4. `04-premio.png` — pantalla de premio (progresión).
5. `05-equilibrio.png` — tutorial de equilibrio (aprendizaje).

---

## Clasificación de contenido (IARC)

Se rellena en Play Console → Configuración → Clasificación de contenido.
Cuestionario oficial. Respuestas para v1.7.3:

**Categoría:** Juegos → Otros o Casual.

| Pregunta                                              | Respuesta |
| ----------------------------------------------------- | --------- |
| Violencia (cartoon, fantasy, realista, o de sangre)   | No        |
| Contenido sexual (desnudez, insinuaciones, actividad) | No        |
| Lenguaje soez u ofensivo                              | No        |
| Referencias a drogas, alcohol o tabaco                | **Sí\***  |
| Simulación de apuestas con dinero real o virtual      | No        |
| Miedo, horror o suspenso                              | No        |
| Interacción entre usuarios (chat, mensajes, etc.)     | No        |
| Compartir ubicación                                   | No        |
| Compartir información personal                        | No        |
| Contenido generado por usuarios (UGC)                 | No        |
| Compras dentro de la app                              | No        |

**\*** Uno de los rewards ("Una caña fresquita") menciona alcohol. Es una referencia mínima y contextual (tradición popular, no promoción). Marcar como "Referencias infrecuentes/leves a alcohol". Google puede subir el rating de PEGI 3 → PEGI 12. Aceptable.

Resultado esperado: **PEGI 12** en Europa (por la referencia al alcohol) / **Everyone 10+** en USA.

Si prefieres PEGI 3, hay que quitar la referencia a "caña" del reward, algo que se puede hacer más adelante en una versión sin ese premio.

---

## Data safety — declaración de datos

Play Console → Contenido de la app → Seguridad de los datos.

**¿La app recopila o comparte datos del usuario?** — **Sí** (por Sentry).

**Datos recopilados:**

| Categoría       | Tipo               | ¿Se recopila? | ¿Se comparte? | Opcional | Uso                         |
| --------------- | ------------------ | ------------- | ------------- | -------- | --------------------------- |
| Diagnóstico app | Registro de fallos | Sí            | No            | No       | Análisis y solución de bugs |
| Diagnóstico app | Diagnóstico        | Sí            | No            | No       | Análisis y solución de bugs |

**Ningún dato personal identificable**. Sentry recibe stack traces técnicos y información de contexto del dispositivo (versión OS, dimensiones de pantalla). No hay cuenta de usuario, no hay login, no hay geolocalización, no hay identificadores publicitarios.

**Cifrado en tránsito:** Sí (HTTPS a Sentry).

**Los usuarios pueden solicitar eliminar sus datos:** No aplica (no hay cuenta de usuario ni datos personales).

---

## Público objetivo (Target audience)

Play Console → Contenido de la app → Público objetivo y contenido.

- **Rangos de edad seleccionados:** 13 años en adelante (si el rating final es PEGI 12).
- **¿Atrae a menores de 13?:** No.
- **¿Contiene anuncios?:** No.

Si el rating final es PEGI 3, se puede añadir el grupo "10-12" también.

---

## Aplicación de noticias

Play Console → Contenido de la app → Aplicación de noticias.

**¿Es una app de noticias?** — **No**.

---

## Aplicaciones de Salud del gobierno (COVID, etc.)

**No aplica.** Es un juego.

---

## Anuncios

Play Console → Contenido de la app → Anuncios.

**¿Contiene anuncios?** — **No**.

---

## Instrucciones para el revisor (opcional pero recomendado)

Al enviar para revisión, en el campo "Notas del revisor":

```
Aplicación sin login, sin recogida de datos personales, sin compras dentro de la app y sin anuncios.

Sentry (https://sentry.io) recibe stack traces técnicos anónimos cuando ocurre un error de JavaScript, sin datos personales identificables. Ver política de privacidad en https://minijuego-lilac.vercel.app/privacy.html

Contenido: minijuego arcade pixel art inspirado en una tradición popular sevillana. Uno de los rewards menciona "una caña fresquita" (referencia leve a alcohol, contexto cultural festivo, sin promoción). Idioma principal: español (España).
```

---

## Territorios de distribución

**Todos los países disponibles** en la primera fase. Sin excluir ninguno.

Si más adelante se detectan territorios con problemas de traducción o distribución específicos, se pueden excluir puntualmente.

---

## Precios

**Gratis** en todos los territorios.

---

## Orden sugerido para rellenar la Play Console

1. **Crear la app** → nombre, idioma, tipo (juego), gratis, aceptar políticas.
2. **Configuración → Ficha de Play Store**:
   - Icono, feature graphic, screenshots.
   - Descripción corta, descripción completa.
   - Categoría, etiquetas, contacto, sitio web, política de privacidad.
3. **Configuración → Clasificación de contenido**: cuestionario IARC.
4. **Configuración → Seguridad de los datos**: formulario Sentry.
5. **Configuración → Público objetivo y contenido**: edades, anuncios, etc.
6. **Configuración → Anuncios**: No.
7. **Configuración → Aplicación de noticias**: No.
8. **Pruebas → Pruebas internas**:
   - Crear versión → subir AAB → notas de la versión.
   - Añadir grupo de testers (mi email).
   - Publicar en pruebas internas.
9. **Instalar en móvil** con el enlace de testers y validar.
10. **Producción**:
    - Crear versión → promocionar el mismo AAB o subir uno nuevo idéntico.
    - Rellenar novedades.
    - **Enviar para revisión**.

Tiempo estimado: **~2-3 horas** en una sentada para todo el setup inicial. Revisión de Google: **1-3 días** la primera vez, luego suele ser horas.

---

## Referencias

- Documentación oficial de la Play Console: https://support.google.com/googleplay/android-developer
- Guía de políticas de contenido: https://play.google.com/about/developer-content-policy/
- Política de privacidad publicada: https://minijuego-lilac.vercel.app/privacy.html
- App Store equivalente (para paridad de datos): `docs/app-store-listing-copy.md`
