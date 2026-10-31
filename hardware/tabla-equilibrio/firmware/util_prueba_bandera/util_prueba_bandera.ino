// Utilidad — Prueba del borne BANDERA (servo + microrruptor del soporte)
// Valida el cableado y simula la ventana de agarre, sin Bluetooth.
//
//   A17 → servo (señal, por la resistencia de 100 Ω) ... GPIO 17
//   A19 → microrruptor del soporte de la bandera ....... GPIO 18 (pull-up)
//   A21 → GND común
//
// Monitor Serie a 115200 baudios, "Nueva línea" como fin de línea:
//   s      → ciclo de bandera: sube de golpe, 0,5 s arriba, baja sola de golpe
//   0-180  → servo a ese ángulo, con la bandera en reposo (para buscar ángulos)
//
// Si durante el ciclo (subida, espera o bajada) se suelta el micro —el palito
// sale del soporte— dice "bandera COGIDA". Con la bandera abajo no dice nada.

const int SERVO_PIN = 17;
const int FLAG_PIN = 18;

// Ángulos provisionales: se ajustan probando con el mecanismo real
const int ANGLE_DOWN = 90;
const int ANGLE_UP = 0;

// Tiempos del ciclo. Subida y bajada van a la velocidad máxima del servo:
// TRAVEL_MS es lo que tarda en recorrer los 90° (SG90 ≈ 0,15 s), y cuenta
// como parte de la ventana de agarre
const unsigned long TRAVEL_MS = 200;
const unsigned long HOLD_MS = 500;

// Pulso estándar de servo: 50 Hz, 0,5 ms (0°) a 2,4 ms (180°)
const int SERVO_FREQ_HZ = 50;
const int SERVO_RES_BITS = 14;
const int PULSE_MIN_US = 500;
const int PULSE_MAX_US = 2400;
const unsigned long PERIOD_US = 1000000UL / SERVO_FREQ_HZ;

// Tras moverse se dejan de mandar pulsos: el SG90 no zumba en reposo
const unsigned long RELEASE_AFTER_MS = 600;
const unsigned long DEBOUNCE_MS = 30;

enum Phase { FLAG_DOWN, FLAG_RISING, FLAG_UP, FLAG_LOWERING };
Phase phase = FLAG_DOWN;
unsigned long phaseStart = 0;
bool grabbedThisCycle = false;

int currentAngle = -1;
unsigned long movedAt = 0;
bool holding = false;

int stableFlag = HIGH;
int rawFlag = HIGH;
unsigned long rawChangedAt = 0;

void writeAngle(int angle) {
  angle = constrain(angle, 0, 180);
  if (angle == currentAngle && holding) return;
  const unsigned long pulse = map(angle, 0, 180, PULSE_MIN_US, PULSE_MAX_US);
  const unsigned long duty = pulse * ((1UL << SERVO_RES_BITS) - 1) / PERIOD_US;
  ledcWrite(SERVO_PIN, duty);
  currentAngle = angle;
  movedAt = millis();
  holding = true;
}

void startPhase(Phase next, const char *label) {
  phase = next;
  phaseStart = millis();
  Serial.println(label);
}

void startCycle() {
  if (phase != FLAG_DOWN) {
    Serial.println("(la bandera ya está en ciclo)");
    return;
  }
  grabbedThisCycle = false;
  startPhase(FLAG_RISING, "↑ subiendo bandera");
}

void updateCycle() {
  if (phase == FLAG_DOWN) return;
  const unsigned long elapsed = millis() - phaseStart;

  if (phase == FLAG_RISING) {
    writeAngle(ANGLE_UP);
    if (elapsed >= TRAVEL_MS) startPhase(FLAG_UP, "■ bandera arriba");
  } else if (phase == FLAG_UP) {
    if (elapsed >= HOLD_MS) startPhase(FLAG_LOWERING, "↓ bajando bandera");
  } else if (phase == FLAG_LOWERING) {
    writeAngle(ANGLE_DOWN);
    if (elapsed >= TRAVEL_MS) {
      phase = FLAG_DOWN;
      Serial.println("· bandera abajo");
    }
  }
}

void handleSerial() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  if (cmd.length() == 0) return;
  if (cmd == "s") {
    startCycle();
  } else if (isDigit(cmd[0]) && phase == FLAG_DOWN) {
    writeAngle(cmd.toInt());
    Serial.printf("Servo → %d°\n", currentAngle);
  } else {
    Serial.println("Comandos: s (ciclo de bandera), 0-180 (ángulo, en reposo)");
  }
}

// Micro pulsado (palito en su sitio) → GPIO 18 a GND → LOW.
// Solo interesa el paso a HIGH (se suelta) dentro del ciclo.
void readFlag() {
  const int now = digitalRead(FLAG_PIN);
  if (now != rawFlag) {
    rawFlag = now;
    rawChangedAt = millis();
  }
  if (millis() - rawChangedAt < DEBOUNCE_MS || rawFlag == stableFlag) return;

  stableFlag = rawFlag;
  if (stableFlag == HIGH && phase != FLAG_DOWN && !grabbedThisCycle) {
    grabbedThisCycle = true;
    Serial.println("🚩 bandera COGIDA");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  pinMode(FLAG_PIN, INPUT_PULLUP);
  stableFlag = rawFlag = digitalRead(FLAG_PIN);
  ledcAttach(SERVO_PIN, SERVO_FREQ_HZ, SERVO_RES_BITS);

  Serial.println("Prueba del borne BANDERA");
  Serial.println("Comandos: s (ciclo de bandera), 0-180 (ángulo, en reposo)");
  writeAngle(ANGLE_DOWN);
}

void loop() {
  handleSerial();
  readFlag();
  updateCycle();

  if (phase == FLAG_DOWN && holding && millis() - movedAt > RELEASE_AFTER_MS) {
    ledcWrite(SERVO_PIN, 0);
    holding = false;
  }
}
