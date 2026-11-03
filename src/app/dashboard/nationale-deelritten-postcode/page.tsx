'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useNationalDeelritten } from '@/hooks/use-filtered-data';
import {
  sumDeelritKPIs,
  deelrittenPerPC4Laad,
  deelrittenPerPC4Los,
  deelrittenPerPC6Laad,
  deelrittenPerPC6Los,
  deelrittenPerKlasse,
  voertuigcategorieDistribution,
  euro6Percentage,
  legeDeelrittenPercentage,
} from '@/lib/aggregate';
import { formatLargeNumber, formatPct } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, CHART_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS, CHART_TOOLTIPS_EXTRA } from '@/lib/descriptions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const PC4BubbleMap = dynamic(
  () => import('@/components/maps/pc4-bubble-map').then((m) => m.PC4BubbleMap),
  { ssr: false, loading: () => <div className="h-[250px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function NationaleDeelrittenPostcodePage() {
  const [pcLevel, setPcLevel] = useState<'PC4' | 'PC6'>('PC4');
  const deelritten = useNationalDeelritten();

  const kpis = useMemo(() => sumDeelritKPIs(deelritten), [deelritten]);
  const laadPC4 = useMemo(
    () => pcLevel === 'PC6' ? deelrittenPerPC6Laad(deelritten) : deelrittenPerPC4Laad(deelritten),
    [deelritten, pcLevel]
  );
  const losPC4 = useMemo(
    () => pcLevel === 'PC6' ? deelrittenPerPC6Los(deelritten) : deelrittenPerPC4Los(deelritten),
    [deelritten, pcLevel]
  );
  const perKlasse = useMemo(() => deelrittenPerKlasse(deelritten), [deelritten]);
  const voertuig = useMemo(() => voertuigcategorieDistribution(deelritten), [deelritten]);
  const euro6 = useMemo(() => euro6Percentage(deelritten), [deelritten]);
  const leeg = useMemo(() => legeDeelrittenPercentage(deelritten), [deelritten]);

  const voertuigSeries = voertuig.map((v) => v.name);
  const voertuigData = [
    {
      category: 'Voertuig',
      ...Object.fromEntries(voertuig.map((v) => [v.name, v.value])),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Nationale deelritten - postcode"
        tooltip={PAGE_HELP.nationaleDeelrittenPostcode}
        color={PAGE_COLORS.nationaleDeelritten.bg}
        description={PAGE_DESCRIPTIONS.nationaleDeelrittenPostcode}
      />
      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT section */}
        <Card data-tour="postcode-input" className="p-6 border-2 border-dmi-primary/20">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle as="h2" title="INPUT" tooltip={SECTION_TOOLTIPS.inputSection} />
            <div className="flex gap-1">
              <Button
                variant={pcLevel === 'PC4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPcLevel('PC4')}
                className={pcLevel === 'PC4' ? 'bg-dmi-orange hover:bg-dmi-orange/90' : ''}
              >
                Postcode-4
              </Button>
              <Button
                variant={pcLevel === 'PC6' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPcLevel('PC6')}
                className={pcLevel === 'PC6' ? 'bg-dmi-orange hover:bg-dmi-orange/90' : ''}
              >
                Postcode-6
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <PC4BubbleMap
              bare
              title={`Aantal deelritten per laad ${pcLevel}`}
              titleTooltip={CHART_TOOLTIPS_EXTRA.pc4LaadDeelritten}
              data={laadPC4.slice(0, 50)}
              color={DMI_COLORS.primary}
              height={340}
              level={pcLevel}
            />
            <PC4BubbleMap
              bare
              title={`Aantal deelritten per los ${pcLevel}`}
              titleTooltip={CHART_TOOLTIPS_EXTRA.pc4LosDeelritten}
              data={losPC4.slice(0, 50)}
              color={DMI_COLORS.primary}
              height={340}
              level={pcLevel}
            />
          </div>
        </Card>

        {/* OUTPUT section */}
        <Card data-tour="postcode-output" className="p-6 border-2 border-dmi-primary/20">
          <SectionTitle as="h2" title="OUTPUT" tooltip={SECTION_TOOLTIPS.outputSection} className="mb-4" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <KPICard
              label="Bruto gewicht (kg)"
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
            <KPICard
              label="Euro-6 deelritten"
              value={formatPct(Math.round(euro6 * 100))}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.euro6Percentage}
            />
            <KPICard
              label="Percentage deelritten - leeg"
              value={formatPct(Math.round(leeg * 100))}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.leegPercentage}
            />
          </div>

          <HorizontalBarChart
            title="Top 3 stadslogistieke klasse"
            data={perKlasse.slice(0, 3).map((k) => ({ name: k.klasse, value: k.count }))}
            color={DMI_COLORS.primary}
            maxItems={3}
            titleTooltip={CHART_TOOLTIPS.stadslogistiekKlasse}
          />

          <div className="mt-4">
            <StackedBarAbsolute
              title="Aantal deelritten per type voertuig"
              data={voertuigData}
              categoryKey="category"
              series={voertuigSeries}
              colors={[...PAGE_COLORS.nationaleDeelritten.chartColors]}
              layout="vertical"
              titleTooltip={CHART_TOOLTIPS.voertuigcategorie}
            />
          </div>
        </Card>
      </div>

      <DataSourceFooter />
    </div>
  );
}
