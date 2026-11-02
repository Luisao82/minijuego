# Hoja de ruta — tabla, bandera y máquina recreativa

Dónde estamos y qué queda, en orden. Cada paso dice de qué depende.
Los diseños 3D están todos enlazados en [Archivos 3D](#archivos-3d) para abrirlos al mandarlos a imprimir.

Leyenda: ✅ hecho · 🔧 en curso · ⏳ pendiente · ❓ falta decidir

---

## Dónde estamos (noviembre 2026)

- ✅ **Placa perforada de la tabla** soldada y funcionando con [`firmware/p5_tabla`](firmware/p5_tabla/p5_tabla.ino): ESP32-S3 + MPU6050, LED de estado, botón CAL, microrruptor y borne BANDERA.
- ✅ **Bluetooth validado**: 50 paquetes/s, ≈16 ms de latencia, sin pérdidas.
- ✅ **Modos de control en el juego** (solo en el laboratorio, rama `feature/modos-control`): control por velocidad para la tabla y calibración por modo.
- ✅ **Placa de la caja de la bandera** (2 × 8 cm) soldada y probada con [`firmware/util_prueba_bandera`](firmware/util_prueba_bandera/util_prueba_bandera.ino): servo + micro + 5 V aparte.
- ✅ **Mecanismo de la bandera diseñado** en OpenSCAD ([`bandera/mecanismo_bandera.scad`](bandera/mecanismo_bandera.scad)): brazo con aspa que solo empuja, goma, topes, imanes y bandera de espuma Ø25.
- ✅ **Concepto de la máquina** en 3D ([modelo de la máquina](maquina/maquina-cucana.html)).
- 🔧 **Pieza de prueba de encaje** de la caja ([`caja/prueba_encaje.scad`](caja/prueba_encaje.scad)), con huecos para GX12, jack, LED, pulsador, USB-C, interruptor KCD1 y tuercas: falta imprimirla y apuntar las medidas buenas (tolerancias de la resina).
- ✅ **Alimentación de la tabla**: portapilas de 4 × AA en una fila con interruptor cuadrado KCD1.

---

## Pasos

### 1. Conectores de las cajas ⏳
Que las cajas se conecten y desconecten sin soldar ni abrir nada.

- ⏳ Elegir el conector del cable de 3 hilos **caja del giroscopio ↔ caja de la bandera** (propuesta: GX12 de 3 pines, rosca, no se suelta con tirones).
- ⏳ Elegir el conector de la **alimentación de 5 V del servo** en la caja de la bandera (propuesta: jack DC 5,5 × 2,1 o USB-C de panel).
- 🔧 La pieza de prueba de encaje ya lleva huecos para el **GX12** (Ø11,8–12,8) y el **KCD1**. Falta comprar el GX12 y elegir el conector de 5 V de la caja de la bandera (cuando se elija, se añade su hueco).
- ⏳ **(nuevo)** Prever el **cable entre el palo, que se balancea, y la repisa**: largo de sobra, alivio de tensión en las dos cajas y por dónde va para que no lo pise el jugador.

Depende de: nada. Bloquea: 2 y 3.

### 2. Caja del giroscopio ⏳
Dos versiones del mismo diseño paramétrico: una para la placa perforada actual y otra para la futura PCB.

- ✅ Alimentación: **portapilas de 4 × AA en una fila** dentro de la caja, con **interruptor cuadrado KCD1** en la caja.
- ✅ Portapilas: **63 × 58 × 15 mm**, cables por un lado de 63 mm.
- ✅ Caja **plana** (portapilas al lado de la placa, unos 14 × 8 × 4 cm), montada **debajo de la tabla** para que no se pueda pisar. Nada metálico encima, debajo ni pegado al extremo de la antena del ESP32.
- 🔧 En el extremo de la tabla que mira a la máquina, al lado de la quilla, con la cara de mandos (KCD1, LED, CAL, USB-C, GX12) hacia fuera. Lejos del rodamiento del extremo.
- ⏳ Medir la altura de la placa montada y anotar hacia qué lado queda la antena.
- ⏳ Imprimir la prueba de encaje y fijar tolerancias (GX12, jack, LED, pulsador, USB-C, KCD1, tuercas).
- ⏳ Diseño 3D de la caja **para la placa perforada**: placa, portapilas, interruptor KCD1, botón CAL, LED, jack del micro, conector de la bandera y ventana USB-C.
- ⏳ Visor 3D realista para revisarla antes de imprimir.
- ⏳ PCB en Aisler (KiCad) y versión de la caja **para la PCB**.

Depende de: 1 (conectores) y la prueba de encaje.

### 3. Caja de la bandera ⏳
Se queda la placa perforada actual (sin PCB).

- 🔧 Mecanismo: [`bandera/mecanismo_bandera.scad`](bandera/mecanismo_bandera.scad). Primero imprimir el **montaje de prueba** (placa + brazo + base + rodillo) y probarlo atornillado a un listón.
- ⏳ Medir y ajustar en el `.scad`: separación de agujeros del micro, distancia agujero ↔ palanca y radio del agujero del aspa.
- ⏳ Comprar: **MG90S** de engranajes metálicos ([Miuzei, 2 uds](https://www.amazon.es/dp/B0C1NCVS6J)), espuma de polietileno Ø25 × 153, imanes Ø6 × 3, tornillo M4 × 30 + autoblocante, M2, fieltro, gomas.
- ⏳ Caja completa de 37 × 11 × 6 cm para empotrar en la repisa: placa del mecanismo, placa perforada, conectores y **ranura lateral de al menos 32 mm** (para que pase la espuma). No cabe entera en la impresora (153 × 87 mm): o va en piezas o es de madera con el mecanismo impreso dentro.

Depende de: 1. Se puede probar el mecanismo ya.

### 4. Firmware con la bandera ⏳
Hoy van por separado `p5_tabla` (tabla) y `util_prueba_bandera` (bandera).

- ⏳ Juntar en un firmware (p6): servo en GPIO 17 y micro de la bandera en GPIO 18, sin bloquear la lectura del giroscopio.
- ⏳ **(nuevo)** Ampliar el **protocolo BLE**: el juego manda «subir bandera» (característica de escritura) y la tabla avisa «bandera cogida» (un bit en `flags` y un contador, como el del botón).
- ⏳ **(nuevo)** Seguridad del servo: soltar el servo en cuanto se coge la bandera y no repetir el ciclo si la bandera no está puesta.
- ⏳ Probar latencias del ciclo completo: salto en pantalla → bandera arriba → agarre → juego.

Depende de: 3 (mecanismo probado). Bloquea: 5.

### 5. Juego: coger la bandera física ⏳
Con cuidado: tocar la mecánica afecta a las otras ramas (`feature/gps-challenge` también modifica `BaseGameScene.js`).

- ⏳ Al saltar con tabla + bandera física: el juego manda «subir bandera» y gana si llega «bandera cogida» dentro de la ventana de tiempo.
- ⏳ Sin tabla, o con tabla sin bandera física: se mantiene tocar la pantalla.
- ❓ Aviso en pantalla de «¡coge la bandera!»: destellos, marco rojo alrededor de la bandera… (pixel art, por decidir).
- ⏳ **(nuevo)** Navegación con **joystick y botones** (API de mandos del navegador) para menús sin pantalla táctil, y el **botón frontal** de impulso y salto.
- ⏳ **(nuevo)** Decisiones abiertas de octubre: ¿las partidas con tabla cuentan para récords y mapa?, ¿dificultad propia?, selector de modo, tutorial.
- ⏳ **(nuevo)** Limpiar el laboratorio antes de fusionar: quitar el desbloqueo temporal de vistas (`PerspectiveUnlockService` con `unlockAll`) y fijar la calibración en `controlConfig.js`.

Depende de: 4.

### 6. Palo físico de equilibrio 🔧
Se descarta el medio tronco. Propuesta (ver el [visor del palo](palo/palo-equilibrio.html)): **tabla con quilla central de punta a punta sobre un eje de acero con rodamientos**, que solo gira a izquierda y derecha, **más cuatro gomas de centrado** que la devuelven al centro como un monopatín.

- ❓ Validar la propuesta: tabla 90 × 26 cm de 2 × 18 mm de abedul encolado; quilla de 36 × 60 mm; eje de acero Ø20 × 94 cm; 3 rodamientos de pie UCP204; 4 soportes de eje tipo SHF20; base de 18 mm atornillada a la tarima; 4 topes de goma a ±12°; superficie a 17 cm de la tarima.
- ⏳ Carga de cálculo: 130 kg × 3 (subir de un salto) ≈ 4 kN. Comprobar con la tabla real antes de usarla en público.
- ⏳ Seguridad: lija antideslizante, cantos redondeados y **faldón de goma o cepillo** alrededor de la base para que no se puedan meter dedos entre la tabla y los topes.
- ✅ **Gomas de centrado** en las 4 esquinas (como los de un monopatín): la inclinación depende de cuánto se carga el peso, no es todo o nada. Van en guías con pasador para ajustar la dureza al peso: niño (5 cm del eje), joven (7), adulto (9) y grande (11,5).
- ⏳ Elegir la goma (Ø25–30, blanda, o bushings de poliuretano) y afinar su dureza probando con personas de distinto peso.
- ⏳ Caja del giroscopio atornillada **debajo** de la tabla, en el extremo que mira a la máquina (ya está en el visor).
- ⏳ Actualizar el modelo de la máquina con este palo.

**Lista de la compra del palo** (precios de Amazon.es del 2 de noviembre de 2026; total ≈ 324 €, o unos 265–285 € con el contrachapado cortado en una tienda de bricolaje):

| Pieza | Cant. | Referencia | Precio |
| --- | --- | --- | --- |
| Contrachapado 18 mm (tabla doble, quilla, base, tacos y tiras) | ~1 m² | [AtHaus 120 × 80 cm](https://www.amazon.es/dp/B0DF2VJXGT) | 101,62 € |
| Rodamientos de pie UCP204 (eje 20 mm) | 3 + 1 de repuesto | [2 uds.](https://www.amazon.es/dp/B0H6B3MBWR) × 2 | 39,98 € |
| Eje de acero Ø20 × 1000 (cortar a 940) | 1 | [Eje de precisión H6](https://www.amazon.es/dp/B07NLB3RWS) | 24,00 € |
| Soportes de eje SHF20 | 4 | [PATIKIL × 4](https://www.amazon.es/dp/B0D9RSP8CQ) | 19,09 € |
| Gomas de centrado (o [bushings de skate](https://www.amazon.es/dp/B0CQ248CH1)) | 4 | [Amortiguadores M8 30 × 30](https://www.amazon.es/dp/B0H6XTQ1YP) | 12,99 € |
| Topes de goma | 4 | [QUARKZMAN 40 × 30 M8](https://www.amazon.es/dp/B0D6Z2J2YX) | 22,79 € |
| Guías y carros de las gomas | 1,5 m | [Pletina aluminio 40 × 5](https://www.amazon.es/dp/B0C6M12QPZ) | 13,81 € |
| Pasadores de bola de 6 mm con anilla | 4 (mirar cuántos trae el pack) | [QUARKZMAN](https://www.amazon.es/dp/B0CNXJV56G) | 18,29 € |
| Tornillos M10 × 60 de los rodamientos | 6 | [Hexagonales M10 × 60](https://www.amazon.es/dp/B096BLH3NQ) | 12,99 € |
| Tuercas autoblocantes M10 + arandelas | 6 | [DIN 985 + DIN 125](https://www.amazon.es/dp/B0FV3LGX2L) | 10,90 € |
| Tornillos para madera 4 × 40 | caja | [fischer, 200 uds.](https://www.amazon.es/dp/B084T4Y7HL) | 6,16 € |
| Lija antideslizante | 3 tiras de 90 cm | [WELSTIK 10 cm × 5 m](https://www.amazon.es/dp/B08CVHMKZQ) | 13,99 € |
| Cola de carpintero D3 | 1 | [Pattex Madera Express](https://www.amazon.es/dp/B00GDFZ83U) | 8,35 € |
| Faldón de cepillo (puede esperar a la feria) | ~2 m | [Burlete de cepillo 2 × 1 m](https://www.amazon.es/dp/B0C93XBN7Y) | 18,99 € |

Antes de comprar: comprobar en cada ficha que el rodamiento es UCP204 para eje de 20 mm y cuántos pasadores trae el pack. Las gomas de 30 mm son más bajas que las del visor: van sobre un taco de madera.

Depende de: 2.

### 7. Máquina recreativa completa ⏳
- ⏳ Mueble de madera (70 × 55 × 180 cm), tarima común, pantalla de 24″, repisa con la caja de la bandera empotrada.
- ⏳ Mandos: joystick + A / B / START + botón frontal de 60 mm → encoder USB (el PC lo ve como un mando).
- ⏳ **(nuevo)** Ordenador: elegir mini-PC, navegador en modo quiosco con arranque automático del juego y Bluetooth compatible (Web Bluetooth en Chrome).
- ⏳ **(nuevo)** Instalación eléctrica: una sola regleta con interruptor y fusible, cargador de 5 V del servo dentro y cables fijados.

Depende de: todo lo anterior.

---

## Archivos 3D

Los `.scad` se abren con OpenSCAD 2021.01 (instalado en el Mac). Los `.stl` son lo que se manda a imprimir.

| Pieza | Diseño | Para imprimir | Estado |
| --- | --- | --- | --- |
| Pieza de prueba de encaje | [`caja/prueba_encaje.scad`](caja/prueba_encaje.scad) | [`prueba_encaje.stl`](caja/prueba_encaje.stl) | 🔧 lista, sin imprimir |
| Tutorial de OpenSCAD | [`caja/aprende_openscad.scad`](caja/aprende_openscad.scad) | — | ✅ |
| Bandera: placa base | [`bandera/mecanismo_bandera.scad`](bandera/mecanismo_bandera.scad) (`pieza = "placa"`) | [`bandera_placa.stl`](bandera/bandera_placa.stl) | 🔧 prueba |
| Bandera: brazo | ídem (`pieza = "brazo"`) | [`bandera_brazo.stl`](bandera/bandera_brazo.stl) | 🔧 prueba |
| Bandera: base del palo | ídem (`pieza = "base_palo"`) | [`bandera_base_palo.stl`](bandera/bandera_base_palo.stl) | 🔧 prueba |
| Bandera: rodillo del aspa | ídem (`pieza = "rodillo"`) | [`bandera_rodillo.stl`](bandera/bandera_rodillo.stl) | 🔧 prueba |
| Caja de la bandera · tramo 1 (mecanismo) | [`caja/caja_bandera.scad`](caja/caja_bandera.scad) (`pieza = "tramo1"`) | [`bandera_caja_tramo1.stl`](caja/bandera_caja_tramo1.stl) | 🔧 provisional |
| Caja de la bandera · tramo 2 | ídem (`pieza = "tramo2"`) | [`bandera_caja_tramo2.stl`](caja/bandera_caja_tramo2.stl) | 🔧 provisional |
| Caja de la bandera · tramo 3 (electrónica) | ídem (`pieza = "tramo3"`) | [`bandera_caja_tramo3.stl`](caja/bandera_caja_tramo3.stl) | 🔧 provisional, falta el conector de 5 V |
| Caja del giroscopio · bandeja | [`caja/caja_giroscopio.scad`](caja/caja_giroscopio.scad) (`pieza = "bandeja"`) | [`giroscopio_bandeja.stl`](caja/giroscopio_bandeja.stl) | 🔧 provisional, falta el alto de la placa |
| Caja del giroscopio · tapa | ídem (`pieza = "tapa"`) | [`giroscopio_tapa.stl`](caja/giroscopio_tapa.stl) | 🔧 provisional |
| Caja del giroscopio · PCB | — | — | ⏳ cuando haya PCB |

Para regenerar los STL tras cambiar una medida: `./bandera/exportar_bandera.sh` (brazo) y `./caja/exportar_cajas.sh` (cajas).

### Visores 3D (para ver, no para imprimir)

| Visor | Dónde |
| --- | --- |
| **Todas las piezas a imprimir** (toca una para aislarla) | [en Claude](https://claude.ai/artifact/CTJbrocxsSLxX7Cy2hfynf) |
| Máquina completa | [`maquina/maquina-cucana.html`](maquina/maquina-cucana.html) · [en Claude](https://claude.ai/artifact/SxhPPBKngYZF1Sx27gFwCr) |
| Mecanismo de la bandera, realista | [en Claude](https://claude.ai/artifact/EcZTavTqwEvG1bEUP5Wjc8) |
| Palo de equilibrio (tabla sobre eje), realista | [`palo/palo-equilibrio.html`](palo/palo-equilibrio.html) · [en Claude](https://claude.ai/artifact/WPm1c7BXRCndj8tkaVmDtZ) |
