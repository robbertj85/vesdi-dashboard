import type { AnprRow, AnprLookupData, LookupEntry } from './types';

// ─── Lookup-based label resolver ───

type LookupMap = Map<string, string>;

function buildMap(entries?: LookupEntry[]): LookupMap {
  const m = new Map<string, string>();
  if (!entries) return m;
  for (const e of entries) m.set(String(e.code).trim(), e.omschrijving);
  return m;
}

/** Resolve a code to a label, trying: row's pre-resolved label → lookup → fallback label helpers → raw code */
function resolveSbi(r: AnprRow, lookup: LookupMap): string {
  if (r.sbiGroepLabel && r.sbiGroepLabel !== r.OgSBI08Groep) return r.sbiGroepLabel;
  return lookup.get(r.OgSBI08Groep ?? '') ?? r.OgSBI08Groep ?? 'Onbekend';
}

function resolveSize(r: AnprRow, lookup: LookupMap): string {
  if (r.bedrijfsgrootteLabel && r.bedrijfsgrootteLabel !== r.bedrijfsgrootte5Code) return r.bedrijfsgrootteLabel;
  return lookup.get(r.bedrijfsgrootte5Code ?? '') ?? companySizeLabel(r.bedrijfsgrootte5Code ?? '');
}

function resolveProvince(r: AnprRow, _lookup: LookupMap): string {
  if (r.provincieLabel && r.provincieLabel !== r.rustNuts2) return r.provincieLabel;
  // The lookup uses CBS provincieCode (20-31) but the data uses NUTS2 (NL11-NL42)
  // Use hardcoded NUTS2→province map
  return NUTS2_PROVINCE[r.rustNuts2 ?? ''] ?? r.rustNuts2 ?? 'Onbekend';
}

function resolveTimeSlot(r: AnprRow, lookup: LookupMap): string {
  if (r.tijdstipDagLabel && r.tijdstipDagLabel !== r.tijdstipDag6Code) return r.tijdstipDagLabel;
  return lookup.get(r.tijdstipDag6Code ?? '') ?? timeSlotLabel(r.tijdstipDag6Code ?? '');
}

function resolveWeekday(r: AnprRow, lookup: LookupMap): string {
  if (r.weekdagLabel && r.weekdagLabel !== r.weekdagCode) return r.weekdagLabel;
  return lookup.get(r.weekdagCode ?? '') ?? weekdayLabel(r.weekdagCode ?? '');
}

// ─── Helper: filter out "Total" rows for a given dimension ───

function excludeTotal(rows: AnprRow[], field: keyof AnprRow): AnprRow[] {
  return rows.filter((r) => {
    const val = r[field];
    return val !== undefined && val !== 'Total';
  });
}

function onlyTotal(rows: AnprRow[], field: keyof AnprRow): AnprRow[] {
  return rows.filter((r) => r[field] === 'Total');
}

/** Get rows for a specific period type: month (M), quarter (K), or annual */
function filterByPeriodType(rows: AnprRow[], type: 'M' | 'K' | 'annual'): AnprRow[] {
  return rows.filter((r) => {
    if (!r.periode) return false;
    if (type === 'M') return /^\d{4}M\d{2}$/.test(r.periode);
    if (type === 'K') return /^\d{4}K\d{2}$/.test(r.periode);
    return /^\d{4}$/.test(r.periode);
  });
}

// ─── M1: Emission × Vehicle pivot ───

export interface EmissionVehiclePivotRow {
  emissieklasse: string;
  N1: number;
  'N2/N3': number;
  totaal: number;
  N1_pct: number;
  'N2/N3_pct': number;
}

export function anprEmissionVehiclePivot(rows: AnprRow[]): EmissionVehiclePivotRow[] {
  const annual = filterByPeriodType(rows, 'annual');
  const emissionClasses = ['0-5', '6', 'Z'];

  // Get totals per vehicle category for percentage calculation
  const n1Total = annual.find((r) => r.europeseVoertuigcategorie === 'N1' && r.emissieklasse3 === 'Total')?.aantalBezoeken ?? 0;
  const n23Total = annual.find((r) => r.europeseVoertuigcategorie === 'N23' && r.emissieklasse3 === 'Total')?.aantalBezoeken ?? 0;

  return emissionClasses.map((ec) => {
    const n1 = annual.find((r) => r.europeseVoertuigcategorie === 'N1' && r.emissieklasse3 === ec)?.aantalBezoeken ?? 0;
    const n23 = annual.find((r) => r.europeseVoertuigcategorie === 'N23' && r.emissieklasse3 === ec)?.aantalBezoeken ?? 0;
    return {
      emissieklasse: emissionLabel(ec),
      N1: n1,
      'N2/N3': n23,
      totaal: n1 + n23,
      N1_pct: n1Total > 0 ? n1 / n1Total : 0,
      'N2/N3_pct': n23Total > 0 ? n23 / n23Total : 0,
    };
  });
}

/** Monthly data per emission class per vehicle category, for regression/comparison */
export function anprMonthlyByEmissionAndVehicle(rows: AnprRow[]): {
  periode: string;
  vehicle: string;
  emissieklasse: string;
  aantalBezoeken: number;
  total: number;
  pct: number;
}[] {
  const monthly = filterByPeriodType(rows, 'M');
  const result: { periode: string; vehicle: string; emissieklasse: string; aantalBezoeken: number; total: number; pct: number }[] = [];

  const vehicles = ['N1', 'N23'];
  const emissions = ['0-5', '6', 'Z'];

  for (const r of monthly) {
    if (!vehicles.includes(r.europeseVoertuigcategorie)) continue;
    if (!emissions.includes(r.emissieklasse3 ?? '')) continue;

    const vLabel = r.europeseVoertuigcategorie === 'N23' ? 'N2/N3' : 'N1';
    const total = monthly.find(
      (t) => t.periode === r.periode && t.europeseVoertuigcategorie === r.europeseVoertuigcategorie && t.emissieklasse3 === 'Total'
    )?.aantalBezoeken ?? 0;

    result.push({
      periode: formatPeriod(r.periode!),
      vehicle: vLabel,
      emissieklasse: emissionLabel(r.emissieklasse3 ?? ''),
      aantalBezoeken: r.aantalBezoeken,
      total,
      pct: total > 0 ? r.aantalBezoeken / total : 0,
    });
  }

  return result.sort((a, b) => a.periode.localeCompare(b.periode));
}

// ─── M1: Emission class analysis ───

export function anprTotalVisits(rows: AnprRow[]): number {
  const annual = filterByPeriodType(rows, 'annual');
  const totalRow = annual.find(
    (r) => r.europeseVoertuigcategorie === 'Total' && r.emissieklasse3 === 'Total'
  );
  return totalRow?.aantalBezoeken ?? 0;
}

export function anprEmissionDistribution(rows: AnprRow[]): { name: string; value: number }[] {
  const annual = filterByPeriodType(rows, 'annual');
  const filtered = excludeTotal(annual, 'emissieklasse3')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');
  return filtered.map((r) => ({
    name: emissionLabel(r.emissieklasse3 ?? ''),
    value: r.aantalBezoeken,
  }));
}

/**
 * CBS delivers N23 (= N2 + N3) alongside N2 and N3. Summing or stacking all of
 * them double-counts trucks, so keep the N2/N3 detail when present, else N23.
 */
function dropOverlappingVehicles(rows: AnprRow[]): AnprRow[] {
  const code = (r: AnprRow) => (r.europeseVoertuigcategorie ?? '').trim();
  const hasDetail = rows.some((r) => code(r) === 'N2' || code(r) === 'N3');
  return hasDetail ? rows.filter((r) => code(r) !== 'N23') : rows;
}

export function anprVehicleCategoryDistribution(rows: AnprRow[]): { name: string; value: number }[] {
  const annual = filterByPeriodType(rows, 'annual');
  const filtered = excludeTotal(annual, 'europeseVoertuigcategorie')
    .filter((r) => r.emissieklasse3 === 'Total');
  return dropOverlappingVehicles(filtered).map((r) => ({
    name: vehicleLabel(r.europeseVoertuigcategorie),
    value: r.aantalBezoeken,
  }));
}

export type PeriodGranularity = 'M' | 'K';

export function anprVisitsByMonth(rows: AnprRow[], granularity: PeriodGranularity = 'M'): { periode: string; [key: string]: string | number }[] {
  const filtered = filterByPeriodType(rows, granularity);
  const vehicleTotal = filtered.filter((r) => r.europeseVoertuigcategorie === 'Total');
  const emissionRows = excludeTotal(vehicleTotal, 'emissieklasse3');

  const byPeriod = new Map<string, Record<string, number>>();
  for (const r of emissionRows) {
    const label = emissionLabel(r.emissieklasse3 ?? '');
    const entry = byPeriod.get(r.periode!) ?? {};
    entry[label] = (entry[label] ?? 0) + r.aantalBezoeken;
    byPeriod.set(r.periode!, entry);
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, data]) => ({ periode: formatPeriod(periode), ...data }));
}

export function anprMonthlyByVehicle(rows: AnprRow[], granularity: PeriodGranularity = 'M'): { periode: string; [key: string]: string | number }[] {
  const filtered = filterByPeriodType(rows, granularity);
  const emissionTotal = filtered.filter((r) => r.emissieklasse3 === 'Total');
  const vehicleRows = dropOverlappingVehicles(excludeTotal(emissionTotal, 'europeseVoertuigcategorie'));

  const byPeriod = new Map<string, Record<string, number>>();
  for (const r of vehicleRows) {
    const label = vehicleLabel(r.europeseVoertuigcategorie);
    const entry = byPeriod.get(r.periode!) ?? {};
    entry[label] = (entry[label] ?? 0) + r.aantalBezoeken;
    byPeriod.set(r.periode!, entry);
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, data]) => ({ periode: formatPeriod(periode), ...data }));
}

/** Monthly N1 vs N2/N3 breakdown (absolute + percentage) */
export function anprMonthlyN1vsN23(rows: AnprRow[], granularity: PeriodGranularity = 'M'): { periode: string; N1: number; 'N2/N3': number; N1_pct: number; 'N2/N3_pct': number }[] {
  const monthly = filterByPeriodType(rows, granularity);
  const emissionTotal = monthly.filter((r) => r.emissieklasse3 === 'Total');

  const periods = [...new Set(emissionTotal.map((r) => r.periode!))].sort();
  return periods.map((p) => {
    const pRows = emissionTotal.filter((r) => r.periode === p);
    const n1 = pRows.find((r) => r.europeseVoertuigcategorie === 'N1')?.aantalBezoeken ?? 0;
    const n23 = pRows.find((r) => r.europeseVoertuigcategorie === 'N23')?.aantalBezoeken ?? 0;
    const total = n1 + n23;
    return {
      periode: formatPeriod(p),
      N1: n1,
      'N2/N3': n23,
      N1_pct: total > 0 ? n1 / total : 0,
      'N2/N3_pct': total > 0 ? n23 / total : 0,
    };
  });
}

export function anprEmissionByVehicle(rows: AnprRow[]): { voertuig: string; [key: string]: string | number }[] {
  const annual = filterByPeriodType(rows, 'annual');
  const filtered = dropOverlappingVehicles(excludeTotal(annual, 'europeseVoertuigcategorie'));
  const nonTotal = excludeTotal(filtered, 'emissieklasse3');

  const byVehicle = new Map<string, Record<string, number>>();
  for (const r of nonTotal) {
    const vLabel = vehicleLabel(r.europeseVoertuigcategorie);
    const eLabel = emissionLabel(r.emissieklasse3 ?? '');
    const entry = byVehicle.get(vLabel) ?? {};
    entry[eLabel] = (entry[eLabel] ?? 0) + r.aantalBezoeken;
    byVehicle.set(vLabel, entry);
  }

  return [...byVehicle.entries()].map(([voertuig, data]) => ({ voertuig, ...data }));
}

export function anprMonthlyEuro6Pct(
  rows: AnprRow[],
  vehicleFilter: 'Total' | 'N1' | 'N23' = 'Total',
  granularity: PeriodGranularity = 'M'
): { periode: string; euro6Pct: number; zeroPct: number; euro05Pct: number; total: number; euro6: number; zero: number; euro05: number }[] {
  const monthly = filterByPeriodType(rows, granularity);
  const filtered = monthly.filter((r) => r.europeseVoertuigcategorie === vehicleFilter);

  const result: { periode: string; euro6Pct: number; zeroPct: number; euro05Pct: number; total: number; euro6: number; zero: number; euro05: number }[] = [];
  const periods = [...new Set(filtered.map((r) => r.periode!))].sort();

  for (const p of periods) {
    const pRows = filtered.filter((r) => r.periode === p);
    const total = pRows.find((r) => r.emissieklasse3 === 'Total')?.aantalBezoeken ?? 0;
    const euro6 = pRows.find((r) => r.emissieklasse3 === '6')?.aantalBezoeken ?? 0;
    const zero = pRows.find((r) => r.emissieklasse3 === 'Z')?.aantalBezoeken ?? 0;
    const euro05 = pRows.find((r) => r.emissieklasse3 === '0-5')?.aantalBezoeken ?? 0;
    result.push({
      periode: formatPeriod(p),
      euro6Pct: total > 0 ? euro6 / total : 0,
      zeroPct: total > 0 ? zero / total : 0,
      euro05Pct: total > 0 ? euro05 / total : 0,
      total, euro6, zero, euro05,
    });
  }
  return result;
}

// ─── M2/J1: SBI industry analysis ───

export function anprVisitsBySbi(rows: AnprRow[], lookup?: AnprLookupData | null): { name: string; value: number }[] {
  const sbiMap = buildMap(lookup?.sbiGroep);
  const filtered = excludeTotal(rows, 'OgSBI08Groep')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');
  const refined = filtered.filter((r) => {
    if (r.typeBezoeker3 !== undefined) return r.typeBezoeker3 === 'Total';
    if (r.periode !== undefined) return /^\d{4}$/.test(r.periode);
    return true;
  });

  const cleanRows = refined.filter((r) => {
    if (r.tijdstipDag6Code !== undefined) return r.tijdstipDag6Code === 'Total';
    if (r.bedrijfsgrootte5Code !== undefined) return r.bedrijfsgrootte5Code === 'Total';
    return true;
  });

  const map = new Map<string, number>();
  for (const r of cleanRows) {
    const label = resolveSbi(r, sbiMap);
    map.set(label, (map.get(label) ?? 0) + r.aantalBezoeken);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function anprVisitorTypeBySbi(rows: AnprRow[], lookup?: AnprLookupData | null): { sbi: string; [key: string]: string | number }[] {
  const sbiMap = buildMap(lookup?.sbiGroep);
  const filtered = excludeTotal(rows, 'OgSBI08Groep');
  const nonTotalVisitor = excludeTotal(filtered, 'typeBezoeker3')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');

  const bySbi = new Map<string, Record<string, number>>();
  for (const r of nonTotalVisitor) {
    const sbi = resolveSbi(r, sbiMap);
    const visitor = visitorLabel(r.typeBezoeker3 ?? '');
    const entry = bySbi.get(sbi) ?? {};
    entry[visitor] = (entry[visitor] ?? 0) + r.aantalBezoeken;
    bySbi.set(sbi, entry);
  }

  return [...bySbi.entries()]
    .map(([sbi, data]) => ({ sbi, ...data }))
    .sort((a, b) => sumNumericValues(b) - sumNumericValues(a));
}

// ─── J2/K1: Company size analysis ───

export function anprVisitsByCompanySize(rows: AnprRow[], lookup?: AnprLookupData | null): { name: string; value: number }[] {
  const sizeMap = buildMap(lookup?.bedrijfsgrootte);
  const filtered = excludeTotal(rows, 'bedrijfsgrootte5Code')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');
  const refined = filtered.filter((r) => {
    if (r.typeBezoeker3 !== undefined) return r.typeBezoeker3 === 'Total';
    if (r.periode !== undefined) return /^\d{4}$/.test(r.periode);
    if (r.OgSBI08Groep !== undefined) return r.OgSBI08Groep === 'Total';
    return true;
  });

  const map = new Map<string, number>();
  for (const r of refined) {
    const label = resolveSize(r, sizeMap);
    map.set(label, (map.get(label) ?? 0) + r.aantalBezoeken);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function anprVisitorTypeBySize(rows: AnprRow[], lookup?: AnprLookupData | null): { grootte: string; [key: string]: string | number }[] {
  const sizeMap = buildMap(lookup?.bedrijfsgrootte);
  const filtered = excludeTotal(rows, 'bedrijfsgrootte5Code');
  const nonTotalVisitor = excludeTotal(filtered, 'typeBezoeker3')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');

  const bySize = new Map<string, Record<string, number>>();
  for (const r of nonTotalVisitor) {
    const size = resolveSize(r, sizeMap);
    const visitor = visitorLabel(r.typeBezoeker3 ?? '');
    const entry = bySize.get(size) ?? {};
    entry[visitor] = (entry[visitor] ?? 0) + r.aantalBezoeken;
    bySize.set(size, entry);
  }

  return [...bySize.entries()].map(([grootte, data]) => ({ grootte, ...data }));
}

// ─── J3: Province analysis ───

export function anprVisitsByProvince(rows: AnprRow[], lookup?: AnprLookupData | null): { name: string; value: number }[] {
  const provMap = buildMap(lookup?.provincie);
  const filtered = excludeTotal(rows, 'rustNuts2')
    .filter((r) => r.europeseVoertuigcategorie === 'Total' && r.typeBezoeker3 === 'Total');

  const map = new Map<string, number>();
  for (const r of filtered) {
    const label = resolveProvince(r, provMap);
    map.set(label, (map.get(label) ?? 0) + r.aantalBezoeken);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ─── J5/J6: Time patterns ───

export function anprTimeOfDayByWeekday(rows: AnprRow[], lookup?: AnprLookupData | null): { tijdstip: string; [key: string]: string | number }[] {
  const timeMap = buildMap(lookup?.tijdstipDag);
  const dayMap = buildMap(lookup?.weekdag);
  const filtered = excludeTotal(rows, 'tijdstipDag6Code');
  const nonTotalDay = excludeTotal(filtered, 'weekdagCode')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');

  const byTime = new Map<string, Record<string, number>>();
  for (const r of nonTotalDay) {
    const time = resolveTimeSlot(r, timeMap);
    const day = resolveWeekday(r, dayMap);
    const entry = byTime.get(time) ?? {};
    entry[day] = (entry[day] ?? 0) + r.aantalBezoeken;
    byTime.set(time, entry);
  }

  return [...byTime.entries()].map(([tijdstip, data]) => ({ tijdstip, ...data }));
}

export function anprTimeOfDayBySbi(rows: AnprRow[], lookup?: AnprLookupData | null): { tijdstip: string; [key: string]: string | number }[] {
  const timeMap = buildMap(lookup?.tijdstipDag);
  const sbiMap = buildMap(lookup?.sbiGroep);
  const filtered = excludeTotal(rows, 'tijdstipDag6Code');
  const nonTotalSbi = excludeTotal(filtered, 'OgSBI08Groep')
    .filter((r) => r.europeseVoertuigcategorie === 'Total');

  const byTime = new Map<string, Record<string, number>>();
  for (const r of nonTotalSbi) {
    const time = resolveTimeSlot(r, timeMap);
    const sbi = resolveSbi(r, sbiMap);
    const entry = byTime.get(time) ?? {};
    entry[sbi] = (entry[sbi] ?? 0) + r.aantalBezoeken;
    byTime.set(time, entry);
  }

  return [...byTime.entries()].map(([tijdstip, data]) => ({ tijdstip, ...data }));
}

// ─── K1: Quarterly SBI × company size ───

export function anprQuarterlySbiBySize(rows: AnprRow[], lookup?: AnprLookupData | null): { periode: string; [key: string]: string | number }[] {
  const sizeMap = buildMap(lookup?.bedrijfsgrootte);
  const quarterly = filterByPeriodType(rows, 'K');
  const filtered = quarterly
    .filter((r) => r.europeseVoertuigcategorie === 'Total')
    .filter((r) => r.OgSBI08Groep === 'Total');
  const nonTotalSize = excludeTotal(filtered, 'bedrijfsgrootte5Code');

  const byPeriod = new Map<string, Record<string, number>>();
  for (const r of nonTotalSize) {
    const label = resolveSize(r, sizeMap);
    const entry = byPeriod.get(r.periode!) ?? {};
    entry[label] = (entry[label] ?? 0) + r.aantalBezoeken;
    byPeriod.set(r.periode!, entry);
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, data]) => ({ periode: formatPeriod(periode), ...data }));
}

// ─── Utility helpers ───

function sumNumericValues(obj: Record<string, string | number>): number {
  let sum = 0;
  for (const v of Object.values(obj)) {
    if (typeof v === 'number') sum += v;
  }
  return sum;
}

// ─── Label helpers ───

function emissionLabel(code: string): string {
  switch (code) {
    case '0-5': return 'Euro 0-5';
    case '6': return 'Euro 6';
    case 'Z': return 'Zero-emissie';
    default: return code;
  }
}

function vehicleLabel(raw: string): string {
  const code = (raw ?? '').trim();
  switch (code) {
    case 'N1': return 'N1 (Bestelwagen)';
    case 'N2': return 'N2 (Middelzwaar)';
    case 'N3': return 'N3 (Zwaar)';
    case 'N23': return 'N2+N3 (Vrachtwagen)';
    default: return code;
  }
}

// NUTS2 → province name (standard Dutch mapping)
const NUTS2_PROVINCE: Record<string, string> = {
  NL11: 'Groningen',
  NL12: 'Friesland',
  NL13: 'Drenthe',
  NL21: 'Overijssel',
  NL22: 'Gelderland',
  NL23: 'Flevoland',
  NL31: 'Utrecht',
  NL32: 'Noord-Holland',
  NL33: 'Zuid-Holland',
  NL34: 'Zeeland',
  NL41: 'Noord-Brabant',
  NL42: 'Limburg',
  Onbekend: 'Onbekend',
};

function companySizeLabel(code: string): string {
  switch (code) {
    case '1': return '1 werkzame persoon';
    case '2': return '2-10 werkzame personen';
    case '3': return '11-50 werkzame personen';
    case '4': return '51-249 werkzame personen';
    case '5': return '250+ werkzame personen';
    case '99': return 'Onbekend';
    default: return code;
  }
}

function visitorLabel(code: string): string {
  switch (code) {
    case 'Eenmalig': return 'Eenmalig';
    case '2_tot_12': return '2-12 bezoeken';
    case 'Groter_1': return '>12 bezoeken';
    case 'Groter_12': return '>12 bezoeken';
    default: return code;
  }
}

function timeSlotLabel(code: string): string {
  switch (code) {
    case '1': return '00:00-05:59';
    case '2': return '06:00-08:59';
    case '3': return '09:00-11:59';
    case '4': return '12:00-14:59';
    case '5': return '15:00-18:59';
    case '6': return '19:00-23:59';
    default: return code;
  }
}

function weekdayLabel(code: string): string {
  switch (code) {
    case '1': return 'Maandag';
    case '2': return 'Dinsdag';
    case '3': return 'Woensdag';
    case '4': return 'Donderdag';
    case '5': return 'Vrijdag';
    case '6': return 'Zaterdag';
    case '7': return 'Zondag';
    default: return code;
  }
}

function formatPeriod(code: string): string {
  const monthMatch = code.match(/^(\d{4})M(\d{2})$/);
  if (monthMatch) {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    return `${months[Number(monthMatch[2]) - 1]} ${monthMatch[1]}`;
  }
  const quarterMatch = code.match(/^(\d{4})K(\d{2})$/);
  if (quarterMatch) return `Q${Number(quarterMatch[2])} ${quarterMatch[1]}`;
  return code;
}
