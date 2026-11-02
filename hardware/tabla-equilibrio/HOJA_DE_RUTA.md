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
- 🔧 **Pieza de prueba de encaje** de la caja ([`caja/prueba_encaje.scad`](caja/prueba_encaje.scad)): falta imprimirla y apuntar las medidas buenas (tolerancias de la resina).

---

## Pasos

### 1. Conectores de las cajas ⏳
Que las cajas se conecten y desconecten sin soldar ni abrir nada.

- ⏳ Elegir el conector del cable de 3 hilos **caja del giroscopio ↔ caja de la bandera** (propuesta: GX12 de 3 pines, rosca, no se suelta con tirones).
- ⏳ Elegir el conector de la **alimentación de 5 V del servo** en la caja de la bandera (propuesta: jack DC 5,5 × 2,1 o USB-C de panel).
- ⏳ Medir los conectores comprados (diámetro de panel, fondo) → van a la pieza de prueba de encaje.
- ⏳ **(nuevo)** Prever el **cable entre el palo, que se balancea, y la repisa**: largo de sobra, alivio de tensión en las dos cajas y por dónde va para que no lo pise el jugador.

Depende de: nada. Bloquea: 2 y 3.

### 2. Caja del giroscopio ⏳
Dos versiones del mismo diseño paramétrico: una para la placa perforada actual y otra para la futura PCB.

- ❓ **(nuevo)** Decidir la **alimentación**: pilas (4 × AA dentro de la caja) o la powerbank atornillada bajo la tabla (lo que se decidió en octubre). Cambia el tamaño de la caja.
- ⏳ Imprimir la prueba de encaje y fijar tolerancias (jack, LED, pulsador, USB-C, KCD1, tuercas).
- ⏳ Diseño 3D de la caja **para la placa perforada**: placa, pilas o powerbank, interruptor KCD1, botón CAL, LED, jack del micro, conector de la bandera y ventana USB-C.
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

### 6. Palo físico de equilibrio ⏳
- ⏳ Diseñar el medio palo: medio tronco de 86 cm (radio 10) bajo una tabla de 26 × 90 cm, balanceo solo lateral, ±12°, 4 topes de goma.
- ⏳ **(nuevo)** Seguridad: superficie antideslizante, que no se pueda volcar, y algo donde agarrarse (asa o barandilla) en una máquina pública.
- ⏳ Montar la caja del giroscopio en el centro, sobre el eje de balanceo.

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
| Caja de la bandera (37 × 11 × 6) | — | — | ⏳ paso 3 |
| Caja del giroscopio · placa perforada | — | — | ⏳ paso 2 |
| Caja del giroscopio · PCB | — | — | ⏳ paso 2 |

Para regenerar los STL de la bandera tras cambiar una medida: `./bandera/exportar_bandera.sh`.

### Visores 3D (para ver, no para imprimir)

| Visor | Dónde |
| --- | --- |
| Máquina completa | [`maquina/maquina-cucana.html`](maquina/maquina-cucana.html) · [en Claude](https://claude.ai/artifact/SxhPPBKngYZF1Sx27gFwCr) |
| Mecanismo de la bandera, realista | [en Claude](https://claude.ai/artifact/EcZTavTqwEvG1bEUP5Wjc8) |
