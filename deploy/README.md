# Deploy: prototype.transportlab.app/vesdi-dashboard

| | |
|---|---|
| URL | https://prototype.transportlab.app/vesdi-dashboard |
| Coolify | resource `vesdi-dashboard` (Docker Compose, `/docker-compose.yaml`), project Coolify-TB / production, *Domains leeg* |
| Container | `vesdi-dashboard-vesdi-dashboard` (Consistent Container Names aan, Custom Internal Name `vesdi-dashboard`) |
| NPM | proxy host `prototype.transportlab.app` → custom location `/vesdi-dashboard/` → `http` `vesdi-dashboard` `3000` (geen URI-rewrite) |

Eén Next.js-service (standalone), geen nginx: álles, ook `/geo`-bestanden, gaat
door de login-check in `src/proxy.ts`.

## Omgevingsvariabelen (Coolify UI, nooit in git)

| Naam | |
|---|---|
| `DEMO_USERNAME`, `DEMO_PASSWORD` | wachtwoordlogin, alleen voor beheerders (leeg laten = alleen persoonlijke links) |
| `AUTH_SECRET` | ondertekent sessiecookies |
| `SURVEY_ADMIN_KEY` | resultatenpagina + uitnodigingen beheren |
| `PUBLIC_BASE_URL` | `https://prototype.transportlab.app/vesdi-dashboard` (redirects + links in uitnodigingen) |
| `ORS_API_KEY` | OpenRouteService (alleen nodig voor routes die nog niet in de cache staan) |
| `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | build args, gedeelde Umami-site voor prototypes |
| `NEXT_PUBLIC_CARTO_API_KEY` | optioneel, build arg |

## Volumes

| Volume | Inhoud | |
|---|---|---|
| `vesdi-demo-data` | CBS-demodata Utrecht (vertrouwelijk) | eenmalig uploaden, opnieuw te maken |
| `vesdi-survey` | `responses.jsonl`, `invites.json`, `ontvangers.csv` | **onvervangbaar**, zit in de nachtelijke backup (`/var/lib/docker/volumes`) |
| `vesdi-routes` | `routes.jsonl` (voorberekende trajecten) | opnieuw te maken met `npm run routes:precompute` |

Data gaat nooit via git. Uploaden vanaf de Mac (container moet draaien):

```sh
deploy/upload-data.sh demo        # demo-data/utrecht/*  (eerst scripts/prepare-demo-data.sh)
deploy/upload-data.sh routes      # data/routes/routes.jsonl (eerst npm run routes:precompute)
deploy/upload-data.sh ontvangers  # data/survey/ontvangers.csv
```

## Na elke redeploy

NPM onthoudt het oude IP van de container → 502 tot je herlaadt:

```sh
deploy/reload-proxy.sh
```
