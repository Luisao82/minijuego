# App Privacy — hoja de respuestas para App Store Connect

Documento operativo para rellenar la sección **App Privacy** de La Cucaña
Trianera en App Store Connect. Basado en el estado del código a la 1.5.1 y en
`PRIVACY.md`.

Última revisión: 2026-07-09 (v1.5.1).

## Dónde

App Store Connect → tu app → sidebar **App Information → App Privacy** →
**Get Started / Manage**.

## Privacy Policy URL

```
https://minijuego-lilac.vercel.app/privacy.html
```

## Data Collection

Pregunta inicial: **"Do you or your third-party partners collect data from
this app?"** → **YES**.

Motivo: Sentry envía crash reports a `sentry.io` cuando ocurre un error. Aunque
no recoge datos personales identificables, "collect" en la definición de Apple
incluye cualquier transmisión de datos a un servidor externo.

### Categorías a MARCAR

| Categoría   | Subtipo               | Marcar |
| ----------- | --------------------- | ------ |
| Diagnostics | Crash Data            | ✅     |
| Diagnostics | Other Diagnostic Data | ✅     |

### Todas las demás — NO marcar

Contact Info · Health & Fitness · Financial Info · Location · Sensitive Info ·
Contacts · User Content · Browsing History · Search History · Identifiers ·
Purchases · Usage Data · Diagnostics → Performance Data · Other Data.

## Detalle de cada tipo marcado

Aplicar las **mismas 3 respuestas** a **Crash Data** y a **Other Diagnostic
Data**:

### 1. How is this data used? (Purposes)

Marcar SOLO:

- ✅ **App Functionality**

NO marcar: Analytics · Developer's Advertising or Marketing · Third-Party
Advertising · Product Personalization · Other Purposes.

### 2. Is this data linked to the user's identity?

- ✅ **No, [...] is not linked to the user's identity**

Motivo: no hay login, ni user ID, ni email, ni identificador de dispositivo
transmitido. La IP se procesa solo para anti-abuso y Sentry no la almacena de
forma vinculable.

### 3. Do you or your third-party partners use this data for tracking?

- ✅ **No, we do not use this data for tracking purposes**

Motivo: no se combina con datos de otras apps ni se comparte con data brokers.

## Publish

Guardar y publicar. Puedes editarlo tantas veces como quieras hasta enviar el
binario a revisión (y también después, con submit nuevo).

## Resultado en la ficha pública

La sección "App Privacy" de la ficha mostrará:

> **Data Not Linked to You**
> The following data may be collected but it is not linked to your identity:
>
> - Diagnostics

## Coherencia con PRIVACY.md

`PRIVACY.md` sección 2 dice "no recoge datos personales identificables" →
coincide con **Not Linked to You**.

`PRIVACY.md` sección 4.1 detalla que Sentry recibe stack trace + user agent +
versión + escena + IP no identificable → coincide con **Crash Data + Other
Diagnostic Data · App Functionality · No linked · No tracking**.

Si Apple revisa ambos, no hay contradicciones.

## Si cambia el código en el futuro

Antes de un nuevo submit revisar:

- ¿Se ha añadido analytics (Google Analytics, Firebase, Amplitude)? → añadir
  **Usage Data → Product Interaction** y purpose **Analytics**.
- ¿Se ha añadido login/cuenta? → añadir **Contact Info** y **Identifiers**.
- ¿Se ha añadido publicidad? → añadir **Usage Data → Advertising Data** con
  purpose **Third-Party Advertising**.
- ¿Se ha añadido compartir ubicación? → añadir **Location**.

Nada de esto está previsto ahora mismo.
