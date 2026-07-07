# Política de privacidad — La Cucaña Trianera

**Última actualización:** 2026-07-06
**Versión de la aplicación:** 1.4.5

Este documento es la **fuente de verdad** de la política de privacidad de la
aplicación _La Cucaña Trianera_. La versión publicada en web
(`public/privacy.html`) y el enlace mostrado dentro de la aplicación
reflejan este mismo contenido.

---

## 1. Responsable del tratamiento

- **Responsable:** Luisao (desarrollador independiente)
- **Contacto:** [luisaodeben@gmail.com](mailto:luisaodeben@gmail.com)
- **Aplicación:** _La Cucaña Trianera_ — minijuego pixel art disponible como
  aplicación web (Vercel) y como aplicación nativa para dispositivos iOS y
  Android (empaquetada con Capacitor).

## 2. Datos personales que recogemos

**Ninguno.** La Cucaña Trianera **no recoge, almacena ni transmite datos
personales identificables** del usuario:

- No se solicita registro ni cuenta.
- No se piden nombre, correo electrónico, edad ni ningún otro dato personal.
- No se accede a contactos, fotos, micrófono, cámara ni ubicación.
- No se utilizan cookies de seguimiento ni identificadores publicitarios.
- No se realiza _fingerprinting_ del dispositivo.
- La aplicación es **gratuita** y **no contiene publicidad ni compras
  integradas**.

## 3. Datos almacenados localmente en tu dispositivo

La aplicación guarda en el **almacenamiento local** de tu dispositivo
(`localStorage` del navegador en la versión web, o su equivalente dentro del
WebView nativo en las versiones móviles) la información necesaria para que el
juego funcione y recuerde tu progreso:

- Estadísticas de partida (intentos, victorias, derrotas, tiempo, premios).
- Personajes y skins desbloqueados.
- Piezas del mapa de Sevilla descubiertas.
- Premios obtenidos y vistos.
- Preferencias de configuración (música activada/silenciada, perspectiva visual
  seleccionada — 2D Triana / 2D Sevilla / primera persona 3D).

Estos datos **nunca abandonan tu dispositivo** y no se sincronizan con ningún
servidor. Si desinstalas la aplicación o limpias el almacenamiento local, esta
información se elimina por completo.

## 4. Servicios de terceros

Para que la aplicación funcione correctamente se utilizan los siguientes
servicios. Ninguno de ellos identifica al usuario por nombre, correo u otro
dato personal.

### 4.1 Sentry (monitorización de errores)

- **Proveedor:** Functional Software, Inc. (Sentry.io).
- **Finalidad:** registrar errores técnicos y caídas de la aplicación para
  corregir bugs. Se activa tanto en la versión web como en la versión nativa.
- **Datos enviados automáticamente al producirse un error:** mensaje y traza
  del error, tipo de navegador o sistema operativo, versión de la aplicación,
  pantalla del juego donde se produjo el fallo y dirección IP (procesada solo
  para prevenir abusos, no almacenada de forma identificable).
- **No** se envía información personal identificable, ni contenido de las
  partidas del usuario, ni datos del almacenamiento local.
- La captura solo se activa cuando ocurre un error real.
- Más información: <https://sentry.io/privacy/>.

### 4.2 Google Fonts (tipografías)

- **Proveedor:** Google Ireland Limited.
- **Finalidad:** cargar las tipografías _Jersey 10_ y _Press Start 2P_ para el
  diseño pixel art del juego. Solo se descargan la primera vez que se abre la
  aplicación web.
- **Datos transmitidos al servidor de Google al cargar la fuente:** dirección
  IP y datos técnicos básicos del navegador.
- En la versión nativa las fuentes se embeben dentro del propio bundle de la
  aplicación, por lo que **no se realiza esta conexión** una vez instalada.
- Más información: <https://policies.google.com/privacy>.

### 4.3 Vercel (alojamiento web)

- **Proveedor:** Vercel Inc.
- **Finalidad:** servir la versión web de la aplicación, este documento y
  cualquier recurso estático (imágenes, audio, código).
- **Datos técnicos registrados por el proveedor:** dirección IP, agente de
  usuario y ruta solicitada, con la única finalidad de servir el contenido y
  prevenir abusos.
- En la versión nativa el bundle está pre-cargado dentro de la propia
  aplicación, por lo que **no se descarga contenido desde Vercel** durante el
  uso normal. Solo se conecta a Vercel si el usuario abre desde la app este
  documento de privacidad, ya que se sirve desde la URL pública oficial.
- Más información: <https://vercel.com/legal/privacy-policy>.

### 4.4 Tiendas de aplicaciones (App Store / Google Play)

Si descargas la aplicación a través de Apple App Store o Google Play, la
tienda correspondiente recopilará sus propios datos según sus políticas
(descargas, versión de sistema operativo, país, valoraciones). La aplicación
en sí no recibe ni accede a esa información.

- Apple: <https://www.apple.com/legal/privacy/>
- Google: <https://policies.google.com/privacy>

### 4.5 Capacitor (framework de empaquetado nativo)

- **Proveedor:** Drifty Co. / Ionic.
- **Finalidad:** empaquetar el juego dentro de una aplicación nativa iOS /
  Android. Capacitor **no recoge datos por su cuenta**; solo proporciona el
  puente entre el código JavaScript del juego y el sistema operativo del
  dispositivo (WKWebView en iOS, WebView en Android).
- **No** se envían datos al proveedor durante el uso normal.
- Más información: <https://capacitorjs.com/privacy>.

## 5. Compartir resultado (Web Share API)

La aplicación incluye un botón "Compartir resultado" que utiliza la **API
nativa de compartición** del dispositivo. Esta función:

- Solo se activa cuando el usuario pulsa explícitamente el botón.
- Genera una imagen con el resultado de la partida que el usuario decide
  enviar o no a través de la aplicación que él mismo seleccione (WhatsApp,
  redes sociales, correo, etc.).
- No envía ningún dato a servidores del desarrollador.

## 6. Permisos del sistema en la versión nativa

La versión iOS de la aplicación **no solicita ningún permiso del sistema**:

- No se pide acceso a cámara, micrófono, ubicación, contactos, fotos ni
  ningún otro dato del dispositivo.
- Solo se utilizan las funciones que no requieren autorización explícita:
  reproducir sonido, mostrar gráficos a pantalla completa y guardar
  preferencias localmente.

## 7. Menores de edad

La aplicación es apta para todos los públicos (clasificación **4+** en App
Store, equivalente PEGI 3 en Europa) y no recoge datos personales, por lo que
su uso por parte de menores no implica recogida de información sujeta a
normativas como RGPD-K, COPPA o LOPDGDD.

## 8. Derechos del usuario

Aunque no tratamos datos personales identificables, en cumplimiento del
**Reglamento (UE) 2016/679 (RGPD)** y la **Ley Orgánica 3/2018 (LOPDGDD)**,
puedes ejercer en cualquier momento los siguientes derechos contactando con
el responsable en [luisaodeben@gmail.com](mailto:luisaodeben@gmail.com):

- Acceso, rectificación y supresión.
- Limitación y oposición al tratamiento.
- Portabilidad.
- Presentar reclamación ante la Agencia Española de Protección de Datos
  (<https://www.aepd.es>).

Para borrar tus datos de juego basta con desinstalar la aplicación o limpiar
el almacenamiento local del navegador.

## 9. Cambios en esta política

Esta política puede actualizarse si se modifican las funcionalidades o
servicios utilizados. La versión vigente siempre será la publicada en la URL
oficial <https://minijuego-lilac.vercel.app/privacy.html>, indicando la fecha
de última actualización y la versión de la aplicación en la cabecera.

Las versiones anteriores permanecen en el historial de Git público del
proyecto (<https://github.com/Luisao82/minijuego>) para consulta y
trazabilidad.

## 10. Contacto

Para cualquier consulta sobre esta política, puedes escribir a:

**Luisao** — [luisaodeben@gmail.com](mailto:luisaodeben@gmail.com)
