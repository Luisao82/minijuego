// Prueba 1 — Blink
// Comprueba que placa, cable, hub e IDE funcionan: el LED de la placa
// parpadea y el Monitor Serie muestra un contador.
//
// Placa: Freenove ESP32-S3 WROOM → en el IDE elegir "ESP32S3 Dev Module".
// Monitor Serie a 115200 baudios.

// LED integrado de la Freenove ESP32-S3. Si no parpadea, probar con 48.
const int LED_PIN = 2;
const unsigned long BLINK_MS = 500;

unsigned long count = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  delay(1000);
  Serial.println("La Cucaña — tabla de equilibrio: prueba 1 (blink)");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(BLINK_MS);
  digitalWrite(LED_PIN, LOW);
  delay(BLINK_MS);

  count++;
  Serial.print("Parpadeo #");
  Serial.println(count);
}
