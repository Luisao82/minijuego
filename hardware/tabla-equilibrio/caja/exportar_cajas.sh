#!/bin/sh
# Exporta las piezas de la caja del giroscopio y de la caja de la bandera a STL.
# Uso: ./exportar_cajas.sh
set -e
OPENSCAD=${OPENSCAD:-/Applications/OpenSCAD-2021.01.app/Contents/MacOS/OpenSCAD}
cd "$(dirname "$0")"

for PIEZA in bandeja tapa; do
  "$OPENSCAD" -D "pieza=\"$PIEZA\"" -o "giroscopio_$PIEZA.stl" caja_giroscopio.scad 2>/dev/null
  echo "Generado giroscopio_$PIEZA.stl"
done
for PIEZA in tramo1 tramo2 tramo3; do
  "$OPENSCAD" -D "pieza=\"$PIEZA\"" -o "bandera_caja_$PIEZA.stl" caja_bandera.scad 2>/dev/null
  echo "Generado bandera_caja_$PIEZA.stl"
done
