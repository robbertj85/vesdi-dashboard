'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { KPICard } from '@/components/layout/kpi-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useAnprTable } from '@/lib/anpr-selectors';
import {
  anprTotalVisits,
  anprVehicleCategoryDistribution,
  anprMonthlyN1vsN23,
  type PeriodGranularity,
} from '@/lib/anpr-aggregate';
import { formatLargeNumber, formatPercentage } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { ChartTitle } from '@/components/charts/chart-title';
import { Hash, Percent } from 'lucide-react';
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

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
        active
          ? 'bg-dmi-primary text-white border-dmi-primary'
          : 'bg-white text-dmi-text/60 border-dmi-text/15 hover:border-dmi-primary/30'
      }`}
    >
      {children}
    </button>
  );
}

export default function AnprOverzichtPage() {
  const m1 = useAnprTable('M1');
  const rows = m1?.rows ?? [];
  const [vehicleMode, setVehicleMode] = useState<'abs' | 'pct'>('abs');
  const [periodGranularity, setPeriodGranularity] = useState<PeriodGranularity>('M');

  const totalVisits = useMemo(() => anprTotalVisits(rows), [rows]);
  const vehicleDist = useMemo(() => anprVehicleCategoryDistribution(rows), [rows]);
  const n1vsN23 = useMemo(() => anprMonthlyN1vsN23(rows, periodGranularity), [rows, periodGranularity]);

  // Compute N1 and N2/N3 annual totals for KPIs
  const n1Total = useMemo(() => vehicleDist.find((d) => d.name.startsWith('N1'))?.value ?? 0, [vehicleDist]);
  const n23Total = useMemo(
    () => vehicleDist.filter((d) => !d.name.startsWith('N1')).reduce((s, d) => s + d.value, 0),
    [vehicleDist]
  );

  // Descriptive statistics per vehicle category
  const stats = useMemo(() => {
    const compute = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, median: 0, mode: 0 };
      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      // Mode: most frequent value (round to nearest 1000 for meaningful mode with continuous data)
      const buckets = new Map<number, number>();
      for (const v of values) {
        const b = Math.round(v / 1000) * 1000;
        buckets.set(b, (buckets.get(b) ?? 0) + 1);
      }
      let modeVal = 0, modeCount = 0;
      for (const [v, c] of buckets) {
        if (c > modeCount) { modeVal = v; modeCount = c; }
      }
      return { avg, min, max, median, mode: modeVal };
    };

    const n1Values = n1vsN23.map((d) => d.N1);
    const n23Values = n1vsN23.map((d) => d['N2/N3']);
    const totalValues = n1vsN23.map((d) => d.N1 + d['N2/N3']);

    return {
      totaal: compute(totalValues),
      N1: compute(n1Values),
      'N2/N3': compute(n23Values),
    };
  }, [n1vsN23]);

  if (!m1) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="ANPR Overzicht"
          tooltip={PAGE_HELP.anprOverzicht}
          color={PAGE_COLORS.anprOverzicht.bg}
          description={PAGE_DESCRIPTIONS.anprOverzicht}
        />
        <p className="text-sm text-dmi-text/60">Geen ANPR M1-data geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader
        title="ANPR Overzicht"
        tooltip={PAGE_HELP.anprOverzicht}
        color={PAGE_COLORS.anprOverzicht.bg}
        description={PAGE_DESCRIPTIONS.anprOverzicht}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Totaal bezoeken"
          value={formatLargeNumber(totalVisits)}
          color={DMI_COLORS.primary}
          tooltip="Totaal aantal geregistreerde bezoeken van vrachtvoertuigen via ANPR-cameras."
        />
        <KPICard
          label="N1 (Bestelwagen)"
          value={formatLargeNumber(n1Total)}
          color={DMI_COLORS.primary}
          tooltip="Totaal aantal bezoeken door N1 bestelwagens."
        />
        <KPICard
          label="N2/N3 (Vrachtwagen)"
          value={formatLargeNumber(n23Total)}
          color={DMI_COLORS.orange}
          tooltip="Totaal aantal bezoeken door N2/N3 vrachtwagens."
        />
      </div>

      {/* Vehicle donut */}
      <DonutChart
        title="Voertuigcategorie"
        titleTooltip={CHART_TOOLTIPS.anprVoertuigcategorie}
        data={vehicleDist}
        colors={[...PAGE_COLORS.anprOverzicht.chartColors]}
        showPercentage
      />

      {/* Descriptive statistics */}
      <Card className="p-4">
        <ChartTitle title="Maandelijkse statistieken" tooltip="Beschrijvende statistieken op basis van maandelijkse bezoekdata." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dmi-text/10">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-dmi-text/60">Categorie</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Gemiddeld</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Min</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Max</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Mediaan</th>
                <th className="text-right py-2 pl-3 text-xs font-semibold text-dmi-text/60">Modus</th>
              </tr>
            </thead>
            <tbody>
              {(['totaal', 'N1', 'N2/N3'] as const).map((cat) => (
                <tr key={cat} className="border-b border-dmi-text/5">
                  <td className="py-2 pr-4 font-medium text-dmi-text">{cat === 'totaal' ? 'Alle voertuigen' : cat}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/80">{formatLargeNumber(Math.round(stats[cat].avg))}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/60">{formatLargeNumber(stats[cat].min)}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/60">{formatLargeNumber(stats[cat].max)}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/80">{formatLargeNumber(Math.round(stats[cat].median))}</td>
                  <td className="py-2 pl-3 text-right text-dmi-text/60">{formatLargeNumber(stats[cat].mode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* N1 vs N2/N3 monthly */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <ChartTitle title="N1 vs N2/N3 per periode" tooltip="Aantal bezoeken uitgesplitst naar N1 (bestelwagen) en N2/N3 (vrachtwagen)." />
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <ToggleButton active={periodGranularity === 'M'} onClick={() => setPeriodGranularity('M')}>Mnd</ToggleButton>
              <ToggleButton active={periodGranularity === 'K'} onClick={() => setPeriodGranularity('K')}>Kw</ToggleButton>
            </div>
            <div className="flex gap-0.5">
              <ToggleButton active={vehicleMode === 'abs'} onClick={() => setVehicleMode('abs')}><Hash className="w-3 h-3" /></ToggleButton>
              <ToggleButton active={vehicleMode === 'pct'} onClick={() => setVehicleMode('pct')}><Percent className="w-3 h-3" /></ToggleButton>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={n1vsN23} margin={{ bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
            <XAxis dataKey="periode" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={90} />
            {vehicleMode === 'abs' ? (
              <YAxis tickFormatter={(v: number) => formatLargeNumber(v)} tick={{ fontSize: 11 }} />
            ) : (
              <YAxis tickFormatter={(v: number) => formatPercentage(v, 0)} domain={[0, 1]} tick={{ fontSize: 11 }} />
            )}
            <Tooltip
              formatter={(v, name) =>
                vehicleMode === 'abs'
                  ? [formatLargeNumber(Number(v)), String(name)]
                  : [formatPercentage(Number(v), 1), String(name)]
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey={vehicleMode === 'abs' ? 'N1' : 'N1_pct'}
              name="N1 (Bestelwagen)"
              fill={DMI_COLORS.primary}
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey={vehicleMode === 'abs' ? 'N2/N3' : 'N2/N3_pct'}
              name="N2/N3 (Vrachtwagen)"
              fill={DMI_COLORS.orange}
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
