// Prueba 3 — Bluetooth LE con inclinación simulada
// El ESP32 se anuncia como "Cucana-Tabla" y envía cada SEND_INTERVAL_MS:
//   - una inclinación lateral FALSA (oscila sola entre -13° y +13°)
//   - el estado del botón (cable en pin 4 + GND, igual que la prueba 2)
// La página hardware/tabla-equilibrio/diagnostico/ se conecta y mide
// paquetes/s, jitter, pérdidas y latencia (ida y vuelta).
//
// Cuando el MPU6050 esté soldado, solo cambia readTiltDegrees(): el protocolo
// y la página siguen igual.
//
// Requiere el paquete "esp32 by Espressif Systems" (incluye la librería BLE).
// Monitor Serie a 115200 baudios.

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// --- Protocolo (debe coincidir con diagnostico/index.html) ---
#define DEVICE_NAME "Cucana-Tabla"
#define SERVICE_UUID "6b1d0001-4c75-4361-9b2a-0a5ec0cafe01"
#define DATA_CHAR_UUID "6b1d0002-4c75-4361-9b2a-0a5ec0cafe01"  // notify: estado de la tabla
#define PING_CHAR_UUID "6b1d0003-4c75-4361-9b2a-0a5ec0cafe01"  // write: ping para medir latencia

// Paquete de 12 bytes, little-endian:
//   [0-1]  seq        uint16  contador de paquetes (detecta pérdidas)
//   [2-3]  tilt       int16   inclinación en centésimas de grado (-1300 = -13.00°)
//   [4]    buttonDown uint8   1 = pulsado ahora mismo
//   [5]    presses    uint8   contador de pulsaciones (no se pierde ninguna aunque sea muy corta)
//   [6-7]  echo       uint16  id del último ping recibido (la página calcula la latencia)
//   [8-11] espMillis  uint32  reloj interno del ESP32
const size_t PACKET_SIZE = 12;

const int BUTTON_PIN = 4;
const int LED_PIN = 2;
const unsigned long DEBOUNCE_MS = 15;
const unsigned long SEND_INTERVAL_MS = 20;  // 50 paquetes/s

// Simulación de la inclinación
const float FAKE_TILT_MAX_DEG = 13.0;
const float FAKE_TILT_PERIOD_MS = 4000.0;

BLECharacteristic *dataChar = nullptr;
volatile bool connected = false;
volatile uint16_t lastPingId = 0;

uint16_t seq = 0;
uint8_t presses = 0;
bool stableDown = false;
bool lastReading = false;
unsigned long lastChangeAt = 0;
unsigned long lastSendAt = 0;

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

float readTiltDegrees() {
  const float phase = (millis() % (unsigned long)FAKE_TILT_PERIOD_MS) / FAKE_TILT_PERIOD_MS;
  return FAKE_TILT_MAX_DEG * sin(phase * 2.0 * PI);
}

void updateButton() {
  const bool reading = digitalRead(BUTTON_PIN) == LOW;

  if (reading != lastReading) {
    lastReading = reading;
    lastChangeAt = millis();
  }

  if (reading != stableDown && millis() - lastChangeAt >= DEBOUNCE_MS) {
    stableDown = reading;
    digitalWrite(LED_PIN, stableDown ? HIGH : LOW);
    if (stableDown) presses++;
  }
}

void writeU16(uint8_t *buf, size_t at, uint16_t v) {
  buf[at] = v & 0xFF;
  buf[at + 1] = v >> 8;
}

void writeU32(uint8_t *buf, size_t at, uint32_t v) {
  for (int i = 0; i < 4; i++) buf[at + i] = (v >> (8 * i)) & 0xFF;
}

void sendPacket() {
  uint8_t packet[PACKET_SIZE];
  const int16_t tilt = (int16_t)round(readTiltDegrees() * 100.0);

  writeU16(packet, 0, seq++);
  writeU16(packet, 2, (uint16_t)tilt);
  packet[4] = stableDown ? 1 : 0;
  packet[5] = presses;
  writeU16(packet, 6, lastPingId);
  writeU32(packet, 8, millis());

  dataChar->setValue(packet, PACKET_SIZE);
  dataChar->notify();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

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

  delay(1000);
  Serial.println("La Cucaña — tabla de equilibrio: prueba 3 (BLE simulado)");
  Serial.println("Anunciándome como " DEVICE_NAME ". Abre la página de diagnóstico y pulsa Conectar.");
}

void loop() {
  updateButton();

  if (connected && millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();
    sendPacket();
  }
}
