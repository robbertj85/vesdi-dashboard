#!/usr/bin/env bash
# Kopieer lokale data naar de volumes van de draaiende container op de VPS.
# Data gaat nooit via git: de CBS-data is vertrouwelijk, de ontvangerslijst bevat
# persoonsgegevens.
#
#   deploy/upload-data.sh demo        # demo-data/utrecht/*  -> vesdi-demo-data
#   deploy/upload-data.sh routes      # data/routes/routes.jsonl -> vesdi-routes
#   deploy/upload-data.sh ontvangers [bestand]  # CSV naam;gemeente;email (standaard
#                                               # data/survey/ontvangers.csv) -> vesdi-survey
#
# Bestaande bestanden met dezelfde naam worden overschreven; andere blijven staan.
# Na `routes` herstart de container niet: de server leest nieuwe regels zelf in.
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${HOST:-hetzner}"
CONTAINER="${CONTAINER:-vesdi-dashboard-vesdi-dashboard}"

send() { # <local dir> <files...> -> <container dir>
  local src="$1" dest="$2"; shift 2
  # tar streams over ssh into the container as the app user (keeps ownership right)
  COPYFILE_DISABLE=1 tar --no-mac-metadata -C "$src" -cf - "$@" | ssh "$HOST" "docker exec -i -u node $CONTAINER tar -C $dest -xf -"
  ssh "$HOST" "docker exec $CONTAINER ls -la $dest" | tail -n +2
}

case "${1:-}" in
  demo)
    [ -d demo-data/utrecht ] || { echo "demo-data/utrecht ontbreekt: draai eerst scripts/prepare-demo-data.sh" >&2; exit 1; }
    send demo-data/utrecht /srv/vesdi/demo-data $(cd demo-data/utrecht && ls) ;;
  routes)
    [ -f data/routes/routes.jsonl ] || { echo "data/routes/routes.jsonl ontbreekt: draai eerst npm run routes:precompute" >&2; exit 1; }
    send data/routes /srv/vesdi/routes routes.jsonl ;;
  ontvangers)
    f="${2:-data/survey/ontvangers.csv}"
    [ -f "$f" ] || { echo "$f ontbreekt" >&2; exit 1; }
    # Always lands as ontvangers.csv, which the import on the results page reads
    ssh "$HOST" "docker exec -i -u node $CONTAINER sh -c 'cat > /srv/vesdi/survey/ontvangers.csv'" < "$f"
    echo "geüpload: $(($(grep -c '' "$f") - 1)) regels (excl. kop) -> /srv/vesdi/survey/ontvangers.csv" ;;
  *) sed -n '2,11p' "$0" >&2; exit 2 ;;
esac
