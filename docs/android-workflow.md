# Android — flujo de trabajo

Referencia rápida para publicar y actualizar la app en Google Play.

## Instalación (una sola vez, por máquina)

1. Android Studio: https://developer.android.com/studio
2. Al arrancar Android Studio, aceptar la descarga del **Android SDK** y del **Android SDK Command-line Tools** (te lo propone en un asistente).
3. En este proyecto: `npm install` (las dependencias JS ya están en `package.json`).
4. La ruta del SDK va en `android/local.properties`, gitignored. Android Studio la genera sola al abrir el proyecto por primera vez.

## Ciclo diario — probar cambios en el móvil

Cada vez que cambies código del juego y quieras verlo en el móvil o simulador:

```bash
npm run build          # regenera dist/
npx cap sync android   # copia dist/ dentro de android/ y refresca plugins
npx cap open android   # abre Android Studio con el proyecto listo
```

En Android Studio: elige un emulador (o conecta un móvil por USB con
"Depuración USB" activa en Opciones de desarrollador) y pulsa **Run ▶**.

## Regenerar iconos y splash

Si cambia el logo o quieres afinar el splash:

```bash
# El master vive en assets/icon.png (1024×1024, transparencia opcional)
npx @capacitor/assets generate --assetPath assets
```

Genera de golpe todas las densidades para Android, iOS y PWA. Después
`npx cap sync` para propagar.

## Build de release (.aab firmado para Google Play)

Antes: crear el **keystore** una sola vez (guárdalo fuera del repo,
copia en OneDrive/iCloud/Bitwarden — si lo pierdes no puedes publicar
actualizaciones jamás):

```bash
keytool -genkey -v \
  -keystore ~/cucana-release.keystore \
  -alias cucana \
  -keyalg RSA -keysize 2048 -validity 10000
```

Referenciar el keystore desde el proyecto (crear `android/keystore.properties`
con las credenciales; el archivo está gitignored):

```
storeFile=/Users/luisao/cucana-release.keystore
storePassword=***
keyAlias=cucana
keyPassword=***
```

Y en `android/app/build.gradle` cargar esas credenciales en el
`signingConfig` de release (lo dejaremos preparado cuando toque).

Build:

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

Subir el `.aab` a Google Play Console → Producción → Nueva versión.

## Versionado

Google Play requiere subir cada versión con `versionCode` mayor que la
anterior (entero, +1 en cada release) y `versionName` legible
(`1.6.0`). Ambos viven en `android/app/build.gradle` (bloque
`defaultConfig`) y hay que subirlos manualmente antes de cada
`bundleRelease` — o mejor, escribir un script que los tome de
`package.json`.
