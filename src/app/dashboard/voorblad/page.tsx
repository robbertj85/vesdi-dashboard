'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useVesdiStore } from '@/lib/store';
import { KPICard } from '@/components/layout/kpi-card';
import { useTour } from '@/components/tour/tour-provider';
import { anprTotalVisits } from '@/lib/anpr-aggregate';
import { DMI_COLORS } from '@/lib/colors';
import { formatLargeNumber, municipalityName } from '@/lib/format';
import { withBase } from '@/lib/base-path';

export default function VoorbladPage() {
  const municipality = useVesdiStore((s) => s.municipality);
  const heroImage = useVesdiStore((s) => s.heroImage);
  const years = useVesdiStore((s) => s.years);
  const zendingenByYear = useVesdiStore((s) => s.zendingenByYear);
  const deelrittenByYear = useVesdiStore((s) => s.deelrittenByYear);
  const anprTables = useVesdiStore((s) => s.anprTables);
  const anprYear = useVesdiStore((s) => s.anprYear);
  const tour = useTour();

  const name = municipalityName(municipality?.name);
  const sortedYears = [...years].sort((a, b) => a - b);
  const latest = years.length > 0 ? Math.max(...years) : undefined;

  // Headline figures for the most recent survey year (whole delivery, unfiltered)
  const summary = useMemo(() => {
    const zendingen = latest ? zendingenByYear.get(latest) ?? [] : [];
    const deelritten = latest ? deelrittenByYear.get(latest) ?? [] : [];
    const trips = deelritten.reduce((s, r) => s + r.aantalDeelritten, 0);
    const euro6 = deelritten.reduce((s, r) => s + (String(r.euronormKlasse) === '6' ? r.aantalDeelritten : 0), 0);
    const m1 = anprTables.get('M1');
    return {
      zendingen: zendingen.reduce((s, r) => s + r.zendingAantal, 0),
      deelritten: trips,
      euro6Pct: trips > 0 ? euro6 / trips : null,
      anprVisits: m1 ? anprTotalVisits(m1.rows) : null,
    };
  }, [latest, zendingenByYear, deelrittenByYear, anprTables]);

  const sources = [
    sortedYears.length > 0 && `Wegvervoersenquête ${sortedYears.join(', ')}`,
    summary.anprVisits !== null && `ANPR ${anprYear ?? ''}`.trim(),
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative rounded-2xl overflow-hidden bg-dmi-primary min-h-[420px] flex flex-col justify-between">
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

        <div className="relative z-10 p-8">
          <img src={withBase('/images/dmi-logo-diap.svg')} alt="DMI Ecosysteem" className="h-12 w-auto" />
        </div>

        <div className="relative z-10 p-8 space-y-3">
          <p className="text-sm font-condensed font-semibold uppercase tracking-wider text-dmi-gold">
            Stadslogistiek in beeld
          </p>
          <h1 className="text-4xl md:text-5xl font-condensed font-bold text-white leading-tight">
            {name}
          </h1>
          {sources.length > 0 && (
            <p className="text-white/80 text-sm">{sources.join(' · ')}</p>
          )}
          {heroImage && !heroImage.startsWith('data:') && (
            <p className="text-white/40 text-[11px] pt-2">Foto: Wikimedia Commons</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={`Zendingen ${latest ?? ''}`.trim()}
          value={formatLargeNumber(summary.zendingen)}
          color={DMI_COLORS.primary}
          tooltip="Totaal aantal zendingen in het zendingenbestand van het meest recente jaar (alle herkomsten en bestemmingen)."
        />
        <KPICard
          label={`Deelritten ${latest ?? ''}`.trim()}
          value={formatLargeNumber(summary.deelritten)}
          color={DMI_COLORS.primary}
          tooltip="Totaal aantal deelritten (ritten tussen twee stops) in het deelrittenbestand van het meest recente jaar."
        />
        <KPICard
          label="Aandeel Euro-6 ritten"
          value={summary.euro6Pct === null ? '–' : `${Math.round(summary.euro6Pct * 100)}%`}
          color={DMI_COLORS.green}
          tooltip="Aandeel deelritten in het meest recente jaar uitgevoerd met een Euro-6 vrachtwagen."
        />
        <KPICard
          label={`ANPR-bezoeken ${anprYear ?? ''}`.trim()}
          value={summary.anprVisits === null ? '–' : formatLargeNumber(summary.anprVisits)}
          color={DMI_COLORS.orange}
          tooltip="Aantal door ANPR-camera's geregistreerde bezoeken van bestel- en vrachtwagens aan de gemeente."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => tour.start()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dmi-gold bg-dmi-gold/10 hover:bg-dmi-gold/20 transition-colors px-5 py-3 font-semibold text-dmi-primary"
        >
          <GraduationCap className="w-5 h-5 text-dmi-gold" />
          Start de rondleiding
        </button>
        <Link
          href="/dashboard/introductie"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dmi-primary hover:bg-dmi-primary/90 transition-colors px-5 py-3 font-semibold text-white"
        >
          Lees de introductie
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard/enquete"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dmi-primary/20 bg-white hover:bg-dmi-primary/5 transition-colors px-5 py-3 font-semibold text-dmi-primary"
        >
          <ClipboardCheck className="w-5 h-5" />
          Vul de enquête in
        </Link>
      </div>
    </div>
  );
}
