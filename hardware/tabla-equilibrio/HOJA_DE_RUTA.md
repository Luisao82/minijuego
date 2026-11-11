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
- ✅ Conector de la **alimentación de 5 V del servo** en la caja de la bandera: **jack DC 5,5 × 2,1 de panel, metálico (DC-099)**, con el positivo en el pin central. Falta comprarlo.
- 🔧 La pieza de prueba de encaje ya lleva huecos para el **GX12** (Ø11,8–12,8) y el **KCD1**. También el del **jack DC de 5 V** (Ø10,6–11,4). Falta comprar el GX12 y el jack DC.
- ⏳ **(nuevo)** Prever el **cable entre el palo, que se balancea, y la repisa**: largo de sobra, alivio de tensión en las dos cajas y por dónde va para que no lo pise el jugador.

Depende de: nada. Bloquea: 2 y 3.

### 2. Caja del giroscopio ⏳
Dos versiones del mismo diseño paramétrico: una para la placa perforada actual y otra para la futura PCB.

- ✅ Alimentación: **portapilas de 4 × AA en una fila** dentro de la caja, con **interruptor cuadrado KCD1** en la caja.
- ✅ Portapilas: **63 × 58 × 15 mm**, cables por un lado de 63 mm.
- ✅ Caja **plana** (portapilas al lado de la placa, unos 14 × 8 × 4 cm), montada **debajo de la tabla** para que no se pueda pisar. Nada metálico encima, debajo ni pegado al extremo de la antena del ESP32.
- 🔧 En el extremo de la tabla que mira a la máquina, al lado de la quilla, con la cara de mandos (KCD1, LED, CAL, USB-C, GX12) hacia fuera. Lejos del rodamiento del extremo.
- ⏳ Medir la altura de la placa montada y la del USB-C, y confirmar que la antena queda en el extremo contrario al USB-C.
- ⏳ Imprimir la prueba de encaje y fijar tolerancias (GX12, jack, LED, pulsador, USB-C, KCD1, tuercas).
- 🔧 Diseño 3D de la caja **para la placa perforada** ([`caja/caja_giroscopio.scad`](caja/caja_giroscopio.scad)): placa, portapilas, interruptor KCD1, botón CAL, LED y GX12 en la cara; **ventana USB-C en la pared del fondo** y **jack del micro en el lateral**. Provisional: no imprimir hasta tener las medidas.
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

### 4. Firmware con la bandera 🔧
Firmware unificado: [`firmware/p6_tabla_bandera`](firmware/p6_tabla_bandera/p6_tabla_bandera.ino), con la bandera en [`bandera.h`](firmware/p6_tabla_bandera/bandera.h).

- ✅ Un firmware (p6): servo en GPIO 17 y micro de la bandera en GPIO 18, sin bloquear la lectura del giroscopio. Subido y probado con el juego (noviembre 2026).
- ✅ **Protocolo BLE** ampliado (ver [README](README.md#protocolo-ble)): el juego escribe «subir bandera» en la característica `…0004` y la tabla avisa con los bits «bandera puesta» y «en ciclo» y un contador de banderas cogidas (byte 12). Compatible con el juego actual, que lee solo los 8 primeros bytes.
- ✅ Seguridad del servo: al coger la bandera el servo baja en el acto y deja de mandar pulsos; no sube si la bandera no está puesta ni durante otro ciclo.
- ⏳ Ajustar `ANGLE_DOWN` / `ANGLE_UP` de [`bandera.h`](firmware/p6_tabla_bandera/bandera.h) con el mecanismo impreso (comando `0-180` del Monitor Serie).
- ⏳ Probar latencias del ciclo completo: salto en pantalla → bandera arriba → agarre → juego. La [página de diagnóstico](diagnostico/index.html) ya tiene el botón «Subir bandera» y mide orden → subida, orden → cogida y ciclo completo.

Depende de: 3 (mecanismo probado). Bloquea: 5.

### 5. Juego: coger la bandera física 🔧
Con cuidado: tocar la mecánica afecta a las otras ramas (`feature/gps-challenge` también modifica `BaseGameScene.js`).

- ✅ Al llegar a la bandera (corriendo o saltando) con tabla + bandera física: el juego manda «subir bandera», avisa «¡COGE LA BANDERA!» y pasa a cámara lenta; solo la consigue si llega «bandera cogida» dentro de la ventana. Hecho en el laboratorio; ventana (1,5 s) y cámara lenta (0,25) ajustables en el panel LAB. Probado con la bandera real (noviembre 2026).
- ✅ Sin tabla, o con tabla sin bandera física: se mantiene tocar la pantalla.
- ✅ Aviso en pantalla: texto «¡COGE LA BANDERA!» parpadeando, marco rojo en el borde de la pantalla y barra dorada con el tiempo que queda.
- ⏳ **(nuevo)** Navegación con **joystick y botones** (API de mandos del navegador) para menús sin pantalla táctil, y el **botón frontal** de impulso y salto.
- ⏳ **(nuevo)** Decisiones abiertas de octubre: ¿las partidas con tabla cuentan para récords y mapa?, ¿dificultad propia?, selector de modo, tutorial.
- ⏳ **(nuevo)** Limpiar el laboratorio antes de fusionar: quitar el desbloqueo temporal de vistas (`PerspectiveUnlockService` con `unlockAll`) y fijar la calibración en `controlConfig.js`.

Depende de: 4.

### 6. Palo físico de equilibrio 🔧
**Decidido: un skate hecho a mano sin ruedas** (ver el [visor de la tabla de skate](palo/tabla-skate.html)). Tabla de contrachapado con dos ejes de skate debajo; las puntas roscadas de cada eje van atornilladas a tacos de madera de la base, así que no rueda: solo se inclina a los lados y las gomas de los ejes la devuelven al centro. Probado con un skate prestado: la sensación es la que se busca.

- ⏳ Comprar los ejes y medir: cuánto sobresale la rosca de cada punta (el taco no puede ser más grueso), alto del eje (placa ↔ centro del eje) y si traen tuercas y arandelas.
- ⏳ Tabla de abedul de 18 mm, unos 80 × 25 cm (o 75 × 21 como el skate de prueba), puntas y cantos redondeados, lija antideslizante. Ejes a unos 45 cm, con 4 tornillos M5 cada uno.
- ⏳ Base de 18 mm, 80 × 40 cm, con 4 tacos de madera dura (agujero de 8 mm para la punta del eje, tuerca y arandela) y tacos de goma debajo.
- ⏳ Gomas: probar las de serie; comprar un juego blando (78A–83A) para niños y uno duro (92A–97A) para adultos grandes si hace falta. La tuerca central también ajusta la dureza.
- ⏳ Seguridad: 4 topes de goma bajo los bordes para que nunca pase de 15°; cantos redondeados; comprobar con 130 kg (y un salto) antes de usarla en público.
- ⏳ Caja del giroscopio atornillada **debajo** de la tabla, entre los dos ejes, con la cara de mandos hacia la máquina (queda a unos 4 cm de la base).
- ⏳ Actualizar el modelo de la máquina con esta tabla.

**Lista de la compra** (precios aproximados, noviembre de 2026; total ≈ 75–90 €):

| Pieza | Cant. | Referencia | Precio |
| --- | --- | --- | --- |
| Ejes de skate de aluminio, 15 cm, con gomas | 1 par | [ifundom](https://www.amazon.es/dp/B0GF41PK4Z) | 17,99 € |
| Contrachapado de abedul 18 mm para la tabla, 80 × 25 cm | 1 | Corte en tienda de bricolaje | 12–15 € |
| Contrachapado 18 mm para la base, 80 × 40 cm | 1 | Corte en tienda de bricolaje | 10–15 € |
| Listón de madera dura 45 × 45 (4 tacos de las puntas + 4 de los topes) | ~50 cm | Tienda de bricolaje | ~5 € |
| Topes de goma | 4 | Tacos de goma Ø25–30 con rosca M6/M8 | ~5 € |
| Tornillos M5 × 30 de los ejes, con tuerca autoblocante | 8 | Tienda de bricolaje | ~4 € |
| Tuercas M8 + arandelas de las puntas (si no las traen) | 4 | Tienda de bricolaje | ~2 € |
| Tornillos para madera 4 × 40 | caja | [fischer, 200 uds.](https://www.amazon.es/dp/B084T4Y7HL) | 6,16 € |
| Lija antideslizante | 1 tira de 80 cm | [WELSTIK 10 cm × 5 m](https://www.amazon.es/dp/B08CVHMKZQ) | 13,99 € |
| Tacos de goma antideslizantes para la base | 4 | Tienda de bricolaje | ~4 € |
| Gomas de recambio blandas o duras (solo si hacen falta) | 1 juego | [Bushings de skate](https://www.amazon.es/dp/B0CQ248CH1) | ~8–10 € |

**Descartado:** tabla con quilla sobre eje de acero, chumaceras y gomas con pasadores (≈ 324 €). Se queda en el [visor antiguo](palo/palo-equilibrio.html) por si hiciera falta.

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
| Caja de la bandera · tramo 3 (electrónica) | ídem (`pieza = "tramo3"`) | [`bandera_caja_tramo3.stl`](caja/bandera_caja_tramo3.stl) | 🔧 provisional, falta ajustar el Ø del jack de 5 V |
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
| **Palo de equilibrio: tabla con ejes de skate** | [`palo/tabla-skate.html`](palo/tabla-skate.html) · [en Claude](https://claude.ai/artifact/A2Yf5WTE2DbToUPYchHhcW) |
| Palo de equilibrio descartado (tabla sobre eje de acero) | [`palo/palo-equilibrio.html`](palo/palo-equilibrio.html) · [en Claude](https://claude.ai/artifact/WPm1c7BXRCndj8tkaVmDtZ) |
