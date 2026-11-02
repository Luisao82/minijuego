// =====================================================================
//  CAJA DE LA BANDERA — empotrada en la repisa (PROVISIONAL)
// =====================================================================
//  Caja abierta por arriba: la tapa es la propia repisa, que tiene la
//  ranura de 3,6 cm por la que sube la bandera. Mide 36,5 cm y no cabe en
//  la impresora (153 × 87), así que va en tres tramos que se atornillan
//  entre sí por unas pestañas interiores con M3:
//
//    tramo1   El del mecanismo: 4 agujeros en el fondo para la placa del
//             brazo (sus patas, con tornillos M4)
//    tramo2   El del medio
//    tramo3   El de la placa perforada y la pared con los conectores
//             (GX12 del cable de la tabla y la entrada de 5 V del servo)
//
//  Cada tramo se imprime de pie (la sección, 103 × 75 mm, apoyada en la
//  bandeja) y se sujeta bajo la repisa con tornillos por sus orejas de
//  arriba.
//
//  Mismos ejes que mecanismo_bandera.scad: el eje del brazo en el origen,
//  X a lo largo, Y arriba, Z hacia delante (Z negativo = pared del fondo).
//
//  PENDIENTE: el conector de 5 V (d_entrada_5v) aún no está elegido.
// =====================================================================

pieza = "montaje";    // "montaje", "tramo1", "tramo2", "tramo3"
$fn = 48;

pared = 2.5;
// Interior (mm), alrededor del mecanismo con la bandera tumbada
x0 = -20; x1 = 340;
y0 = -50; y1 = 50;            // abierta por arriba
z0 = -24; z1 = 46;            // z0 = donde apoyan las patas de la placa
cortes = [100, 220];          // uniones entre tramos

pestana = 4;                  // pestañas de unión: grosor (en X) y fondo
d_m3 = 3.4;
d_m4 = 4.5;
d_gx12 = 12.2;
d_entrada_5v = 11;            // por decidir (jack DC de panel, USB-C…)

// Agujeros de las patas de la placa del mecanismo (iguales que en mecanismo_bandera.scad)
patas = [[-11, -39], [59, -39], [59, 43], [-11, -20]];

// Placa perforada de 2 × 8 cm tumbada en el fondo del tramo 3
placa_x = 236; placa_z = 0;

ext_min = [x0 - pared, y0 - pared, z0 - pared];
ext_max = [x1 + pared, y1, z1 + pared];
echo(str("Caja de la bandera: ", ext_max[0] - ext_min[0], " × ", ext_max[1] - ext_min[1], " × ",
         ext_max[2] - ext_min[2], " mm en 3 tramos"));

module casco() {
  difference() {
    translate(ext_min) cube(ext_max - ext_min);
    translate([x0, y0, z0]) cube([x1 - x0, y1 - y0 + 1, z1 - z0]);
  }
}

// Pestaña en U (fondo, pared trasera y delantera) con 4 agujeros M3
module pestana_union(x, lado) {
  xa = lado < 0 ? x - pestana : x;
  difference() {
    translate([xa, y0 - 0.01, z0 - 0.01]) difference() {
      cube([pestana, y1 - y0 - 4, z1 - z0 + 0.02]);
      translate([-1, pestana, pestana]) cube([pestana + 2, y1 - y0, z1 - z0 - 2 * pestana]);
    }
    for (p = agujeros_union()) translate([xa - 1, p[0], p[1]]) rotate([0, 90, 0]) cylinder(d = d_m3, h = pestana + 2);
  }
}
function agujeros_union() = [[y0 + pestana / 2, -8], [y0 + pestana / 2, 30], [0, z0 + pestana / 2], [0, z1 - pestana / 2]];

// Orejas arriba por dentro para atornillar la caja bajo la repisa
module oreja(x, atras) {
  z = atras ? z0 : z1 - 10;
  difference() {
    translate([x - 6, y1 - 4, z]) cube([12, 4, 10]);
    translate([x, y1 - 5, z + 5]) rotate([-90, 0, 0]) cylinder(d = 4, h = 6);
  }
}

module caja_entera() {
  difference() {
    union() {
      casco();
      for (c = cortes) { pestana_union(c, -1); pestana_union(c, 1); }
      // Atrás en los tres tramos; delante solo donde no pasa la bandera al subir
      for (x = [80, 160, 300]) oreja(x, true);
      oreja(300, false);
      // Separadores de la placa perforada
      for (dx = [3, 77]) translate([placa_x + dx, y0 - 0.01, placa_z + 10]) rotate([-90, 0, 0]) cylinder(d = 6, h = 6);
    }
    // Patas de la placa del mecanismo: M4 por la pared del fondo
    for (p = patas) translate([p[0], p[1], z0 - pared - 1]) cylinder(d = d_m4, h = pared + 2);
    // Conectores en la pared del extremo
    translate([x1 - 1, 0, 0]) rotate([0, 90, 0]) cylinder(d = d_gx12, h = pared + 2);
    translate([x1 - 1, -28, 0]) rotate([0, 90, 0]) cylinder(d = d_entrada_5v, h = pared + 2);
    for (dx = [3, 77]) translate([placa_x + dx, y0 - 1, placa_z + 10]) rotate([-90, 0, 0]) cylinder(d = 2.2, h = 8);
  }
}

module tramo(i) {
  a = i == 1 ? ext_min[0] - 1 : cortes[i - 2];
  b = i == 3 ? ext_max[0] + 1 : cortes[i - 1];
  intersection() {
    caja_entera();
    translate([a, ext_min[1] - 1, ext_min[2] - 1]) cube([b - a, ext_max[1] - ext_min[1] + 2, ext_max[2] - ext_min[2] + 2]);
  }
}

module montaje() {
  color("Silver") tramo(1);
  color("LightGray") tramo(2);
  color("Silver") tramo(3);
  // Mecanismo y placa perforada, de referencia
  %translate([-16, -44, -24]) cube([80, 92, 24]);
  %translate([98, -12.5, 13.8]) cube([153, 25, 25]);
  %translate([placa_x, y0 + 6, placa_z]) cube([80, 1.6, 20]);
}

if (pieza == "montaje") montaje();
else if (pieza == "tramo1") tramo(1);
else if (pieza == "tramo2") tramo(2);
else if (pieza == "tramo3") tramo(3);
