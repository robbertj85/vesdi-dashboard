'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useVesdiStore } from '@/lib/store';
import { useNationalDeelritten } from '@/hooks/use-filtered-data';
import {
  sumDeelritKPIs,
  deelrittenPerKlasse,
  brandstofDistribution,
  gewichtsklasseDistribution,
  voertuigcategorieDistribution,
} from '@/lib/aggregate';
import { formatLargeNumber, formatPct } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, CHART_TOOLTIPS, PAGE_HELP, CHART_TOOLTIPS_EXTRA } from '@/lib/descriptions';
import dynamic from 'next/dynamic';

const PC4Choropleth = dynamic(
  () => import('@/components/maps/pc4-choropleth').then((m) => m.PC4Choropleth),
  { ssr: false, loading: () => <div className="h-[300px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function NationaleDeelrittenPage() {
  const deelritten = useNationalDeelritten();
  const lookup = useVesdiStore((s) => s.lookup);

  const kpis = useMemo(() => sumDeelritKPIs(deelritten), [deelritten]);
  const perKlasse = useMemo(() => deelrittenPerKlasse(deelritten), [deelritten]);
  const brandstof = useMemo(
    () => brandstofDistribution(deelritten, lookup?.brandstofsoort || []),
    [deelritten, lookup]
  );
  const gewicht = useMemo(
    () => gewichtsklasseDistribution(deelritten),
    [deelritten]
  );
  const voertuig = useMemo(
    () => voertuigcategorieDistribution(deelritten),
    [deelritten]
  );

  // PC4 beladingsgraad data for choropleth
  const pc4Data = useMemo(() => {
    const map = new Map<string, { trips: number; beladSum: number }>();
    for (const r of deelritten) {
      const pc4 = r.PC4LaadNL;
      if (!pc4) continue;
      const curr = map.get(pc4) || { trips: 0, beladSum: 0 };
      curr.trips += r.aantalDeelritten;
      curr.beladSum += (r.beladingsgraadGewichtGemiddeld / 100) * r.aantalDeelritten;
      map.set(pc4, curr);
    }
    return [...map.entries()].map(([pc4, v]) => ({
      pc4,
      value: v.trips > 0 ? v.beladSum / v.trips : 0,
    }));
  }, [deelritten]);

  const brandstofSeries = brandstof.map((b) => b.name);
  const brandstofData = [
    {
      category: 'Brandstof',
      ...Object.fromEntries(brandstof.map((b) => [b.name, b.value])),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Nationale deelritten"
        tooltip={PAGE_HELP.nationaleDeelritten}
        color={PAGE_COLORS.nationaleDeelritten.bg}
        description={PAGE_DESCRIPTIONS.nationaleDeelritten}
      />
      <FilterBar showEuronorm showEmissiezone />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div data-tour="kpis" className="grid grid-cols-2 gap-3">
            <KPICard
              label="Bruto gewicht"
              value={formatLargeNumber(kpis.brutoGewicht)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.brutoGewicht}
            />
            <KPICard
              label="Aantal deelritten"
              value={formatLargeNumber(kpis.aantalDeelritten)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.aantalDeelritten}
            />
          </div>
          <HorizontalBarChart
            title="Aantal deelritten per stadslogistieke klasse"
            data={perKlasse.map((k) => ({ name: k.klasse, value: k.count }))}
            color={DMI_COLORS.primary}
            titleTooltip={CHART_TOOLTIPS.stadslogistiekKlasse}
          />
        </div>

        {/* Center column */}
        <div className="space-y-4">
          <PC4Choropleth
            title="Gemiddelde beladingsgraad per laad-PC4"
            titleTooltip={CHART_TOOLTIPS_EXTRA.beladingsgraadPC4Laad}
            data={pc4Data}
            color={DMI_COLORS.primary}
            height={300}
          />
          <StackedBarAbsolute
            title="Aantal deelritten per brandstofsoort"
            data={brandstofData}
            categoryKey="category"
            series={brandstofSeries}
            colors={[DMI_COLORS.gold, DMI_COLORS.teal]}
            layout="vertical"
            titleTooltip={CHART_TOOLTIPS.brandstofsoort}
          />
        </div>

        {/* Right column - donuts */}
        <div className="space-y-4">
          <DonutChart
            title="Aantal deelritten per gewichtsklasse"
            data={gewicht}
            colors={[...PAGE_COLORS.nationaleDeelritten.chartColors]}
            titleTooltip={CHART_TOOLTIPS.gewichtsklasse}
          />
          <DonutChart
            title="Aantal deelritten per voertuigcategorie"
            data={voertuig}
            colors={[...PAGE_COLORS.nationaleDeelritten.chartColors]}
            titleTooltip={CHART_TOOLTIPS.voertuigcategorie}
          />
        </div>
      </div>

      {/* Summary table */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <KPICard
          label="Gemiddelde beladingsgraad"
          value={formatPct(Math.round(kpis.beladingsgraad * 100))}
          color={DMI_COLORS.primary}
          tooltip={KPI_TOOLTIPS.beladingsgraad}
        />
      </div>

      <DataSourceFooter />
    </div>
  );
}
