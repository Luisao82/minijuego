# TODO — La Cucaña Trianera
> Hoja de ruta hacia el producto final. Actualizar este documento tras cada sesión de trabajo.

---

## 🎮 Contenido del juego

### Premios
- [ ] Diseñar y añadir nuevos premios (imagen + nombre + probabilidad en `rewards.json`)
- [ ] Revisar balance de probabilidades con los nuevos premios

### Mapa de Sevilla
- [ ] Añadir más puntos de interés con foto a las piezas existentes del mapa
- [ ] Completar las piezas que aún no tienen ningún punto asignado
- [ ] Revisar descripciones de los puntos existentes

### Personajes y skins
- [ ] Valorar añadir nuevos personajes
- [ ] Valorar añadir nuevos skins a los personajes existentes
- [ ] Revisar condiciones de desbloqueo y si son equilibradas

---

## 🔊 Sonido

- [ ] Añadir música de fondo (menú, juego, historia)
- [ ] Revisar y completar efectos de sonido existentes (click, hit, chapuzón, victoria)
- [ ] Añadir sonido al saltar en el pódium de StatsScene
- [ ] Valorar sonido ambiente en la pantalla de juego (río, multitud)

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

- [ ] Icono de la app en todos los tamaños requeridos (1024×1024 base, varios derivados)
- [ ] Imagen de portada / feature graphic para Google Play (1024×500)
- [ ] Capturas de pantalla representativas del juego (tutorial, partida, premios, mapa)
- [ ] Vídeo de presentación opcional (30 s) para App Store / Play Store

---

## ⚖️ Legal

- [ ] Redactar Política de privacidad (aunque no se recogen datos personales, Apple la exige)
- [ ] Revisar licencias de fuentes usadas (Jersey 10, Press Start 2P — Google Fonts, OFL)
- [ ] Revisar licencias de assets de audio
- [ ] Valorar añadir créditos en el juego

---

## 🔗 Compartir y viralidad

- [ ] Botón "Compartir resultado" al ganar o perder (Web Share API en móvil)
- [ ] Imagen de preview generada dinámicamente con la puntuación para compartir
- [ ] Revisar y validar previews de Open Graph al compartir el enlace

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

*Última actualización: 2026-05-21 — v1.0.0*
