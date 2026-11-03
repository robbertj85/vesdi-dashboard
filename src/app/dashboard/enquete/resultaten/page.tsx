'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Download, FileUp, Globe, KeyRound, Loader2, Mail, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TEMPLATE,
  MAILTO_SAFE_LENGTH,
  mailtoUrl,
  outlookWebUrl,
  type EmailTemplate,
  type Recipient,
} from '@/components/survey/invite-email';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/info-tip';
import { DMI_COLORS } from '@/lib/colors';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { SCALE, type SurveySummary } from '@/lib/survey';

const KEY_STORAGE = 'vesdi-survey-admin-key';

/** Diverging 1–5: mauve (negative) → neutral grey → teal (positive). */
const LIKERT_COLORS = ['#AE576F', '#D9A3B3', '#C9CDD2', '#93D0BE', '#2E8F72'];

interface InviteRow {
  id: string;
  naam: string;
  gemeente: string;
  email: string;
  createdAt: string;
  mailedAt: string | null;
  link: string;
  respondedAt: string | null;
}

function readKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export default function EnqueteResultatenPage() {
  const [key, setKey] = useState(readKey);
  const [keyInput, setKeyInput] = useState('');
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const api = useCallback(
    (url: string, init?: RequestInit) =>
      fetch(url, { ...init, headers: { ...init?.headers, 'x-admin-key': key, 'Content-Type': 'application/json' }, cache: 'no-store' }),
    [key]
  );

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const [s, i] = await Promise.all([api('/api/survey/results'), api('/api/survey/invites')]);
      if (!s.ok) {
        const data = await s.json().catch(() => ({}));
        throw new Error(data.error || `Fout ${s.status}`);
      }
      setSummary(await s.json());
      setInvites(i.ok ? await i.json() : []);
      try {
        sessionStorage.setItem(KEY_STORAGE, key);
      } catch {
        // per-tab convenience only
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden mislukt');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [api, key]);

  useEffect(() => {
    // Fetch once a key is known; state is only set in the async callbacks
    if (key) void Promise.resolve().then(load);
  }, [key, load]);

  async function downloadCsv() {
    const res = await api('/api/survey/results?format=csv');
    if (!res.ok) return setError('Download mislukt');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vesdi-enquete-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const header = (
    <PageHeader
      title="Enquête – resultaten"
      color={DMI_COLORS.primary}
      description="Samenvatting van alle ingevulde enquêtes en beheer van persoonlijke uitnodigingslinks."
    />
  );

  if (!key || (!summary && error)) {
    return (
      <div className="max-w-md mx-auto">
        {header}
        <Card className="p-6 gap-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-dmi-primary" />
            <h2 className="font-condensed font-bold text-dmi-primary">Beheerderssleutel</h2>
          </div>
          <p className="text-sm text-dmi-text/70">
            De resultaten zijn alleen zichtbaar voor DMI. Vul de beheerderssleutel in
            (<code className="text-xs">SURVEY_ADMIN_KEY</code> op de server).
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setKey(keyInput.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoFocus
              className="flex-1 h-10 rounded-lg border border-dmi-primary/20 px-3 text-sm outline-none focus:border-dmi-primary"
            />
            <button className="rounded-lg bg-dmi-primary px-4 text-sm font-semibold text-white">Openen</button>
          </form>
          {error && <p role="alert" className="text-sm text-dmi-red">{error}</p>}
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-5xl mx-auto">
        {header}
        <div className="flex items-center gap-2 text-sm text-dmi-text/60">
          <Loader2 className="w-4 h-4 animate-spin" /> Resultaten laden…
        </div>
      </div>
    );
  }

  const contractTotal = summary.contract.reduce((s, c) => s + c.count, 0);
  const positive = summary.contract
    .filter((c) => c.value === 'zeker-wel' || c.value === 'waarschijnlijk-wel')
    .reduce((s, c) => s + c.count, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {header}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-dmi-primary/20 px-3 py-2 text-sm font-medium text-dmi-primary hover:bg-white"
        >
          {loading ? 'Vernieuwen…' : 'Vernieuwen'}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          className="flex items-center gap-1.5 rounded-lg bg-dmi-primary px-3 py-2 text-sm font-semibold text-white hover:bg-dmi-primary/90"
        >
          <Download className="w-4 h-4" /> Download alle antwoorden (CSV)
        </button>
        <Link href="/dashboard/enquete" className="ml-auto text-sm text-dmi-primary/70 hover:text-dmi-primary underline">
          Naar de enquête
        </Link>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Ingevulde enquêtes" value={String(summary.total)} sub={`${summary.gemeenten.length} gemeente(n)`} />
        <Stat
          label="Zou zelf contracteren"
          value={contractTotal ? `${Math.round((positive / contractTotal) * 100)}%` : '–'}
          sub={`${positive} van ${contractTotal} (zeker of waarschijnlijk)`}
        />
        <Stat
          label="Kans ANPR-data aanleveren"
          value={summary.anprKans.average === null ? '–' : summary.anprKans.average.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
          sub={`gemiddeld op 1–5, n = ${summary.anprKans.rated}`}
        />
      </div>

      {/* Ratings per item */}
      <Card className="p-6 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle as="h2" title="Waardering per onderdeel" tooltip={SECTION_TOOLTIPS.resultatenOverzicht} />
          <LikertLegend />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-dmi-text/50 border-b border-dmi-primary/10">
              <th className="py-2 font-medium">Onderdeel</th>
              <th className="py-2 font-medium text-right w-16">Gem.</th>
              <th className="py-2 font-medium text-right w-12">n</th>
              <th className="py-2 font-medium pl-4 w-[40%]">Verdeling</th>
            </tr>
          </thead>
          <tbody>
            {[...summary.items]
              .sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
              .map((item) => (
                <tr key={item.id} className="border-b border-dmi-primary/5 align-top">
                  <td className="py-2.5 pr-3">
                    <span className="text-dmi-text">{item.title}</span>
                    {item.comments.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-dmi-primary/70 cursor-pointer">
                          {item.comments.length} toelichting(en)
                        </summary>
                        <ul className="mt-1 space-y-1 text-xs text-dmi-text/70 list-disc pl-4">
                          {item.comments.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-dmi-text tabular-nums">
                    {item.average === null ? '–' : item.average.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2.5 text-right text-dmi-text/60 tabular-nums">
                    {item.rated}
                    {item.nvt > 0 && <span className="block text-[10px]">+{item.nvt} n.v.t.</span>}
                  </td>
                  <td className="py-2.5 pl-4">
                    <LikertBar distribution={item.distribution} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 gap-4">
          <h2 className="text-lg font-bold text-dmi-primary">Contract na drie jaar</h2>
          <CountBars rows={summary.contract} />
        </Card>
        <Card className="p-6 gap-4">
          <h2 className="text-lg font-bold text-dmi-primary">ANPR</h2>
          <p className="text-xs font-medium text-dmi-text/60">Heeft de gemeente ANPR-camera&apos;s?</p>
          <CountBars rows={summary.cameras} />
          <p className="text-xs font-medium text-dmi-text/60 pt-2">Verwachte belemmeringen</p>
          <CountBars rows={[...summary.belemmeringen].sort((a, b) => b.count - a.count)} />
        </Card>
      </div>

      <Card className="p-6 gap-3">
        <h2 className="text-lg font-bold text-dmi-primary">Respondenten</h2>
        <div className="flex flex-wrap gap-2">
          {summary.gemeenten.map((g) => (
            <span key={g.name} className="rounded-full bg-dmi-primary/8 px-3 py-1 text-xs text-dmi-text">
              {g.name} <span className="text-dmi-text/50">({g.count})</span>
            </span>
          ))}
          {summary.gemeenten.length === 0 && <span className="text-sm text-dmi-text/50">Nog geen reacties.</span>}
        </div>
        {summary.anonymous > 0 && (
          <p className="text-xs text-dmi-text/50">
            {summary.anonymous} reactie(s) kwamen binnen via de gedeelde login in plaats van een persoonlijke link.
          </p>
        )}
      </Card>

      <InvitesCard invites={invites} api={api} onChange={load} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4 gap-1">
      <p className="text-xs text-dmi-text/60">{label}</p>
      <p className="text-2xl font-bold text-dmi-primary tabular-nums">{value}</p>
      <p className="text-xs text-dmi-text/50">{sub}</p>
    </Card>
  );
}

function LikertLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-dmi-text/70">
      {SCALE.map((s, i) => (
        <span key={s.value} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LIKERT_COLORS[i] }} />
          {s.value} {s.label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

/** One horizontal bar split into the 1..5 shares, with a hover title per segment. */
function LikertBar({ distribution }: { distribution: number[] }) {
  const total = distribution.reduce((s, c) => s + c, 0);
  if (total === 0) return <span className="text-xs text-dmi-text/40">geen cijfers</span>;
  return (
    <div className="flex h-4 w-full gap-[2px]" role="img" aria-label={distribution.map((c, i) => `${i + 1}: ${c}`).join(', ')}>
      {distribution.map((c, i) =>
        c > 0 ? (
          <div
            key={i}
            title={`${SCALE[i].value} – ${SCALE[i].label}: ${c} (${Math.round((c / total) * 100)}%)`}
            className="h-full first:rounded-l last:rounded-r"
            style={{ width: `${(c / total) * 100}%`, backgroundColor: LIKERT_COLORS[i] }}
          />
        ) : null
      )}
    </div>
  );
}

function CountBars({ rows }: { rows: { value: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.value} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_2rem] items-center gap-3 text-sm">
          <span className="text-dmi-text/80 truncate" title={r.label}>{r.label}</span>
          <div className="h-3 rounded-r bg-dmi-primary/5">
            <div className="h-full rounded-r bg-dmi-primary" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums text-dmi-text">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

const TEMPLATE_STORAGE = 'vesdi-survey-email-template';

function readTemplate(): EmailTemplate {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE);
    if (raw) return { ...DEFAULT_TEMPLATE, ...(JSON.parse(raw) as Partial<EmailTemplate>) };
  } catch {
    // per-browser convenience only
  }
  return DEFAULT_TEMPLATE;
}

function InvitesCard({
  invites,
  api,
  onChange,
}: {
  invites: InviteRow[];
  api: (url: string, init?: RequestInit) => Promise<Response>;
  onChange: () => void;
}) {
  const [form, setForm] = useState({ naam: '', gemeente: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [template, setTemplate] = useState<EmailTemplate>(readTemplate);

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE, JSON.stringify(template));
    } catch {
      // ignore
    }
  }, [template]);

  /** Open a pre-filled new message in the mail app (Outlook) and remember it was mailed. */
  async function compose(r: Recipient & { id: string }, via: 'mailto' | 'web' = 'mailto') {
    if (!r.email) {
      setError(`Geen e-mailadres bekend voor ${r.naam}.`);
      return;
    }
    if (via === 'mailto') {
      const url = mailtoUrl(template, r);
      if (url.length > MAILTO_SAFE_LENGTH) {
        setError('De e-mailtekst is te lang voor Outlook; maak hem korter of gebruik "Outlook web".');
        return;
      }
      window.location.href = url;
    } else {
      window.open(outlookWebUrl(template, r), '_blank', 'noopener');
    }
    await api(`/api/survey/invites?id=${encodeURIComponent(r.id)}`, { method: 'PATCH' });
    onChange();
  }

  async function create(e: React.FormEvent, thenCompose: boolean) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api('/api/survey/invites', { method: 'POST', body: JSON.stringify(form) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Aanmaken mislukt');
    const created = { id: data.id as string, link: data.link as string, ...form };
    setForm({ naam: '', gemeente: '', email: '' });
    if (thenCompose && created.email) await compose(created);
    else onChange();
  }

  async function importList() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await api('/api/survey/invites', { method: 'POST', body: JSON.stringify({ action: 'import' }) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Importeren mislukt');
    const invalid = (data.invalid ?? []) as { row: number; reason: string }[];
    setNotice(
      `${data.created} nieuwe uitnodiging(en) aangemaakt, ${data.alreadyInvited} stonden er al.` +
        (invalid.length ? ` Overgeslagen: ${invalid.map((i) => `regel ${i.row} (${i.reason})`).join(', ')}.` : '')
    );
    onChange();
  }

  async function revoke(id: string) {
    const invite = invites.find((i) => i.id === id);
    if (!window.confirm(`Uitnodiging van ${invite?.naam ?? 'deze persoon'} intrekken? De link werkt daarna niet meer.`)) return;
    await api(`/api/survey/invites?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    onChange();
  }

  async function copy(link: string, id: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError('Kopiëren mislukt; selecteer de link handmatig.');
    }
  }

  const responded = invites.filter((i) => i.respondedAt).length;
  const toMail = invites.filter((i) => i.email && !i.mailedAt && !i.respondedAt);
  const nextUp = toMail[0];

  return (
    <Card className="p-6 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle as="h2" title="Persoonlijke uitnodigingen" tooltip={SECTION_TOOLTIPS.resultatenUitnodigingen} />
        <span className="text-sm text-dmi-text/60">
          {invites.length} uitnodigingen · {invites.filter((i) => i.mailedAt).length} gemaild · {responded} ingevuld
        </span>
      </div>

      {/* Workflow: import the list, then send one e-mail at a time */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={importList}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-dmi-primary/20 px-3 py-2 text-sm font-medium text-dmi-primary hover:bg-dmi-bg disabled:opacity-40"
        >
          <FileUp className="w-4 h-4" /> Importeer ontvangerslijst
        </button>
        <button
          type="button"
          onClick={() => nextUp && compose(nextUp)}
          disabled={!nextUp}
          className="flex items-center gap-1.5 rounded-lg bg-dmi-orange px-4 py-2 text-sm font-semibold text-white hover:bg-dmi-orange/90 disabled:opacity-40"
        >
          <Mail className="w-4 h-4" />
          {nextUp ? `Volgende e-mail opstellen: ${nextUp.naam} (${toMail.length} te gaan)` : 'Iedereen is gemaild'}
        </button>
      </div>
      <p className="text-xs text-dmi-text/50 -mt-2">
        De ontvangerslijst is een CSV met de kolommen <code>naam;gemeente;email</code> in{' '}
        <code>data/survey/ontvangers.csv</code> (staat niet in git). Een e-mail opent als nieuw bericht in
        Outlook; je controleert en verstuurt hem zelf.
      </p>
      {notice && <p className="text-sm rounded-lg bg-dmi-green/10 px-3 py-2 text-dmi-text">{notice}</p>}
      {error && <p role="alert" className="text-sm text-dmi-red">{error}</p>}

      <details className="rounded-lg border border-dmi-primary/10 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-dmi-primary">E-mailtekst bekijken of aanpassen</summary>
        <div className="mt-3 space-y-2">
          <p className="text-xs text-dmi-text/60">
            Gebruik <code>{'{naam}'}</code>, <code>{'{gemeente}'}</code> en <code>{'{link}'}</code>; die worden per ontvanger ingevuld.
            Je aanpassingen worden in deze browser bewaard.
          </p>
          <input
            value={template.subject}
            onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
            aria-label="Onderwerp"
            className="w-full h-10 rounded-lg border border-dmi-primary/20 px-3 text-sm outline-none focus:border-dmi-primary"
          />
          <textarea
            value={template.body}
            onChange={(e) => setTemplate({ ...template, body: e.target.value })}
            aria-label="Tekst"
            rows={14}
            className="w-full rounded-lg border border-dmi-primary/20 px-3 py-2 text-sm font-mono outline-none focus:border-dmi-primary"
          />
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_TEMPLATE)}
            className="text-xs text-dmi-primary/70 hover:text-dmi-primary underline"
          >
            Standaardtekst herstellen
          </button>
        </div>
      </details>

      <form onSubmit={(e) => create(e, true)} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2">
        {(['naam', 'gemeente', 'email'] as const).map((f) => (
          <input
            key={f}
            type={f === 'email' ? 'email' : 'text'}
            value={form[f]}
            onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            placeholder={f === 'naam' ? 'Naam *' : f === 'gemeente' ? 'Gemeente *' : 'E-mail'}
            className="h-10 rounded-lg border border-dmi-primary/20 px-3 text-sm outline-none focus:border-dmi-primary"
            maxLength={f === 'email' ? 200 : 120}
          />
        ))}
        <button
          type="button"
          onClick={(e) => create(e, false)}
          disabled={busy || !form.naam.trim() || !form.gemeente.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dmi-primary/20 px-3 h-10 text-sm font-medium text-dmi-primary disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" /> Alleen link
        </button>
        <button
          disabled={busy || !form.naam.trim() || !form.gemeente.trim() || !form.email.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-dmi-primary px-4 h-10 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Mail className="w-4 h-4" /> Aanmaken + mail
        </button>
      </form>

      {invites.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-dmi-text/50 border-b border-dmi-primary/10">
              <th className="py-2 font-medium">Naam</th>
              <th className="py-2 font-medium">Gemeente</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.id} className={cn('border-b border-dmi-primary/5', nextUp?.id === i.id && 'bg-dmi-orange/5')}>
                <td className="py-2">
                  {i.naam}
                  {i.email && <span className="block text-xs text-dmi-text/50">{i.email}</span>}
                </td>
                <td className="py-2 text-dmi-text/80">{i.gemeente}</td>
                <td className="py-2 text-xs">
                  {i.respondedAt ? (
                    <span className="inline-flex items-center gap-1 font-medium text-dmi-green">
                      <Check className="w-3.5 h-3.5" /> ingevuld {new Date(i.respondedAt).toLocaleDateString('nl-NL')}
                    </span>
                  ) : i.mailedAt ? (
                    <span className="text-dmi-primary/80">gemaild {new Date(i.mailedAt).toLocaleDateString('nl-NL')}</span>
                  ) : (
                    <span className="text-dmi-text/50">nog niet gemaild</span>
                  )}
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => compose(i)}
                      disabled={!i.email}
                      title={i.email ? 'Open een nieuw bericht in Outlook' : 'Geen e-mailadres'}
                      className="inline-flex items-center gap-1 rounded-md bg-dmi-primary px-2 py-1 text-xs font-medium text-white hover:bg-dmi-primary/90 disabled:opacity-30"
                    >
                      <Mail className="w-3.5 h-3.5" /> Mail opstellen
                    </button>
                    <button
                      type="button"
                      onClick={() => compose(i, 'web')}
                      disabled={!i.email}
                      title="Opstellen in Outlook op het web"
                      aria-label={`Mail aan ${i.naam} opstellen in Outlook op het web`}
                      className="rounded-md border border-dmi-primary/15 p-1.5 text-dmi-primary hover:bg-dmi-bg disabled:opacity-30"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(i.link, i.id)}
                      title="Link kopiëren"
                      aria-label={`Link van ${i.naam} kopiëren`}
                      className="rounded-md border border-dmi-primary/15 p-1.5 text-dmi-primary hover:bg-dmi-bg"
                    >
                      {copied === i.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => revoke(i.id)}
                      title="Link intrekken"
                      aria-label={`Uitnodiging van ${i.naam} intrekken`}
                      className="rounded-md p-1.5 text-dmi-red/70 hover:text-dmi-red hover:bg-dmi-red/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
