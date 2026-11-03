'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { DualAxisLineChart } from '@/components/charts/dual-axis-line-chart';
import { PercentageLineChart } from '@/components/charts/percentage-line-chart';
import { DataTable } from '@/components/charts/data-table';
import { StackedBar100 } from '@/components/charts/stacked-bar-100';
import { GroupedBarChart } from '@/components/charts/grouped-bar-chart';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useVesdiStore } from '@/lib/store';
import {
  trendDeelrittenKms,
  trendEuro6Percentage,
  trendZendingenGewicht,
  beladingsgraadPerKlasse,
  voertuigTypePerYear,
  deelrittenPerKlassePerYear,
} from '@/lib/aggregate';
import { formatPct } from '@/lib/format';

export default function TrendsPage() {
  const zendingenByYear = useVesdiStore((s) => s.zendingenByYear);
  const deelrittenByYear = useVesdiStore((s) => s.deelrittenByYear);
  const municipality = useVesdiStore((s) => s.municipality);
  const years = useVesdiStore((s) => s.years);

  const deelrittenKms = useMemo(
    () => trendDeelrittenKms(deelrittenByYear, municipality?.code || ''),
    [deelrittenByYear, municipality]
  );

  const euro6 = useMemo(
    () => trendEuro6Percentage(deelrittenByYear),
    [deelrittenByYear]
  );

  const zendingenGewicht = useMemo(
    () => trendZendingenGewicht(zendingenByYear),
    [zendingenByYear]
  );

  const beladingsgraad = useMemo(
    () => beladingsgraadPerKlasse(deelrittenByYear),
    [deelrittenByYear]
  );

  const voertuigTypes = useMemo(
    () => voertuigTypePerYear(deelrittenByYear),
    [deelrittenByYear]
  );

  const deelrittenKlasse = useMemo(
    () => deelrittenPerKlassePerYear(deelrittenByYear),
    [deelrittenByYear]
  );

  // Get all vehicle type keys
  const voertuigKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of voertuigTypes) {
      for (const key of Object.keys(entry)) {
        if (key !== 'year') keys.add(key);
      }
    }
    return [...keys];
  }, [voertuigTypes]);

  // Build total row for beladingsgraad (excluding lege ritten, consistent with CBS methodology)
  const beladingsgraadTotal = useMemo(() => {
    const total: Record<string, string | number> = { klasse: 'Totaal' };
    for (const year of years) {
      const rows = deelrittenByYear.get(year) || [];
      const national = rows.filter(
        (r) => r.isNational && r.stadslogistieke_klasse !== '***Lege_rit***'
      );
      const totalTrips = national.reduce((s, r) => s + r.aantalDeelritten, 0);
      const weightedSum = national.reduce(
        (s, r) => s + (r.beladingsgraadGewichtGemiddeld / 100) * r.aantalDeelritten,
        0
      );
      total[String(year)] = totalTrips > 0 ? Math.round((weightedSum / totalTrips) * 100) : 0;
    }
    return total;
  }, [deelrittenByYear, years]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Trends" tooltip={PAGE_HELP.trends} color={PAGE_COLORS.trends.bg} description={PAGE_DESCRIPTIONS.trends}>
        <span className="bg-dmi-orange text-white px-3 py-1 rounded-full text-sm font-medium">
          {years.join(', ')}
        </span>
      </PageHeader>

      <div data-tour="trend-charts" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <DualAxisLineChart
          title="Aantal deelritten en kms intra-gemeente logistiek"
          data={deelrittenKms}
          line1Label="Aantal deelritten"
          line2Label="Kms binnen gemeente"
          line1Color={DMI_COLORS.orange}
          line2Color={DMI_COLORS.orange}
          titleTooltip={CHART_TOOLTIPS.trendDeelrittenKms}
        />

        <PercentageLineChart
          title="Percentage aantal deelritten Euro-6 voertuigen"
          data={euro6}
          color={DMI_COLORS.orange}
          titleTooltip={CHART_TOOLTIPS.trendEuro6}
        />

        <DualAxisLineChart
          title="Aantal zendingen en bijbehorend gewicht"
          data={zendingenGewicht}
          line1Label="Aantal zendingen"
          line2Label="Bruto gewicht"
          line1Color={DMI_COLORS.orange}
          line2Color={DMI_COLORS.orange}
          titleTooltip={CHART_TOOLTIPS.trendZendingenGewicht}
        />

        {/* Row 2 */}
        <DataTable
          title="Beladingsgraad stadslogistieke klasse top 10"
          data={beladingsgraad}
          columns={[
            { key: 'klasse', label: 'Stadslogistieke klasse' },
            ...years.map((y) => ({
              key: String(y),
              label: String(y),
              format: (v: number | string) => formatPct(Number(v)),
            })),
          ]}
          accentColor={DMI_COLORS.orange}
          totalRow={beladingsgraadTotal}
          titleTooltip={CHART_TOOLTIPS.beladingsgraadKlasse}
        />

        <StackedBar100
          title="Percentage aantal deelritten per type voertuig"
          data={voertuigTypes}
          categoryKey="year"
          series={voertuigKeys}
          titleTooltip={CHART_TOOLTIPS.voertuigTypePerYear}
        />

        <GroupedBarChart
          title="Aantal deelritten per stadslogistieke klasse"
          data={deelrittenKlasse}
          years={years}
          titleTooltip={CHART_TOOLTIPS.deelrittenPerKlasse}
        />
      </div>

      <DataSourceFooter />
    </div>
  );
}
