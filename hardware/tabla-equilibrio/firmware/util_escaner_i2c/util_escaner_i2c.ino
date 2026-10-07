// Utilidad — Escáner I2C
// Busca cualquier dispositivo I2C (el MPU6050 responde en 0x68 o 0x69) y prueba
// también con SDA y SCL intercambiados, por si los cables están cruzados.
// Repite cada 3 segundos: se pueden ir moviendo cables sin volver a subir nada.
//
// Monitor Serie a 115200 baudios.

#include <Wire.h>

const int PIN_A = 8;  // SDA esperado
const int PIN_B = 9;  // SCL esperado
const unsigned long SCAN_EVERY_MS = 3000;

int scan(int sda, int scl) {
  Wire.end();
  Wire.begin(sda, scl);
  Wire.setClock(100000);  // velocidad baja: más tolerante a malos contactos

  int found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("   ✓ Dispositivo en 0x");
      Serial.print(addr, HEX);
      if (addr == 0x68 || addr == 0x69) Serial.print("  ← MPU6050");
      Serial.println();
      found++;
    }
  }
  return found;
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("Escáner I2C — La Cucaña");
}

void loop() {
  Serial.println();
  Serial.printf("Probando SDA=GPIO %d, SCL=GPIO %d (montaje correcto)...\n", PIN_A, PIN_B);
  const int normal = scan(PIN_A, PIN_B);

  Serial.printf("Probando SDA=GPIO %d, SCL=GPIO %d (cables cruzados)...\n", PIN_B, PIN_A);
  const int swapped = scan(PIN_B, PIN_A);

  if (normal > 0) {
    Serial.println("→ Todo bien: el montaje es correcto.");
  } else if (swapped > 0) {
    Serial.println("→ SDA y SCL están CRUZADOS: intercambia los cables de GPIO 8 y GPIO 9.");
  } else {
    Serial.println("→ No responde nada. Revisa alimentación (¿LED del sensor encendido?), filas y soldaduras.");
  }

  delay(SCAN_EVERY_MS);
}
