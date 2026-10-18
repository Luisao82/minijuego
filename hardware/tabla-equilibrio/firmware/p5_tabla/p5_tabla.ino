// Firmware de la tabla de equilibrio — versión para la placa soldada
// Basado en la prueba 4, con:
//   - LED de estado externo
//   - botón de calibrar externo (además de BOOT y de "c" por el Monitor Serie)
//   - calibración guardada en memoria: no hace falta recalibrar al encender
//   - sin mensajes por el puerto serie cuando no hay ordenador conectado
//
// Pines (placa perforada, ver README):
//   MPU6050  SDA → GPIO 8   SCL → GPIO 9   VCC → 3V3   GND → GND
//   Borne MICRO (microrruptor)  → GPIO 4 + GND
//   Borne LED (LED + 220 Ω)     → GPIO 5 + GND
//   Borne CAL (pulsador 12 mm)  → GPIO 6 + GND
//
// LED de estado:
//   parpadeo lento   → esperando conexión Bluetooth
//   fijo             → conectada al juego
//   parpadeo rápido  → calibrando (tabla quieta y plana)
//   doble parpadeo   → error del sensor (revisar cables del MPU6050)
//
// Monitor Serie / Serial Plotter a 115200 baudios.

#include <Wire.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// --- Protocolo (debe coincidir con diagnostico/ y con el juego) ---
#define DEVICE_NAME "Cucana-Tabla"
#define SERVICE_UUID "6b1d0001-4c75-4361-9b2a-0a5ec0cafe01"
#define DATA_CHAR_UUID "6b1d0002-4c75-4361-9b2a-0a5ec0cafe01"
#define PING_CHAR_UUID "6b1d0003-4c75-4361-9b2a-0a5ec0cafe01"
const size_t PACKET_SIZE = 12;
const uint8_t FLAG_BUTTON_DOWN = 0x01;
const uint8_t FLAG_SENSOR_ERROR = 0x02;

// --- Pines ---
const int SDA_PIN = 8;
const int SCL_PIN = 9;
const int MICRO_PIN = 4;
const int LED_PIN = 5;
const int CALIBRATE_PIN = 6;
const int BOOT_BUTTON_PIN = 0;

// --- Eje de inclinación lateral ---
// Depende de cómo quede el sensor respecto a la tabla. Si al inclinar a los
// lados no se mueve la barra pero sí al inclinar hacia delante → TILT_AXIS_Y.
// Si va al revés → INVERT_TILT = true.
#define TILT_AXIS_X 0
#define TILT_AXIS_Y 1
const int TILT_AXIS = TILT_AXIS_X;
const bool INVERT_TILT = false;

// --- MPU6050 ---
const uint8_t MPU_ADDR = 0x68;
const uint8_t REG_PWR_MGMT_1 = 0x6B;
const uint8_t REG_CONFIG = 0x1A;
const uint8_t REG_GYRO_CONFIG = 0x1B;
const uint8_t REG_ACCEL_CONFIG = 0x1C;
const uint8_t REG_ACCEL_XOUT_H = 0x3B;
const uint8_t REG_WHO_AM_I = 0x75;
const float GYRO_LSB_PER_DPS = 131.0;  // rango ±250 °/s
const float FILTER_ALPHA = 0.98;       // 98% giroscopio + 2% acelerómetro

// --- Tiempos ---
const unsigned long SAMPLE_INTERVAL_US = 5000;  // 200 lecturas/s
const unsigned long SEND_INTERVAL_MS = 20;      // 50 paquetes/s
const unsigned long PRINT_INTERVAL_MS = 50;
const unsigned long CALIBRATION_MS = 2000;
const unsigned long SENSOR_RETRY_MS = 2000;
const unsigned long DEBOUNCE_MS = 15;

// --- Patrones del LED (ms) ---
const unsigned long LED_SLOW_MS = 500;
const unsigned long LED_FAST_MS = 100;
const unsigned long LED_DOUBLE_PERIOD_MS = 1200;

// --- Calibración guardada ---
const char *PREFS_NAMESPACE = "tabla";
const char *KEY_CENTER = "center";
const char *KEY_BIAS = "bias";

BLECharacteristic *dataChar = nullptr;
volatile bool connected = false;
volatile uint16_t lastPingId = 0;
Preferences prefs;

bool sensorOk = false;
float angle = 0;
float centerOffset = 0;
float gyroBias = 0;
unsigned long lastSampleUs = 0;
unsigned long lastSendAt = 0;
unsigned long lastPrintAt = 0;
unsigned long lastRetryAt = 0;
uint16_t seq = 0;
uint8_t presses = 0;

// Botón con antirrebote (lo usan el microrruptor y el de calibrar)
struct Button {
  int pin;
  bool stableDown;
  bool lastReading;
  unsigned long lastChangeAt;
};
Button micro = { MICRO_PIN, false, false, 0 };
Button calButton = { CALIBRATE_PIN, false, false, 0 };
Button bootButton = { BOOT_BUTTON_PIN, false, false, 0 };

// Devuelve true en el momento en que se pulsa (flanco de bajada estable)
bool updateButton(Button &b) {
  const bool reading = digitalRead(b.pin) == LOW;
  if (reading != b.lastReading) {
    b.lastReading = reading;
    b.lastChangeAt = millis();
  }
  if (reading != b.stableDown && millis() - b.lastChangeAt >= DEBOUNCE_MS) {
    b.stableDown = reading;
    return b.stableDown;
  }
  return false;
}

// ---------- Serie: solo si hay un ordenador escuchando ----------

bool serialReady() {
  return (bool)Serial;
}

void logMsg(const String &msg) {
  if (serialReady()) Serial.println(msg);
}

// ---------- LED de estado ----------

void showLed() {
  const unsigned long t = millis();
  bool on;
  if (!sensorOk) {
    // Doble parpadeo: dos destellos cortos y una pausa
    const unsigned long p = t % LED_DOUBLE_PERIOD_MS;
    on = p < 120 || (p > 240 && p < 360);
  } else if (connected) {
    on = true;
  } else {
    on = (t / LED_SLOW_MS) % 2 == 0;
  }
  digitalWrite(LED_PIN, on ? HIGH : LOW);
}

// ---------- Bluetooth ----------

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    connected = true;
  }

  void onDisconnect(BLEServer *server) override {
    connected = false;
    BLEDevice::startAdvertising();
  }
};

class PingCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    auto value = characteristic->getValue();
    if (value.length() >= 2) {
      lastPingId = (uint8_t)value[0] | ((uint8_t)value[1] << 8);
    }
  }
};

void setupBle() {
  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  dataChar = service->createCharacteristic(DATA_CHAR_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  dataChar->addDescriptor(new BLE2902());

  BLECharacteristic *pingChar = service->createCharacteristic(
    PING_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pingChar->setCallbacks(new PingCallbacks());
  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
}

// ---------- MPU6050 ----------

bool writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool readRegisters(uint8_t reg, uint8_t *buf, size_t len) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(MPU_ADDR, (uint8_t)len) != len) return false;
  for (size_t i = 0; i < len; i++) buf[i] = Wire.read();
  return true;
}

bool initSensor() {
  uint8_t whoAmI = 0;
  if (!readRegisters(REG_WHO_AM_I, &whoAmI, 1)) {
    logMsg("✗ MPU6050 NO detectado (VCC→E13, GND→F13, SCL→G13, SDA→H13)");
    return false;
  }
  logMsg(String("✓ MPU6050 detectado (WHO_AM_I = 0x") + String(whoAmI, HEX) + ")");
  writeRegister(REG_PWR_MGMT_1, 0x00);
  writeRegister(REG_CONFIG, 0x03);
  writeRegister(REG_GYRO_CONFIG, 0x00);
  writeRegister(REG_ACCEL_CONFIG, 0x00);
  delay(100);
  return true;
}

bool readAxis(float &accelAngle, float &gyroRate) {
  uint8_t raw[14];
  if (!readRegisters(REG_ACCEL_XOUT_H, raw, 14)) return false;

  const int16_t ax = (raw[0] << 8) | raw[1];
  const int16_t ay = (raw[2] << 8) | raw[3];
  const int16_t az = (raw[4] << 8) | raw[5];
  const int16_t gx = (raw[8] << 8) | raw[9];
  const int16_t gy = (raw[10] << 8) | raw[11];

  if (TILT_AXIS == TILT_AXIS_X) {
    accelAngle = atan2((float)ay, (float)az) * RAD_TO_DEG;
    gyroRate = gx / GYRO_LSB_PER_DPS;
  } else {
    accelAngle = atan2(-(float)ax, (float)az) * RAD_TO_DEG;
    gyroRate = gy / GYRO_LSB_PER_DPS;
  }
  return true;
}

// Mide el centro y la deriva del giroscopio con la tabla quieta, y lo guarda
void calibrate() {
  logMsg("Calibrando: tabla QUIETA y PLANA...");
  float sumAngle = 0, sumRate = 0;
  int samples = 0;
  const unsigned long start = millis();

  while (millis() - start < CALIBRATION_MS) {
    float accelAngle, gyroRate;
    if (readAxis(accelAngle, gyroRate)) {
      sumAngle += accelAngle;
      sumRate += gyroRate;
      samples++;
    }
    digitalWrite(LED_PIN, ((millis() - start) / LED_FAST_MS) % 2 == 0 ? HIGH : LOW);
    delay(5);
  }

  if (samples == 0) {
    sensorOk = false;
    logMsg("✗ Calibración fallida: el sensor no responde");
    return;
  }

  centerOffset = sumAngle / samples;
  gyroBias = sumRate / samples;
  angle = centerOffset;
  lastSampleUs = micros();

  prefs.putFloat(KEY_CENTER, centerOffset);
  prefs.putFloat(KEY_BIAS, gyroBias);
  logMsg(String("✓ Calibrado y guardado. Centro = ") + String(centerOffset, 2) + "°");
}

// Al arrancar: usa la calibración guardada; si no hay, calibra
void loadOrCalibrate() {
  if (prefs.isKey(KEY_CENTER) && prefs.isKey(KEY_BIAS)) {
    centerOffset = prefs.getFloat(KEY_CENTER, 0);
    gyroBias = prefs.getFloat(KEY_BIAS, 0);
    float accelAngle, gyroRate;
    angle = readAxis(accelAngle, gyroRate) ? accelAngle : centerOffset;
    lastSampleUs = micros();
    logMsg(String("✓ Calibración guardada. Centro = ") + String(centerOffset, 2) + "°");
  } else {
    calibrate();
  }
}

void updateAngle() {
  const unsigned long now = micros();
  if (now - lastSampleUs < SAMPLE_INTERVAL_US) return;
  const float dt = (now - lastSampleUs) / 1000000.0;
  lastSampleUs = now;

  float accelAngle, gyroRate;
  if (!readAxis(accelAngle, gyroRate)) {
    sensorOk = false;
    logMsg("✗ Se ha perdido el sensor (¿cable suelto?)");
    return;
  }
  angle = FILTER_ALPHA * (angle + (gyroRate - gyroBias) * dt) + (1 - FILTER_ALPHA) * accelAngle;
}

float tiltDegrees() {
  const float tilt = angle - centerOffset;
  return INVERT_TILT ? -tilt : tilt;
}

void retrySensor() {
  if (millis() - lastRetryAt < SENSOR_RETRY_MS) return;
  lastRetryAt = millis();
  sensorOk = initSensor();
  if (sensorOk) loadOrCalibrate();
}

// ---------- Envío ----------

void writeU16(uint8_t *buf, size_t at, uint16_t v) {
  buf[at] = v & 0xFF;
  buf[at + 1] = v >> 8;
}

void writeU32(uint8_t *buf, size_t at, uint32_t v) {
  for (int i = 0; i < 4; i++) buf[at + i] = (v >> (8 * i)) & 0xFF;
}

void sendPacket() {
  uint8_t packet[PACKET_SIZE];
  const float tilt = sensorOk ? constrain(tiltDegrees(), -180.0, 180.0) : 0;

  uint8_t flags = 0;
  if (micro.stableDown) flags |= FLAG_BUTTON_DOWN;
  if (!sensorOk) flags |= FLAG_SENSOR_ERROR;

  writeU16(packet, 0, seq++);
  writeU16(packet, 2, (uint16_t)(int16_t)round(tilt * 100.0));
  packet[4] = flags;
  packet[5] = presses;
  writeU16(packet, 6, lastPingId);
  writeU32(packet, 8, millis());

  dataChar->setValue(packet, PACKET_SIZE);
  dataChar->notify();
}

// ---------- Programa ----------

void setup() {
  Serial.begin(115200);
#if ARDUINO_USB_CDC_ON_BOOT
  // Sin ordenador conectado, no esperar a enviar mensajes por USB
  Serial.setTxTimeoutMs(0);
#endif
  pinMode(MICRO_PIN, INPUT_PULLUP);
  pinMode(CALIBRATE_PIN, INPUT_PULLUP);
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  delay(1000);

  logMsg("La Cucaña — tabla de equilibrio");
  prefs.begin(PREFS_NAMESPACE, false);

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000);
  sensorOk = initSensor();
  if (sensorOk) loadOrCalibrate();

  setupBle();
  logMsg("Anunciándome como " DEVICE_NAME);
}

void loop() {
  if (updateButton(micro)) presses++;

  const bool fromSerial = serialReady() && Serial.available() && tolower(Serial.read()) == 'c';
  if ((updateButton(calButton) || updateButton(bootButton) || fromSerial) && sensorOk) calibrate();

  if (sensorOk) updateAngle();
  else retrySensor();

  if (connected && millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();
    sendPacket();
  }

  showLed();

  // Formato "nombre:valor" para Tools → Serial Plotter
  if (sensorOk && serialReady() && millis() - lastPrintAt >= PRINT_INTERVAL_MS) {
    lastPrintAt = millis();
    Serial.print("inclinacion:");
    Serial.print(tiltDegrees(), 2);
    Serial.print(",micro:");
    Serial.println(micro.stableDown ? 10 : 0);
  }
}
