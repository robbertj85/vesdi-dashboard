# VESDI Dashboard

## Overview
Municipal dashboard for visualizing CBS VESDI freight transport data (zendingen & deelritten). Built for the DMI Ecosysteem project. Licensed under AGPL-3.0.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Charts:** Recharts 3
- **Maps:** Leaflet + React-Leaflet 5
- **Routing:** OpenRouteService (self-hosted at ors.transportbeat.nl, proxied via /api/ors)
- **State:** Zustand 5 with IndexedDB persistence (no server-side database)
- **Data parsing:** PapaParse (CSV), xlsx (Excel — SheetJS CDN build 0.20.3, the npm `xlsx` is unmaintained/vulnerable)
- **Auth:** shared demo login via `src/proxy.ts` (Next 16 "proxy" = middleware) + HMAC-signed cookie (`src/lib/auth.ts`)

## Dev Commands
```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting
```

## Project Structure
```
src/
  app/                          # Next.js App Router pages
    login/                      # Shared demo login page
    demo/                       # Post-login: loads Utrecht demo data, then continues to ?next=
    api/
      ors/                      # ORS proxy API route (avoids CORS)
      auth/login, auth/logout   # Session cookie set/clear
      demo/, demo/[file]        # Manifest + files of the demo dataset (login required)
    dashboard/                  # 13 dashboard pages + layout (plus 6 ANPR pages)
      voorblad/                 # Cover page with hero image + DMI logo
      introductie/              # Introduction with CBS/VESDI background text
      trends/                   # Multi-year trend charts
      zendingen-overzicht/      # NUTS3 choropleth overview
      nationale-zendingen/      # National shipments
      internationale-zendingen/ # International shipments
      nationale-deelritten/     # National trips
      nationale-deelritten-postcode/ # Trips by postcode (PC4 + PC6)
      routekaart/               # Route map (ORS API, parallel batched)
      internationale-deelritten-overzicht/ # Int. trips NUTS3 overview
      internationale-deelritten/ # International trips detail
      externe-links/            # External links (DMI, CBS VESDI)
      definities/               # Glossary of terms
      data-volledigheid/        # Data completeness bars per column/year
  components/
    charts/    # Recharts wrappers (donut, bar, line, table)
    layout/    # Expandable sidebar, filter bar, KPI card, page header, sidebar context
    maps/      # Leaflet map components (choropleth, bubble, route)
    ui/        # shadcn/ui primitives
    upload/    # File drop zone, DemoCard
    ui/info-tip.tsx  # InfoTip (?) + SectionTitle — use for every new section/heading
  hooks/       # Custom React hooks (filtered data, geojson)
  lib/
    types.ts         # TypeScript interfaces (ZendingRow, DeelritRow, etc.)
    store.ts         # Zustand store with IndexedDB persistence + Wikipedia hero fetch
    selectors.ts     # Filtered data selectors (hooks)
    aggregate.ts     # Data aggregation functions (PC4 + PC6 level)
    transform.ts     # CSV → derived columns (geo fallback PC6→PC4→NUTS3, klasse lookups)
    validate.ts      # File type auto-detection
    column-schemas.ts # Expected CSV column definitions
    parse-csv.ts     # PapaParse wrapper
    parse-xlsx.ts    # xlsx parser for lookup tables
    format.ts        # Dutch number formatting
    colors.ts        # DMI design system colors
    country-codes.ts # NUTS3 → country mapping
    idb-storage.ts   # IndexedDB storage adapter for Zustand
    descriptions.ts  # Dutch tooltip texts: PAGE_DESCRIPTIONS, PAGE_HELP, KPI/CHART/SECTION_TOOLTIPS
    auth.ts          # Credential check + session token sign/verify
    demo-data.ts     # Demo dataset directory listing (DEMO_DATA_DIR)
public/
  geo/         # GeoJSON + centroids: pc4, pc6 (464K), nuts3 (1.5K)
  images/      # DMI logos (SVG)
```

## Data Flow
1. User drops CSV/XLSX files on upload page
2. `validate.ts` auto-detects file type by column inspection
3. `parse-csv.ts` / `parse-xlsx.ts` parse raw data
4. `transform.ts` adds derived columns (LaadLand, isNational, geo keys with PC6→PC4→NUTS3 fallback, klasse/voertuig/gewicht label resolution)
5. `store.ts` persists to IndexedDB via Zustand middleware
6. Dashboard pages use `selectors.ts` hooks → `aggregate.ts` functions → chart components
7. Route map requests trajectories from `/api/ors` in batches of 500; the server answers from a persistent route cache (`src/lib/route-cache.ts`, `$ROUTE_CACHE_DIR/routes.jsonl`) and only calls ORS for missing pairs. Precompute all pairs with `npm run routes:precompute` (pair logic shared via `src/lib/route-pairs.ts`)

## Geographic Fallback Chain
- **PC6 available** → geoKey = full PC6 code (e.g. "3511AB"), centroid from pc6-centroids.json
- **PC4 available** → geoKey = PC4 code (e.g. "3511"), centroid from pc4-centroids.json
- **NUTS3 only** → geoKey = "NUTS3:NL310", centroid from nuts3-centroids.json
- Bubble map and route map use cascading centroid resolution with fallback

## Supported Cities
Column availability varies by city:
| City | Zone Columns |
|------|-------------|
| Almere | None (17 cols) |
| Amsterdam/Den Haag/Rotterdam/Zwolle | emissiezone only (19 cols) |
| Utrecht | All 8 zones (25 cols) |

Zone columns are optional — the app handles missing zone data gracefully.

## Environment Variables
```
NEXT_PUBLIC_ORS_API_KEY=    # ORS API key (X-API-Key header, for route map)
NEXT_PUBLIC_ORS_BASE_URL=   # ORS base URL (default: https://ors.transportbeat.nl/ors)
NEXT_PUBLIC_CARTO_API_KEY=  # Optional CARTO basemap key; without it maps fall back to muted OSM tiles
DEMO_USERNAME=              # Shared login (required — app is unusable without it)
DEMO_PASSWORD=
AUTH_SECRET=                # Optional cookie signing key (derived from credentials if unset)
DEMO_DATA_DIR=              # Optional; default ./demo-data/utrecht
SURVEY_ADMIN_KEY=           # Required to view Enquête results / manage invite links
SURVEY_DATA_DIR=            # Optional; default ./data/survey (must be persistent storage)
ROUTE_CACHE_DIR=            # Optional; default ./data/routes (precomputed trajectories)
```

## Demo Data & Auth
- Everything except `/login`, `/api/auth/*`, `/_next/*`, `/images/*` requires the session cookie (`src/proxy.ts`). `/api/demo*` re-check the cookie themselves.
- `demo-data/` holds confidential CBS data: gitignored, built by `scripts/prepare-demo-data.sh` from the local `Utrecht/` folders. Never commit it; the GitHub repo is public.
- IndexedDB values are chunked (`idb-storage.ts`): the full Utrecht state is ~114M chars, above Chrome's ~133 MB per-value limit.

## Enquête (questionnaire)
- Goal: measure whether municipal staff need this information, to decide on a multi-year CBS contract (DMI pays the first 3 years).
- `src/lib/survey.ts`: items (one per page, or per section on long pages, anchored via `data-tour`), answer options, server-side `sanitizeAnswers`.
- `src/components/survey/survey-provider.tsx`: draft in localStorage + docked, non-modal rating panel that walks the pages (like the tour, but the page stays usable).
- Storage: `/api/survey` appends JSON lines to `$SURVEY_DATA_DIR/responses.jsonl` — no database. Needs persistent disk (VPS volume); Vercel's filesystem is ephemeral.
- Personal invite links `/uitnodiging/<code>` (managed on `/dashboard/enquete/resultaten`, admin key) log in without a password; identity comes from the invite and the latest response per invite counts.
- Invitation e-mails: recipient list `data/survey/ontvangers.csv` (or `SURVEY_RECIPIENTS_FILE`), imported into invites; per invite a `mailto:` (Outlook) or Outlook-web compose link from the template in `src/components/survey/invite-email.ts`; `PUBLIC_BASE_URL` sets the link host.
- Auth modes: shared password (DEMO_USERNAME/DEMO_PASSWORD) + invite links, or link-only (only AUTH_SECRET set). Invite sessions last 90 days.
- UI copy is Dutch in the informal "je" form — keep it that way.
- `data/` holds personal data: gitignored, never commit.

## Conventions
- Some source files use CRLF line endings — preserve them when editing.
- Tooltips: every page header gets `tooltip={PAGE_HELP.x}`; every section/chart/KPI/filter gets a (?) via `InfoTip`, `SectionTitle`, `titleTooltip` or `tooltip`.
- Guided tour ("Rondleiding"): steps in `src/components/tour/tour-steps.ts`, overlay in `tour-provider.tsx` (mounted in the dashboard layout). Steps spotlight elements by `data-tour="…"` attributes — keep those when refactoring a page. Auto-starts once per browser on `/dashboard/voorblad` (localStorage `vesdi-tour-seen`).
- Chart cards must not use `h-full` (stacked cards in one grid column overflow). Use the `bare` prop on DonutChart / StackedBarAbsolute / PC4BubbleMap when nesting inside another Card.
- ANPR tables contain N1, N2, N3 *and* N23 (= N2+N3): use `dropOverlappingVehicles` in `anpr-aggregate.ts` when summing/stacking vehicle categories.
- Euronorm values may be numbers after parsing: compare with `String(r.euronormKlasse) === '6'`. 2021/2022 deliveries name the column `EuronormKlasse` (normalized in `transform.ts`).
