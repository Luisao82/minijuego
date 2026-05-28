# Plantilla de contacto — Solicitud de uso de obra musical

Este documento es una **plantilla** para solicitar permiso de uso de la
sevillana de *Cantores de Híspalis* adaptada como música del menú principal
del juego *La Cucaña Trianera*.

---

## A quién enviarla — orden recomendado

Las sevillanas de Cantores de Híspalis están casi con total seguridad
registradas en la **SGAE** (Sociedad General de Autores y Editores). Los
derechos de la **composición** (no de la grabación) los gestiona el editor
musical, que aparece en el registro de la SGAE de la canción.

Pasos sugeridos:

1. **Identificar la sevillana exacta** — título, álbum, año. Sin esto no se
   puede tramitar nada.
2. **Buscar la obra en el catálogo de la SGAE**
   <https://www.sgae.es> (apartado de consulta de obras). Allí aparece el
   nombre del editor musical y los autores.
3. **Contactar primero con el editor musical** que figura como gestor de la
   obra. Es quien autoriza usos sincronización.
4. **En paralelo, contactar con Cantores de Híspalis** por su web/Instagram
   oficial (gesto de cortesía y para acelerar). No tienen capacidad de
   autorizar derechos editoriales, pero su ayuda agiliza el contacto con
   el editor.
5. **Si no hay respuesta en 4–6 semanas**, la opción prudente es **sustituir
   la música** por una composición original.

### Tipo de licencia que se necesita

Lo que se necesita técnicamente es una **licencia de sincronización (sync
license)** para usar una **versión derivada** (la adaptación a MIDI/BeepBox)
de una obra musical preexistente como banda sonora de un videojuego. Si
también se vende en App Store o Google Play, se considera **uso comercial**,
aunque el juego sea gratuito.

---

## Asunto sugerido

> Solicitud de autorización para uso de obra musical en un videojuego pixel
> art sobre Triana

---

## Cuerpo del email

> Estimados [Cantores de Híspalis / nombre del editor musical]:
>
> Me llamo Luisao y estoy desarrollando, como proyecto personal y sin ánimo
> de lucro inicial, un pequeño videojuego pixel art retro titulado **"La
> Cucaña Trianera"**, inspirado en la tradicional Velá de Santa Ana y en la
> Cucaña del Guadalquivir. El juego es un homenaje a Triana, a su gente y
> a sus tradiciones, y está pensado como una experiencia breve, gratuita y
> familiar.
>
> Para la pantalla del menú principal he creado una **adaptación instrumental
> en estilo 8/16 bits** (recreada con el sintetizador online BeepBox) de la
> sevillana **«[TÍTULO EXACTO DE LA SEVILLANA]»**, interpretada
> originalmente por **Cantores de Híspalis** en su álbum **«[ÁLBUM]»**
> ([AÑO]). La adaptación reinterpreta la melodía con sonidos chip-tune
> retro, sin voz, durante el tiempo que el jugador permanece en el menú
> principal del juego.
>
> Soy consciente de que la composición original tiene derechos de autor y
> de que el uso de una versión derivada como banda sonora requiere
> autorización de los titulares. Por ello les escribo para **solicitar
> formalmente su permiso** antes de publicar el juego en las tiendas
> oficiales de Apple App Store y Google Play.
>
> Mis intenciones:
>
> - **Modelo gratuito.** El juego se distribuirá de forma totalmente
>   gratuita, sin publicidad ni compras integradas.
> - **Atribución.** Su autoría aparecerá visible y destacada en la pantalla
>   de créditos del juego, junto con cualquier texto adicional que
>   indiquen.
> - **No-comercial.** No habrá explotación comercial de la obra: ni venta,
>   ni licencia a terceros, ni uso fuera del propio juego.
> - **Reversible.** Si lo prefieren, sustituiré la música por una
>   composición original inspirada en el folclore sin reclamación alguna.
>
> Sería un honor enormemente especial contar con su autorización para
> rendir, a través de este pequeño juego, un pequeño homenaje a Triana y
> al espíritu de la Velá.
>
> Quedo a su disposición para cualquier aclaración, gestión administrativa
> o ajuste que consideren oportuno (incluida la posibilidad de un acuerdo
> de licencia formal si fuera necesario).
>
> Un cordial saludo,
>
> **Luisao**
> Desarrollador y autor de *La Cucaña Trianera*
> luisaodeben@gmail.com
> Web del juego: [URL de Vercel del juego]
> Política de privacidad: [URL de privacy.html]

---

## Adjuntos recomendados

- Una captura del juego (Pantalla de inicio con el título).
- Si es posible, un MP3 corto (10-15 s) de la adaptación BeepBox actual.
- La URL para probar la versión web del juego.

---

## Notas internas

- Guardar **copia escrita** de cualquier respuesta. Apple/Google pueden
  requerir prueba de autorización si se dispara una reclamación.
- Si llega autorización, **archivarla** en `docs/legal/` (no subir al repo
  público si contiene datos personales).
- Actualizar `CREDITS.md` y la `CreditsScene` retirando la advertencia
  "pendiente de autorización" y añadiendo el texto exacto que pidan.
- Si la respuesta es negativa o silencio prolongado, sustituir el archivo
  `public/assets/audio/intro.wav` (o el track de música del menú actual)
  por una composición original y actualizar créditos.
