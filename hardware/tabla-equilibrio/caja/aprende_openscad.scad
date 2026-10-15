// =====================================================================
//  APRENDE OPENSCAD EN 7 PASOS — una caja sencilla
// =====================================================================
//
//  Cómo usar este archivo:
//    1. Cambia el número de `paso` (justo debajo) de 1 a 7.
//    2. Pulsa F5 (vista previa rápida) para ver el resultado.
//    3. Lee el comentario de ese paso más abajo.
//
//  Ratón en la vista 3D:
//    - Arrastrar con botón izquierdo  → girar
//    - Arrastrar con botón derecho    → mover
//    - Rueda                          → zoom
//
//  Las medidas son siempre en MILÍMETROS.
// =====================================================================

paso = 1;   // <-- CAMBIA ESTE NÚMERO (1 a 7) y pulsa F5


// ---------------------------------------------------------------------
//  PARÁMETROS: las medidas de la caja, todas en un sitio.
//  Si quieres la caja más grande, cambia aquí y se adapta todo.
// ---------------------------------------------------------------------
ancho  = 60;    // eje X
largo  = 80;    // eje Y
alto   = 30;    // eje Z
pared  = 2.5;   // grosor de las paredes

agujero_led  = 6;    // diámetro del agujero del LED
agujero_jack = 6;    // diámetro del agujero del jack

$fn = 64;  // suavidad de los círculos (más = más redondo, más lento)


// ---------------------------------------------------------------------
//  PASO 1 — Un bloque.
//  cube([X, Y, Z]) crea una caja maciza desde el origen (0,0,0).
// ---------------------------------------------------------------------
if (paso == 1) {
    cube([ancho, largo, alto]);
}


// ---------------------------------------------------------------------
//  PASO 2 — Vaciar el bloque con difference().
//  difference() { A; B; } = A menos B.
//  El primer objeto es el bloque; el segundo, un bloque más pequeño
//  que "muerde" el interior. translate([x,y,z]) lo mueve.
//
//  Truco: el bloque interior sube por encima del borde (+1) para que
//  la caja quede abierta por arriba y no salga una "piel" fantasma.
// ---------------------------------------------------------------------
if (paso == 2) {
    difference() {
        cube([ancho, largo, alto]);
        translate([pared, pared, pared])
            cube([ancho - 2*pared, largo - 2*pared, alto]);
    }
}


// ---------------------------------------------------------------------
//  PASO 3 — Ver lo que restas con "#".
//  Pon # delante de una pieza y se dibuja en rojo transparente.
//  Es la mejor forma de comprobar que un agujero está donde quieres.
// ---------------------------------------------------------------------
if (paso == 3) {
    difference() {
        cube([ancho, largo, alto]);
        # translate([pared, pared, pared])
            cube([ancho - 2*pared, largo - 2*pared, alto]);
    }
}


// ---------------------------------------------------------------------
//  PASO 4 — Agujero redondo en una pared (el del jack).
//  cylinder(d = diámetro, h = altura) crea un cilindro vertical.
//  rotate([90, 0, 0]) lo tumba para que atraviese la pared delantera.
// ---------------------------------------------------------------------
if (paso == 4) {
    difference() {
        cube([ancho, largo, alto]);
        translate([pared, pared, pared])
            cube([ancho - 2*pared, largo - 2*pared, alto]);

        // Jack: centrado en el ancho, a media altura, en la pared de delante
        # translate([ancho/2, pared + 1, alto/2])
            rotate([90, 0, 0])
                cylinder(d = agujero_jack, h = pared + 2);
    }
}


// ---------------------------------------------------------------------
//  PASO 5 — Módulos: piezas con nombre que puedes reutilizar.
//  module nombre() { ... } define la pieza; nombre(); la dibuja.
//  Aquí la caja pasa a ser un módulo, y la tapa, otro.
// ---------------------------------------------------------------------
module caja() {
    difference() {
        cube([ancho, largo, alto]);
        translate([pared, pared, pared])
            cube([ancho - 2*pared, largo - 2*pared, alto]);
        translate([ancho/2, pared + 1, alto/2])
            rotate([90, 0, 0])
                cylinder(d = agujero_jack, h = pared + 2);
    }
}

module tapa() {
    difference() {
        cube([ancho, largo, pared]);
        // Agujero del LED, en el centro de la tapa
        translate([ancho/2, largo/2, -1])
            cylinder(d = agujero_led, h = pared + 2);
    }
}

if (paso == 5) {
    caja();
    // La tapa, dibujada al lado (desplazada en X) para verlas las dos
    translate([ancho + 10, 0, 0]) tapa();
}


// ---------------------------------------------------------------------
//  PASO 6 — Montar las piezas para ver cómo encajan.
//  color("nombre", transparencia) solo cambia cómo se ve en pantalla.
//  La tapa se coloca encima de la caja con translate.
// ---------------------------------------------------------------------
if (paso == 6) {
    color("orange") caja();
    color("steelblue", 0.6) translate([0, 0, alto]) tapa();
}


// ---------------------------------------------------------------------
//  PASO 7 — Preparar para imprimir.
//  Para la impresora, cada pieza va por separado y apoyada en la cama.
//  1. Deja aquí solo la pieza que quieras exportar (caja o tapa).
//  2. Pulsa F6 (render completo; tarda más que F5).
//  3. Menú File → Export → Export as STL…
//  4. Abre el STL en el programa de tu impresora (Photon Workshop, Lychee…).
// ---------------------------------------------------------------------
if (paso == 7) {
    caja();
}


// =====================================================================
//  PARA EXPERIMENTAR
//  - Cambia `ancho`, `largo` o `alto` arriba y mira cómo se adapta todo.
//  - Cambia `pared` a 1 o a 5.
//  - Cambia `$fn` a 6: ¡los agujeros salen hexagonales!
//  - En el paso 4, cambia `alto/2` por `alto - 8` para subir el jack.
//
//  Chuleta:
//    cube([x,y,z])            bloque
//    cylinder(d=, h=)         cilindro
//    sphere(d=)               esfera
//    translate([x,y,z])       mover
//    rotate([x,y,z])          girar (grados)
//    difference() { A; B; }   A menos B
//    union() { A; B; }        A más B
//    # pieza                  ver en rojo lo que se resta
//    module nombre() { }      pieza reutilizable
// =====================================================================
