'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, Eye, Loader2, Send, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/info-tip';
import { ChoiceGroup, CheckboxGroup, ScaleInput } from '@/components/survey/choice-inputs';
import { useSurvey } from '@/components/survey/survey-provider';
import { DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import {
  ANPR_KANS_SCALE,
  BELEMMERINGEN,
  CAMERA_OPTIONS,
  CONTRACT_OPTIONS,
  FUNCTIES,
  SCALE,
  missingRequired,
  type Score,
  type StoredResponse,
} from '@/lib/survey';
import { withBase } from '@/lib/base-path';

const inputClass =
  'w-full h-10 rounded-lg border border-dmi-primary/20 bg-white px-3 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15';
const textareaClass =
  'w-full rounded-lg border border-dmi-primary/20 bg-white px-3 py-2 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15';

const MISSING_LABELS: Record<string, string> = {
  gemeente: 'je gemeente',
  functie: 'je functie',
  contractvraag: 'de vraag over een contract na drie jaar',
};

interface InviteInfo {
  naam: string;
  gemeente: string;
  email: string;
}

export default function EnquetePage() {
  const { items, answers, update, setRating, startWalk, submittedId, markSubmitted, reset } = useSurvey();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [previous, setPrevious] = useState<StoredResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Personal invite link? Then identity is known and earlier answers can be edited.
  useEffect(() => {
    let cancelled = false;
    fetch(withBase('/api/survey'), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { invite: InviteInfo | null; previous: StoredResponse | null } | null) => {
        if (cancelled || !data) return;
        setInvite(data.invite);
        setPrevious(data.previous);
        // Pre-fill an empty draft with the previous submission so it can be edited
        if (data.previous) {
          const prev = data.previous;
          update((a) =>
            Object.keys(a.ratings).length === 0 && !a.contract.intentie
              ? {
                  respondent: prev.respondent,
                  ratings: prev.ratings,
                  contract: prev.contract,
                  anpr: prev.anpr,
                  opmerkingen: prev.opmerkingen,
                }
              : a
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [update]);

  const ratedCount = items.filter((i) => answers.ratings[i.id]?.score != null).length;
  // Invited respondents don't type their municipality: it comes from the invite
  const effective = invite
    ? { ...answers, respondent: { ...answers.respondent, gemeente: invite.gemeente } }
    : answers;
  const missing = missingRequired(effective);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(withBase('/api/survey'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(effective),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Versturen mislukt');
      markSubmitted(data.id);
      setEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Versturen mislukt');
    } finally {
      setSending(false);
    }
  }

  const header = (
    <PageHeader
      title="Enquête"
      color={DMI_COLORS.primary}
      description={PAGE_DESCRIPTIONS.enquete}
      tooltip={PAGE_HELP.enquete}
    />
  );

  if (submittedId && !editing) {
    return (
      <div className="max-w-3xl mx-auto">
        {header}
        <Card className="p-8 items-center text-center gap-4">
          <CheckCircle2 className="w-12 h-12 text-dmi-green" />
          <h2 className="text-xl font-condensed font-bold text-dmi-primary">Bedankt voor het invullen!</h2>
          <p className="text-sm text-dmi-text/70 max-w-lg leading-relaxed">
            Je antwoorden zijn ontvangen. Ze helpen DMI en de gemeenten bepalen of een meerjarig contract
            met het CBS voor deze data de moeite waard is.
            {invite && ' Je kunt je antwoorden nog aanpassen; een nieuwe inzending vervangt de vorige.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {invite ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-dmi-primary/20 px-4 py-2 text-sm font-medium text-dmi-primary hover:bg-dmi-bg"
              >
                Antwoorden aanpassen
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-dmi-primary/20 px-4 py-2 text-sm font-medium text-dmi-primary hover:bg-dmi-bg"
              >
                Nieuwe enquête invullen (andere collega)
              </button>
            )}
            <Link
              href="/dashboard/voorblad"
              className="rounded-lg bg-dmi-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dmi-primary/90"
            >
              Terug naar het dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {header}

      {/* Why */}
      <Card className="p-6 gap-3">
        <SectionTitle as="h2" title="Waarom deze enquête?" tooltip={SECTION_TOOLTIPS.enqueteWaarom} />
        <div className="text-sm text-dmi-text/80 leading-relaxed space-y-2">
          <p>
            De VESDI-data in dit dashboard komt van het CBS. IenW en DMI overwegen om deze data in te
            kopen voor <strong>20 à 25 gemeenten</strong>, met een geschatte contractwaarde van
            <strong> ca. € 605.000</strong>. De eerste drie jaar betaalt DMI de levering; daarna beslissen
            gemeenten zelf of ze een contract met het CBS afsluiten. Dat kost naar schatting minimaal
            <strong> € 2.500 tot € 7.500 per gemeente per jaar</strong>.
          </p>
          <p>
            Met deze enquête inventariseren we of het inkopen van de VESDI-data <strong>echt nodig is, of
            eigenlijk niet</strong>: welke informatie heb je in je werk echt nodig, en zou jouw gemeente na
            die drie jaar zelf contracteren? Invullen kost ongeveer 10 minuten; je antwoorden worden
            tussentijds in deze browser bewaard.
          </p>
        </div>
        {previous && (
          <p className="text-xs rounded-lg bg-dmi-gold/10 border border-dmi-gold/40 px-3 py-2 text-dmi-text/80">
            Je hebt deze enquête op {new Date(previous.submittedAt).toLocaleDateString('nl-NL')} al ingevuld.
            Je eerdere antwoorden staan hieronder; een nieuwe inzending vervangt de vorige.
          </p>
        )}
      </Card>

      {/* 1. Respondent */}
      <Card className="p-6 gap-4">
        <SectionTitle as="h2" title="1. Over u" tooltip={SECTION_TOOLTIPS.enqueteOverU} />
        {invite ? (
          <div className="flex items-center gap-3 rounded-lg bg-dmi-primary/5 px-4 py-3">
            <UserRound className="w-5 h-5 text-dmi-primary" />
            <p className="text-sm text-dmi-text">
              Je vult de enquête in als <strong>{invite.naam}</strong>, gemeente <strong>{invite.gemeente}</strong>
              <span className="text-dmi-text/50"> (via je persoonlijke uitnodiging)</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-dmi-text">Gemeente *</span>
              <input
                className={inputClass}
                value={answers.respondent.gemeente}
                onChange={(e) => update((a) => ({ ...a, respondent: { ...a.respondent, gemeente: e.target.value } }))}
                placeholder="Bijv. Utrecht"
                maxLength={120}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-dmi-text">Naam (optioneel)</span>
              <input
                className={inputClass}
                value={answers.respondent.naam}
                onChange={(e) => update((a) => ({ ...a, respondent: { ...a.respondent, naam: e.target.value } }))}
                maxLength={120}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-dmi-text">E-mail (optioneel)</span>
              <input
                type="email"
                className={inputClass}
                value={answers.respondent.email}
                onChange={(e) => update((a) => ({ ...a, respondent: { ...a.respondent, email: e.target.value } }))}
                placeholder="Voor eventuele vervolgvragen"
                maxLength={200}
              />
            </label>
          </div>
        )}
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-dmi-text">Wat is je functie? *</span>
          <select
            className={inputClass}
            value={answers.respondent.functie}
            onChange={(e) => update((a) => ({ ...a, respondent: { ...a.respondent, functie: e.target.value } }))}
          >
            <option value="">Kies een functie…</option>
            {FUNCTIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>
      </Card>

      {/* 2. Ratings */}
      <Card className="p-6 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle as="h2" title="2. Waardering per onderdeel" tooltip={SECTION_TOOLTIPS.enqueteWaardering} />
          <span className="text-sm text-dmi-text/60">
            {ratedCount} van {items.length} beoordeeld
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-dmi-primary/10 overflow-hidden" aria-hidden>
          <div
            className="h-full bg-dmi-gold transition-all"
            style={{ width: `${items.length ? (ratedCount / items.length) * 100 : 0}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => startWalk()}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dmi-gold bg-dmi-gold/10 hover:bg-dmi-gold/20 transition-colors px-5 py-3 font-semibold text-dmi-primary"
        >
          <ClipboardCheck className="w-5 h-5 text-dmi-gold" />
          {ratedCount === 0
            ? "Start de beoordeling langs de pagina's"
            : ratedCount < items.length
              ? `Ga verder met beoordelen (${items.length - ratedCount} te gaan)`
              : 'Alle onderdelen beoordeeld – opnieuw doorlopen'}
        </button>
        <p className="text-xs text-dmi-text/50 -mt-1">
          Aanbevolen: je gaat langs elke pagina en geeft daar een cijfer, zodat je ziet wat je beoordeelt.
          Je kunt ook hieronder direct een cijfer geven.
        </p>

        <ul className="divide-y divide-dmi-primary/10">
          {items.map((item) => {
            const r = answers.ratings[item.id];
            return (
              <li key={item.id} className="py-3 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3 items-center">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-dmi-text/50">{item.title}</p>
                  <p className="text-sm font-semibold text-dmi-text leading-snug">{item.what}</p>
                  <button
                    type="button"
                    onClick={() => startWalk(item.id)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-dmi-primary/70 hover:text-dmi-primary"
                  >
                    <Eye className="w-3.5 h-3.5" /> Bekijk en beoordeel op de pagina
                  </button>
                </div>
                <ScaleInput
                  name={`Waardering ${item.title}`}
                  options={SCALE}
                  value={r?.score ?? null}
                  onChange={(v) => setRating(item.id, { score: v as Score })}
                  allowNvt
                  size="sm"
                />
              </li>
            );
          })}
        </ul>
      </Card>

      {/* 3. Contract */}
      <Card id="afronding" className="p-6 gap-4 scroll-mt-6">
        <SectionTitle as="h2" title="3. Na de eerste drie jaar" tooltip={SECTION_TOOLTIPS.enqueteContract} />
        <p className="text-sm font-medium text-dmi-text">
          De eerste drie jaar betaalt DMI de levering van deze data door het CBS. Daarna kost de data
          naar schatting minimaal <strong>€ 2.500 tot € 7.500 per gemeente per jaar</strong>. Zou jouw
          gemeente daarna zelf een contract met het CBS afsluiten om de data te blijven ontvangen? *
        </p>
        <ChoiceGroup
          name="Contract na drie jaar"
          options={CONTRACT_OPTIONS}
          value={answers.contract.intentie}
          onChange={(v) => update((a) => ({ ...a, contract: { ...a.contract, intentie: v } }))}
        />
        <label className="space-y-1.5 block">
          <span className="text-sm text-dmi-text/80">Onder welke voorwaarden, of waarom niet? (optioneel)</span>
          <textarea
            className={textareaClass}
            rows={3}
            maxLength={2000}
            value={answers.contract.toelichting}
            onChange={(e) => update((a) => ({ ...a, contract: { ...a.contract, toelichting: e.target.value } }))}
            placeholder="Bijv. budget, gedeelde inkoop met andere gemeenten, welke onderdelen onmisbaar zijn…"
          />
        </label>
      </Card>

      {/* 4. ANPR */}
      <Card className="p-6 gap-4">
        <SectionTitle as="h2" title="4. ANPR-data van je gemeente" tooltip={SECTION_TOOLTIPS.enqueteAnpr} />
        <p className="text-sm text-dmi-text/80 leading-relaxed">
          De ANPR-pagina&apos;s worden gevuld met cameradata die gemeenten aan het CBS leveren. Een deel van
          de tabellen bevat nu nog dummy-data.
        </p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-dmi-text">Heeft je gemeente ANPR-camera&apos;s (bijv. voor een milieu- of zero-emissiezone)?</p>
          <ChoiceGroup
            name="ANPR-camera's"
            options={CAMERA_OPTIONS}
            value={answers.anpr.cameras}
            onChange={(v) => update((a) => ({ ...a, anpr: { ...a.anpr, cameras: v } }))}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-dmi-text">
            Hoe groot is de kans dat je gemeente ANPR-data aan het CBS kan aanleveren om de ANPR-tabellen te vullen?
          </p>
          <ScaleInput
            name="Kans ANPR-data aanleveren"
            options={ANPR_KANS_SCALE}
            value={answers.anpr.kans}
            onChange={(v) => update((a) => ({ ...a, anpr: { ...a.anpr, kans: v === 'nvt' ? null : v } }))}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-dmi-text">Welke belemmeringen verwacht je? (meerdere mogelijk)</p>
          <CheckboxGroup
            options={BELEMMERINGEN}
            value={answers.anpr.belemmeringen}
            onChange={(v) => update((a) => ({ ...a, anpr: { ...a.anpr, belemmeringen: v } }))}
          />
        </div>
        <label className="space-y-1.5 block">
          <span className="text-sm text-dmi-text/80">Toelichting (optioneel)</span>
          <textarea
            className={textareaClass}
            rows={2}
            maxLength={2000}
            value={answers.anpr.toelichting}
            onChange={(e) => update((a) => ({ ...a, anpr: { ...a.anpr, toelichting: e.target.value } }))}
          />
        </label>
      </Card>

      {/* 5. Remarks + submit */}
      <Card className="p-6 gap-4">
        <SectionTitle as="h2" title="5. Overige opmerkingen" tooltip={SECTION_TOOLTIPS.enqueteOpmerkingen} />
        <textarea
          className={textareaClass}
          rows={3}
          maxLength={4000}
          value={answers.opmerkingen}
          onChange={(e) => update((a) => ({ ...a, opmerkingen: e.target.value }))}
          placeholder="Welke informatie mis je nog? Wat zou het dashboard waardevoller maken?"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-dmi-primary/10">
          <div className="flex-1 text-xs text-dmi-text/60">
            {missing.length > 0 ? (
              <>Nog in te vullen: {missing.map((m) => MISSING_LABELS[m] ?? m).join(', ')}.</>
            ) : ratedCount === 0 ? (
              <>Je hebt nog geen onderdelen beoordeeld. Je kunt toch versturen.</>
            ) : (
              <>Klaar om te versturen. {ratedCount} van {items.length} onderdelen beoordeeld.</>
            )}
            {error && <p role="alert" className="text-dmi-red mt-1">{error}</p>}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={missing.length > 0 || sending}
            className="flex items-center justify-center gap-2 rounded-lg bg-dmi-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-dmi-orange/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {previous || submittedId ? 'Antwoorden bijwerken' : 'Verstuur enquête'}
          </button>
        </div>
      </Card>

      <p className="text-center text-xs text-dmi-text/40">
        <Link href="/dashboard/enquete/resultaten" className="underline hover:text-dmi-text/60">
          Resultaten bekijken (alleen voor beheer)
        </Link>
      </p>
    </div>
  );
}
