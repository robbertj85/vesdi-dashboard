#!/usr/bin/env bash
# Assemble the Utrecht demo dataset from the local (gitignored) CBS delivery
# folders into demo-data/utrecht/, which the app serves via /api/demo after login.
#
# The CBS data is confidential and must never be committed: demo-data/ is
# gitignored. On a server, run this script (or copy the folder) next to the app,
# or point DEMO_DATA_DIR at wherever the files live.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:-Utrecht}"
DEST="demo-data/utrecht"

rm -rf "$DEST"
mkdir -p "$DEST"

copy() { cp "$SRC/$1" "$DEST/"; echo "  + $1"; }

echo "VESDI wegvervoersenquete 2021-2022"
copy "2021-2022/zendingenbestand_Utrecht_2021_v1.1.csv"
copy "2021-2022/deelrittenbestand_Utrecht_2021_v1.1.csv"
copy "2021-2022/zendingenbestand_Utrecht_2022_v1.0.csv"
copy "2021-2022/deelrittenbestand_Utrecht_2022_v1.0.csv"

echo "VESDI wegvervoersenquete 2023 (PC6) + codetabellen"
copy "2023/DATA_zendingenbestand_PC6_Utrecht_2023_v1.0.csv"
copy "2023/DATA_deelrittenbestand_PC6_Utrecht_2023_v1.0.csv"
copy "2023/codetabel_gemeentecode_2023.csv"
copy "2023/codetabel_stadslogistieke_klasse_v1.csv"
copy "2023/codetabellen_VESDI_gemeente_Utrecht.xlsx"
copy "2023/NL_NUTS_schema_SJ2023_v2021.xlsx"

echo "ANPR 2025"
for f in "$SRC"/anpr-1/*.csv "$SRC"/anpr-1/Variabelen_ANPR.xlsx; do
  copy "anpr-1/$(basename "$f")"
done

if [ -f VESDI_lookup.xlsx ]; then
  cp VESDI_lookup.xlsx "$DEST/"; echo "  + VESDI_lookup.xlsx"
fi

echo "Done: $(ls "$DEST" | wc -l | tr -d ' ') files, $(du -sh "$DEST" | cut -f1) in $DEST"
