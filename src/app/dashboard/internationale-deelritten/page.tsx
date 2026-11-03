'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/info-tip';
import { DataSourceFooter } from '@/components/layout/data-source-footer';
import { FilterBar } from '@/components/layout/filter-bar';
import { KPICard } from '@/components/layout/kpi-card';
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useVesdiStore } from '@/lib/store';
import { useInternationalDeelritten } from '@/hooks/use-filtered-data';
import {
  sumDeelritKPIs,
  deelrittenPerKlasse,
  gewichtsklasseDistribution,
  voertuigcategorieDistribution,
} from '@/lib/aggregate';
import { formatLargeNumber, formatPct } from '@/lib/format';
import { PAGE_DESCRIPTIONS, KPI_TOOLTIPS, CHART_TOOLTIPS, PAGE_HELP, SECTION_TOOLTIPS } from '@/lib/descriptions';
import { getCountryFromNuts3 } from '@/lib/country-codes';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import dynamic from 'next/dynamic';

const PC4BubbleMap = dynamic(
  () => import('@/components/maps/pc4-bubble-map').then((m) => m.PC4BubbleMap),
  { ssr: false, loading: () => <div className="h-[250px] bg-white/5 rounded-lg animate-pulse" /> }
);

export default function InternationaleDeelrittenPage() {
  const [mapView, setMapView] = useState<'laden' | 'lossen'>('laden');
  const [donutView, setDonutView] = useState<'maxGewicht' | 'voertuig' | 'leeggewicht' | 'brandstof'>('maxGewicht');
  const deelritten = useInternationalDeelritten();
  const municipality = useVesdiStore((s) => s.municipality);

  const kpis = useMemo(() => sumDeelritKPIs(deelritten), [deelritten]);
  const perKlasse = useMemo(() => deelrittenPerKlasse(deelritten), [deelritten]);
  const gewicht = useMemo(() => gewichtsklasseDistribution(deelritten), [deelritten]);
  const voertuig = useMemo(() => voertuigcategorieDistribution(deelritten), [deelritten]);

  // Leeggewicht distribution
  const leeggewicht = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of deelritten) {
      const name = r.leeggewichtCombinatie_klasse || 'Onbekend';
      map.set(name, (map.get(name) || 0) + r.aantalDeelritten);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [deelritten]);

  // Country data for bar chart
  const countryData = useMemo(() => {
    const map = new Map<string, { geladen: number; gelost: number }>();
    for (const r of deelritten) {
      if (r.LaadLand && r.LaadLand !== 'NL') {
        const curr = map.get(r.LaadLand) || { geladen: 0, gelost: 0 };
        curr.geladen += r.aantalDeelritten;
        map.set(r.LaadLand, curr);
      }
      if (r.LosLand && r.LosLand !== 'NL') {
        const curr = map.get(r.LosLand) || { geladen: 0, gelost: 0 };
        curr.gelost += r.aantalDeelritten;
        map.set(r.LosLand, curr);
      }
    }
    return [...map.entries()]
      .map(([code, data]) => ({
        country: getCountryFromNuts3(code + '000'),
        ...data,
      }))
      .sort((a, b) => (b.geladen + b.gelost) - (a.geladen + a.gelost));
  }, [deelritten]);

  // PC4 data for bubble map
  const pc4MapData = useMemo(() => {
    const map = new Map<string, { count: number; weight: number }>();
    for (const r of deelritten) {
      const pc4 = mapView === 'laden' ? r.PC4LaadNL : r.PC4LosNL;
      if (!pc4) continue;
      const curr = map.get(pc4) || { count: 0, weight: 0 };
      curr.count += r.aantalDeelritten;
      curr.weight += r.brutoGewicht;
      map.set(pc4, curr);
    }
    return [...map.entries()]
      .map(([pc4, v]) => ({ pc4, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [deelritten, mapView]);

  const donutData = donutView === 'maxGewicht' ? gewicht
    : donutView === 'voertuig' ? voertuig
    : leeggewicht;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Internationale deelritten"
        tooltip={PAGE_HELP.internationaleDeelritten}
        color={PAGE_COLORS.nationaleDeelritten.bg}
        description={PAGE_DESCRIPTIONS.internationaleDeelritten}
      />
      <FilterBar showEuronorm showHandelsrichting />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <KPICard
              label="Aantal deelritten"
              value={formatLargeNumber(kpis.aantalDeelritten)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.aantalDeelritten}
            />
            <KPICard
              label="Gemiddelde beladingsgraad"
              value={formatPct(Math.round(kpis.beladingsgraad * 100))}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.beladingsgraad}
            />
            <KPICard
              label="Bruto gewicht (kg)"
              value={formatLargeNumber(kpis.brutoGewicht)}
              color={DMI_COLORS.primary}
              tooltip={KPI_TOOLTIPS.brutoGewicht}
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
          <Card className="p-4">
            <SectionTitle title="Import/export per handelsland" tooltip={SECTION_TOOLTIPS.importExportLand} className="mb-3" />
            <ResponsiveContainer width="100%" height={Math.max(200, countryData.length * 28 + 40)}>
              <BarChart data={countryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" horizontal={false} />
                <XAxis type="number" tickFormatter={formatAxisTick} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [(v as number).toLocaleString('nl-NL')]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="geladen" name="Geladen" fill={DMI_COLORS.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="gelost" name="Gelost" fill={DMI_COLORS.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SectionTitle title="Deelritten per PC4 in de gemeente" tooltip={SECTION_TOOLTIPS.pc4InGemeente} className="flex-1" />
              <Tabs value={mapView} onValueChange={(v) => setMapView(v as 'laden' | 'lossen')}>
                <TabsList className="h-7">
                  <TabsTrigger value="laden" className="text-xs px-2 py-1">Laden</TabsTrigger>
                  <TabsTrigger value="lossen" className="text-xs px-2 py-1">Lossen</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <PC4BubbleMap
              bare
              title=""
              data={pc4MapData.slice(0, 30)}
              color={DMI_COLORS.primary}
              height={250}
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <SectionTitle title="Voertuiginformatie" tooltip={SECTION_TOOLTIPS.voertuiginformatie} className="flex-1" />
              <Tabs value={donutView} onValueChange={(v) => setDonutView(v as typeof donutView)}>
                <TabsList className="h-7">
                  <TabsTrigger value="maxGewicht" className="text-xs px-2 py-1">Max gewicht</TabsTrigger>
                  <TabsTrigger value="voertuig" className="text-xs px-2 py-1">Voertuig</TabsTrigger>
                  <TabsTrigger value="leeggewicht" className="text-xs px-2 py-1">Leeggewicht</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <DonutChart bare title="" data={donutData} />
          </Card>
        </div>
      </div>

      <DataSourceFooter />
    </div>
  );
}
