// =====================================================================
//  PIEZA DE PRUEBA DE ENCAJE — caja de la tabla de equilibrio
// =====================================================================
//  Placa del mismo grosor que las paredes de la caja, con agujeros de
//  varios tamaños para descubrir cuál encaja mejor con cada pieza en TU
//  impresora y TU resina (la resina encoge un poco al curar).
//
//  Filas (de arriba abajo):
//    0. Conector GX12 de panel ......... Ø 11,8 – 12,8 mm (cable de 3 hilos a la bandera)
//    1. Jack 3,5 mm y portaled ......... Ø 5,8 – 8,0 mm
//    2. Pulsador de calibrar ........... Ø 11,8 – 12,6 mm
//    3. Ventana del USB-C .............. 4 tamaños de ventana redondeada
//    4. Tornillos y tuercas ............ agujero pasante + hexágono para tuerca
//       (M2, M2.5 y M3: el hexágono se prueba metiendo la tuerca)
//    Columna derecha: interruptor KCD1 (basculante) — 3 recortes rectangulares
//       alrededor de 19 × 13 mm; el bueno es el que lo sujeta por sus pestañas
//       sin holgura
//    Sueltos en los huecos libres: jack DC 5,5 × 2,1 de panel (DC-099), la
//       entrada de 5 V de la caja de la bandera ... Ø 10,6 – 11,4 mm
//
//  Cada agujero lleva grabada su medida debajo.
//  Uso: prueba cada pieza en los agujeros y apunta el más pequeño en
//  el que entra bien sin forzar. Esas medidas van a la caja definitiva.
// =====================================================================

grosor = 2.5;          // = grosor de pared de la caja
ancho_placa = 146;   // cabe plana en la impresora (153 × 87)
alto_placa = 86;     // casi el fondo de la impresora (87)
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
recortes_interruptor = [[18.8, 12.8], [19.2, 13.0], [19.6, 13.4]];  // [largo, ancho]
agujeros_gx12 = [11.8, 12.0, 12.2, 12.5, 12.8];   // rosca M12 del conector
// Jack DC de 5 V: [Ø, x, y]. No caben en fila, van en los huecos libres
agujeros_dc = [[10.6, 130, 77.5], [10.8, 108, 62], [11.0, 108, 42], [11.4, 108, 24]];

// Altura (Y) del centro de cada fila
fila_gx12 = 77.5;
fila_jack = 62;
fila_pulsador = 42;
fila_usb = 24;
fila_tornillos = 8;

// Columna del interruptor (a la derecha del resto)
columna_interruptor = 126;
filas_interruptor = [62, 40, 18];
radio_recorte = 0.6;  // esquinas casi vivas, como el cuerpo del interruptor

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

// Rectángulo con esquinas apenas redondeadas (centrado)
module recorte_2d(largo, ancho) {
    offset(r = radio_recorte)
        square([largo - 2 * radio_recorte, ancho - 2 * radio_recorte], center = true);
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

    for (i = [0 : len(recortes_interruptor) - 1])
        translate([columna_interruptor, filas_interruptor[i]])
            recorte_2d(recortes_interruptor[i][0], recortes_interruptor[i][1]);

    for (i = [0 : len(agujeros_gx12) - 1])
        translate([12 + i * 24, fila_gx12]) circle(d = agujeros_gx12[i]);

    for (a = agujeros_dc)
        translate([a[1], a[2]]) circle(d = a[0]);
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
    for (i = [0 : len(recortes_interruptor) - 1]) {
        r = recortes_interruptor[i];
        translate([columna_interruptor, filas_interruptor[i] - r[1] / 2 - 3.2])
            etiqueta_2d(str(r[0], "x", r[1]));
    }
    // Al lado del agujero: debajo no cabe sin pisar la fila del jack
    for (i = [0 : len(agujeros_gx12) - 1])
        translate([12 + i * 24 + agujeros_gx12[i] / 2 + 5, fila_gx12]) etiqueta_2d(str(agujeros_gx12[i]));
    // El primero va en la fila del GX12: también con la medida al lado
    for (i = [0 : len(agujeros_dc) - 1]) {
        a = agujeros_dc[i];
        translate(i == 0 ? [a[1] + a[0] / 2 + 5, a[2]] : [a[1], a[2] - a[0] / 2 - 3.2]) etiqueta_2d(str(a[0]));
    }
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
