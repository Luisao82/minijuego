// Prueba 4 — Giroscopio real (MPU6050) + botón + Bluetooth LE
// Igual que la prueba 3, pero la inclinación ya no es simulada: sale del MPU6050.
//
// Al arrancar comprueba si el sensor responde (sirve para saber si la soldadura
// está bien) y calibra el centro: deja la protoboard QUIETA y PLANA 2 segundos.
// Para recalibrar: botón BOOT de la placa, o enviar "c" desde el Monitor Serie.
//
// Montaje (ver README):
//   MPU6050 VCC → 3V3   GND → GND   SDA → GPIO 8   SCL → GPIO 9
//   Botón: GPIO 4 + GND
//
// Monitor Serie / Serial Plotter a 115200 baudios.
// No necesita librerías extra: el MPU6050 se lee directamente por I2C (Wire).

#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// --- Protocolo (debe coincidir con diagnostico/index.html) ---
#define DEVICE_NAME "Cucana-Tabla"
#define SERVICE_UUID "6b1d0001-4c75-4361-9b2a-0a5ec0cafe01"
#define DATA_CHAR_UUID "6b1d0002-4c75-4361-9b2a-0a5ec0cafe01"
#define PING_CHAR_UUID "6b1d0003-4c75-4361-9b2a-0a5ec0cafe01"
const size_t PACKET_SIZE = 12;

// Byte 4 del paquete: banderas
const uint8_t FLAG_BUTTON_DOWN = 0x01;
const uint8_t FLAG_SENSOR_ERROR = 0x02;

// --- Pines ---
const int SDA_PIN = 8;
const int SCL_PIN = 9;
const int BUTTON_PIN = 4;
const int CALIBRATE_PIN = 0;  // botón BOOT de la placa
const int LED_PIN = 2;

// --- Eje de inclinación lateral ---
// Depende de cómo esté colocado el sensor. Si al inclinar a los lados no se
// mueve la barra pero sí al inclinar hacia delante, cambiar a TILT_AXIS_Y.
// Si la barra va al revés (izquierda ↔ derecha), cambiar INVERT_TILT.
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

// Filtro complementario: el giroscopio es rápido pero deriva; el acelerómetro
// es estable pero ruidoso. Se mezclan: 98% giroscopio + 2% acelerómetro.
const float FILTER_ALPHA = 0.98;

// --- Tiempos ---
const unsigned long SAMPLE_INTERVAL_US = 5000;  // 200 lecturas/s
const unsigned long SEND_INTERVAL_MS = 20;      // 50 paquetes/s
const unsigned long PRINT_INTERVAL_MS = 50;
const unsigned long CALIBRATION_MS = 2000;
const unsigned long SENSOR_RETRY_MS = 2000;
const unsigned long DEBOUNCE_MS = 15;

BLECharacteristic *dataChar = nullptr;
volatile bool connected = false;
volatile uint16_t lastPingId = 0;

bool sensorOk = false;
float angle = 0;         // ángulo filtrado (sin centrar)
float centerOffset = 0;  // ángulo en reposo, se resta para centrar
float gyroBias = 0;      // deriva del giroscopio en reposo
unsigned long lastSampleUs = 0;
unsigned long lastSendAt = 0;
unsigned long lastPrintAt = 0;
unsigned long lastRetryAt = 0;

uint16_t seq = 0;
uint8_t presses = 0;
bool stableDown = false;
bool lastReading = false;
unsigned long lastChangeAt = 0;
bool lastCalibrateDown = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    connected = true;
    Serial.println("Conectado");
  }

  void onDisconnect(BLEServer *server) override {
    connected = false;
    Serial.println("Desconectado — vuelvo a anunciarme");
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
    Serial.println("✗ MPU6050 NO detectado. Revisa soldadura y cables (VCC, GND, SDA→8, SCL→9).");
    return false;
  }

  Serial.print("✓ MPU6050 detectado (WHO_AM_I = 0x");
  Serial.print(whoAmI, HEX);
  Serial.println(whoAmI == 0x68 ? ", original)" : ", compatible/clon: debería funcionar igual)");

  writeRegister(REG_PWR_MGMT_1, 0x00);   // despertar
  writeRegister(REG_CONFIG, 0x03);       // filtro paso bajo ~44 Hz (quita vibraciones)
  writeRegister(REG_GYRO_CONFIG, 0x00);  // ±250 °/s
  writeRegister(REG_ACCEL_CONFIG, 0x00); // ±2 g
  delay(100);
  return true;
}

// Devuelve el ángulo del acelerómetro y la velocidad del giroscopio en el eje elegido
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

void calibrate() {
  Serial.println("Calibrando: deja la protoboard QUIETA y PLANA...");
  digitalWrite(LED_PIN, HIGH);

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
    delay(5);
  }

  digitalWrite(LED_PIN, LOW);
  if (samples == 0) {
    sensorOk = false;
    Serial.println("✗ Calibración fallida: el sensor no responde.");
    return;
  }

  centerOffset = sumAngle / samples;
  gyroBias = sumRate / samples;
  angle = centerOffset;
  lastSampleUs = micros();

  Serial.print("✓ Calibrado. Centro = ");
  Serial.print(centerOffset, 2);
  Serial.print("°, deriva giroscopio = ");
  Serial.print(gyroBias, 3);
  Serial.println(" °/s");
}

void updateAngle() {
  const unsigned long now = micros();
  if (now - lastSampleUs < SAMPLE_INTERVAL_US) return;
  const float dt = (now - lastSampleUs) / 1000000.0;
  lastSampleUs = now;

  float accelAngle, gyroRate;
  if (!readAxis(accelAngle, gyroRate)) {
    sensorOk = false;
    Serial.println("✗ Se ha perdido el sensor (¿cable suelto?)");
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
  if (sensorOk) calibrate();
}

// ---------- Botones ----------

void updateButton() {
  const bool reading = digitalRead(BUTTON_PIN) == LOW;

  if (reading != lastReading) {
    lastReading = reading;
    lastChangeAt = millis();
  }

  if (reading != stableDown && millis() - lastChangeAt >= DEBOUNCE_MS) {
    stableDown = reading;
    if (stableDown) presses++;
  }
}

void checkRecalibrate() {
  const bool down = digitalRead(CALIBRATE_PIN) == LOW;
  const bool fromSerial = Serial.available() && tolower(Serial.read()) == 'c';
  if ((down && !lastCalibrateDown) || fromSerial) {
    if (sensorOk) calibrate();
  }
  lastCalibrateDown = down;
}

// ---------- Bluetooth ----------

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
  if (stableDown) flags |= FLAG_BUTTON_DOWN;
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

// ---------- Programa ----------

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(CALIBRATE_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  delay(1500);

  Serial.println("La Cucaña — tabla de equilibrio: prueba 4 (giroscopio real)");

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000);

  sensorOk = initSensor();
  if (sensorOk) calibrate();

  setupBle();
  Serial.println("Anunciándome como " DEVICE_NAME ". Abre la página de diagnóstico y pulsa Conectar.");
}

void loop() {
  updateButton();
  checkRecalibrate();

  if (sensorOk) {
    updateAngle();
  } else {
    retrySensor();
  }

  if (connected && millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();
    sendPacket();
  }

  // Formato "nombre:valor" para verlo como gráfica en Tools → Serial Plotter
  if (sensorOk && millis() - lastPrintAt >= PRINT_INTERVAL_MS) {
    lastPrintAt = millis();
    Serial.print("inclinacion:");
    Serial.print(tiltDegrees(), 2);
    Serial.print(",boton:");
    Serial.println(stableDown ? 10 : 0);
  }
}
