'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ZendingRow,
  DeelritRow,
  LookupData,
  LookupEntry,
  MunicipalityInfo,
  FilterState,
  DetectedFile,
  NutsMapping,
  AnprTable,
  AnprLookupData,
} from './types';
import { parseCSV, readFileAsText, readFileAsArrayBuffer } from './parse-csv';
import { parseLookupXlsx, parseCodetabellenXlsx, parseNutsSchema, parseAnprLookupXlsx } from './parse-xlsx';
import { detectFileType } from './validate';
import { transformZendingen, transformDeelritten } from './transform';
import { transformAnprRows } from './anpr-transform';
import { idbStorage } from './idb-storage';

interface VesdiStore {
  // Data (persisted)
  zendingenByYear: Map<number, ZendingRow[]>;
  deelrittenByYear: Map<number, DeelritRow[]>;
  lookup: LookupData | null;
  nutsMapping: NutsMapping[];
  municipality: MunicipalityInfo | null;
  years: number[];
  heroImage: string | null;
  filters: FilterState;

  // ANPR data (persisted)
  anprTables: Map<string, AnprTable>;
  anprLookup: AnprLookupData | null;
  anprYear: number | null;

  // UI state (not persisted)
  detectedFiles: DetectedFile[];
  isProcessing: boolean;
  processingStatus: string;
  _hydrated: boolean;

  // Actions
  processFiles: (files: File[]) => Promise<void>;
  setFilter: (key: keyof FilterState, value: string | number | null) => void;
  resetFilters: () => void;
  setAnprTables: (tables: Map<string, AnprTable>) => void;
  clear: () => void;
}

// Shape of the serialized state in IndexedDB (Maps become Records)
interface PersistedState {
  zendingenByYear: Record<string, ZendingRow[]>;
  deelrittenByYear: Record<string, DeelritRow[]>;
  lookup: LookupData | null;
  nutsMapping: NutsMapping[];
  municipality: MunicipalityInfo | null;
  years: number[];
  heroImage: string | null;
  filters: FilterState;
  anprTables: Record<string, AnprTable>;
  anprLookup: AnprLookupData | null;
  anprYear: number | null;
}

const defaultFilters: FilterState = {
  year: null,
  euronorm: null,
  laadEmissiezone: null,
  losEmissiezone: null,
  handelsrichting: null,
};

/** Convert a File to a base64 data URL */
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// CBS uses official names that differ from common/Wikipedia names
const WIKI_NAME_MAP: Record<string, string[]> = {
  "'s-Gravenhage": ['Den Haag'],
  "'s-Hertogenbosch": ['Den Bosch'],
  "Leeuwarden": ['Leeuwarden (stad)'],
  "Súdwest-Fryslân": ['Súdwest-Fryslân'],
};

/**
 * Fetch a city image from the Dutch Wikipedia API.
 * Uses the page summary endpoint which returns the main article image.
 * Wikipedia content is moderated, CC-licensed, and safe.
 */
async function fetchCityImage(cityName: string): Promise<string | null> {
  // Strip common suffixes like "(gemeente)", "(stad)", "(dorp)" and normalize quotes
  const normalized = cityName
    .replace(/\s*\(gemeente\)|\s*\(stad\)|\s*\(dorp\)/gi, '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .trim();
  // Build list of names to try: normalized + known alternatives
  const alternatives = WIKI_NAME_MAP[normalized] || WIKI_NAME_MAP[cityName] || [];
  const namesToTry = [normalized, ...alternatives];

  for (const name of namesToTry) {
    try {
      const encodedName = encodeURIComponent(name);
      // Try Dutch Wikipedia first
      const res = await fetch(
        `https://nl.wikipedia.org/api/rest_v1/page/summary/${encodedName}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.originalimage?.source) return data.originalimage.source;
        if (data.thumbnail?.source) return data.thumbnail.source;
      }

      // Fallback: try English Wikipedia
      const resEn = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`
      );
      if (resEn.ok) {
        const dataEn = await resEn.json();
        if (dataEn.originalimage?.source) return dataEn.originalimage.source;
        if (dataEn.thumbnail?.source) return dataEn.thumbnail.source;
      }
    } catch {
      // Network error — try next name
    }
  }
  return null;
}

export const useVesdiStore = create<VesdiStore>()(
  persist(
    (set, get) => ({
      zendingenByYear: new Map(),
      deelrittenByYear: new Map(),
      lookup: null,
      nutsMapping: [],
      municipality: null,
      years: [],
      heroImage: null,
      anprTables: new Map(),
      anprLookup: null,
      anprYear: null,
      detectedFiles: [],
      isProcessing: false,
      processingStatus: '',
      filters: { ...defaultFilters },
      _hydrated: false,

      processFiles: async (files: File[]) => {
        set({ isProcessing: true, processingStatus: 'Bestanden detecteren...' });

        // Phase 1: Detect all files (accumulate with previously detected files)
        const previousFiles = get().detectedFiles;
        const detected: DetectedFile[] = [];
        for (const file of files) {
          const result = await detectFileType(file);
          detected.push(result);
        }
        set({ detectedFiles: [...previousFiles, ...detected] });

        // Phase 2: Parse lookup first (needed for transform)
        let lookup = get().lookup;
        const lookupFile = detected.find((d) => d.type === 'VESDI_LOOKUP');
        if (lookupFile) {
          set({ processingStatus: 'Lookup-tabel verwerken...' });
          const buffer = await readFileAsArrayBuffer(lookupFile.file);
          lookup = parseLookupXlsx(buffer);
          set({ lookup });
        }

        // Parse NUTS schema
        const nutsFile = detected.find((d) => d.type === 'NUTS_SCHEMA');
        if (nutsFile) {
          set({ processingStatus: 'NUTS-schema verwerken...' });
          const buffer = await readFileAsArrayBuffer(nutsFile.file);
          const nutsMapping = parseNutsSchema(buffer);
          set({ nutsMapping });
        }

        // Parse CBS codetabellen XLSX (contains voertuig, brandstof, gewicht, etc.)
        const codetabellenFiles = detected.filter((d) => d.type === 'CODETABELLEN_GEMEENTE');
        for (const ctFile of codetabellenFiles) {
          set({ processingStatus: 'CBS codetabellen verwerken...' });
          const buffer = await readFileAsArrayBuffer(ctFile.file);
          const partial = parseCodetabellenXlsx(buffer);

          // Ensure a lookup object exists
          if (!lookup) {
            lookup = {
              voertuigsoortRDW: [],
              brandstofsoort: [],
              laadvermogenCombinatie: [],
              maxToegestaanGewicht: [],
              leeggewichtCombinatie: [],
              logistiekeKlasse: [],
              legeRit: [],
              nuts3: [],
              gemeentecode: [],
            };
          }

          // Merge extracted tables: CBS codetabellen entries replace empty arrays
          for (const [key, entries] of Object.entries(partial) as [keyof LookupData, LookupEntry[]][]) {
            if (entries && entries.length > 0) {
              lookup = { ...lookup, [key]: entries };
            }
          }
        }

        // Parse CSV codetables and merge into lookup
        const gemeenteFile = detected.find((d) => d.type === 'CODETABEL_GEMEENTE');
        const klasseFile = detected.find((d) => d.type === 'CODETABEL_KLASSE');

        if (gemeenteFile || klasseFile) {
          // Ensure a lookup object exists
          if (!lookup) {
            lookup = {
              voertuigsoortRDW: [],
              brandstofsoort: [],
              laadvermogenCombinatie: [],
              maxToegestaanGewicht: [],
              leeggewichtCombinatie: [],
              logistiekeKlasse: [],
              legeRit: [],
              nuts3: [],
              gemeentecode: [],
            };
          }

          if (gemeenteFile) {
            set({ processingStatus: 'Gemeente-codetabel verwerken...' });
            const text = await readFileAsText(gemeenteFile.file);
            const { data } = parseCSV<{ gemNaam: string; gemCode: string | number }>(text);
            const entries: LookupEntry[] = data.map((row) => ({
              code: String(row.gemCode).padStart(4, '0'),
              omschrijving: String(row.gemNaam),
            }));
            lookup = { ...lookup, gemeentecode: entries };
          }

          if (klasseFile) {
            set({ processingStatus: 'Klasse-codetabel verwerken...' });
            const text = await readFileAsText(klasseFile.file);
            const { data } = parseCSV<{ stadslogistieke_klasse_code: number; stadslogistieke_klasse: string }>(text);
            const entries: LookupEntry[] = data.map((row) => ({
              code: Number(row.stadslogistieke_klasse_code),
              omschrijving: String(row.stadslogistieke_klasse),
            }));
            lookup = { ...lookup, logistiekeKlasse: entries };
          }
        }

        if (lookup) set({ lookup });

        // Phase 3: Parse data CSVs
        const zendingenByYear = new Map(get().zendingenByYear);
        const deelrittenByYear = new Map(get().deelrittenByYear);
        const yearsSet = new Set(get().years);

        const zendingenFiles = detected.filter((d) => d.type === 'ZENDINGEN');
        for (const zf of zendingenFiles) {
          set({ processingStatus: `Zendingenbestand verwerken: ${zf.file.name}...` });
          const text = await readFileAsText(zf.file);
          const { data } = parseCSV<ZendingRow>(text);
          const transformed = transformZendingen(data, lookup);
          const year = zf.year || (transformed[0]?.jaar ?? 0);
          if (year) {
            zendingenByYear.set(year, transformed);
            yearsSet.add(year);
          }
        }

        const deelrittenFiles = detected.filter((d) => d.type === 'DEELRITTEN');
        for (const df of deelrittenFiles) {
          set({ processingStatus: `Deelrittenbestand verwerken: ${df.file.name}...` });
          const text = await readFileAsText(df.file);
          const { data } = parseCSV<DeelritRow>(text);
          const transformed = transformDeelritten(data, lookup);
          const year = df.year || (transformed[0]?.jaar ?? 0);
          if (year) {
            deelrittenByYear.set(year, transformed);
            yearsSet.add(year);
          }
        }

        const years = [...yearsSet].sort();

        // Phase 4: Auto-detect municipality
        let municipality = get().municipality;
        if (!municipality) {
          for (const rows of zendingenByYear.values()) {
            const roiRows = rows.filter((r) => r.dummy_laadInROI === 1);
            if (roiRows.length > 0) {
              const gemCounts = new Map<string, number>();
              for (const r of roiRows) {
                gemCounts.set(r.laadGemeente, (gemCounts.get(r.laadGemeente) || 0) + r.zendingAantal);
              }
              let maxCode = '';
              let maxCount = 0;
              for (const [code, count] of gemCounts) {
                if (count > maxCount) {
                  maxCode = code;
                  maxCount = count;
                }
              }
              if (maxCode) {
                const nameEntry = lookup?.gemeentecode.find(
                  (e) => String(e.code) === maxCode || String(e.code).padStart(4, '0') === maxCode
                );
                const nutsEntry = get().nutsMapping.find(
                  (n) => n.gemeentecode === String(maxCode) || n.gemeentecode === String(maxCode).padStart(4, '0')
                );
                let filenameName = '';
                const allDetected = [...previousFiles, ...detected];
                for (const df of allDetected) {
                  const match = df.file.name.match(/_PC6_([A-Za-z\s'-]+)_\d{4}/);
                  if (match) { filenameName = match[1]; break; }
                }
                municipality = {
                  code: maxCode,
                  name: nutsEntry?.gemeentenaam || nameEntry?.omschrijving || filenameName || maxCode,
                };
              }
              break;
            }
          }
        }

        // Phase 5: Parse ANPR lookup
        let anprLookup = get().anprLookup;
        const anprLookupFile = detected.find((d) => d.type === 'ANPR_LOOKUP');
        if (anprLookupFile) {
          set({ processingStatus: 'ANPR lookup-tabel verwerken...' });
          const buffer = await readFileAsArrayBuffer(anprLookupFile.file);
          anprLookup = parseAnprLookupXlsx(buffer);
          set({ anprLookup });
        }

        // Phase 6: Parse ANPR CSV files
        const anprTables = new Map(get().anprTables);
        let anprYear = get().anprYear;
        const anprFiles = detected.filter((d) => d.type === 'ANPR_CSV');
        for (const af of anprFiles) {
          if (!af.anprTableId) continue;
          set({ processingStatus: `ANPR bestand verwerken: ${af.file.name}...` });
          const text = await readFileAsText(af.file);
          const { data } = parseCSV<Record<string, unknown>>(text);
          const rows = transformAnprRows(data, anprLookup);
          anprTables.set(af.anprTableId, {
            id: af.anprTableId,
            rows,
            isDummy: af.isDummy ?? false,
          });
          if (af.year) anprYear = af.year;
        }

        // Handle hero image — manual upload takes priority, then auto-fetch from Wikipedia
        const heroFile = detected.find((d) => d.type === 'HERO_IMAGE');
        let heroImage = get().heroImage;
        if (heroFile) {
          heroImage = await fileToDataURL(heroFile.file);
        } else if (!heroImage && municipality) {
          // No manual hero image — try to fetch one from Wikipedia
          const wikiImage = await fetchCityImage(municipality.name);
          if (wikiImage) heroImage = wikiImage;
        }

        set({
          zendingenByYear,
          deelrittenByYear,
          years,
          municipality,
          heroImage,
          anprTables,
          anprLookup,
          anprYear,
          isProcessing: false,
          processingStatus: 'Klaar!',
          filters: { ...defaultFilters, year: years[years.length - 1] || null },
        });
      },

      setFilter: (key, value) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        }));
      },

      resetFilters: () => {
        const years = get().years;
        set({
          filters: { ...defaultFilters, year: years[years.length - 1] || null },
        });
      },

      setAnprTables: (tables: Map<string, AnprTable>) => {
        set({ anprTables: tables });
      },

      clear: () => {
        set({
          zendingenByYear: new Map(),
          deelrittenByYear: new Map(),
          lookup: null,
          nutsMapping: [],
          municipality: null,
          years: [],
          heroImage: null,
          anprTables: new Map(),
          anprLookup: null,
          anprYear: null,
          detectedFiles: [],
          isProcessing: false,
          processingStatus: '',
          filters: { ...defaultFilters },
        });
      },
    }),
    {
      name: 'vesdi-store',
      storage: createJSONStorage(() => idbStorage),

      // v1: copy the legacy "EuronormKlasse" column (2021/2022 deliveries) to
      // euronormKlasse for data that was stored before transform.ts handled it.
      version: 1,
      migrate: (persisted, version) => {
        const ps = persisted as Partial<PersistedState>;
        if (version < 1 && ps?.deelrittenByYear) {
          for (const rows of Object.values(ps.deelrittenByYear)) {
            for (const r of rows) {
              const legacy = (r as unknown as Record<string, unknown>).EuronormKlasse;
              if (r.euronormKlasse == null && legacy != null) r.euronormKlasse = String(legacy);
            }
          }
        }
        return ps as unknown as VesdiStore;
      },

      // Only persist data fields — skip transient UI state and non-serializable File objects
      partialize: (state) => ({
        zendingenByYear: Object.fromEntries(state.zendingenByYear),
        deelrittenByYear: Object.fromEntries(state.deelrittenByYear),
        lookup: state.lookup,
        nutsMapping: state.nutsMapping,
        municipality: state.municipality,
        years: state.years,
        heroImage: state.heroImage,
        filters: state.filters,
        anprTables: Object.fromEntries(state.anprTables),
        anprLookup: state.anprLookup,
        anprYear: state.anprYear,
      }),

      // Convert serialized Records back to Maps on rehydration
      merge: (persistedState, currentState) => {
        const ps = persistedState as Partial<PersistedState> | undefined;
        if (!ps) return { ...currentState, _hydrated: true };

        return {
          ...currentState,
          ...ps,
          zendingenByYear: ps.zendingenByYear
            ? new Map(
                Object.entries(ps.zendingenByYear).map(([k, v]) => [Number(k), v])
              )
            : currentState.zendingenByYear,
          deelrittenByYear: ps.deelrittenByYear
            ? new Map(
                Object.entries(ps.deelrittenByYear).map(([k, v]) => [Number(k), v])
              )
            : currentState.deelrittenByYear,
          anprTables: ps.anprTables
            ? new Map(Object.entries(ps.anprTables))
            : currentState.anprTables,
          _hydrated: true,
        };
      },

      onRehydrateStorage: () => {
        return () => {
          // Mark as hydrated after rehydration completes
          useVesdiStore.setState({ _hydrated: true });

          // Auto-fetch city image if municipality exists but no hero image yet
          const { municipality, heroImage } = useVesdiStore.getState();
          if (municipality && !heroImage) {
            fetchCityImage(municipality.name).then((url) => {
              if (url) useVesdiStore.setState({ heroImage: url });
            });
          }
        };
      },
    }
  )
);
