# Tabla de equilibrio — prototipo hardware

Mando físico opcional para La Cucaña Trianera: el jugador se sube a una tabla basculante.

- **Inclinación lateral** (giroscopio MPU6050) → equilibrio en el palo (`inputDirection` de -1 a 1).
- **Inclinarse hacia delante** (microrruptor de rodillo) → parar la barra de impulso y, después, saltar a por la bandera.
- Conexión por **Bluetooth LE** a la pantalla (monitor con Chrome o tablet con la app).

Esta carpeta es independiente del juego: aquí solo hay firmware y herramientas de prueba.

```
hardware/tabla-equilibrio/
├── firmware/
│   ├── p1_blink/          # Prueba 1: placa + IDE funcionando
│   ├── p2_boton/          # Prueba 2: botón simulado con un cable
│   ├── p3_ble_simulado/   # Prueba 3: Bluetooth con inclinación falsa
│   └── p4_giroscopio/     # Prueba 4: MPU6050 real + botón + Bluetooth
├── diagnostico/
│   └── index.html         # Página que mide la calidad del Bluetooth
├── simulador/
│   ├── index.html         # Barra de equilibrio con la física real del juego
│   └── analogModel.js     # Respuesta analógica + inestabilidad extra (lógica pura)
└── shared/
    ├── boardConnection.js # Conexión Web Bluetooth (compartida)
    └── tabla.css          # Estilos compartidos
```

## Material

| Pieza                                      | Estado                        |
| ------------------------------------------ | ----------------------------- |
| Freenove ESP32-S3 WROOM (8 MB)             | ✅ Funcionando                |
| MPU6050 (GY-521)                           | ✅ Pines soldados             |
| Microrruptores de palanca con rodillo      | ✅ Cables soldados (COM + NO) |
| Protoboards + cables macho-macho (GTIWUNG) | ✅                            |
| Soldador + estaño                          | ✅                            |

Las pruebas 1, 2 y 3 **no necesitan soldar**.

---

## Paso 1 — Preparar el IDE de Arduino

1. Instalar **Arduino IDE 2** desde <https://www.arduino.cc/en/software>.
2. _Arduino IDE → Settings… (Preferencias)_ → en **Additional boards manager URLs** pegar:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. _Tools → Board → Boards Manager…_ → buscar **esp32** → instalar **"esp32 by Espressif Systems"** (tarda un rato).
4. _Tools → Board → esp32 →_ **ESP32S3 Dev Module**.

## Paso 2 — Conectar la placa

- La Freenove tiene **dos USB-C**: uno es el **USB nativo** del ESP32-S3 y el otro el **COM / UART**. Valen los dos.
- Cable: el USB-A → USB-C que viene con la placa, al hub del Mac.
- _Tools → Port_ → elegir el que aparece al enchufar:
  - USB nativo → `/dev/cu.usbmodem…` (el que usamos). Necesita _Tools → USB CDC On Boot →_ **Enabled** para ver el Monitor Serie.
  - COM / UART → `/dev/cu.usbserial-…` o `/dev/cu.wchusbserial-…`.

**Si no aparece ningún puerto:**

1. Probar el otro USB-C de la placa.
2. Probar sin hub, con el cable USB-C ↔ USB-C (que sea de datos).
3. Instalar el driver **CH343** de la documentación de Freenove.

## Paso 3 — Prueba 1: Blink

1. _File → Open…_ → `firmware/p1_blink/p1_blink.ino`.
2. Botón **Upload** (flecha →).
3. _Tools → Serial Monitor_ a **115200** baudios.

✅ El LED de la placa parpadea y el monitor muestra `Parpadeo #1, #2…`

Si no parpadea, cambiar `LED_PIN` de `2` a `48` y volver a subir. Si la subida se queda en `Connecting…`, mantener pulsado el botón **BOOT** de la placa mientras empieza a subir.

## Paso 4 — Prueba 2: Botón con un cable

Montaje en la protoboard (ESP32 pinchado en la protoboard grande):

```
ESP32 GPIO 4  ──── cable A ──── (punta suelta)
ESP32 GND     ──── cable B ──── (punta suelta)

Juntar las puntas de A y B = PULSAR
```

1. Abrir y subir `firmware/p2_boton/p2_boton.ino`.
2. Abrir el Serial Monitor.

✅ Al juntar las puntas: `PULSADO (pulsación #1)` y se enciende el LED. Al separarlas: `LIBRE`.

Cuando llegue el microrruptor, se conecta igual: **COM → GND** y **NO → GPIO 4**.

## Paso 5 — Prueba 3: Bluetooth y latencia

Mantén el montaje del cable de la prueba 2.

1. Abrir y subir `firmware/p3_ble_simulado/p3_ble_simulado.ino`.
2. Serial Monitor: debe decir `Anunciándome como Cucana-Tabla`.
3. Arrancar Apache en XAMPP y abrir en **Chrome**:
   ```
   http://localhost/minijuego/Prueba2/hardware/tabla-equilibrio/diagnostico/
   ```
4. **Conectar** → elegir `Cucana-Tabla` en la ventana de Chrome.
   - La primera vez macOS puede pedir permiso de Bluetooth para Chrome
     (_Ajustes del Sistema → Privacidad y seguridad → Bluetooth_).

✅ La barra se mueve sola de lado a lado (inclinación simulada) y al juntar los cables se enciende el cuadro del botón.

### Qué mirar

| Medida            | Bien    | Revisar    |
| ----------------- | ------- | ---------- |
| Paquetes/s        | ~50     | < 25       |
| Jitter            | < 10 ms | > 20 ms    |
| Latencia estimada | < 40 ms | > 70 ms    |
| Cortes > 200 ms   | 0       | cualquiera |
| Desconexiones     | 0       | cualquiera |

**Pruebas recomendadas:**

- 5 minutos tranquilo, con la placa a 1–2 m del Mac.
- Alejarse a 3–5 m y poner el cuerpo entre la placa y el Mac.
- Con el Wi-Fi a tope (un vídeo en streaming) y varios móviles cerca → simula el ruido de un evento.
- Desenchufar la placa y volver a enchufarla → la página debe reconectar sola.

La latencia que muestra es una estimación (mitad del ida y vuelta) e incluye hasta 20 ms de espera hasta el siguiente paquete, así que la real es algo menor.

## Paso 6 — Montaje del MPU6050

El ESP32-S3 es tan ancho que en la protoboard de 830 puntos solo deja libre **una columna en el lado derecho** (la `j`) y ninguna en el izquierdo. Cabe todo igualmente usando la **línea de alimentación derecha** (`+` roja y `−` azul) y poniendo el sensor **debajo del ESP32**, en las filas libres.

```
        lado derecho del ESP32          columna j      línea derecha
        ──────────────────────          ─────────      ─────────────
        GND (arriba, junto a 5V)   ──►  j  ───────────►  −  (azul)
        3V3 (abajo del todo)       ──►  j  ───────────►  +  (roja)
        GPIO 8                     ──►  j  ─────┐
        GPIO 9                     ──►  j  ───┐ │
        GPIO 4                     ──►  j  ── botón ── −  (azul)
                                              │ │
        MPU6050 (filas libres de abajo, pines en la columna f,
                 la placa del sensor tumbada hacia la izquierda)
          fila 40  VCC  ── j ──────────────────────────►  +  (roja)
          fila 41  GND  ── j ──────────────────────────►  −  (azul)
          fila 42  SCL  ── j ◄────────────────────┘ │      (GPIO 9)
          fila 43  SDA  ── j ◄──────────────────────┘      (GPIO 8)
          filas 44–47  XDA, XCL, AD0, INT → sin conectar
```

| MPU6050 | Va a            | Cable                               |
| ------- | --------------- | ----------------------------------- |
| VCC     | `+` de la línea | La línea `+` viene del pin **3V3**  |
| GND     | `−` de la línea | La línea `−` viene del pin **GND**  |
| SCL     | **GPIO 9**      | Directo, de la columna `j` a la `j` |
| SDA     | **GPIO 8**      | Directo, de la columna `j` a la `j` |
| Botón   | GPIO 4 y `−`    | Cambiar el cable de GND al `−`      |

**Cuidado:**

- **VCC al 3V3, nunca al 5V.**
- Comprobar en la serigrafía que cada cable está en la fila del pin correcto. Justo debajo del 4 está **EN**: si se lleva a GND, la placa se reinicia.
- En algunas protoboards de 830 puntos la línea `+`/`−` está **cortada por la mitad** (la raya roja/azul se interrumpe). Si es así, puentear las dos mitades con un cable.
- Las patas que salen del MPU6050 tienen que entrar en filas distintas (una fila por pata), nunca varias en la misma fila.

## Paso 7 — Prueba 4: giroscopio real

1. Abrir y subir `firmware/p4_giroscopio/p4_giroscopio.ino`.
2. Abrir el Serial Monitor **con la protoboard quieta y plana**: al arrancar calibra el centro durante 2 segundos (el LED se queda encendido).

✅ Debe aparecer:

```
✓ MPU6050 detectado (WHO_AM_I = 0x68, original)
✓ Calibrado. Centro = 1.23°, deriva giroscopio = -0.412 °/s
```

- Si dice **`✗ MPU6050 NO detectado`**: revisar VCC, GND, SDA→8, SCL→9 y las soldaduras (cada pin debe tener un cono de estaño brillante, sin bolas ni puentes con el pin de al lado). Reintenta solo cada 2 segundos, así que basta con corregir el cable.
- Si dice WHO_AM_I con otro valor (`0x70`, `0x72`, `0x98`…): es un clon compatible y funciona igual.

3. _Tools → Serial Plotter_: al **inclinar la protoboard a izquierda y derecha** la línea `inclinacion` sube y baja.
   - Si solo se mueve al inclinar **hacia delante/atrás**: cambiar `TILT_AXIS` a `TILT_AXIS_Y` y volver a subir.
   - Si va **al revés**: cambiar `INVERT_TILT` a `true`.
4. Cerrar el Serial Plotter y abrir la página de diagnóstico → **Conectar**. Ahora la barra la mueves tú inclinando la protoboard, y `Sensor` debe decir **OK**.

**Recalibrar** (si en reposo no marca ~0°): dejarla quieta y pulsar el botón **BOOT** de la placa, o escribir `c` en el Serial Monitor. Mientras calibra (2 s) no envía datos, así que la página marcará un corte: es normal.

## Paso 8 — Simulador de equilibrio

Prueba la sensación de jugar con la tabla **antes de tocar el juego**. Usa la física real (`BalanceBar` + `BalanceSystem` importados de `src/game`), así que necesita el servidor de Vite:

```
npm run dev
```

y abrir en Chrome: `http://localhost:9876/hardware/tabla-equilibrio/simulador/`

- **Entrada:** tabla (Bluetooth) o teclado ← → (se comporta como los botones del juego, para comparar).
- **Empezar:** botón, barra espaciadora o pulsar el microrruptor. Con la tabla, la posición al empezar se toma como centro.
- **Respuesta de la inclinación:** zona muerta, inclinación máxima (±13° = fuerza completa) y curva.
- **Inestabilidad extra** (propuesta para los modos analógicos, desactivada por defecto = física actual):
  - **Vaivén:** perturbación suave continua, la barra nunca está quieta.
  - **Gravedad:** cuanto más lejos del centro, más tira hacia fuera (péndulo invertido).
  - Ambas se amplifican con la grasa igual que el drift.
- **Palo y personaje:** stat de equilibrio (mueve los límites rojos), grasa y duración hasta la bandera.
- El **historial** guarda cada intento con su configuración para comparar.

---

## Protocolo BLE

|                | UUID                                   |
| -------------- | -------------------------------------- |
| Servicio       | `6b1d0001-4c75-4361-9b2a-0a5ec0cafe01` |
| Datos (notify) | `6b1d0002-4c75-4361-9b2a-0a5ec0cafe01` |
| Ping (write)   | `6b1d0003-4c75-4361-9b2a-0a5ec0cafe01` |

Paquete de datos — 12 bytes, little-endian, cada 20 ms:

| Bytes | Campo       | Tipo   | Descripción                                 |
| ----- | ----------- | ------ | ------------------------------------------- |
| 0–1   | `seq`       | uint16 | Contador de paquetes (detecta pérdidas)     |
| 2–3   | `tilt`      | int16  | Inclinación lateral en centésimas de grado  |
| 4     | `flags`     | uint8  | bit 0 = botón pulsado, bit 1 = error sensor |
| 5     | `presses`   | uint8  | Contador de pulsaciones (ninguna se pierde) |
| 6–7   | `echo`      | uint16 | Id del último ping recibido                 |
| 8–11  | `espMillis` | uint32 | Reloj interno del ESP32                     |

Se envía siempre el **estado completo**: si un paquete llega tarde, el siguiente lo corrige.

## Siguientes pasos

1. ~~Soldar el MPU6050 y leer la inclinación real~~ → `p4_giroscopio`.
2. ~~Soldar el microrruptor~~ (hecho; falta montarlo con el tope de goma en la tabla).
3. Ajustar la sensación con el simulador y cerrar el diseño de los modos de control (botones / giroscopio del móvil / tabla).
4. Integrar el "modo tabla" en el juego como entrada opcional (táctil / tabla).
