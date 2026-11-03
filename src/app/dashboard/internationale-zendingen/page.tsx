'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useInternationalZendingen } from '@/hooks/use-filtered-data';
import {
  sumKPIs,
  zendingenPerKlasse,
  internationalPerCountry,
  importExportPercentage,
  emissiezoneDistribution,
} from '@/lib/aggregate';
import { formatLargeNumber, formatPct } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, CHART_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatAxisTick } from '@/lib/format';

export default function InternationaleZendingenPage() {
  const zendingen = useInternationalZendingen();

  const kpis = useMemo(() => sumKPIs(zendingen), [zendingen]);
  const perKlasse = useMemo(() => zendingenPerKlasse(zendingen), [zendingen]);
  const perCountry = useMemo(() => internationalPerCountry(zendingen), [zendingen]);
  const impExp = useMemo(() => importExportPercentage(zendingen), [zendingen]);
  const laadEZ = useMemo(
    () => emissiezoneDistribution(zendingen, 'laad_zone_emissiezonePC6'),
    [zendingen]
  );
  const losEZ = useMemo(
    () => emissiezoneDistribution(zendingen, 'los_zone_emissiezonePC6'),
    [zendingen]
  );


  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Internationale zendingen"
        tooltip={PAGE_HELP.internationaleZendingen}
        color={PAGE_COLORS.internationaleZendingen.bg}
        description={PAGE_DESCRIPTIONS.internationaleZendingen}
      />
      <FilterBar showEuronorm showHandelsrichting />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Percentage import"
              value={formatPct(Math.round(impExp.importPct * 100))}
              color={DMI_COLORS.green}
              tooltip={KPI_TOOLTIPS.importPercentage}
            />
            <KPICard
              label="Percentage export"
              value={formatPct(Math.round(impExp.exportPct * 100))}
              color={DMI_COLORS.green}
              tooltip={KPI_TOOLTIPS.exportPercentage}
            />
          </div>

          {/* Country bar chart */}
          <Card className="p-4">
            <SectionTitle title="Import/export per handelsland" tooltip={SECTION_TOOLTIPS.importExportLand} className="mb-3" />
            <ResponsiveContainer width="100%" height={Math.max(200, perCountry.length * 28 + 40)}>
              <BarChart data={perCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" horizontal={false} />
                <XAxis type="number" tickFormatter={formatAxisTick} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [(v as number).toLocaleString('nl-NL')]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="geladenAantal" name="Geladen" fill={DMI_COLORS.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="gelostAantal" name="Gelost" fill={DMI_COLORS.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Center column */}
        <div className="space-y-4">
          <HorizontalBarChart
            title="Stadslogistieke klasse"
            data={perKlasse.map((k) => ({ name: k.klasse, value: k.count }))}
            color={DMI_COLORS.green}
            xLabel="Aantal zendingen"
            titleTooltip={CHART_TOOLTIPS.stadslogistiekKlasse}
          />
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Bruto gewicht"
              value={formatLargeNumber(kpis.brutoGewicht)}
              color={DMI_COLORS.green}
              tooltip={KPI_TOOLTIPS.brutoGewicht}
            />
            <KPICard
              label="Aantal zendingen"
              value={formatLargeNumber(kpis.zendingAantal)}
              color={DMI_COLORS.green}
              tooltip={KPI_TOOLTIPS.zendingAantal}
            />
          </div>
        </div>

        {/* Right column - donut charts */}
        <div className="space-y-4">
          <DonutChart
            title="Laden in emissiezone"
            data={laadEZ}
            colors={[DMI_COLORS.green, '#4D5C28']}
            titleTooltip={CHART_TOOLTIPS.emissiezoneLaden}
          />
          <DonutChart
            title="Lossen in emissiezone"
            data={losEZ}
            colors={[DMI_COLORS.green, '#4D5C28']}
            titleTooltip={CHART_TOOLTIPS.emissiezoneLossen}
          />
        </div>
      </div>

      <DataSourceFooter />
    </div>
  );
}
