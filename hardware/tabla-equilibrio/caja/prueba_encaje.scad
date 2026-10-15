// =====================================================================
//  PIEZA DE PRUEBA DE ENCAJE — caja de la tabla de equilibrio
// =====================================================================
//  Placa del mismo grosor que las paredes de la caja, con agujeros de
//  varios tamaños para descubrir cuál encaja mejor con cada pieza en TU
//  impresora y TU resina (la resina encoge un poco al curar).
//
//  Filas (de arriba abajo):
//    1. Jack 3,5 mm y portaled ......... Ø 5,8 – 8,0 mm
//    2. Pulsador de calibrar ........... Ø 11,8 – 12,6 mm
//    3. Ventana del USB-C .............. 4 tamaños de ventana redondeada
//    4. Tornillos y tuercas ............ agujero pasante + hexágono para tuerca
//       (M2, M2.5 y M3: el hexágono se prueba metiendo la tuerca)
//
//  Cada agujero lleva grabada su medida debajo.
//  Uso: prueba cada pieza en los agujeros y apunta el más pequeño en
//  el que entra bien sin forzar. Esas medidas van a la caja definitiva.
// =====================================================================

grosor = 2.5;          // = grosor de pared de la caja
ancho_placa = 104;
alto_placa = 74;
radio_esquina = 3;

grabado = 0.6;         // profundidad de los textos
tam_texto = 2.8;
fuente = "Liberation Sans:style=Bold";

$fn = 64;

// La pieza se construye en 2D (perfil con agujeros) y luego se extruye:
// OpenSCAD calcula las operaciones 2D al instante, mientras que restar
// textos en 3D con la versión 2021 tarda muchísimo al exportar (F6).

// Medidas a probar
agujeros_jack_led = [5.8, 6.0, 6.2, 6.4, 6.6, 7.0, 8.0];
agujeros_pulsador = [11.8, 12.0, 12.2, 12.4, 12.6];
ventanas_usb = [[9.4, 3.6], [10.0, 4.0], [11.0, 5.0], [12.5, 6.5]];  // [ancho, alto]
// [nombre, Ø pasante, entrecaras de la tuerca + holgura]
tornillos = [["M2", 2.4, 4.3], ["M2.5", 2.9, 5.3], ["M3", 3.4, 5.8]];

// Altura (Y) del centro de cada fila
fila_jack = 62;
fila_pulsador = 42;
fila_usb = 24;
fila_tornillos = 8;

// ---------------------------------------------------------------------

module placa_2d() {
    hull()
        for (x = [radio_esquina, ancho_placa - radio_esquina],
             y = [radio_esquina, alto_placa - radio_esquina])
            translate([x, y]) circle(r = radio_esquina);
}

// Rectángulo con extremos redondos, como el contorno de un USB-C
module ventana_2d(an, al) {
    hull()
        for (dx = [-(an - al) / 2, (an - al) / 2])
            translate([dx, 0]) circle(d = al);
}

// Con $fn = 6, el diámetro de circle es entre vértices
module hexagono_2d(entrecaras) {
    circle(d = entrecaras / cos(30), $fn = 6);
}

module etiqueta_2d(texto) {
    text(texto, size = tam_texto, font = fuente, halign = "center", valign = "center");
}

// Todos los agujeros pasantes
module agujeros_2d() {
    for (i = [0 : len(agujeros_jack_led) - 1])
        translate([9 + i * 14, fila_jack]) circle(d = agujeros_jack_led[i]);

    for (i = [0 : len(agujeros_pulsador) - 1])
        translate([12 + i * 20, fila_pulsador]) circle(d = agujeros_pulsador[i]);

    for (i = [0 : len(ventanas_usb) - 1])
        translate([15 + i * 25, fila_usb]) ventana_2d(ventanas_usb[i][0], ventanas_usb[i][1]);

    for (i = [0 : len(tornillos) - 1]) {
        x0 = 10 + i * 33;
        translate([x0, fila_tornillos]) circle(d = tornillos[i][1]);
        translate([x0 + 9, fila_tornillos]) hexagono_2d(tornillos[i][2]);
    }
}

// Las medidas grabadas bajo cada agujero
module etiquetas_2d() {
    for (i = [0 : len(agujeros_jack_led) - 1]) {
        d = agujeros_jack_led[i];
        translate([9 + i * 14, fila_jack - d / 2 - 3.2]) etiqueta_2d(str(d));
    }
    for (i = [0 : len(agujeros_pulsador) - 1]) {
        d = agujeros_pulsador[i];
        translate([12 + i * 20, fila_pulsador - d / 2 - 3.2]) etiqueta_2d(str(d));
    }
    for (i = [0 : len(ventanas_usb) - 1]) {
        v = ventanas_usb[i];
        translate([15 + i * 25, fila_usb - v[1] / 2 - 3.2]) etiqueta_2d(str(v[0], "x", v[1]));
    }
    for (i = [0 : len(tornillos) - 1])
        translate([10 + i * 33 + 20, fila_tornillos]) etiqueta_2d(tornillos[i][0]);
}

// Capa inferior: placa con agujeros. Capa superior (los últimos 0,6 mm):
// además, sin las letras → quedan grabadas.
//
// capa = 0 → las dos (para verla en OpenSCAD con F5)
// capa = 1 / 2 → solo una, para exportar: así no hace falta la unión 3D,
// que es lo lento. exportar_stl.sh exporta las dos y las junta en un STL.
capa = 0;

if (capa != 2)
    linear_extrude(grosor - grabado)
        difference() { placa_2d(); agujeros_2d(); }

if (capa != 1)
    translate([0, 0, grosor - grabado])
        linear_extrude(grabado)
            difference() { placa_2d(); agujeros_2d(); etiquetas_2d(); }
