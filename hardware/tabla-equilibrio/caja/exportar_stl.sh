#!/bin/sh
# Exporta una pieza de varias capas (variable `capa` = 1, 2) y las junta en un
# solo STL. Evita la unión 3D de OpenSCAD 2021, que es muy lenta con textos.
# Uso: ./exportar_stl.sh prueba_encaje
set -e
OPENSCAD=${OPENSCAD:-/Applications/OpenSCAD-2021.01.app/Contents/MacOS/OpenSCAD}
PIEZA=$1
TMP=$(mktemp -d)

for CAPA in 1 2; do
  "$OPENSCAD" -D "capa=$CAPA" -o "$TMP/capa$CAPA.stl" "$PIEZA.scad"
done

# STL ASCII: se quitan las líneas solid/endsolid de cada capa y se envuelve todo en uno
{
  echo "solid $PIEZA"
  grep -hv -e '^solid' -e '^endsolid' "$TMP"/capa*.stl
  echo "endsolid $PIEZA"
} > "$PIEZA.stl"

rm -rf "$TMP"
echo "Generado $PIEZA.stl"
