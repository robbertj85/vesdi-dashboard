'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, CHART_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import { useNationalZendingen } from '@/hooks/use-filtered-data';
import { sumKPIs, zendingenPerKlasse } from '@/lib/aggregate';
import { formatLargeNumber } from '@/lib/format';
import dynamic from 'next/dynamic';

const PC4BubbleMap = dynamic(
  () => import('@/components/maps/pc4-bubble-map').then((m) => m.PC4BubbleMap),
  { ssr: false, loading: () => <div className="h-[300px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function NationaleZendingenPage() {
  const zendingen = useNationalZendingen();

  const kpis = useMemo(() => sumKPIs(zendingen), [zendingen]);
  const perKlasse = useMemo(() => zendingenPerKlasse(zendingen), [zendingen]);

  // PC4 data for bubble maps
  const laadPC4Data = useMemo(() => {
    const map = new Map<string, { count: number; weight: number }>();
    for (const r of zendingen) {
      if (!r.PC4LaadNL) continue;
      const curr = map.get(r.PC4LaadNL) || { count: 0, weight: 0 };
      curr.count += r.zendingAantal;
      curr.weight += r.brutoGewicht;
      map.set(r.PC4LaadNL, curr);
    }
    return [...map.entries()]
      .map(([pc4, v]) => ({ pc4, count: v.count, weight: v.weight }))
      .sort((a, b) => b.count - a.count);
  }, [zendingen]);

  const losPC4Data = useMemo(() => {
    const map = new Map<string, { count: number; weight: number }>();
    for (const r of zendingen) {
      if (!r.PC4LosNL) continue;
      const curr = map.get(r.PC4LosNL) || { count: 0, weight: 0 };
      curr.count += r.zendingAantal;
      curr.weight += r.brutoGewicht;
      map.set(r.PC4LosNL, curr);
    }
    return [...map.entries()]
      .map(([pc4, v]) => ({ pc4, count: v.count, weight: v.weight }))
      .sort((a, b) => b.count - a.count);
  }, [zendingen]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Nationale zendingen"
        tooltip={PAGE_HELP.nationaleZendingen}
        color={PAGE_COLORS.nationaleZendingen.bg}
        description={PAGE_DESCRIPTIONS.nationaleZendingen}
      />
      <FilterBar showEuronorm showEmissiezone />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Bruto gewicht"
              value={formatLargeNumber(kpis.brutoGewicht)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.brutoGewicht}
            />
            <KPICard
              label="Aantal zendingen"
              value={formatLargeNumber(kpis.zendingAantal)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.zendingAantal}
            />
          </div>
          <HorizontalBarChart
            title="Stadslogistieke klasse"
            data={perKlasse.map((k) => ({ name: k.klasse, value: k.count }))}
            color={DMI_COLORS.primary}
            xLabel="Aantal zendingen"
            titleTooltip={CHART_TOOLTIPS.stadslogistiekKlasse}
          />
        </div>

        {/* Right column - maps */}
        <div className="space-y-4">
          <PC4BubbleMap
            title="Aantal zendingen per laadlocatie"
            titleTooltip={SECTION_TOOLTIPS.pc4LaadZendingen}
            data={laadPC4Data}
            color={DMI_COLORS.primary}
            height={300}
          />
          <PC4BubbleMap
            title="Aantal zendingen per PC4 loslocatie"
            titleTooltip={SECTION_TOOLTIPS.pc4LosZendingen}
            data={losPC4Data}
            color={DMI_COLORS.primary}
            height={300}
          />
        </div>
      </div>

      <DataSourceFooter />
    </div>
  );
}
