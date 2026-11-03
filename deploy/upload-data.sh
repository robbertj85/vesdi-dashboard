#!/usr/bin/env bash
# Kopieer lokale data naar de volumes van de draaiende container op de VPS.
# Data gaat nooit via git: de CBS-data is vertrouwelijk, de ontvangerslijst bevat
# persoonsgegevens.
#
#   deploy/upload-data.sh demo        # demo-data/utrecht/*  -> vesdi-demo-data
#   deploy/upload-data.sh routes      # data/routes/routes.jsonl -> vesdi-routes
#   deploy/upload-data.sh ontvangers  # data/survey/ontvangers.csv -> vesdi-survey
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
    [ -f data/survey/ontvangers.csv ] || { echo "data/survey/ontvangers.csv ontbreekt" >&2; exit 1; }
    send data/survey /srv/vesdi/survey ontvangers.csv ;;
  *) sed -n '2,13p' "$0" >&2; exit 2 ;;
esac
