# App Store — hoja de copy lista para pegar

Documento operativo para rellenar la ficha de tienda de **La Cucaña
Trianera** en App Store Connect. Todos los textos están dimensionados
para respetar los límites de Apple y pueden copiarse tal cual.

Última revisión: 2026-07-09 · Referencia: v1.5.3.

---

## Datos que ya están cerrados

| Campo               | Valor                                                          |
| ------------------- | -------------------------------------------------------------- |
| App Name (30 char)  | `La Cucaña Trianera` (18 char)                                 |
| Bundle ID           | `com.cucana.trianera`                                          |
| Copyright           | `© 2026 Luisao`                                                |
| Primary Language    | Spanish (Spain)                                                |
| Privacy Policy URL  | `https://minijuego-lilac.vercel.app/privacy.html`              |
| Support URL         | `https://minijuego-lilac.vercel.app/support.html`              |
| Marketing URL       | _(dejar vacío)_                                                |
| Category primaria   | Games → Casual                                                 |
| Category secundaria | Games → Arcade                                                 |
| Age Rating          | 4+ (ver `app-store-privacy-checklist.md` para el cuestionario) |

---

## Subtítulo (30 char máx)

Opción propuesta:

```
Sube el palo, coge la bandera
```

29 caracteres. Cabe.

Alternativas si no encaja:

- `Salta, equilibra, gana premios` (30)
- `Cucaña de Triana en pixel art` (29)

---

## Promotional Text (170 char máx, editable sin nueva submission)

```
Sube el palo enjabonado, aguanta el equilibrio y coge la bandera antes de caer al río. Ahora con vista 3D y colección de premios.
```

157 caracteres.

---

## Description (4000 char máx)

```
LA CUCAÑA TRIANERA

Un minijuego pixel art inspirado en la Cucaña de Triana, la tradición sevillana de subir por un palo enjabonado colocado sobre el Guadalquivir para coger una bandera al final.

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

~1250 caracteres. Hay margen para ampliar más adelante.

---

## Keywords (100 char máx, separadas por comas, sin espacio detrás de la coma)

```
sevilla,triana,arcade,pixel,retro,tradicion,feria,minijuego,español,casual,offline,gratis,palo
```

96 caracteres.

**Reglas aplicadas:**

- No repite palabras del nombre ni del subtítulo (Apple ya las indexa).
- No incluye marcas ajenas.
- Incluye términos con volumen de búsqueda: `offline`, `gratis`, `español`, `pixel`, `retro`, `arcade`.
- Deja fuera `cucaña`, `bandera`, `equilibrio`, `salto`, `premios` porque ya aparecen en nombre/subtítulo/descripción.

Iteración posterior con datos reales del primer mes: subir palabras que aparezcan en búsquedas y bajar las que no.

---

## What's New in This Version (release notes para el primer submit)

```
Primera versión en App Store. Sube por el palo enjabonado de la cucaña de Triana, aguanta el equilibrio y coge la bandera antes de caer al Guadalquivir. Vista 3D, personajes desbloqueables y colección de premios inspirados en la Velá de Santa Ana.
```

~245 caracteres.

Para versiones posteriores: usar el resumen humano del `CHANGELOG.md` del release en cuestión, no una lista técnica.

---

## Datos para el reviewer (no públicos)

App Review Contact Information — se rellena en App Store Connect al enviar
para revisión. Estos datos **no aparecen en la ficha pública**.

| Campo         | Valor                   |
| ------------- | ----------------------- |
| First Name    | Luis                    |
| Last Name     | _(apellido legal real)_ |
| Phone Number  | _(móvil de contacto)_   |
| Email Address | `luisaodeben@gmail.com` |
| Sign-In Info  | Not required (no login) |

**Review Notes** sugeridas:

```
La aplicación no requiere login ni permisos del sistema. No recoge datos personales; Sentry recibe stack traces anónimos de errores de JavaScript únicamente cuando se produce un fallo (ver política de privacidad, sección 4.1). Sin compras dentro de la app ni anuncios. Contenido apto para todos los públicos. Idioma principal: español. La vista 3D es un highlight comercial de la app; se accede desde el menú tras el tutorial.
```

---

## Localización

**Idioma principal**: Spanish (Spain).

Para el primer submit **no se añaden traducciones**. Cuando se decida abrir a
mercado internacional, se traducen: name, subtitle, description, keywords,
promotional text y screenshots. Los créditos y la política de privacidad
pueden quedarse en español.

---

## Categorías de rating cerradas

Ver `app-store-privacy-checklist.md` para el cuestionario detallado. Resumen:

- Todas las categorías (violencia, sexo, alcohol, gambling, etc.) marcadas
  como **None**.
- Resultado: **Ages 4+** (equivalente PEGI 3).
- **Ojo:** este resultado depende de que los retratos de personaje con
  alcohol se rediseñen (ver `ip-content-audit.md` sección 2). Si se envía
  con la jarra de El Trianero visible, la respuesta correcta cambia a
  "Alcohol References — Infrequent/Mild" y el rating sube a **12+**.

---

## Icons y screenshots

Ya en el repositorio, listos para subir:

- **Icon 1024×1024**: `public/assets/store/icon-1024.png`.
- **Screenshots iPhone 6.7"/6.9"** (2796×1290, 5 tiles): `public/assets/store/screenshots/iphone-6.7/*.png`.
- **Screenshots iPad 13"** (2752×2064, 5 tiles): `public/assets/store/screenshots/ipad-13/*.png`.

Si se decide iPhone only (no iPad), esa carpeta se ignora y en Xcode se
restringe el Device Family a iPhone.

---

## Orden sugerido para rellenar la ficha

1. General → App Information → subir icono, elegir categorías, pegar
   copyright, Privacy Policy URL, Support URL.
2. Age Rating → cuestionario (ver `app-store-privacy-checklist.md`).
3. App Privacy → declaración de datos recolectados (ver mismo doc).
4. Distribution → App Store → Version 1.0 → rellenar name, subtitle,
   description, keywords, promotional text, what's new.
5. Screenshots por dispositivo.
6. App Review Information → contacto y notes.
7. Submit for Review.

Total realista: **~2 horas** en una sentada, si el binario ya está subido
desde Xcode.
