'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useVesdiStore } from '@/lib/store';
import { useInternationalDeelritten } from '@/hooks/use-filtered-data';
import { sumDeelritKPIs } from '@/lib/aggregate';
import { formatLargeNumber } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import type { Nuts3Data } from '@/lib/types';
import dynamic from 'next/dynamic';

const Nuts3Choropleth = dynamic(
  () => import('@/components/maps/nuts3-choropleth').then((m) => m.Nuts3Choropleth),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function InternationaleDeelrittenOverzichtPage() {
  const municipality = useVesdiStore((s) => s.municipality);
  const deelritten = useInternationalDeelritten();
  const kpis = useMemo(() => sumDeelritKPIs(deelritten), [deelritten]);

  // NUTS3 aggregation for deelritten naar de gemeente (by laadNuts3)
  const naarGemeente = useMemo((): Nuts3Data[] => {
    const filtered = deelritten.filter((r) => r.losGemeente === municipality?.code);
    const map = new Map<string, number>();
    let total = 0;
    for (const r of filtered) {
      if (!r.laadNuts3) continue;
      map.set(r.laadNuts3, (map.get(r.laadNuts3) || 0) + r.aantalDeelritten);
      total += r.aantalDeelritten;
    }
    return [...map.entries()]
      .map(([nuts3, count]) => ({ nuts3, count, percentage: total > 0 ? count / total : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [deelritten, municipality]);

  // NUTS3 aggregation for deelritten vanuit de gemeente (by losNuts3)
  const vanuitGemeente = useMemo((): Nuts3Data[] => {
    const filtered = deelritten.filter((r) => r.laadGemeente === municipality?.code);
    const map = new Map<string, number>();
    let total = 0;
    for (const r of filtered) {
      if (!r.losNuts3) continue;
      map.set(r.losNuts3, (map.get(r.losNuts3) || 0) + r.aantalDeelritten);
      total += r.aantalDeelritten;
    }
    return [...map.entries()]
      .map(([nuts3, count]) => ({ nuts3, count, percentage: total > 0 ? count / total : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [deelritten, municipality]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Internationale deelritten"
        tooltip={PAGE_HELP.internationaleDeelrittenOverzicht}
        color={PAGE_COLORS.internationaleDeelritten.bg}
        description={PAGE_DESCRIPTIONS.internationaleDeelrittenOverzicht}
      />
      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: naar de gemeente */}
        <div className="space-y-4">
          <SectionTitle title="Aantal deelritten naar de gemeente per laad NUTS3" tooltip={SECTION_TOOLTIPS.nuts3NaarDeelritten} />
          <Nuts3Choropleth
            data={naarGemeente}
            colorScale="mauve"
            height={400}
            center={[50.8, 7.5]}
            zoom={5}
          />
        </div>

        {/* Right: vanuit de gemeente */}
        <div className="space-y-4">
          <SectionTitle title="Aantal deelritten vanuit de gemeente per los NUTS3" tooltip={SECTION_TOOLTIPS.nuts3VanuitDeelritten} />
          <Nuts3Choropleth
            data={vanuitGemeente}
            colorScale="mauve"
            height={400}
            center={[50.8, 7.5]}
            zoom={5}
          />
        </div>
      </div>

      {/* KPIs centered */}
      <div className="flex justify-center gap-6 mt-6">
        <KPICard
          label="Bruto gewicht"
          value={formatLargeNumber(kpis.brutoGewicht)}
          color={DMI_COLORS.mauve}
          tooltip={KPI_TOOLTIPS.brutoGewicht}
        />
        <KPICard
          label="Aantal deelritten"
          value={formatLargeNumber(kpis.aantalDeelritten)}
          color={DMI_COLORS.mauve}
          tooltip={KPI_TOOLTIPS.aantalDeelritten}
        />
      </div>

      <DataSourceFooter />
    </div>
  );
}
