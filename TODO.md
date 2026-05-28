# TODO — La Cucaña Trianera
> Hoja de ruta hacia el producto final. Actualizar este documento tras cada sesión de trabajo.

---

## 🎮 Contenido del juego

### Premios
- [x] Diseñar y añadir nuevos premios (imagen + nombre + probabilidad en `rewards.json`)
- [x] Revisar balance de probabilidades con los nuevos premios

### Mapa de Sevilla
- [ ] Añadir más puntos de interés con foto a las piezas existentes del mapa
- [ ] Completar las piezas que aún no tienen ningún punto asignado
- [ ] Revisar descripciones de los puntos existentes

### Personajes y skins
- [x] Valorar añadir nuevos personajes
- [x] Valorar añadir nuevos skins a los personajes existentes
- [x] Revisar condiciones de desbloqueo y si son equilibradas

---

## 🔊 Sonido

- [x] Añadir música de fondo (menú, juego, historia)
- [x] Revisar y completar efectos de sonido existentes (click, hit, chapuzón, victoria)
- [x] Añadir sonido al saltar en el pódium de StatsScene
- [x] Valorar sonido ambiente en la pantalla de juego (río, multitud)

---

## 📄 Documentación interna

- [ ] Completar `auditoria.md` — revisar los puntos pendientes y cerrarlos
- [ ] Mantener `GDD.md` actualizado con cada nueva decisión de diseño
- [ ] Mantener `CHANGELOG.md` al día en cada publicación

---

## 📱 Publicación — App Store (iOS)

- [ ] Crear cuenta de Apple Developer ($99/año)
- [ ] Configurar bundle ID, permisos y metadatos en Xcode
- [ ] Generar certificados y provisioning profiles
- [ ] Encapsular la app con Capacitor para iOS (`npx cap build ios`)
- [ ] Preparar capturas de pantalla en los tamaños requeridos por Apple (6.9", 6.5", 12.9")
- [ ] Redactar descripción, palabras clave y categoría en App Store Connect
- [ ] Crear y publicar **Política de privacidad** (obligatoria, aunque no se recojan datos)
- [ ] Enviar para revisión a Apple

---

## 🤖 Publicación — Google Play Store (Android)

- [ ] Crear cuenta de Google Play Developer ($25 único)
- [ ] Encapsular la app con Capacitor para Android (`npx cap build android`)
- [ ] Generar APK / AAB firmado
- [ ] Preparar capturas de pantalla para Google Play (teléfono + tablet)
- [ ] Redactar ficha de la app (descripción, categoría, clasificación de contenido)
- [ ] Vincular la misma Política de privacidad
- [ ] Enviar para revisión

---

## 🎨 Assets de tiendas

- [x] Icono de la app en todos los tamaños requeridos (1024×1024 base + 30 derivados iOS/Android/PWA/favicon en `public/assets/store/icons/`)
- [x] Imagen de portada / feature graphic para Google Play (1024×500 — `public/assets/store/feature-graphic-1024x500.png`)
- [x] Capturas de pantalla representativas del juego (5 capturas × 3 formatos: iPhone 6.7", iPad 13", Google Play / PWA — en `public/assets/store/screenshots/`)
- [ ] Vídeo de presentación opcional (30 s) para App Store / Play Store

---

## ⚖️ Legal

- [x] Redactar Política de privacidad (`PRIVACY.md` + `public/privacy.html` listos para Vercel)
- [x] Revisar licencias de fuentes usadas (Jersey 10 y Press Start 2P — OFL 1.1, atribuidas en `CREDITS.md`)
- [x] Revisar licencias de assets de audio (SFX propios con jsfxr/CC0; música del menú ⚠️ pendiente de autorización — ver `docs/email-cantores-hispalis.md`)
- [x] Créditos en el juego (`CreditsScene` accesible desde el menú por el icono ©)
- [x] Sustituir `LICENSE` del template Phaser Studio por licencia propietaria de Luisao
- [x] Limpiar `package.json` (autor, licencia, eliminar refs del template)
- [ ] **Bloqueante de publicación:** contactar con los titulares de Cantores de Híspalis para autorizar la sevillana adaptada del menú (o sustituirla por una composición original)

---

## 🔗 Compartir y viralidad

- [x] Botón "Compartir resultado" al ganar o perder (Web Share API en móvil)
- [x] Imagen de preview generada dinámicamente con la puntuación para compartir
- [x] Revisar y validar previews de Open Graph al compartir el enlace

---

## ⚙️ Calidad y balance

- [ ] Ajuste fino de dificultad con feedback real de jugadores:
  - Velocidad de oscilación del palo en fase de equilibrio
  - Duración y cantidad de aceite
  - Ventana de tiempo para saltar en fase 3
- [ ] Tests en dispositivos reales (iOS y Android) — rendimiento y controles táctiles
- [ ] Revisar comportamiento offline (PWA con service worker)
- [ ] Validar que el easter egg sigue funcionando tras los cambios recientes

---

## 🐛 Bugs conocidos / deuda técnica

- [ ] Revisar y cerrar los puntos pendientes de `auditoria.md`
- [ ] Revisar memory leaks detectados en `audit/memory-leaks-base-scene`
- [ ] Optimización de assets pendiente (`audit/optimize-assets`)

---

*Última actualización: 2026-05-28 — v1.0.0*
