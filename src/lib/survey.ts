/**
 * Enquête: do municipal staff actually need this information?
 * Shared between the client (questionnaire UI) and the server (validation,
 * storage, results). No Node or browser APIs in here.
 */

export const SURVEY_VERSION = 1;

/** A page, or a section of a long page, that respondents rate on a 1–5 scale. */
export interface SurveyItem {
  id: string;
  /** Route, optionally with a query string (e.g. preset page settings) */
  page: string;
  /** `data-tour` anchor of the section to outline; omit to rate the whole page */
  target?: string;
  title: string;
  /** What the respondent is looking at, in one sentence */
  what: string;
  requires?: 'anpr' | 'vesdi';
}

export const SURVEY_ITEMS: SurveyItem[] = [
  { id: 'trends', page: '/dashboard/trends', target: 'trend-charts', title: 'Trends over meerdere jaren', what: 'Ontwikkeling van deelritten, zendingen, Euro-6 aandeel en beladingsgraad per jaar.', requires: 'vesdi' },
  { id: 'zendingen-herkomst', page: '/dashboard/zendingen-overzicht', target: 'nuts-maps', title: 'Herkomst en bestemming van zendingen', what: 'Kaarten met de regio’s waar goederen voor de gemeente vandaan komen en naartoe gaan.', requires: 'vesdi' },
  { id: 'nationale-zendingen', page: '/dashboard/nationale-zendingen', title: 'Nationale zendingen', what: 'Zendingen per stadslogistieke klasse en de belangrijkste laad- en loslocaties.', requires: 'vesdi' },
  { id: 'internationale-zendingen', page: '/dashboard/internationale-zendingen', title: 'Internationale zendingen', what: 'Import en export per handelsland en stadslogistieke klasse.', requires: 'vesdi' },
  { id: 'nationale-deelritten', page: '/dashboard/nationale-deelritten', title: 'Nationale deelritten', what: 'Ritten per goederenklasse, brandstof, gewichtsklasse en voertuigtype, plus beladingsgraad.', requires: 'vesdi' },
  { id: 'postcode-locaties', page: '/dashboard/nationale-deelritten-postcode', target: 'postcode-input', title: 'Laad- en loslocaties per postcode', what: 'Bubbelkaarten van waar in de gemeente geladen en gelost wordt (PC4 en PC6).', requires: 'vesdi' },
  { id: 'postcode-kenmerken', page: '/dashboard/nationale-deelritten-postcode', target: 'postcode-output', title: 'Kenmerken van ritten per postcode', what: 'Gewicht, aantallen, Euro-6 aandeel, lege ritten en voertuigtypen van deze ritten.', requires: 'vesdi' },
  { id: 'routekaart', page: '/dashboard/routekaart', target: 'route-map', title: 'Routekaart', what: 'De meest voorkomende herkomst-bestemmingsparen als waarschijnlijke routes over het wegennet.', requires: 'vesdi' },
  { id: 'int-deelritten-overzicht', page: '/dashboard/internationale-deelritten-overzicht', title: 'Internationale deelritten: herkomst en bestemming', what: 'Europese kaarten van grensoverschrijdende ritten van en naar de gemeente.', requires: 'vesdi' },
  { id: 'int-deelritten', page: '/dashboard/internationale-deelritten', title: 'Internationale deelritten: details', what: 'Handelslanden, goederenklassen, postcodes en voertuigkenmerken van internationale ritten.', requires: 'vesdi' },
  { id: 'anpr-overzicht', page: '/dashboard/anpr-overzicht', title: 'ANPR: bezoeken en voertuigcategorieën', what: 'Aantal bezoeken van bestel- en vrachtwagens en de verdeling over N1, N2 en N3.', requires: 'anpr' },
  { id: 'anpr-emissie', page: '/dashboard/anpr-emissie', target: 'emissie-trends', title: 'ANPR: emissieklassen', what: 'Aandeel Euro 0-5, Euro 6 en zero-emissie, per maand.', requires: 'anpr' },
  { id: 'anpr-emissie-voertuig', page: '/dashboard/anpr-emissie', target: 'emissie-voertuig', title: 'ANPR: bezoeken per voertuigcategorie per maand', what: 'Maandelijkse bezoeken uitgesplitst naar bestelwagen, middelzware en zware vrachtwagen.', requires: 'anpr' },
  { id: 'anpr-bedrijven', page: '/dashboard/anpr-bedrijven', title: 'ANPR: bedrijfstakken', what: 'Bezoeken per bedrijfstak (SBI) en bedrijfsgrootte van de voertuigeigenaar.', requires: 'anpr' },
  { id: 'anpr-bezoekers', page: '/dashboard/anpr-bezoekers', title: 'ANPR: bezoekers', what: 'Hoe vaak voertuigen terugkomen en uit welke provincie ze komen.', requires: 'anpr' },
  { id: 'anpr-tijdpatronen', page: '/dashboard/anpr-tijdpatronen', title: 'ANPR: tijdpatronen', what: 'Drukte per dagdeel en weekdag.', requires: 'anpr' },
  { id: 'anpr-analyse', page: '/dashboard/anpr-analyse?extrapoleer=2030', title: 'ANPR: trendanalyse', what: 'Trendlijnen van de emissieklassen, doorgetrokken tot 2030, en een statistische vergelijking tussen maanden.', requires: 'anpr' },
];

export const SCALE = [
  { value: 1, label: 'Niet waardevol' },
  { value: 2, label: 'Weinig waardevol' },
  { value: 3, label: 'Neutraal' },
  { value: 4, label: 'Waardevol' },
  { value: 5, label: 'Zeer waardevol' },
] as const;

export const FUNCTIES = [
  { value: 'beleid-logistiek', label: 'Beleidsadviseur stadslogistiek / goederenvervoer' },
  { value: 'beleid-mobiliteit', label: 'Beleidsadviseur mobiliteit / verkeer' },
  { value: 'milieu', label: 'Milieu / luchtkwaliteit / ZE-zone' },
  { value: 'ruimte', label: 'Ruimtelijke ordening / gebiedsontwikkeling' },
  { value: 'data', label: 'Data / onderzoek / informatievoorziening' },
  { value: 'handhaving', label: 'Handhaving / vergunningen' },
  { value: 'management', label: 'Management / bestuursadvies' },
  { value: 'anders', label: 'Anders' },
] as const;

export const CONTRACT_OPTIONS = [
  { value: 'zeker-wel', label: 'Ja, zeker' },
  { value: 'waarschijnlijk-wel', label: 'Waarschijnlijk wel' },
  { value: 'waarschijnlijk-niet', label: 'Waarschijnlijk niet' },
  { value: 'zeker-niet', label: 'Nee, zeker niet' },
] as const;

export const CAMERA_OPTIONS = [
  { value: 'ja', label: 'Ja' },
  { value: 'nee', label: 'Nee' },
  { value: 'weet-niet', label: 'Weet ik niet' },
] as const;

export const ANPR_KANS_SCALE = [
  { value: 1, label: 'Zeer onwaarschijnlijk' },
  { value: 2, label: 'Onwaarschijnlijk' },
  { value: 3, label: 'Misschien' },
  { value: 4, label: 'Waarschijnlijk' },
  { value: 5, label: 'Zeer waarschijnlijk' },
] as const;

export const BELEMMERINGEN = [
  { value: 'privacy', label: 'Privacy / AVG' },
  { value: 'juridisch', label: 'Juridische grondslag of doelbinding' },
  { value: 'eigendom', label: "Camera's zijn niet van de gemeente (bijv. politie, provincie)" },
  { value: 'techniek', label: 'Technische ontsluiting van de data' },
  { value: 'capaciteit', label: 'Capaciteit of budget' },
  { value: 'bestuurlijk', label: 'Bestuurlijk draagvlak' },
  { value: 'geen-cameras', label: "Geen (geschikte) camera's" },
] as const;

export type Score = 1 | 2 | 3 | 4 | 5 | 'nvt';

export interface SurveyAnswers {
  respondent: { naam: string; gemeente: string; functie: string; email: string };
  ratings: Record<string, { score: Score | null; comment: string }>;
  contract: { intentie: string | null; toelichting: string };
  anpr: { cameras: string | null; kans: number | null; belemmeringen: string[]; toelichting: string };
  opmerkingen: string;
}

export interface StoredResponse extends SurveyAnswers {
  id: string;
  submittedAt: string;
  version: number;
  /** Set when submitted through a personal invite link; the latest response per invite counts */
  inviteId: string | null;
}

/** Personal survey link for one respondent (~10 people, managed on the results page). */
export interface SurveyInvite {
  id: string;
  code: string;
  naam: string;
  gemeente: string;
  email: string;
  createdAt: string;
  /** When the invitation e-mail was last composed from the admin page */
  mailedAt?: string | null;
}

export function emptyAnswers(): SurveyAnswers {
  return {
    respondent: { naam: '', gemeente: '', functie: '', email: '' },
    ratings: {},
    contract: { intentie: null, toelichting: '' },
    anpr: { cameras: null, kans: null, belemmeringen: [], toelichting: '' },
    opmerkingen: '',
  };
}

/** Fields that must be filled in before submitting; returns Dutch messages. */
export function missingRequired(a: SurveyAnswers): string[] {
  const missing: string[] = [];
  if (!a.respondent.gemeente.trim()) missing.push('gemeente');
  if (!a.respondent.functie) missing.push('functie');
  // Also catches a draft that still holds a removed option (e.g. the old neutral answer)
  if (!CONTRACT_OPTIONS.some((o) => o.value === a.contract.intentie)) missing.push('contractvraag');
  return missing;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const oneOf = (v: unknown, allowed: readonly { value: string }[]) =>
  typeof v === 'string' && allowed.some((o) => o.value === v) ? v : null;

/**
 * Server-side: turn untrusted JSON into a clean SurveyAnswers, or return an
 * error message. Unknown items/options are dropped, strings are length-capped.
 */
export function sanitizeAnswers(input: unknown): SurveyAnswers | string {
  if (!input || typeof input !== 'object') return 'Ongeldige invoer';
  const raw = input as Record<string, unknown>;
  const r = (raw.respondent ?? {}) as Record<string, unknown>;
  const c = (raw.contract ?? {}) as Record<string, unknown>;
  const n = (raw.anpr ?? {}) as Record<string, unknown>;
  const rawRatings = (raw.ratings ?? {}) as Record<string, unknown>;

  const ratings: SurveyAnswers['ratings'] = {};
  for (const item of SURVEY_ITEMS) {
    const entry = rawRatings[item.id] as { score?: unknown; comment?: unknown } | undefined;
    if (!entry) continue;
    const score =
      entry.score === 'nvt' ? 'nvt'
      : typeof entry.score === 'number' && [1, 2, 3, 4, 5].includes(entry.score) ? (entry.score as Score)
      : null;
    const comment = str(entry.comment, 1000);
    if (score !== null || comment) ratings[item.id] = { score, comment };
  }

  const kans = typeof n.kans === 'number' && [1, 2, 3, 4, 5].includes(n.kans) ? n.kans : null;
  const belemmeringen = Array.isArray(n.belemmeringen)
    ? [...new Set(n.belemmeringen.filter((b): b is string => BELEMMERINGEN.some((o) => o.value === b)))]
    : [];

  const answers: SurveyAnswers = {
    respondent: {
      naam: str(r.naam, 120),
      gemeente: str(r.gemeente, 120),
      functie: oneOf(r.functie, FUNCTIES) ?? '',
      email: str(r.email, 200),
    },
    ratings,
    contract: { intentie: oneOf(c.intentie, CONTRACT_OPTIONS), toelichting: str(c.toelichting, 2000) },
    anpr: {
      cameras: oneOf(n.cameras, CAMERA_OPTIONS),
      kans,
      belemmeringen,
      toelichting: str(n.toelichting, 2000),
    },
    opmerkingen: str(raw.opmerkingen, 4000),
  };

  const missing = missingRequired(answers);
  if (missing.length > 0) return `Verplichte vragen ontbreken: ${missing.join(', ')}`;
  if (answers.respondent.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.respondent.email)) {
    return 'Ongeldig e-mailadres';
  }
  return answers;
}

/** Aggregated results returned by /api/survey/results. */
export interface SurveySummary {
  total: number;
  gemeenten: { name: string; count: number }[];
  functies: { value: string; label: string; count: number }[];
  items: {
    id: string;
    title: string;
    page: string;
    /** counts for scores 1..5 */
    distribution: number[];
    nvt: number;
    rated: number;
    average: number | null;
    comments: string[];
  }[];
  contract: { value: string; label: string; count: number }[];
  cameras: { value: string; label: string; count: number }[];
  anprKans: { distribution: number[]; average: number | null; rated: number };
  belemmeringen: { value: string; label: string; count: number }[];
  /** Responses that came in through the shared login instead of a personal link */
  anonymous: number;
}
