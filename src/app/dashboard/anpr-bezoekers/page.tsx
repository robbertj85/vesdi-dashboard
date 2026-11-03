'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DummyBanner } from '@/components/layout/dummy-banner';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { PAGE_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useAnprTable, useAnprLookup } from '@/lib/anpr-selectors';
import {
  anprVisitsByCompanySize,
  anprVisitorTypeBySize,
  anprVisitsByProvince,
} from '@/lib/anpr-aggregate';

export default function AnprBezoekersPage() {
  const j2 = useAnprTable('J2');
  const j3 = useAnprTable('J3');
  const lookup = useAnprLookup();

  const j2Rows = j2?.rows ?? [];
  const j3Rows = j3?.rows ?? [];

  const sizeDist = useMemo(() => anprVisitsByCompanySize(j2Rows, lookup), [j2Rows, lookup]);
  const visitorBySize = useMemo(() => anprVisitorTypeBySize(j2Rows, lookup), [j2Rows, lookup]);
  const provinceDist = useMemo(() => anprVisitsByProvince(j3Rows, lookup), [j3Rows, lookup]);

  const visitorSeries = useMemo(
    () => [...new Set(visitorBySize.flatMap((d) => Object.keys(d).filter((k) => k !== 'grootte')))],
    [visitorBySize]
  );

  const hasData = j2Rows.length > 0 || j3Rows.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="ANPR Bezoekers"
          tooltip={PAGE_HELP.anprBezoekers}
          color={PAGE_COLORS.anprBezoekers.bg}
          description={PAGE_DESCRIPTIONS.anprBezoekers}
        />
        <p className="text-sm text-dmi-text/60">Geen ANPR bezoekersdata geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader
        title="ANPR Bezoekers"
        tooltip={PAGE_HELP.anprBezoekers}
        color={PAGE_COLORS.anprBezoekers.bg}
        description={PAGE_DESCRIPTIONS.anprBezoekers}
      />

      <DummyBanner tableIds={['J2', 'J3']} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor type by company size */}
        {visitorBySize.length > 0 && (
          <StackedBarAbsolute
            title="Bezoekerstype per bedrijfsgrootte"
            titleTooltip={CHART_TOOLTIPS.anprBezoekersType}
            data={visitorBySize}
            categoryKey="grootte"
            series={visitorSeries}
            colors={[...PAGE_COLORS.anprBezoekers.chartColors]}
          />
        )}

        {/* Province of origin */}
        {provinceDist.length > 0 && (
          <HorizontalBarChart
            title="Herkomst provincie"
            titleTooltip={CHART_TOOLTIPS.anprHerkomstProvincie}
            data={provinceDist.map((d) => ({ name: d.name, value: d.value }))}
            color={PAGE_COLORS.anprBezoekers.chartColors[0]}
            xLabel="Bezoeken"
          />
        )}
      </div>

      {/* Company size bar */}
      {sizeDist.length > 0 && (
        <HorizontalBarChart
          title="Bezoeken per bedrijfsgrootte"
          titleTooltip={CHART_TOOLTIPS.anprBedrijfsgrootte}
          data={sizeDist.map((d) => ({ name: d.name, value: d.value }))}
          color={PAGE_COLORS.anprBezoekers.chartColors[1]}
          xLabel="Bezoeken"
        />
      )}
    </div>
  );
}
