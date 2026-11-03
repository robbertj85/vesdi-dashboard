'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useVesdiStore } from '@/lib/store';
import { useFilteredZendingen } from '@/hooks/use-filtered-data';
import { zendingenPerNuts3Laad, zendingenPerNuts3Los, sumKPIs } from '@/lib/aggregate';
import { formatLargeNumber } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import dynamic from 'next/dynamic';

const Nuts3Choropleth = dynamic(
  () => import('@/components/maps/nuts3-choropleth').then((m) => m.Nuts3Choropleth),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function ZendingenOverzichtPage() {
  const municipality = useVesdiStore((s) => s.municipality);
  const zendingen = useFilteredZendingen();

  const naarGemeente = useMemo(
    () => zendingenPerNuts3Laad(zendingen, municipality?.code || ''),
    [zendingen, municipality]
  );
  const vanuitGemeente = useMemo(
    () => zendingenPerNuts3Los(zendingen, municipality?.code || ''),
    [zendingen, municipality]
  );

  const kpisNaar = useMemo(() => {
    const rows = zendingen.filter((r) => r.losGemeente === municipality?.code);
    return sumKPIs(rows);
  }, [zendingen, municipality]);

  const kpisVanuit = useMemo(() => {
    const rows = zendingen.filter((r) => r.laadGemeente === municipality?.code);
    return sumKPIs(rows);
  }, [zendingen, municipality]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Overzicht zendingen"
        tooltip={PAGE_HELP.zendingenOverzicht}
        color={PAGE_COLORS.zendingen.bg}
        description={PAGE_DESCRIPTIONS.zendingenOverzicht}
      />
      <FilterBar />

      {/* KPI totals — always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="Gewicht (naar)"
          value={formatLargeNumber(kpisNaar.brutoGewicht)}
          color={DMI_COLORS.primary}
          tooltip={KPI_TOOLTIPS.brutoGewicht}
        />
        <KPICard
          label="Zendingen (naar)"
          value={formatLargeNumber(kpisNaar.zendingAantal)}
          color={DMI_COLORS.primary}
          tooltip={KPI_TOOLTIPS.zendingAantal}
        />
        <KPICard
          label="Gewicht (vanuit)"
          value={formatLargeNumber(kpisVanuit.brutoGewicht)}
          color={DMI_COLORS.teal}
          tooltip={KPI_TOOLTIPS.brutoGewicht}
        />
        <KPICard
          label="Zendingen (vanuit)"
          value={formatLargeNumber(kpisVanuit.zendingAantal)}
          color={DMI_COLORS.teal}
          tooltip={KPI_TOOLTIPS.zendingAantal}
        />
      </div>

      <div data-tour="nuts-maps" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: naar de gemeente */}
        <div className="space-y-3">
          <SectionTitle title="Percentage zendingen naar de gemeente, per NUTS3-laadlocatie" tooltip={SECTION_TOOLTIPS.nuts3NaarZendingen} />
          <Nuts3Choropleth
            data={naarGemeente}
            colorScale="teal"
            height={320}
          />
        </div>

        {/* Right: vanuit de gemeente */}
        <div className="space-y-3">
          <SectionTitle title="Percentage zendingen vanuit de gemeente, per NUTS3-loslocatie" tooltip={SECTION_TOOLTIPS.nuts3VanuitZendingen} />
          <Nuts3Choropleth
            data={vanuitGemeente}
            colorScale="teal"
            height={320}
          />
        </div>
      </div>

      <DataSourceFooter />
    </div>
  );
}
