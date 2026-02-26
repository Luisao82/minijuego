# La Cucaña Trianera

Minijuego retro en estilo **pixel art 16 bits** inspirado en la Cucaña de Triana, la tradicional prueba de equilibrio de la Velá de Santa Ana en Sevilla.

---

## La tradición de la Cucaña en Triana

Cada mes de julio, el barrio de Triana en Sevilla celebra la **Velá de Santa Ana**, una de las fiestas populares más antiguas y queridas de la ciudad. Entre farolillos, casetas, música y el olor a pescaíto frito, el río Guadalquivir se convierte en escenario de una de las pruebas más divertidas y esperadas: **la Cucaña**.

La Cucaña consiste en un largo palo de madera colocado en horizontal sobre el río, engrasado con sebo o jabón, que parte desde una barcaza. Los participantes deben recorrerlo manteniendo el equilibrio hasta alcanzar una bandera clavada en el extremo. Lo que parece sencillo se convierte en un desafío casi imposible: el palo resbala, se balancea con cada paso y la caída al Guadalquivir está asegurada para la mayoría.

Es una tradición que lleva generaciones formando parte del verano trianero, donde niños y mayores se lanzan a intentarlo entre los aplausos y las risas del público que observa desde la orilla y el puente. Más que una competición, es un espectáculo que representa el espíritu festivo, valiente y desenfadado de Triana.

---

## Sobre el juego

**La Cucaña Trianera** traslada esta tradición a la pantalla. El jugador debe avanzar por el palo engrasado sobre el Guadalquivir, manteniendo el equilibrio hasta alcanzar la bandera en el extremo. Sencillo de entender, difícil de conseguir.

### Pantallas principales

1. **Pantalla de Inicio** - Fondo pixel art del río Guadalquivir con el Puente de Triana. Título retro y texto parpadeante "Pulse para empezar".
2. **Selección de Personaje** - Elige tu personaje con estadísticas estilo RPG retro (peso, equilibrio, altura, edad). En el MVP solo estará disponible "El Trianero".
3. **Pantalla de Juego** - La acción principal: el personaje avanza por el palo con controles táctiles para mantener el equilibrio.
4. **Pantalla Final** - Resultado de la partida, tanto si llegas a la bandera como si caes al agua.

### Mecánicas de juego

- **Impulso inicial (timing):** Minijuego de timing para coger carrerilla antes de subir al palo.
- **Avance por el palo:** Avance hacia la bandera con física de oscilación. Cuanto más cerca del extremo, más inestable.
- **Sistema de equilibrio dinámico:** Hay que mantener el equilibrio de forma activa. Si se desestabiliza demasiado, caída al agua.
- **Zonas de aceite y desgaste:** El palo tiene zonas con distintos niveles de aceite. Las zonas más usadas tienen más agarre; las vírgenes son más resbaladizas.
- **Salto final:** Al llegar al extremo, salto para alcanzar la bandera. Si el timing o el equilibrio fallan, caída justo antes de conseguirlo.

### Sistema de personajes

Cada personaje tiene estadísticas que afectan a la partida:

| Stat | Efecto |
|------|--------|
| **Peso** | Afecta a la física del palo. Más peso = más inercia, pero también más estabilidad en condiciones normales |
| **Equilibrio** | Determina el margen antes de caer. Más equilibrio = más tiempo de reacción |
| **Altura** | Centro de gravedad más alto (más difícil de equilibrar), pero brazos más largos para alcanzar la bandera |
| **Edad** | Afecta a la velocidad de movimiento y la resistencia |

**Personaje inicial: "El Trianero"** - Stats medios en todo. El personaje equilibrado para aprender las mecánicas.

### Diseño visual

- Estética **pixel art 16 bits**, estilo SNES/Mega Drive
- Escenario: el palo sobre el Guadalquivir, ambientado en la Velá de Santa Ana
- Sprites dibujados a mano en baja resolución (16x16 o 32x32 px)
- Animaciones de movimiento, equilibrio y caída al agua

---

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| **Phaser 3** | Motor del juego (v3.90.0) |
| **Vite** | Bundler y servidor de desarrollo (v6.3.1) |
| **JavaScript** | Lenguaje base |
| **LibreSprite / Aseprite** | Creación de sprites y pixel art |

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instalar dependencias |
| `npm run dev` | Servidor de desarrollo en `http://localhost:8080` |
| `npm run build` | Build de producción en carpeta `dist` |

## Estructura del proyecto

```
├── index.html              # HTML principal
├── public/
│   ├── assets/             # Sprites, audio y assets del juego
│   ├── favicon.png
│   └── style.css           # Estilos globales
├── src/
│   ├── main.js             # Bootstrap de la aplicación
│   └── game/
│       ├── main.js         # Configuración y arranque de Phaser
│       └── scenes/         # Escenas del juego
├── vite/                   # Configuración de Vite
└── package.json
```

---

## Visión a futuro

- Más personajes con distintos stats que cambien la experiencia de juego
- Modo con bots en cola: otros jugadores IA suben antes que tú y desgastan el aceite del palo
- Distribución como **PWA** (Progressive Web App) para instalar directamente desde el navegador
- Posible empaquetado nativo con **Capacitor** para Android/iOS
