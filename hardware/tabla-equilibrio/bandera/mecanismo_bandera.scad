// =====================================================================
//  MECANISMO DE LA BANDERA — montaje de prueba
// =====================================================================
//  Cuatro piezas para probar el mecanismo atornillado a un listón, antes
//  de hacer la caja de la repisa:
//
//    placa      Placa base: hueco del servo, buje del eje M4, tope de
//               abajo (0°), tope de arriba (85°) y poste alto de la goma
//    brazo      Brazo que gira sobre su propio tornillo M4, con el
//               portapalo (tubo + embudo), la ventana del micro y la
//               bandeja ranurada donde se atornilla el microrruptor.
//               El poste de la goma va por delante: se cambia sin desmontar
//    base_palo  Parte rígida de la bandera: entra en el tubo (imán abajo,
//               la pisa el micro), un disco donde apoya la espuma y un
//               pincho con estrías que se clava en ella
//    rodillo    Rodillo para el aspa del servo (mejor si se forra con
//               un trozo de tubo de silicona o termorretráctil)
//
//  Cómo funciona: el aspa del servo NO va unida al brazo. Su rodillo
//  empuja el brazo desde abajo hasta el tope de 85° y una goma elástica
//  lo baja. Si alguien tira de la bandera mientras baja, el brazo se
//  separa del aspa y el servo no nota la fuerza.
//
//  La bandera: cilindro de espuma de polietileno de Ø25 × 153 mm (se dobla
//  sin romperse ni pasar fuerza al mecanismo; es un recambio). Se le hace un
//  agujero centrado de Ø7 y 45 mm en la base y se clava el pincho con
//  silicona caliente (el cianoacrilato no agarra al polietileno). La tela
//  blanca va pegada en los 5–6 cm de arriba.
//
//  Uso:
//    · pieza = "montaje" enseña todo montado (servo, micro y espuma en gris)
//    · angulo_brazo mueve el brazo (0 abajo, 85 arriba) para ver holguras
//    · animar = true y Vista → Animar (FPS 10, pasos 60) lo mueve solo
//    · Para exportar: pieza = "placa" / "brazo" / "base_palo" / "rodillo",
//      F6 y Exportar STL (o ./exportar_bandera.sh, que saca las cuatro)
//
//  Al pulsar F5, la consola muestra a qué ángulo del aspa llega el brazo
//  al tope: sirve para ajustar ANGLE_UP en el firmware sin forzar el servo.
//
//  Ejes: la placa está en el plano XY, su cara delantera es z = 0 y el
//  eje del brazo es el origen. X hacia la punta del brazo en reposo.
// =====================================================================

pieza = "montaje";    // "montaje", "placa", "brazo", "base_palo", "rodillo"
angulo_brazo = 0;     // 0 = abajo, 85 = arriba (solo en "montaje")
animar = false;

$fn = 48;

// ---------- Medidas que hay que comprobar con las piezas reales ----------

// Cilindro de espuma de la bandera
d_espuma = 25;
largo_espuma = 153;

// Microrruptor de palanca con rodillo (el mismo de la tabla, tipo KW11-3Z)
micro_largo = 20;           // a lo largo del brazo
micro_alto = 10.3;          // de la cara de la palanca a la de los terminales
micro_grueso = 6.4;
micro_entre_agujeros = 9.5;
micro_agujero_desde_palanca = 7.3;   // centro del agujero ↔ cara de la palanca
micro_ajuste = 3;           // recorrido de las ranuras (± mm) para afinar el clic

// Servo SG90 / MG90S (mismas medidas exteriores)
servo_largo = 22.8;
servo_ancho = 12.5;
holgura_servo = 0.4;        // en el hueco de la placa: la resina encoge y los servos varían
servo_entre_agujeros = 27.8;
servo_eje_desde_extremo = 5.9;
servo_d_agujero = 1.8;      // para sus tornillos rosca-chapa
servo_alto_sobre_placa = 6.8;  // caja por delante de la placa (orejetas apoyadas)
z_aspa = 11;                // cara de arriba del aspa, medida desde la placa

// Aspa del servo: radio del agujero donde va el rodillo (aspa larga de un brazo)
radio_aspa = 18;
d_rodillo = 6;

// Imanes de neodimio Ø6 × 3 (uno en el fondo del tubo, otro en la base del
// palo): sujetan el palo para que no salga despedido al subir y bajar.
// Hundirlos un poco más (hundido_iman) los hace más fáciles de soltar.
d_iman = 6.2;
alto_iman = 3;
hundido_iman = 0.5;

// Tornillería
d_m4 = 4.4;
d_cabeza_m4 = 8.2;          // tornillo Allen M4 por detrás, cabeza embutida
prof_cabeza_m4 = 4.2;
d_m2 = 2.4;
d_tornillo_madera = 4.5;
fieltro = 1.5;              // almohadillas pegadas en los dos topes

// ---------- Geometría del mecanismo (igual que el modelo 3D) ----------

grosor_placa = 6;
placa_min = [-16, -44];
placa_max = [64, 48];
agujeros_madera = [[-11, -39], [59, -39], [59, 43], [-11, -20]];
// Patas por detrás: el cuerpo del servo sobresale 16 mm de la placa y
// tiene que quedar en el aire, sin tocar el listón
separacion_liston = 18;
d_pata = 11;

eje_servo = [12, -3];       // eje del servo respecto al eje del brazo
radio_buje = 6;

z_brazo = 13;               // cara trasera del brazo (alto del buje)
grosor_brazo = 5;
alto_brazo = 10;
z_frente = z_brazo + grosor_brazo;

angulo_tope = 85;
tope_largo = 14;
tope_fondo = 8;
tope_arriba_desde = 28;     // a lo largo del brazo
tope_abajo_x = 55;

goma_brazo_x = 45;          // poste de la goma en el brazo
goma_placa = [45, -35];     // poste de la goma en la placa
poste_brazo_alto = 6;       // por delante del brazo

// Portapalo
d_base = 12;                // casquillo del palo
d_tubo_int = d_base + 0.6;
pared_tubo = 2;
d_tubo_ext = d_tubo_int + 2 * pared_tubo;
fondo_tubo = 4;             // pared del fondo, aloja el imán
tubo_ini = 56;
tubo_largo = 30;            // incluido el fondo
embudo_largo = 6;
embudo_abre = 4;
z_eje_tubo = z_frente + d_tubo_ext / 2;
largo_base = 35;             // hasta el disco: queda 3 mm por encima del embudo
disco_grueso = 3;
pincho_d = 8;               // agujero en la espuma algo menor (Ø7) para que apriete
pincho_largo = 45;
estria_paso = 6;
estria_salto = 1.2;         // las estrías hacen de arpón dentro de la espuma

ventana_largo = 16;
ventana_alto = 8;
// La bandeja sube el micro hasta que su palanca queda a la altura del eje del tubo
bandeja_grosor = z_eje_tubo - micro_grueso / 2 - z_frente;
hueco_micro = 1;            // entre el tubo y la cara de la palanca (centro de las ranuras)
micro_x = tubo_ini + fondo_tubo + 13;   // centro del micro a lo largo del brazo

// ---------- Cálculo: ángulo del brazo según el ángulo del aspa ----------
// El rodillo toca la cara de abajo del brazo, a C del eje del brazo

C = alto_brazo / 2 + d_rodillo / 2;

function rodillo_en(phi) = eje_servo + radio_aspa * [cos(phi), sin(phi)];
function brazo_por_aspa(phi) =
    let (p = rodillo_en(phi), rho = norm(p))
    atan2(p[1], p[0]) + asin(min(1, C / rho));
function aspa_para(theta) =
    [for (phi = [-60 : 0.5 : 150]) if (brazo_por_aspa(phi) >= theta) phi][0];

phi_reposo = aspa_para(0) - 3;   // el rodillo queda justo por debajo, sin tocar
phi_arriba = aspa_para(angulo_tope);

echo(str("Aspa: reposo ≈ ", phi_reposo, "°, llega al tope de ", angulo_tope,
         "° con el aspa a ", phi_arriba, "° → recorrido del servo ≈ ",
         phi_arriba - phi_reposo, "°"));
for (phi = [-30 : 15 : 120])
    echo(str("  aspa ", phi, "° → brazo ", round(max(0, brazo_por_aspa(phi))), "°"));

// ---------------------------------------------------------------------

module redondeado_2d(a, b, r = 3) {
    offset(r = r) offset(delta = -r)
        translate(a) square(b - a);
}

module ranura_2d(centro, recorrido, d) {
    hull()
        for (dy = [-recorrido, recorrido])
            translate(centro + [0, dy]) circle(d = d);
}

module poste_goma(alto, d = 5) {
    cylinder(d = d, h = alto - 1.5);
    translate([0, 0, alto - 1.5]) cylinder(d = d + 3, h = 1.5);
}

servo_centro = eje_servo + [0, -(servo_largo / 2 - servo_eje_desde_extremo)];

module placa_2d() {
    difference() {
        redondeado_2d(placa_min, placa_max);
        translate(servo_centro) square([servo_ancho + holgura_servo, servo_largo + holgura_servo], center = true);
        for (dy = [-servo_entre_agujeros / 2, servo_entre_agujeros / 2])
            translate(servo_centro + [0, dy]) circle(d = servo_d_agujero);
        for (p = agujeros_madera) translate(p) circle(d = d_tornillo_madera);
    }
}

module tope_abajo() {
    translate([tope_abajo_x - tope_largo / 2, -(alto_brazo / 2 + fieltro) - tope_fondo, 0])
        cube([tope_largo, tope_fondo, z_frente]);
}

module tope_arriba() {
    rotate([0, 0, angulo_tope])
        translate([tope_arriba_desde, alto_brazo / 2 + fieltro, 0])
            cube([tope_largo, tope_fondo, z_frente]);
}

module placa() {
    difference() {
        union() {
            translate([0, 0, -grosor_placa]) linear_extrude(grosor_placa) placa_2d();
            for (p = agujeros_madera)
                translate([p[0], p[1], -grosor_placa - separacion_liston])
                    difference() {
                        cylinder(d = d_pata, h = separacion_liston + 0.01);
                        translate([0, 0, -1]) cylinder(d = d_tornillo_madera, h = separacion_liston + 2);
                    }
            cylinder(r = radio_buje, h = z_brazo);
            tope_abajo();
            tope_arriba();
            // Llega hasta la altura del poste del brazo, que está por delante
            translate(goma_placa) poste_goma(z_frente + poste_brazo_alto, 7);
        }
        translate([0, 0, -grosor_placa - 1]) cylinder(d = d_m4, h = z_brazo + grosor_placa + 2);
        translate([0, 0, -grosor_placa - 0.01]) cylinder(d = d_cabeza_m4, h = prof_cabeza_m4);
    }
}

// Cilindro a lo largo de X
module a_lo_largo(x, d1, d2, h) {
    translate([x, 0, z_eje_tubo]) rotate([0, 90, 0]) cylinder(d1 = d1, d2 = d2, h = h);
}

micro_y = d_tubo_ext / 2 + hueco_micro;   // cara de la palanca
tubo_fin = tubo_ini + tubo_largo;

module brazo() {
    difference() {
        union() {
            translate([0, 0, z_brazo]) linear_extrude(grosor_brazo) hull() {
                circle(r = radio_buje);
                translate([tubo_fin - 4, -alto_brazo / 2]) square([4, alto_brazo]);
            }
            translate([goma_brazo_x, 0, z_frente - 0.01]) poste_goma(poste_brazo_alto);

            a_lo_largo(tubo_ini, d_tubo_ext, d_tubo_ext, tubo_largo);
            a_lo_largo(tubo_fin, d_tubo_ext, d_tubo_ext + embudo_abre, embudo_largo);
            translate([tubo_ini, -alto_brazo / 2, z_frente - 0.01])
                cube([tubo_largo, alto_brazo, z_eje_tubo - z_frente]);

            // Bandeja del micro, al lado del tubo
            translate([micro_x - micro_largo / 2 - 3, 0, z_frente])
                cube([micro_largo + 6, micro_y + micro_alto + 2, bandeja_grosor]);
        }
        translate([0, 0, z_brazo - 1]) cylinder(d = d_m4, h = grosor_brazo + 2);

        a_lo_largo(tubo_ini + fondo_tubo, d_tubo_int, d_tubo_int, tubo_largo);
        a_lo_largo(tubo_fin - 0.01, d_tubo_int, d_tubo_int + embudo_abre, embudo_largo + 0.02);
        a_lo_largo(tubo_ini + fondo_tubo - alto_iman - hundido_iman, d_iman, d_iman, alto_iman + hundido_iman + 0.01);

        // Ventana por la que entra la palanca del micro
        translate([micro_x - ventana_largo / 2, 0, z_eje_tubo - ventana_alto / 2])
            cube([ventana_largo, d_tubo_ext / 2 + 1, ventana_alto]);

        translate([0, 0, z_frente - 1]) linear_extrude(bandeja_grosor + 2)
            for (dx = [-micro_entre_agujeros / 2, micro_entre_agujeros / 2])
                ranura_2d([micro_x + dx, micro_y + micro_agujero_desde_palanca], micro_ajuste, d_m2);
    }
}

// De pie, como se imprime: el imán abajo y el pincho arriba
module base_palo() {
    difference() {
        union() {
            cylinder(d1 = d_base - 1.6, d2 = d_base, h = 0.8);
            translate([0, 0, 0.8]) cylinder(d = d_base, h = largo_base - 0.8);
            translate([0, 0, largo_base]) cylinder(d = d_espuma, h = disco_grueso);
            // Pincho: conos apilados con la cara plana hacia el disco
            for (z = [0 : estria_paso : pincho_largo - estria_paso])
                translate([0, 0, largo_base + disco_grueso + z])
                    cylinder(d1 = pincho_d + estria_salto, d2 = pincho_d - estria_salto, h = estria_paso);
        }
        translate([0, 0, -0.01]) cylinder(d = d_iman, h = alto_iman + hundido_iman);
    }
}

module rodillo() {
    difference() {
        cylinder(d = d_rodillo, h = z_frente + 1 - z_aspa);
        translate([0, 0, -0.01]) cylinder(d = d_m2, h = 20);
    }
}

// ---------- Montaje (lo gris no se imprime) ----------

module servo_fantasma(phi) {
    %translate([servo_centro[0], servo_centro[1], 0]) {
        translate([-servo_ancho / 2, -servo_largo / 2, -16]) cube([servo_ancho, servo_largo, 16 + servo_alto_sobre_placa]);
        translate([-servo_ancho / 2, -16, 0]) cube([servo_ancho, 32, 2.5]);
    }
    %translate([eje_servo[0], eje_servo[1], z_aspa - 1.6]) rotate([0, 0, phi]) {
        cylinder(d = 7, h = 1.6);
        translate([0, -2.5, 0]) cube([radio_aspa + 2, 5, 1.6]);
    }
}

module micro_fantasma() {
    %translate([micro_x - micro_largo / 2, micro_y, z_frente + bandeja_grosor])
        cube([micro_largo, micro_alto, micro_grueso]);
}

module palo_fantasma() {
    %translate([tubo_ini + fondo_tubo, 0, z_eje_tubo]) rotate([0, 90, 0]) {
        translate([0, 0, largo_base + disco_grueso]) cylinder(d = d_espuma, h = largo_espuma);
    }
}

module montaje(theta) {
    phi = theta <= 0 ? phi_reposo : aspa_para(theta);
    color("BurlyWood") placa();
    servo_fantasma(phi);
    color("Silver") translate(concat(rodillo_en(phi), z_aspa)) rodillo();
    rotate([0, 0, theta]) {
        color("Orange") brazo();
        micro_fantasma();
        palo_fantasma();
        color("DimGray") translate([tubo_ini + fondo_tubo, 0, z_eje_tubo]) rotate([0, 90, 0]) base_palo();
    }
}

theta_vista = animar ? angulo_tope * (1 - cos($t * 360)) / 2 : angulo_brazo;

if (pieza == "montaje") montaje(theta_vista);
else if (pieza == "placa") placa();
else if (pieza == "brazo") brazo();
else if (pieza == "base_palo") base_palo();
else if (pieza == "rodillo") rodillo();
