# Flujo de publicación iOS — La Cucaña Trianera

> **Para futuro-tú.** Este documento explica cómo publicar una nueva versión de
> la app en la App Store desde cero, sin acordarte de nada. Léelo entero la
> primera vez; después basta con la sección **TL;DR**.

---

## TL;DR — Publicar una nueva versión (el flujo de siempre)

Ya con todo configurado (ver "Setup one-time" más abajo), publicar una versión
nueva es **7 pasos**:

```bash
# 1. Rama de feature (nunca tocar main directo)
git checkout -b feature/mi-cambio

# 2. Cambios en el código (VSCode) → commit → push → PR → merge a main

# 3. Volver a main actualizado
git checkout main && git pull

# 4. Rama de release para bump de versión
git checkout -b chore/release-1.8.0
```

En esa rama:

- **`package.json`** — subir `version` a la nueva (ej. `1.7.0` → `1.8.0`).
- **`CHANGELOG.md`** — mover el bloque `## [Unreleased]` a
  `## [1.8.0] — YYYY-MM-DD` (dejar un `[Unreleased]` vacío encima).
- **`ios/App/App.xcodeproj/project.pbxproj`** — subir `MARKETING_VERSION` a la
  nueva (aparece dos veces: Debug y Release). El `CURRENT_PROJECT_VERSION` no
  hace falta tocarlo — CI lo sobreescribe con el nº de run automáticamente.

```bash
# 5. Commit + PR + merge a main
git add package.json CHANGELOG.md ios/App/App.xcodeproj/project.pbxproj
git commit -m "chore(release): bump to 1.8.0"
gh pr create --title "chore(release): 1.8.0" --body "Bump version + changelog"
# ...revisar, mergear a main desde GitHub...

# 6. Tras merge, taggear main y push del tag
git checkout main && git pull
git tag v1.8.0
git push origin v1.8.0
```

- **7.** GitHub Actions arranca solo → tab **Actions** en GitHub → esperar
  a que el workflow **iOS Release** termine (10–20 min). Al final el build
  aparece en **App Store Connect → TestFlight** procesándose (5–30 min más).

Cuando aparece en TestFlight ya se puede:

- Instalar en tu iPhone via TestFlight para probar.
- Ir a App Store Connect → tu app → **iOS App → +** (versión nueva) → poner
  release notes → seleccionar el build → **Submit for Review**.

---

## Por qué existe este flujo

Tu Mac es un **MacBook Air 2018**. macOS Sequoia 15 no lo soporta, así que el
tope de macOS local es Sonoma 14, y con Sonoma el tope de Xcode es 16. **Apple
exige Xcode 26 / SDK iOS 26 para subir a App Store desde 2026-04.** Por eso ni
`Archive` ni `Distribute App` desde tu Xcode 16 funcionan: la validación falla
con "SDK version issue".

Solución: los runners `macos-latest` de GitHub Actions vienen con **Xcode 26
preinstalado** y son **gratis**. El workflow
`.github/workflows/ios-release.yml` hace en la nube lo que antes hacías tú a
mano en Xcode: build web → cap sync → xcodebuild archive → export IPA →
upload a App Store Connect.

---

## Setup one-time (ya hecho el 2026-07-11)

Estos pasos **ya están hechos**. Se documentan por si hay que rehacerlos algún
día (Mac nuevo, cuenta rotada, etc.).

### 1. Crear una App Store Connect API Key

1. Entrar en <https://appstoreconnect.apple.com> → **Users and Access**.
2. Pestaña **Integrations** → **App Store Connect API** → **Team Keys** →
   botón **Generate API Key** (o el `+`).
3. Nombre sugerido: `github-actions-ios-release`.
4. Access: **App Manager** (suficiente para subir builds).
5. Al pulsar **Generate** aparece el key en la lista con:
   - **Key ID** — código corto tipo `ABCD1234EF`.
   - **Issuer ID** — UUID que aparece arriba de la tabla (idéntico para todas
     las keys del team).
6. **Descargar el `.p8`** (botón _Download API Key_). **Solo se puede descargar
   una vez.** Guárdalo en un sitio seguro (1Password, Vault, etc.) — si lo
   pierdes hay que generar una key nueva.

### 2. Añadir los secrets al repo de GitHub

En <https://github.com/> → tu repo → **Settings → Secrets and variables →
Actions → New repository secret**. Crear tres:

| Secret                            | Valor                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `APP_STORE_CONNECT_API_KEY_ID`    | El Key ID (`ABCD1234EF`)                                                                                               |
| `APP_STORE_CONNECT_API_ISSUER_ID` | El Issuer ID (UUID)                                                                                                    |
| `APP_STORE_CONNECT_API_KEY_P8`    | **El contenido completo del `.p8`** (incluidas las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`) |

Para el tercero: abre el `.p8` con cualquier editor de texto y **pega tal cual
todo el contenido** (con saltos de línea) en el valor del secret.

### 3. Registrar el App ID en developer.apple.com

Solo hace falta si es la primera vez que subes esta app:

1. <https://developer.apple.com/account/resources/identifiers>.
2. **+** → **App IDs** → **App** → Continue.
3. Description: `La Cucaña Trianera`.
4. Bundle ID: **Explicit** → `com.cucana.trianera`.
5. Capabilities: dejar por defecto (no usamos push, iCloud, etc.).
6. Continue → Register.

### 4. Crear la ficha inicial en App Store Connect

También solo la primera vez:

1. <https://appstoreconnect.apple.com> → **My Apps** → **+** → **New App**.
2. Platform: **iOS**.
3. Name: `La Cucaña Trianera`.
4. Primary Language: **Spanish (Spain)**.
5. Bundle ID: `com.cucana.trianera` (dropdown, sale del paso 3).
6. SKU: `cucana-trianera-ios` (interno, no visible al usuario, no se puede
   cambiar).
7. User Access: **Full Access**.
8. Create.

Después rellenar la ficha con los textos ya redactados en
[`docs/app-store-listing-copy.md`](./app-store-listing-copy.md):

- Subtítulo, promotional text, descripción, keywords, categorías.
- **Privacy Policy URL:** `https://minijuego-lilac.vercel.app/privacy.html`.
- **Support URL:** `https://minijuego-lilac.vercel.app/support.html`.
- **App Privacy:** rellenar según [`docs/app-store-privacy-checklist.md`](./app-store-privacy-checklist.md).
- **Screenshots:** subir los de `public/assets/store/screenshots/iphone-6.7/` y
  `public/assets/store/screenshots/ipad-13/`.
- **App Icon 1024×1024:** `public/assets/store/icon-1024.png`.

---

## El workflow por dentro (qué hace `.github/workflows/ios-release.yml`)

Cuando pusheas un tag `vX.Y.Z`, el runner ejecuta en orden:

1. **Checkout** del código.
2. **Setup Node 24** + `npm ci`.
3. **`npm run build`** → genera `dist/`.
4. **`npx cap sync ios`** → copia `dist/` a `ios/App/App/public/` y actualiza
   Pods.
5. **Instala la API Key** del secret en `~/.appstoreconnect/private_keys/`.
6. **`xcodebuild archive`** con:
   - `-allowProvisioningUpdates` + credenciales de API Key → firma automática.
   - `CURRENT_PROJECT_VERSION=<github.run_number>` → build number único
     monotónico. Esto es importante: **cada archive necesita un build number
     distinto** o App Store Connect rechaza el upload. Al derivarlo del
     `github.run_number`, nunca colisiona.
7. **Export IPA** con `ExportOptions.plist` (`method: app-store-connect`,
   `signingStyle: automatic`).
8. **Upload a App Store Connect** con `xcrun altool --upload-app`.
9. **Sube el `.ipa` como artifact** de GitHub (retención 14 días) por si hay
   que descargarlo para depurar.

**Cómo se dispara:**

- `git push origin vX.Y.Z` (tag SemVer).
- O manual desde **Actions → iOS Release → Run workflow** (útil para retriggerear).

---

## Después del upload — App Store Connect

Cuando el workflow acaba OK:

1. **Espera 5–30 min.** Apple procesa el build (validación de firma, escaneo
   de bugs conocidos). Recibes un email cuando termina.
2. **App Store Connect → tu app → TestFlight** — ahí aparece el build. Si
   pide info sobre compliance de encriptación, marcar **No** (no usamos
   criptografía custom más allá de la de HTTPS/iOS, que está exenta).
3. **Prueba en TestFlight** desde tu iPhone antes de mandar a review.
4. Si todo bien: **iOS App** (columna izquierda de la ficha) → botón **+
   Version** → poner **What's New in This Version** (release notes) →
   scroll hasta **Build** → click **Select a build before you submit your
   app** → elegir el build subido → **Save**.
5. **Submit for Review**. Tarda entre 24h y 3 días.

---

## Troubleshooting

### El workflow falla en el paso Archive

- **`No signing certificate "iOS Distribution" found`** — la API Key no tiene
  permisos suficientes. Regenerar con role **App Manager** o **Admin**.
- **`No profiles for 'com.cucana.trianera' were found`** — falta el App ID en
  developer.apple.com (ver Setup, paso 3).
- **`Invalid bundle. The "UISupportedInterfaceOrientations"...`** — ya
  arreglado con `UIRequiresFullScreen = true` en `Info.plist` (fecha del fix:
  2026-07-11). Si vuelve a salir, verifica que la clave sigue ahí.

### El upload sube pero App Store Connect rechaza el build

Revisar el email de Apple. Errores típicos:

- **`ITMS-90XXX` sobre build number ya usado** — muy raro con nuestro esquema
  de `github.run_number`, pero puede pasar si borras y recreas el repo.
  Solución: bumpear MARKETING_VERSION patch y re-tag.
- **Missing compliance** — al abrir el build en TestFlight aparece "Missing
  Compliance". Contestar el cuestionario de encriptación (típicamente
  todo _No_).

### El workflow falla en Sync (`pod install` con error de UTF-8)

Localmente pasaba, en CI no debería. Si vuelve a pasar añadir al workflow:

```yaml
- name: Fix locale
  run: |
    echo "LANG=en_US.UTF-8" >> $GITHUB_ENV
    echo "LC_ALL=en_US.UTF-8" >> $GITHUB_ENV
```

Ya está incluido a nivel de job.

### Necesito ver logs detallados de `xcodebuild`

En GitHub Actions → run fallido → expandir el step "Archive" o "Export IPA".
Los logs completos aparecen ahí. También puedes descargar el artifact del
IPA (si llegó a generarse) desde la pestaña _Summary_ del run.

### Rotar la API Key (si la key vencida o comprometida)

1. En App Store Connect → Users and Access → Integrations → **Revoke** la
   antigua.
2. Generar una nueva (mismo procedimiento del Setup, paso 1).
3. Actualizar los tres secrets del repo en GitHub.
4. Volver a lanzar el workflow (Actions → Run workflow).

---

## Ficheros clave (dónde vive cada cosa)

| Archivo                                 | Qué contiene                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `.github/workflows/ios-release.yml`     | El pipeline de CI que compila y sube.                                          |
| `.github/workflows/ci.yml`              | Lint + tests + build web en cada PR (no toca iOS).                             |
| `package.json`                          | Versión visible pública. Debe coincidir con `CHANGELOG.md`.                    |
| `CHANGELOG.md`                          | Historia de cambios en formato Keep a Changelog.                               |
| `capacitor.config.json`                 | `appId`, `appName`, `webDir`. Casi nunca cambia.                               |
| `ios/App/App.xcodeproj/project.pbxproj` | Config Xcode. Aquí vive `MARKETING_VERSION` y `DEVELOPMENT_TEAM` (35NYHC9DG4). |
| `ios/App/App/Info.plist`                | Orientaciones, status bar, `UIRequiresFullScreen`.                             |
| `docs/app-store-listing-copy.md`        | Textos de la ficha (subtítulo, descripción, keywords, notes).                  |
| `docs/app-store-privacy-checklist.md`   | Respuestas a la sección App Privacy.                                           |
| `public/assets/store/`                  | Icono 1024, screenshots y feature graphic.                                     |
| `public/privacy.html`                   | Política de privacidad hosteada en Vercel.                                     |
| `public/support.html`                   | Página de soporte hosteada en Vercel.                                          |

---

## Anexo — Versionado y build numbers, aclaración

- **MARKETING_VERSION** (`1.7.0`, `1.8.0`...) — la que ve el usuario en la
  ficha de la App Store y en Ajustes. Sube por SemVer:
  - **MAJOR** — cambios drásticos, hitos.
  - **MINOR** — features nuevas.
  - **PATCH** — bug fixes / pulido.
- **CURRENT_PROJECT_VERSION** (`3`, `47`, `128`...) — build number interno.
  App Store Connect exige que sea **monotónicamente creciente** dentro de la
  misma MARKETING_VERSION (y por seguridad lo hacemos siempre creciente). Lo
  gestiona CI vía `github.run_number` — **no lo edites a mano**. El valor que
  ves en `project.pbxproj` es solo para builds locales de debug; el que va a
  la tienda lo pone CI.

Coste normal en GitHub Actions: ~20 min de macOS por release. Con 2000
min/mes gratis en cuentas privadas y ilimitados en repos públicos, esto no
consume presupuesto.

---

## Android

Este workflow es solo iOS. Cuando se publique en Google Play, replicar el
mismo patrón en `.github/workflows/android-release.yml`. Ver
[`docs/android-workflow.md`](./android-workflow.md) para los pasos previos
(Play Console, keystore, etc.).
