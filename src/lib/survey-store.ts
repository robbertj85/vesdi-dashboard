import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import Papa from 'papaparse';
import { SURVEY_VERSION, type StoredResponse, type SurveyAnswers, type SurveyInvite } from './survey';

/**
 * Survey responses are appended as JSON lines to a file on the server.
 * Configure SURVEY_DATA_DIR to point at persistent storage (e.g. a Docker
 * volume); the default ./data/survey is gitignored.
 */
function surveyDir(): string {
  return process.env.SURVEY_DATA_DIR || path.join(process.cwd(), 'data', 'survey');
}
function surveyFile(): string {
  return path.join(/*turbopackIgnore: true*/ surveyDir(), 'responses.jsonl');
}
function invitesFile(): string {
  return path.join(/*turbopackIgnore: true*/ surveyDir(), 'invites.json');
}

export async function saveResponse(answers: SurveyAnswers, inviteId: string | null): Promise<StoredResponse> {
  const record: StoredResponse = {
    ...answers,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    version: SURVEY_VERSION,
    inviteId,
  };
  const file = surveyFile();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  // A single appendFile of one line is atomic enough for this volume of writes
  await appendFile(/*turbopackIgnore: true*/ file, JSON.stringify(record) + '\n', 'utf8');
  return record;
}

/**
 * All responses that count: the file is an append-only log, so for invited
 * respondents only their most recent submission is kept.
 */
export async function readResponses(): Promise<StoredResponse[]> {
  const all = await readAllResponses();
  const latestByInvite = new Map<string, StoredResponse>();
  const anonymous: StoredResponse[] = [];
  for (const r of all) {
    if (r.inviteId) latestByInvite.set(r.inviteId, r);
    else anonymous.push(r);
  }
  return [...latestByInvite.values(), ...anonymous].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

async function readAllResponses(): Promise<StoredResponse[]> {
  let text: string;
  try {
    text = await readFile(/*turbopackIgnore: true*/ surveyFile(), 'utf8');
  } catch {
    return [];
  }
  const out: StoredResponse[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push({ inviteId: null, ...JSON.parse(line) });
    } catch {
      // skip a corrupt line rather than failing the whole export
    }
  }
  return out;
}

/** Results are only for DMI: they require SURVEY_ADMIN_KEY on top of the demo login. */
export function checkAdminKey(key: string | null): 'ok' | 'denied' | 'unconfigured' {
  const expected = process.env.SURVEY_ADMIN_KEY;
  if (!expected) return 'unconfigured';
  if (!key) return 'denied';
  const a = createHash('sha256').update(key).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b) ? 'ok' : 'denied';
}

// ─── Personal invite links ───

export async function readInvites(): Promise<SurveyInvite[]> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ invitesFile(), 'utf8')) as SurveyInvite[];
  } catch {
    return [];
  }
}

async function writeInvites(invites: SurveyInvite[]): Promise<void> {
  const file = invitesFile();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  // write-then-rename so a crash never leaves a half-written file
  const tmp = `${file}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(invites, null, 2), 'utf8');
  await rename(/*turbopackIgnore: true*/ tmp, file);
}

export async function createInvite(data: { naam: string; gemeente: string; email: string }): Promise<SurveyInvite> {
  const invites = await readInvites();
  const invite: SurveyInvite = {
    id: randomUUID(),
    // 72 bits of randomness, URL-safe: not guessable, short enough to paste in an e-mail
    code: randomBytes(9).toString('base64url'),
    naam: data.naam,
    gemeente: data.gemeente,
    email: data.email,
    createdAt: new Date().toISOString(),
  };
  await writeInvites([...invites, invite]);
  return invite;
}

export async function deleteInvite(id: string): Promise<boolean> {
  const invites = await readInvites();
  const remaining = invites.filter((i) => i.id !== id);
  if (remaining.length === invites.length) return false;
  await writeInvites(remaining);
  return true;
}

export async function findInviteByCode(code: string): Promise<SurveyInvite | null> {
  const invites = await readInvites();
  const hash = (v: string) => createHash('sha256').update(v).digest();
  const wanted = hash(code);
  return invites.find((i) => timingSafeEqual(hash(i.code), wanted)) ?? null;
}

export async function findInviteById(id: string | undefined): Promise<SurveyInvite | null> {
  if (!id) return null;
  return (await readInvites()).find((i) => i.id === id) ?? null;
}

export async function markInviteMailed(id: string): Promise<boolean> {
  const invites = await readInvites();
  const invite = invites.find((i) => i.id === id);
  if (!invite) return false;
  invite.mailedAt = new Date().toISOString();
  await writeInvites(invites);
  return true;
}

// ─── Recipient list (kept out of git: personal data) ───

/**
 * The list of people to invite: a CSV with columns naam;gemeente;email
 * (header required; ";" or "," separated). Default location is inside the
 * gitignored data folder; override with SURVEY_RECIPIENTS_FILE.
 */
export function recipientsFile(): string {
  return process.env.SURVEY_RECIPIENTS_FILE || path.join(surveyDir(), 'ontvangers.csv');
}

export interface RecipientImportResult {
  file: string;
  created: number;
  alreadyInvited: number;
  invalid: { row: number; reason: string }[];
}

const EMAIL_RE = /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/;

/** Create an invite for every recipient in the list that does not have one yet (matched on e-mail). */
export async function importRecipients(): Promise<RecipientImportResult | null> {
  const file = recipientsFile();
  let text: string;
  try {
    text = await readFile(/*turbopackIgnore: true*/ file, 'utf8');
  } catch {
    return null;
  }
  // Normalise BOM and line endings: Papa picks one newline style from the first line
  const normalised = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const parsed = Papa.parse<Record<string, string>>(normalised, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''),
  });
  const pick = (row: Record<string, string>, keys: string[]) =>
    (keys.map((k) => row[k]).find((v) => v != null && String(v).trim() !== '') ?? '').toString().trim();

  const invites = await readInvites();
  const known = new Set(invites.map((i) => i.email.toLowerCase()).filter(Boolean));
  const result: RecipientImportResult = { file, created: 0, alreadyInvited: 0, invalid: [] };

  parsed.data.forEach((row, idx) => {
    const rowNumber = idx + 2; // 1-based, after the header line
    const email = pick(row, ['email', 'mail', 'emailadres', 'mailadres']).toLowerCase();
    const naam = pick(row, ['naam', 'name', 'volledigenaam']).slice(0, 120);
    const gemeente = pick(row, ['gemeente', 'gemeenteorganisatie', 'organisatie', 'municipality']).slice(0, 120);
    if (!EMAIL_RE.test(email)) return void result.invalid.push({ row: rowNumber, reason: 'ongeldig of ontbrekend e-mailadres' });
    if (!naam) return void result.invalid.push({ row: rowNumber, reason: 'naam ontbreekt' });
    if (!gemeente) return void result.invalid.push({ row: rowNumber, reason: 'gemeente ontbreekt' });
    if (known.has(email)) return void result.alreadyInvited++;
    known.add(email);
    invites.push({
      id: randomUUID(),
      code: randomBytes(9).toString('base64url'),
      naam,
      gemeente,
      email,
      createdAt: new Date().toISOString(),
      mailedAt: null,
    });
    result.created++;
  });

  if (result.created > 0) await writeInvites(invites);
  return result;
}
