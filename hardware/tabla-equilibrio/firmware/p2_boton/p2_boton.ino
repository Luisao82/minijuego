// Prueba 2 — Botón (simulado con un cable)
// Un cable en BUTTON_PIN y otro en GND: juntar las puntas = pulsar.
// Es exactamente el mismo circuito que tendrá el microrruptor (COM → GND, NO → BUTTON_PIN).
// No hace falta resistencia: se usa la pull-up interna del ESP32.
//
// Monitor Serie a 115200 baudios.

const int BUTTON_PIN = 4;
const int LED_PIN = 2;

// Antirrebote: un contacto metálico "vibra" unos milisegundos al cerrarse.
// Solo aceptamos el cambio si se mantiene estable este tiempo.
const unsigned long DEBOUNCE_MS = 15;

bool stableDown = false;
bool lastReading = false;
unsigned long lastChangeAt = 0;
unsigned long pressCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  delay(1000);
  Serial.println("La Cucaña — tabla de equilibrio: prueba 2 (botón)");
  Serial.println("Junta el cable del pin 4 con el de GND para pulsar.");
}

void loop() {
  // Con pull-up, el pin lee LOW cuando el botón está cerrado
  const bool reading = digitalRead(BUTTON_PIN) == LOW;

  if (reading != lastReading) {
    lastReading = reading;
    lastChangeAt = millis();
  }

  if (reading != stableDown && millis() - lastChangeAt >= DEBOUNCE_MS) {
    stableDown = reading;
    digitalWrite(LED_PIN, stableDown ? HIGH : LOW);

    if (stableDown) {
      pressCount++;
      Serial.print("PULSADO  (pulsación #");
      Serial.print(pressCount);
      Serial.println(")");
    } else {
      Serial.println("LIBRE");
    }
  }
}
