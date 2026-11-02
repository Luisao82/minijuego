#!/bin/sh
# Exporta las cuatro piezas del mecanismo de la bandera a STL.
# Uso: ./exportar_bandera.sh
set -e
OPENSCAD=${OPENSCAD:-/Applications/OpenSCAD-2021.01.app/Contents/MacOS/OpenSCAD}
cd "$(dirname "$0")"

for PIEZA in placa brazo base_palo rodillo; do
  "$OPENSCAD" -D "pieza=\"$PIEZA\"" -o "bandera_$PIEZA.stl" mecanismo_bandera.scad 2>/dev/null
  echo "Generado bandera_$PIEZA.stl"
done
