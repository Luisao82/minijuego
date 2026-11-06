// Bandera física: el servo empuja el brazo hasta el tope de arriba y la goma
// lo baja; el microrruptor del portapalo dice si el palo está puesto.
//
// Ciclo: sube → espera arriba → baja. Si durante el ciclo el palo sale del
// portapalo (el micro se suelta), cuenta como "bandera cogida" y el servo
// baja en el acto: el aspa solo empuja, así que el brazo queda libre y nadie
// tira contra el servo. Al terminar se dejan de mandar pulsos (no zumba).
#pragma once
#include <Arduino.h>

class FlagMechanism {
public:
  // Ángulos provisionales: se ajustan probando con el mecanismo real
  // (comando 0-180 por el Monitor Serie con la bandera abajo)
  static constexpr int ANGLE_DOWN = 90;
  static constexpr int ANGLE_UP = 0;

  // Lo que tarda el servo en hacer el recorrido completo (MG90S ≈ 0,2 s)
  static constexpr unsigned long TRAVEL_MS = 250;
  static constexpr unsigned long DEFAULT_HOLD_MS = 500;
  static constexpr unsigned long MIN_HOLD_MS = 100;
  static constexpr unsigned long MAX_HOLD_MS = 3000;

  enum Phase { FLAG_DOWN, FLAG_RISING, FLAG_UP, FLAG_LOWERING };

  void begin(int servoPin, int switchPin) {
    servoPin_ = servoPin;
    switchPin_ = switchPin;
    pinMode(switchPin_, INPUT_PULLUP);
    stableHigh_ = rawHigh_ = digitalRead(switchPin_) == HIGH;
    ledcAttach(servoPin_, SERVO_FREQ_HZ, SERVO_RES_BITS);
    writeAngle(ANGLE_DOWN);
  }

  // Devuelve el motivo si no puede subir, o nullptr si arranca el ciclo
  const char *start(unsigned long holdMs) {
    if (phase_ != FLAG_DOWN) return "la bandera ya está en ciclo";
    if (!present()) return "no hay bandera en el portapalo";
    holdMs_ = constrain(holdMs, MIN_HOLD_MS, MAX_HOLD_MS);
    grabbedThisCycle_ = false;
    setPhase(FLAG_RISING);
    return nullptr;
  }

  // Devuelve true en el momento en que se coge la bandera
  bool update() {
    const bool grabbed = readSwitch();
    const unsigned long elapsed = millis() - phaseStart_;

    if (phase_ == FLAG_RISING) {
      writeAngle(ANGLE_UP);
      if (elapsed >= TRAVEL_MS) setPhase(FLAG_UP);
    } else if (phase_ == FLAG_UP) {
      if (elapsed >= holdMs_) setPhase(FLAG_LOWERING);
    } else if (phase_ == FLAG_LOWERING) {
      writeAngle(ANGLE_DOWN);
      if (elapsed >= TRAVEL_MS) setPhase(FLAG_DOWN);
    }

    if (grabbed && (phase_ == FLAG_RISING || phase_ == FLAG_UP)) setPhase(FLAG_LOWERING);

    if (phase_ == FLAG_DOWN && holding_ && millis() - movedAt_ > RELEASE_AFTER_MS) {
      ledcWrite(servoPin_, 0);
      holding_ = false;
    }
    return grabbed;
  }

  // Solo con la bandera abajo, para buscar los ángulos buenos
  bool moveTo(int angle) {
    if (phase_ != FLAG_DOWN) return false;
    writeAngle(angle);
    return true;
  }

  bool present() const { return !stableHigh_; }
  bool cycling() const { return phase_ != FLAG_DOWN; }
  Phase phase() const { return phase_; }
  uint8_t grabs() const { return grabs_; }
  int angle() const { return currentAngle_; }

private:
  // Pulso estándar de servo: 50 Hz, 0,5 ms (0°) a 2,4 ms (180°)
  static constexpr int SERVO_FREQ_HZ = 50;
  static constexpr int SERVO_RES_BITS = 14;
  static constexpr int PULSE_MIN_US = 500;
  static constexpr int PULSE_MAX_US = 2400;
  static constexpr unsigned long PERIOD_US = 1000000UL / SERVO_FREQ_HZ;
  static constexpr unsigned long RELEASE_AFTER_MS = 600;
  // Más largo que un antirrebote normal: al llegar al tope de golpe, el palo
  // puede despegarse un instante del micro y no debe contar como cogida
  static constexpr unsigned long GRAB_CONFIRM_MS = 50;

  int servoPin_ = -1;
  int switchPin_ = -1;
  Phase phase_ = FLAG_DOWN;
  unsigned long phaseStart_ = 0;
  unsigned long holdMs_ = DEFAULT_HOLD_MS;
  bool grabbedThisCycle_ = false;
  uint8_t grabs_ = 0;

  int currentAngle_ = -1;
  unsigned long movedAt_ = 0;
  bool holding_ = false;

  // Micro pulsado (palo puesto) → pin a GND → LOW
  bool stableHigh_ = false;
  bool rawHigh_ = false;
  unsigned long rawChangedAt_ = 0;

  void setPhase(Phase next) {
    phase_ = next;
    phaseStart_ = millis();
  }

  void writeAngle(int angle) {
    angle = constrain(angle, 0, 180);
    if (angle == currentAngle_ && holding_) return;
    const unsigned long pulse = map(angle, 0, 180, PULSE_MIN_US, PULSE_MAX_US);
    ledcWrite(servoPin_, pulse * ((1UL << SERVO_RES_BITS) - 1) / PERIOD_US);
    currentAngle_ = angle;
    movedAt_ = millis();
    holding_ = true;
  }

  bool readSwitch() {
    const bool high = digitalRead(switchPin_) == HIGH;
    if (high != rawHigh_) {
      rawHigh_ = high;
      rawChangedAt_ = millis();
    }
    if (rawHigh_ == stableHigh_ || millis() - rawChangedAt_ < GRAB_CONFIRM_MS) return false;

    stableHigh_ = rawHigh_;
    if (stableHigh_ && phase_ != FLAG_DOWN && !grabbedThisCycle_) {
      grabbedThisCycle_ = true;
      grabs_++;
      return true;
    }
    return false;
  }
};
