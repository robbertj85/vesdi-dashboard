'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DMI_COLORS } from '@/lib/colors';
import { useVesdiStore } from '@/lib/store';
import { useFilteredZendingen, useFilteredDeelritten } from '@/hooks/use-filtered-data';
import { dataCompleteness } from '@/lib/aggregate';
import { formatNumber } from '@/lib/format';
import { municipalityName } from '@/lib/format';

const ZENDINGEN_FIELDS = [
  { key: 'jaar', label: 'Jaar' },
  { key: 'laadPC6', label: 'Laad PC6' },
  { key: 'laadPC4', label: 'Laad PC4' },
  { key: 'laadGemeente', label: 'Laad gemeente' },
  { key: 'laadNuts3', label: 'Laad NUTS3' },
  { key: 'losPC6', label: 'Los PC6' },
  { key: 'losPC4', label: 'Los PC4' },
  { key: 'losGemeente', label: 'Los gemeente' },
  { key: 'losNuts3', label: 'Los NUTS3' },
  { key: 'stadslogistieke_klasse_code', label: 'Stadslogistieke klasse' },
  { key: 'euronormKlasse', label: 'Euronorm' },
  { key: 'brandstofsoortKlasse', label: 'Brandstofsoort' },
  { key: 'laad_zone_emissiezonePC6', label: 'Laad emissiezone' },
  { key: 'los_zone_emissiezonePC6', label: 'Los emissiezone' },
  { key: 'zendingAantal', label: 'Aantal zendingen' },
  { key: 'brutoGewicht', label: 'Bruto gewicht' },
  { key: 'zendingAfstandGemiddeld', label: 'Gemiddelde afstand' },
];

const DEELRITTEN_FIELDS = [
  { key: 'jaar', label: 'Jaar' },
  { key: 'voertuigsoortRDW', label: 'Voertuigsoort' },
  { key: 'laadPC6', label: 'Laad PC6' },
  { key: 'laadPC4', label: 'Laad PC4' },
  { key: 'laadGemeente', label: 'Laad gemeente' },
  { key: 'laadNuts3', label: 'Laad NUTS3' },
  { key: 'losPC6', label: 'Los PC6' },
  { key: 'losPC4', label: 'Los PC4' },
  { key: 'losGemeente', label: 'Los gemeente' },
  { key: 'losNuts3', label: 'Los NUTS3' },
  { key: 'stadslogistieke_klasse_code', label: 'Stadslogistieke klasse' },
  { key: 'euronormKlasse', label: 'Euronorm' },
  { key: 'brandstofsoortKlasse', label: 'Brandstofsoort' },
  { key: 'laad_zone_emissiezonePC6', label: 'Laad emissiezone' },
  { key: 'los_zone_emissiezonePC6', label: 'Los emissiezone' },
  { key: 'aantalDeelritten', label: 'Aantal deelritten' },
  { key: 'aantalLegeDeelritten', label: 'Lege deelritten' },
  { key: 'brutoGewicht', label: 'Bruto gewicht' },
  { key: 'deelritAfstandGemiddeld', label: 'Gemiddelde afstand' },
  { key: 'beladingsgraadGewichtGemiddeld', label: 'Beladingsgraad' },
];

function CompletenessBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-dmi-text/70 w-36 shrink-0 truncate" title={label}>
        {label}
      </span>
      <Progress value={pct} className="flex-1 h-2" />
      <span
        className="text-xs font-medium w-10 text-right"
        style={{ color: pct === 100 ? DMI_COLORS.green : pct >= 80 ? DMI_COLORS.gold : DMI_COLORS.red }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function DataVolledigheidPage() {
  const municipality = useVesdiStore((s) => s.municipality);
  const years = useVesdiStore((s) => s.years);
  const zendingen = useFilteredZendingen();
  const deelritten = useFilteredDeelritten();

  const zendingenCompleteness = useMemo(
    () => dataCompleteness(zendingen as unknown as Record<string, unknown>[], ZENDINGEN_FIELDS.map((f) => f.key)),
    [zendingen]
  );

  const deelrittenCompleteness = useMemo(
    () => dataCompleteness(deelritten as unknown as Record<string, unknown>[], DEELRITTEN_FIELDS.map((f) => f.key)),
    [deelritten]
  );

  const avgZendingen = zendingenCompleteness.length > 0
    ? zendingenCompleteness.reduce((s, c) => s + c.completeness, 0) / zendingenCompleteness.length
    : 0;

  const avgDeelritten = deelrittenCompleteness.length > 0
    ? deelrittenCompleteness.reduce((s, c) => s + c.completeness, 0) / deelrittenCompleteness.length
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Data volledigheid"
        tooltip={PAGE_HELP.dataVolledigheid}
        color={DMI_COLORS.green}
        description="Overzicht van de datakwaliteit en volledigheid per veld in de geladen bestanden."
      />
      <FilterBar />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Gemeente"
          value={municipalityName(municipality?.name, 'Onbekend')}
          color={DMI_COLORS.green}
          tooltip={SECTION_TOOLTIPS.kpiGemeente}
        />
        <KPICard
          label="Jaren"
          value={years.join(', ') || '-'}
          color={DMI_COLORS.green}
          tooltip={SECTION_TOOLTIPS.kpiJaren}
        />
        <KPICard
          label="Zendingenrijen"
          value={formatNumber(zendingen.length)}
          color={DMI_COLORS.green}
          tooltip={SECTION_TOOLTIPS.kpiZendingenRijen}
        />
        <KPICard
          label="Deelrittenrijen"
          value={formatNumber(deelritten.length)}
          color={DMI_COLORS.green}
          tooltip={SECTION_TOOLTIPS.kpiDeelrittenRijen}
        />
      </div>

      <div data-tour="completeness" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zendingen completeness */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="Zendingen volledigheid" tooltip={SECTION_TOOLTIPS.completenessZendingen} />
            <span
              className="text-sm font-bold"
              style={{ color: avgZendingen >= 0.95 ? DMI_COLORS.green : DMI_COLORS.gold }}
            >
              {Math.round(avgZendingen * 100)}%
            </span>
          </div>
          <div className="space-y-2">
            {zendingenCompleteness.map((c, i) => (
              <CompletenessBar
                key={c.field}
                label={ZENDINGEN_FIELDS[i]?.label || c.field}
                value={c.completeness}
              />
            ))}
          </div>
        </Card>

        {/* Deelritten completeness */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="Deelritten volledigheid" tooltip={SECTION_TOOLTIPS.completenessDeelritten} />
            <span
              className="text-sm font-bold"
              style={{ color: avgDeelritten >= 0.95 ? DMI_COLORS.green : DMI_COLORS.gold }}
            >
              {Math.round(avgDeelritten * 100)}%
            </span>
          </div>
          <div className="space-y-2">
            {deelrittenCompleteness.map((c, i) => (
              <CompletenessBar
                key={c.field}
                label={DEELRITTEN_FIELDS[i]?.label || c.field}
                value={c.completeness}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
