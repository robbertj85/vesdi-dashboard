'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useAnprTable } from '@/lib/anpr-selectors';
import {
  anprMonthlyEuro6Pct,
  anprMonthlyByVehicle,
  anprEmissionVehiclePivot,
  anprEmissionDistribution,
  anprVisitsByMonth,
  anprTotalVisits,
  type PeriodGranularity,
} from '@/lib/anpr-aggregate';
import { DonutChart } from '@/components/charts/donut-chart';
import { KPICard } from '@/components/layout/kpi-card';
import { formatPercentage, formatLargeNumber } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { ChartTitle } from '@/components/charts/chart-title';
import { Hash, Percent } from 'lucide-react';

type VehicleFilter = 'Total' | 'N1' | 'N2/N3';

function vehicleFilterToRaw(f: VehicleFilter): 'Total' | 'N1' | 'N23' {
  return f === 'N2/N3' ? 'N23' : f;
}

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

export default function AnprEmissiePage() {
  const m1 = useAnprTable('M1');
  const rows = m1?.rows ?? [];

  const [overviewVehicle, setOverviewVehicle] = useState<VehicleFilter>('Total');
  const [vehicleChartMode, setVehicleChartMode] = useState<'abs' | 'pct'>('abs');
  const [periodGranularity, setPeriodGranularity] = useState<PeriodGranularity>('M');

  // Emission distribution and monthly data
  const totalVisits = useMemo(() => anprTotalVisits(rows), [rows]);
  const emissionDist = useMemo(() => anprEmissionDistribution(rows), [rows]);
  const monthlyEmissionData = useMemo(() => anprVisitsByMonth(rows, periodGranularity), [rows, periodGranularity]);
  const emissionSeries = useMemo(
    () => [...new Set(monthlyEmissionData.flatMap((d) => Object.keys(d).filter((k) => k !== 'periode')))],
    [monthlyEmissionData]
  );
  const euro6Pct = useMemo(() => {
    const euro6 = emissionDist.find((d) => d.name === 'Euro 6');
    return totalVisits > 0 && euro6 ? euro6.value / totalVisits : 0;
  }, [emissionDist, totalVisits]);
  const zeroPct = useMemo(() => {
    const zero = emissionDist.find((d) => d.name === 'Zero-emissie');
    return totalVisits > 0 && zero ? zero.value / totalVisits : 0;
  }, [emissionDist, totalVisits]);

  // Filtered by vehicle for the overview table
  const filteredTrend = useMemo(
    () => anprMonthlyEuro6Pct(rows, vehicleFilterToRaw(overviewVehicle), periodGranularity),
    [rows, overviewVehicle, periodGranularity]
  );
  const monthlyByVehicle = useMemo(() => anprMonthlyByVehicle(rows, periodGranularity), [rows, periodGranularity]);
  const pivotData = useMemo(() => anprEmissionVehiclePivot(rows), [rows]);

  const vehicleSeries = useMemo(
    () => [...new Set(monthlyByVehicle.flatMap((d) => Object.keys(d).filter((k) => k !== 'periode')))],
    [monthlyByVehicle]
  );

  const monthlyByVehiclePct = useMemo(() => {
    return monthlyByVehicle.map((d) => {
      const total = vehicleSeries.reduce((s, k) => s + (Number(d[k]) || 0), 0);
      const row: Record<string, string | number> = { periode: d.periode };
      for (const k of vehicleSeries) {
        row[k] = total > 0 ? Math.round((Number(d[k]) / total) * 1000) / 10 : 0; // as percentage e.g. 80.3
      }
      return row;
    });
  }, [monthlyByVehicle, vehicleSeries]);

  if (!m1) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="ANPR Emissie" tooltip={PAGE_HELP.anprEmissie} color={PAGE_COLORS.anprEmissie.bg} description={PAGE_DESCRIPTIONS.anprEmissie} />
        <p className="text-sm text-dmi-text/60">Geen ANPR M1-data geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="ANPR Emissie" tooltip={PAGE_HELP.anprEmissie} color={PAGE_COLORS.anprEmissie.bg} description={PAGE_DESCRIPTIONS.anprEmissie} />

      {/* ─── Emission KPIs ─── */}
      <div data-tour="kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Totaal bezoeken" value={formatLargeNumber(totalVisits)} color={DMI_COLORS.primary} tooltip="Totaal aantal bezoeken over alle voertuigcategorieen." />
        <KPICard label="Euro-6 aandeel" value={formatPercentage(euro6Pct, 1)} color={DMI_COLORS.orange} tooltip="Percentage bezoeken door Euro-6 voertuigen." />
        <KPICard label="Zero-emissie aandeel" value={formatPercentage(zeroPct, 1)} color={DMI_COLORS.green} tooltip="Percentage bezoeken door zero-emissievoertuigen." />
      </div>

      {/* Period granularity toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-dmi-text/50">Periode:</span>
        <div className="flex gap-0.5">
          <ToggleButton active={periodGranularity === 'M'} onClick={() => setPeriodGranularity('M')}>Maand</ToggleButton>
          <ToggleButton active={periodGranularity === 'K'} onClick={() => setPeriodGranularity('K')}>Kwartaal</ToggleButton>
        </div>
      </div>

      {/* ─── Emission donut + monthly stacked bar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Emissieklasse"
          titleTooltip={CHART_TOOLTIPS.anprEmissieklasse}
          data={emissionDist}
          colors={[...PAGE_COLORS.anprEmissie.chartColors]}
          showPercentage
        />
        <StackedBarAbsolute
          title="Maandelijkse bezoeken per emissieklasse"
          titleTooltip={CHART_TOOLTIPS.anprMaandelijkBezoeken}
          data={monthlyEmissionData}
          categoryKey="periode"
          series={emissionSeries}
          colors={[...PAGE_COLORS.anprEmissie.chartColors]}
        />
      </div>

      {/* ─── Emission × Vehicle pivot table ─── */}
      <Card className="p-4">
        <ChartTitle title="Emissieklasse per voertuigcategorie" tooltip="Kruistabel van emissieklassen tegen N1 (bestelwagen) en N2/N3 (vrachtwagen)." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dmi-text/10">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-dmi-text/60">Emissieklasse</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">N1</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">N1 %</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">N2/N3</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">N2/N3 %</th>
                <th className="text-right py-2 pl-3 text-xs font-semibold text-dmi-text/60">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.map((row) => (
                <tr key={row.emissieklasse} className="border-b border-dmi-text/5">
                  <td className="py-2 pr-4 font-medium text-dmi-text">{row.emissieklasse}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/80">{formatLargeNumber(row.N1)}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/60">{formatPercentage(row.N1_pct, 1)}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/80">{formatLargeNumber(row['N2/N3'])}</td>
                  <td className="py-2 px-3 text-right text-dmi-text/60">{formatPercentage(row['N2/N3_pct'], 1)}</td>
                  <td className="py-2 pl-3 text-right font-medium text-dmi-text">{formatLargeNumber(row.totaal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Monthly by vehicle category ─── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <ChartTitle title="Maandelijks per voertuigcategorie" tooltip={CHART_TOOLTIPS.anprMaandelijkVoertuig} />
          <div className="flex gap-0.5">
            <ToggleButton active={vehicleChartMode === 'abs'} onClick={() => setVehicleChartMode('abs')}><Hash className="w-3 h-3" /></ToggleButton>
            <ToggleButton active={vehicleChartMode === 'pct'} onClick={() => setVehicleChartMode('pct')}><Percent className="w-3 h-3" /></ToggleButton>
          </div>
        </div>
        <StackedBarAbsolute
          bare
          title=""
          data={vehicleChartMode === 'abs' ? monthlyByVehicle : monthlyByVehiclePct}
          categoryKey="periode"
          series={vehicleSeries}
          colors={[DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.mauve, DMI_COLORS.purple]}
        />
      </Card>

      {/* ─── Detailed monthly overview with vehicle filter ─── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <ChartTitle title="Maandelijks overzicht" tooltip="Percentage en aantallen per emissieklasse per maand." />
          <div className="flex gap-0.5">
            <ToggleButton active={overviewVehicle === 'Total'} onClick={() => setOverviewVehicle('Total')}>Alle</ToggleButton>
            <ToggleButton active={overviewVehicle === 'N1'} onClick={() => setOverviewVehicle('N1')}>N1</ToggleButton>
            <ToggleButton active={overviewVehicle === 'N2/N3'} onClick={() => setOverviewVehicle('N2/N3')}>N2/N3</ToggleButton>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dmi-text/10" style={{ borderBottomColor: PAGE_COLORS.anprEmissie.bg + '40' }}>
                <th className="text-left py-2 pr-3 text-xs font-semibold text-dmi-text/60">Periode</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Totaal</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Euro-6</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">% Euro-6</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">Zero-emissie</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-dmi-text/60">% Zero</th>
                <th className="text-right py-2 pl-3 text-xs font-semibold text-dmi-text/60">Euro 0-5</th>
                <th className="text-right py-2 pl-3 text-xs font-semibold text-dmi-text/60">% 0-5</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrend.map((d) => (
                <tr key={d.periode} className="border-b border-dmi-text/5">
                  <td className="py-1.5 pr-3 font-medium text-dmi-text">{d.periode}</td>
                  <td className="py-1.5 px-3 text-right text-dmi-text/80">{formatLargeNumber(d.total)}</td>
                  <td className="py-1.5 px-3 text-right text-dmi-text/80">{formatLargeNumber(d.euro6)}</td>
                  <td className="py-1.5 px-3 text-right font-medium" style={{ color: DMI_COLORS.orange }}>{formatPercentage(d.euro6Pct, 1)}</td>
                  <td className="py-1.5 px-3 text-right text-dmi-text/80">{formatLargeNumber(d.zero)}</td>
                  <td className="py-1.5 px-3 text-right font-medium" style={{ color: DMI_COLORS.green }}>{formatPercentage(d.zeroPct, 1)}</td>
                  <td className="py-1.5 pl-3 text-right text-dmi-text/80">{formatLargeNumber(d.euro05)}</td>
                  <td className="py-1.5 pl-3 text-right text-dmi-text/60">{formatPercentage(d.euro05Pct, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
