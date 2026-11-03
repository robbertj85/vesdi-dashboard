'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DummyBanner } from '@/components/layout/dummy-banner';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { DataTable } from '@/components/charts/data-table';
import { PAGE_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useAnprTable, useAnprLookup } from '@/lib/anpr-selectors';
import {
  anprVisitsBySbi,
  anprVisitorTypeBySbi,
  anprQuarterlySbiBySize,
} from '@/lib/anpr-aggregate';
import { formatLargeNumber } from '@/lib/format';

export default function AnprBedrijvenPage() {
  const m2 = useAnprTable('M2');
  const j1 = useAnprTable('J1');
  const k1 = useAnprTable('K1');
  const lookup = useAnprLookup();

  // Use M2 for SBI overview (monthly data, more detail), fall back to J1
  const sbiRows = m2?.rows ?? j1?.rows ?? [];
  const j1Rows = j1?.rows ?? [];
  const k1Rows = k1?.rows ?? [];

  const sbiDistribution = useMemo(() => anprVisitsBySbi(sbiRows, lookup), [sbiRows, lookup]);
  const visitorBySbi = useMemo(() => anprVisitorTypeBySbi(j1Rows, lookup), [j1Rows, lookup]);
  const quarterlyBySize = useMemo(() => anprQuarterlySbiBySize(k1Rows, lookup), [k1Rows, lookup]);

  const visitorSeries = useMemo(
    () => [...new Set(visitorBySbi.flatMap((d) => Object.keys(d).filter((k) => k !== 'sbi')))],
    [visitorBySbi]
  );

  const sizeSeries = useMemo(
    () => [...new Set(quarterlyBySize.flatMap((d) => Object.keys(d).filter((k) => k !== 'periode')))],
    [quarterlyBySize]
  );

  const hasData = sbiRows.length > 0 || j1Rows.length > 0 || k1Rows.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="ANPR Bedrijfstakken"
          tooltip={PAGE_HELP.anprBedrijven}
          color={PAGE_COLORS.anprBedrijven.bg}
          description={PAGE_DESCRIPTIONS.anprBedrijven}
        />
        <p className="text-sm text-dmi-text/60">Geen ANPR bedrijfstak-data geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader
        title="ANPR Bedrijfstakken"
        tooltip={PAGE_HELP.anprBedrijven}
        color={PAGE_COLORS.anprBedrijven.bg}
        description={PAGE_DESCRIPTIONS.anprBedrijven}
      />

      <DummyBanner tableIds={['M2', 'J1', 'K1']} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SBI industry bar chart */}
        <HorizontalBarChart
          title="Bezoeken per bedrijfstak (SBI)"
          titleTooltip={CHART_TOOLTIPS.anprSbiGroep}
          data={sbiDistribution.map((d) => ({ name: d.name, value: d.value }))}
          color={PAGE_COLORS.anprBedrijven.chartColors[0]}
          xLabel="Bezoeken"
        />

        {/* Visitor type by SBI */}
        {visitorBySbi.length > 0 && (
          <StackedBarAbsolute
            title="Bezoekerstype per bedrijfstak"
            titleTooltip={CHART_TOOLTIPS.anprBezoekersType}
            data={visitorBySbi}
            categoryKey="sbi"
            series={visitorSeries}
            colors={[...PAGE_COLORS.anprBedrijven.chartColors]}
            layout="vertical"
          />
        )}
      </div>

      {/* Quarterly by company size */}
      {quarterlyBySize.length > 0 && (
        <StackedBarAbsolute
          title="Kwartaal bezoeken per bedrijfsgrootte"
          titleTooltip={CHART_TOOLTIPS.anprBedrijfsgrootte}
          data={quarterlyBySize}
          categoryKey="periode"
          series={sizeSeries}
          colors={[...PAGE_COLORS.anprBedrijven.chartColors]}
        />
      )}

      {/* Summary table */}
      <DataTable
        title="Bezoeken per bedrijfstak"
        titleTooltip="Totaal aantal bezoeken per bedrijfstak (SBI-groep) van de voertuigeigenaar."
        data={sbiDistribution.map((d) => ({
          bedrijfstak: d.name,
          bezoeken: d.value,
        }))}
        columns={[
          { key: 'bedrijfstak', label: 'Bedrijfstak' },
          { key: 'bezoeken', label: 'Bezoeken', format: (v) => formatLargeNumber(Number(v)) },
        ]}
        accentColor={PAGE_COLORS.anprBedrijven.bg}
      />
    </div>
  );
}
