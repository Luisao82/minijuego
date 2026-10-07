// Utilidad — Detector de tensión (multímetro de pobre)
// Usa el cable suelto del GPIO 4 como "punta de prueba": al tocar con su punta
// un agujero de la protoboard, dice si ahí hay 3,3 V, GND o nada.
//
// Truco: se lee el pin dos veces, una con pull-down (tira a 0) y otra con
// pull-up (tira a 1). Si las dos lecturas coinciden, algo externo manda:
//   - las dos en 1 → hay 3,3 V
//   - las dos en 0 → hay GND
//   - distintas    → al aire / sin conexión
//
// Monitor Serie a 115200 baudios.

const int PROBE_PIN = 4;
const unsigned long PRINT_EVERY_MS = 300;

String lastState = "";

int readWith(int mode) {
  pinMode(PROBE_PIN, mode);
  delayMicroseconds(200);
  return digitalRead(PROBE_PIN);
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("Detector de tensión — toca con la punta del cable del GPIO 4");
}

void loop() {
  const int down = readWith(INPUT_PULLDOWN);
  const int up = readWith(INPUT_PULLUP);

  String state;
  if (down == HIGH && up == HIGH) state = "⚡ 3,3 V";
  else if (down == LOW && up == LOW) state = "⏚ GND";
  else state = "· al aire (sin conexión)";

  if (state != lastState) {
    Serial.println(state);
    lastState = state;
  }
  delay(PRINT_EVERY_MS);
}
