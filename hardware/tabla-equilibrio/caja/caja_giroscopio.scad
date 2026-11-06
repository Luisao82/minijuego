// =====================================================================
//  CAJA DEL GIROSCOPIO — versión para la placa perforada (PROVISIONAL)
// =====================================================================
//  Caja plana que va atornillada DEBAJO de la tabla, en el extremo que
//  mira a la máquina. Dos piezas:
//
//    tapa     Se atornilla a la tabla con 4 tornillos para madera
//             avellanados y lleva 4 tuercas M3 encajadas
//    bandeja  Cuelga de la tapa con 4 tornillos M3 desde abajo. Para
//             cambiar las pilas se quitan esos 4 tornillos y baja entera
//
//  Dentro: el portapilas de 4 × AA junto a la cara de mandos y la placa
//  al fondo, con su USB-C pegado a la pared del fondo. La antena del ESP32,
//  en el extremo contrario al USB-C, mira a las pilas pero queda a unos
//  17 mm de ellas (mínimo 10 mm).
//  La cara de mandos (la que mira a la máquina) lleva el interruptor
//  KCD1, el LED, el botón CAL y el conector GX12, por encima del portapilas.
//  Pared del fondo: ventana del USB-C. Lateral: jack 3,5 mm del microrruptor.
//
//  La placa se atornilla por sus 2 agujeros de las esquinas del lado de las
//  pilas. Al cortar la fila 1 se perdieron los otros 2: ese extremo solo
//  apoya en 2 postes.
//
//  PENDIENTE de medir: alto de la placa montada, alto y posición del USB-C y
//  agujeros de las esquinas. Los huecos se ajustan con la pieza de prueba de
//  encaje. Cambiar aquí y volver a exportar (exportar_cajas.sh).
//
//  Ejes: X a lo largo (la cara de mandos en x = 0), Y a lo ancho, Z arriba.
// =====================================================================

pieza = "montaje";    // "montaje", "bandeja", "tapa"
$fn = 48;

// ---------- Medidas pendientes de confirmar ----------
alto_placa_montada = 28;     // de la cara de abajo de la placa a lo más alto del ESP32
placa = [70, 50];            // placa perforada de 50 × 70
placa_recorte = 3;           // lo que se quitó al cortar la fila 1 para sacar el USB-C
placa_agujero_borde = 2.5;   // centro de los agujeros de esquina ↔ borde de la placa
placa_separador = 5;         // separadores bajo la placa
usb_alto = 15;               // de la cara de abajo de la placa al centro del USB-C
usb_desvio = 1.3;            // centro del ESP32 (columna I) respecto al centro de la placa
pilas = [58, 63, 15];        // portapilas: [a lo largo, a lo ancho, alto]; cables por el lado de 63

// Huecos de la cara (los buenos salen de la pieza de prueba de encaje)
kcd1 = [19.2, 13.0];         // interruptor, recorte rectangular
d_led = 6.2;
d_cal = 12.2;                // pulsador de calibrar
d_gx12 = 12.2;               // conector del cable de la bandera
d_jack = 6.2;                // jack 3,5 mm del microrruptor
usb_ventana = [26, 9];       // holgada: la Freenove lleva dos USB-C juntos, y aún sin medir

// ---------- Construcción ----------
pared = 2.5;
holgura = 2;
d_m3 = 3.4;
m3_tuerca = 5.8;             // entrecaras + holgura (como en la prueba de encaje)

hueco_mandos = 17;           // altura libre sobre el portapilas para los mandos de la cara
interior = [
  holgura + pilas[0] + 4 + placa[0] + holgura,
  max(pilas[1], placa[1]) + 2 * holgura,
  max(pilas[2] + hueco_mandos, placa_separador + alto_placa_montada) + 2
];
exterior = [interior[0] + 2 * pared, interior[1] + 2 * pared, interior[2] + pared];
tapa_grosor = 3;
oreja_r = 6;                 // orejas exteriores con los tornillos M3
// Centradas en la pared: así la caja no pasa de 84 mm de ancho y cabe en la impresora
orejas = [for (x = [14, exterior[0] - 14], y = [0, exterior[1]]) [x, y]];
madera = [for (x = [30, exterior[0] - 30], y = [16, exterior[1] - 16]) [x, y]];

echo(str("Caja del giroscopio: ", exterior[0], " × ", exterior[1] + 2 * oreja_r, " × ",
         exterior[2] + tapa_grosor, " mm (con orejas y tapa)"));

// Altura de los mandos de la cara: por encima del portapilas
z_mandos = pared + pilas[2] + hueco_mandos / 2 + 1;
mandos = [  // [y, tipo]
  [pared + 13, "kcd1"], [pared + 29, "led"], [pared + 43, "cal"], [pared + 59, "gx12"]
];

module recorte_mando(tipo) {
  if (tipo == "kcd1") cube([pared * 3, kcd1[0], kcd1[1]], center = true);
  else rotate([0, 90, 0]) cylinder(d = tipo == "led" ? d_led : tipo == "cal" ? d_cal : d_gx12, h = pared * 3, center = true);
}

placa_largo = placa[0] - placa_recorte;
placa_x = pared + interior[0] - 0.5 - placa_largo;
placa_y = (exterior[1] - placa[1]) / 2;
jack_x = 38;                 // detrás del KCD1 y por encima del portapilas

module bandeja() {
  difference() {
    union() {
      difference() {
        cube(exterior);
        translate([pared, pared, pared]) cube(interior + [0, 0, 1]);
      }
      for (p = orejas) translate([p[0], p[1], 0]) cylinder(r = oreja_r, h = exterior[2]);
      // Separadores de la placa
      // Los del lado del USB-C se meten en la pared del fondo: tangentes darían una malla no válida
      for (dx = [placa_agujero_borde, placa_largo - 1], dy = [placa_agujero_borde, placa[1] - placa_agujero_borde])
        translate([placa_x + dx, placa_y + dy, 0]) cylinder(d = 6, h = pared + placa_separador);
      // Tope del portapilas para que no se deslice hacia la placa
      translate([pared + holgura + pilas[0] + 1, pared, 0]) cube([2, interior[1], pared + 6]);
    }
    for (m = mandos) translate([pared / 2, m[0], z_mandos]) recorte_mando(m[1]);
    // Jack del microrruptor, en el lateral
    translate([jack_x, -1, z_mandos]) rotate([-90, 0, 0]) cylinder(d = d_jack, h = pared + 2);
    // Ventana del USB-C, en la pared del fondo
    translate([exterior[0] - pared / 2, exterior[1] / 2 + usb_desvio, pared + placa_separador + usb_alto])
      cube([pared * 3, usb_ventana[0], usb_ventana[1]], center = true);
    for (p = orejas) {
      translate([p[0], p[1], -1]) cylinder(d = d_m3, h = exterior[2] + 2);
      translate([p[0], p[1], -1]) cylinder(d = 6.2, h = 4);   // cabeza del tornillo, por debajo
    }
    for (dy = [placa_agujero_borde, placa[1] - placa_agujero_borde])
      translate([placa_x + placa_agujero_borde, placa_y + dy, pared]) cylinder(d = 2.2, h = placa_separador + 1);
  }
}

module tapa() {
  difference() {
    hull() {
      cube([exterior[0], exterior[1], tapa_grosor]);
      for (p = orejas) translate([p[0], p[1], 0]) cylinder(r = oreja_r, h = tapa_grosor);
    }
    for (p = orejas) {
      translate([p[0], p[1], -1]) cylinder(d = d_m3, h = tapa_grosor + 2);
      translate([p[0], p[1], tapa_grosor - 2.4]) cylinder(d = m3_tuerca / cos(30), h = 3, $fn = 6);
    }
    // Tornillos para madera avellanados (la cabeza queda por abajo, dentro de la caja)
    for (p = madera) translate([p[0], p[1], -1]) {
      cylinder(d = 4.5, h = tapa_grosor + 2);
      cylinder(d1 = 9, d2 = 4.5, h = 3.2);
    }
  }
}

module montaje() {
  color("Silver") bandeja();
  color("LightGray") translate([0, 0, exterior[2] + 2]) tapa();
  %translate([pared + holgura, (exterior[1] - pilas[1]) / 2, pared]) cube(pilas);
  %translate([placa_x, placa_y, pared + placa_separador]) {
    cube([placa_largo, placa[1], 1.6]);
    translate([placa_largo - 58, 10 + usb_desvio, 1.6]) cube([58, 28, alto_placa_montada - 1.6]);
  }
}

if (pieza == "montaje") montaje();
else if (pieza == "bandeja") bandeja();
else if (pieza == "tapa") tapa();
