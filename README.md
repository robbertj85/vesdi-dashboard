# VESDI Dashboard

Municipal dashboard for visualizing CBS VESDI (Vehicle Emission Shipment Data Interface) freight transport data. Built for the [DMI Ecosysteem](https://dmi-ecosysteem.nl) project.

## What is VESDI?

In 2021, CBS (Statistics Netherlands) started developing the VESDI data platform in collaboration with the Ministry of I&W and Topsector Logistiek. VESDI collects data on urban freight transport movements across Dutch municipalities, covering shipments (zendingen) and trip segments (deelritten).

More information: [CBS VESDI dossier](https://www.cbs.nl/nl-nl/dossier/vesdi)

## Features

- **Upload & auto-detect** — Drop CBS CSV/XLSX files; file types are detected automatically by column inspection
- **14 dashboard pages** — Cover page, introduction, trends, national/international shipments & trips, route map, glossary, data completeness
- **Interactive maps** — NUTS3 choropleth, PC4/PC6 bubble maps, ORS-powered route visualization
- **Multi-city support** — Works with data from Utrecht, Amsterdam, Den Haag, Rotterdam, Almere, Zwolle and other municipalities
- **Geographic precision** — PC6→PC4→NUTS3 fallback chain for centroid resolution (464K PC6 centroids)
- **Client-side processing** — All data stays in the browser (IndexedDB), no server upload required
- **Dutch language** — Full Dutch UI; every page, section, chart, filter and KPI has a (?) tooltip
- **Demo mode** — Shared-login demo with Utrecht VESDI + ANPR data preloaded

## Quick Start

```bash
npm install
cp .env.example .env.local   # then set DEMO_USERNAME / DEMO_PASSWORD
./scripts/prepare-demo-data.sh   # optional: assemble the Utrecht demo dataset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in, and either explore the Utrecht demo or drop your own CBS VESDI / ANPR data files.

## Demo login & Utrecht demo data

The whole app (pages, `/api/*` and `/geo/*`) is behind one shared login, configured with
`DEMO_USERNAME` and `DEMO_PASSWORD` (see `.env.example`). Without them nobody can log in.
Sessions are HMAC-signed httpOnly cookies valid for 7 days; changing the password (or
`AUTH_SECRET`) logs everyone out.

After login, `/demo` downloads the Utrecht demonstration dataset (VESDI wegvervoersenquête
2021–2023 + ANPR 2025) from `/api/demo` and processes it in the browser like a normal upload.
The ANPR tables marked `DUMMY` contain zeros and are filled with synthetic values derived from
the real M1 table; those pages stay labelled "Dummy-data".

**The CBS data is confidential and is never committed.** `demo-data/` is gitignored. On a
server, run `scripts/prepare-demo-data.sh` (needs the local `Utrecht/` delivery folders), copy
`demo-data/utrecht/` next to the app, or point `DEMO_DATA_DIR` at the files.

### Required Files

| File | Description |
|------|------------|
| Zendingenbestand (CSV) | Shipment data per municipality per year |
| Deelrittenbestand (CSV) | Trip segment data per municipality per year |
| VESDI_lookup.xlsx | Reference tables (vehicle types, weight classes, etc.) |

### Optional Files

| File | Description |
|------|------------|
| Codetabel gemeente (CSV) | Municipality code → name mapping |
| Codetabel klasse (CSV) | Logistics class code → name mapping |
| NL_NUTS_schema (XLSX) | NUTS geographic classification |
| Hero image (PNG/JPG) | Custom cover page image (auto-fetched from Wikipedia if not provided) |

## Route Map

The route map uses [OpenRouteService](https://openrouteservice.org/) for road network routing. By default it connects to a self-hosted instance. To configure:

```env
NEXT_PUBLIC_ORS_BASE_URL=https://your-ors-instance.com/ors
NEXT_PUBLIC_ORS_API_KEY=your-api-key
```

Requests go through `/api/ors`, which keeps a persistent server-side route cache (`ROUTE_CACHE_DIR`, default `./data/routes`). Precompute every trajectory for the demo dataset once, so visitors never wait for routing:

```bash
npm run routes:precompute              # all ~36,000 pairs; resumable, skips cached pairs
npm run routes:precompute -- --limit 1000
```

The route cache is derived from the confidential CBS data (postcode-level origin/destination pairs) and lives under the gitignored `data/` folder.

## Enquête (questionnaire)

The "Enquête" page asks municipal staff to rate every page (or section) on a 1–5 scale — ideally by walking through the dashboard with a docked rating panel — and asks whether their municipality would contract CBS itself after the first three DMI-funded years, and how likely it is they can deliver ANPR data to CBS.

- Responses are stored as JSON lines in `SURVEY_DATA_DIR` (default `./data/survey`, gitignored). Use persistent storage, e.g. a Docker volume.
- Results, CSV export and personal invite links: `/dashboard/enquete/resultaten`, protected by `SURVEY_ADMIN_KEY`.
- Invite links (`/uitnodiging/<code>`) log a respondent in without a password (session valid 90 days), fill in their name and municipality, and keep one (latest) response per person.
- Sending invitations: put the recipient list in `data/survey/ontvangers.csv` (`naam;gemeente;email`, see `scripts/ontvangers.voorbeeld.csv`; gitignored), click "Importeer ontvangerslijst" on the results page, then "Volgende e-mail opstellen" opens a pre-filled message in Outlook per person. The e-mail text is editable on that page. Set `PUBLIC_BASE_URL` so links point at the public site.
- Link-only mode: leave `DEMO_USERNAME`/`DEMO_PASSWORD` unset and set `AUTH_SECRET`; then only personal links give access (create one for yourself too).

## Basemap

Maps use CARTO's light basemap when `NEXT_PUBLIC_CARTO_API_KEY` is set (free key:
https://carto.com/basemaps/apikey — CARTO watermarks tiles requested without one). Without a
key, desaturated OpenStreetMap tiles are used.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS 4** + shadcn/ui
- **Recharts 3** for charts
- **Leaflet** + React-Leaflet 5 for maps
- **Zustand 5** with IndexedDB persistence
- **PapaParse** (CSV) + **xlsx** (Excel)

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

## Links

- [DMI Ecosysteem](https://dmi-ecosysteem.nl)
- [CBS VESDI dossier](https://www.cbs.nl/nl-nl/dossier/vesdi)
