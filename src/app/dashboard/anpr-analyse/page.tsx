'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PAGE_HELP } from '@/lib/descriptions';
import { PAGE_COLORS, DMI_COLORS } from '@/lib/colors';
import { useAnprTable } from '@/lib/anpr-selectors';
import { anprMonthlyByEmissionAndVehicle, anprMonthlyEuro6Pct } from '@/lib/anpr-aggregate';
import {
  twoProportionZTest,
  linearRegression,
  extrapolate,
  monthLabelFn,
  parsePeriodLabel,
} from '@/lib/anpr-statistics';
import { formatPercentage, formatLargeNumber } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { ChartTitle } from '@/components/charts/chart-title';
import { Info, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function AnprAnalysePage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense>
      <AnprAnalyseContent />
    </Suspense>
  );
}

function AnprAnalyseContent() {
  const m1 = useAnprTable('M1');
  const rows = m1?.rows ?? [];

  const monthlyDetailed = useMemo(() => anprMonthlyByEmissionAndVehicle(rows), [rows]);
  const euro6Trend = useMemo(() => anprMonthlyEuro6Pct(rows), [rows]);
  const periods = useMemo(
    () => [...new Set(monthlyDetailed.map((d) => d.periode))].sort((a, b) => {
      const pa = parsePeriodLabel(a);
      const pb = parsePeriodLabel(b);
      if (!pa || !pb) return a.localeCompare(b);
      return pa.year !== pb.year ? pa.year - pb.year : pa.month - pb.month;
    }),
    [monthlyDetailed]
  );

  // ─── Z-test state ───
  const [periodA, setPeriodA] = useState<string>(periods[0] ?? '');
  const [periodB, setPeriodB] = useState<string>(periods[periods.length - 1] ?? '');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'N1' | 'N2/N3'>('all');
  const [comparisonApplied, setComparisonApplied] = useState(false);

  // ─── Regression/extrapolation state ───
  // Determine last data month for destination date calculation
  const lastPeriod = useMemo(() => {
    if (euro6Trend.length === 0) return { month: 12, year: 2025 };
    return parsePeriodLabel(euro6Trend[euro6Trend.length - 1].periode) ?? { month: 12, year: 2025 };
  }, [euro6Trend]);
  const [destMonth, setDestMonth] = useState(6);
  const [destYear, setDestYear] = useState(lastPeriod.year + 1);
  const [appliedExtraMonths, setAppliedExtraMonths] = useState(0);

  // ?extrapoleer=2030 (used by the questionnaire) opens the page with the
  // extrapolation to December of that year already applied.
  const autoYear = Number(useSearchParams().get('extrapoleer')) || null;
  const [autoApplied, setAutoApplied] = useState<string | null>(null);
  const autoKey = autoYear ? `${autoYear}:${lastPeriod.year}-${lastPeriod.month}` : null;
  if (autoYear && autoYear > lastPeriod.year && autoKey !== autoApplied) {
    // Adjusting state while rendering (React's pattern for props→state sync)
    setAutoApplied(autoKey);
    setDestMonth(12);
    setDestYear(autoYear);
    setAppliedExtraMonths((autoYear - lastPeriod.year) * 12 + (12 - lastPeriod.month));
  }
  const [extraMode, setExtraMode] = useState<'clamp' | 'substitute'>('clamp');

  // ─── Regression data (Euro-6, Zero-emissie, and Euro 0-5) ───
  const regressionData = useMemo(() => {
    const euro6Points = euro6Trend.map((d, i) => ({ x: i, y: d.euro6Pct }));
    const zePoints = euro6Trend.map((d, i) => ({ x: i, y: d.zeroPct }));
    const euro05Points = euro6Trend.map((d, i) => ({ x: i, y: d.euro05Pct }));
    const regEuro6 = linearRegression(euro6Points);
    const regZE = linearRegression(zePoints);
    const regEuro05 = linearRegression(euro05Points);

    const first = euro6Trend[0] ? parsePeriodLabel(euro6Trend[0].periode) : null;
    const labelFn = first ? monthLabelFn(first.month, first.year) : (i: number) => `+${i}`;

    const chartData: {
      periode: string;
      euro6Pct: number | null; zeroPct: number | null; euro05Pct: number | null;
      fittedEuro6: number | null; fittedZE: number | null; fittedEuro05: number | null;
      extraEuro6: number | null; extraZE: number | null; extraEuro05: number | null;
    }[] = euro6Trend.map((d, i) => ({
      periode: d.periode,
      euro6Pct: d.euro6Pct,
      zeroPct: d.zeroPct,
      euro05Pct: d.euro05Pct,
      fittedEuro6: regEuro6.fitted[i]?.y ?? null,
      fittedZE: regZE.fitted[i]?.y ?? null,
      fittedEuro05: regEuro05.fitted[i]?.y ?? null,
      extraEuro6: null,
      extraZE: null,
      extraEuro05: null,
    }));

    if (appliedExtraMonths > 0) {
      // Bridge: set extrapolation start on the last data point so lines connect
      const lastIdx = chartData.length - 1;
      if (lastIdx >= 0) {
        chartData[lastIdx].extraEuro6 = chartData[lastIdx].euro6Pct;
        chartData[lastIdx].extraZE = chartData[lastIdx].zeroPct;
        chartData[lastIdx].extraEuro05 = chartData[lastIdx].euro05Pct;
      }

      const rawEuro6 = extrapolate(regEuro6, euro6Trend.length, appliedExtraMonths, labelFn);
      const rawZE = extrapolate(regZE, euro6Trend.length, appliedExtraMonths, labelFn);
      const rawEuro05 = extrapolate(regEuro05, euro6Trend.length, appliedExtraMonths, labelFn);

      for (let i = 0; i < appliedExtraMonths; i++) {
        let e6 = rawEuro6[i].y;
        let ze = rawZE[i].y;
        let e05 = rawEuro05[i].y;

        if (extraMode === 'substitute') {
          // Constrained: all three must sum to 1, none below 0
          // Clamp negatives to 0, redistribute surplus proportionally to the others
          e6 = Math.max(0, e6);
          ze = Math.max(0, ze);
          e05 = Math.max(0, e05);
          const sum = e6 + ze + e05;
          if (sum > 0) {
            e6 = e6 / sum;
            ze = ze / sum;
            e05 = e05 / sum;
          }
        } else {
          // Clamp: just floor at 0
          e6 = Math.max(0, e6);
          ze = Math.max(0, ze);
          e05 = Math.max(0, e05);
        }

        chartData.push({
          periode: rawEuro6[i].label,
          euro6Pct: null, zeroPct: null, euro05Pct: null,
          fittedEuro6: null, fittedZE: null, fittedEuro05: null,
          extraEuro6: e6,
          extraZE: ze,
          extraEuro05: e05,
        });
      }
    }

    return {
      chartData,
      euro6: { r2: regEuro6.r2, slope: regEuro6.slope },
      ze: { r2: regZE.r2, slope: regZE.slope },
      euro05: { r2: regEuro05.r2, slope: regEuro05.slope },
    };
  }, [euro6Trend, appliedExtraMonths, extraMode]);

  // ─── Z-test comparison ───
  const comparisonData = useMemo(() => {
    if (!periodA || !periodB || periodA === periodB) return null;
    const vehicles = vehicleFilter === 'all' ? ['N1', 'N2/N3'] : [vehicleFilter];
    const emissions = ['Euro 6', 'Zero-emissie', 'Euro 0-5'] as const;

    const byKey = new Map<string, { total: number; byEmission: Map<string, number> }>();
    for (const d of monthlyDetailed) {
      const key = `${d.periode}|${d.vehicle}`;
      if (!byKey.has(key)) byKey.set(key, { total: d.total, byEmission: new Map() });
      byKey.get(key)!.byEmission.set(d.emissieklasse, d.aantalBezoeken);
    }

    const results: {
      vehicle: string; emission: string;
      k1: number; n1: number; k2: number; n2: number;
      p1: number; p2: number; diff: number; relChange: number;
      z: number; pValue: number; significance: string;
    }[] = [];

    for (const v of vehicles) {
      for (const e of emissions) {
        const data1 = byKey.get(`${periodA}|${v}`);
        const data2 = byKey.get(`${periodB}|${v}`);
        const k1 = data1?.byEmission.get(e) ?? 0;
        const n1 = data1?.total ?? 0;
        const k2 = data2?.byEmission.get(e) ?? 0;
        const n2 = data2?.total ?? 0;
        if (n1 > 0 && n2 > 0) {
          const test = twoProportionZTest(k1, n1, k2, n2);
          results.push({
            vehicle: v, emission: e,
            k1, n1, k2, n2,
            p1: test.p1, p2: test.p2,
            diff: test.diff, relChange: test.relativeChange,
            z: test.z, pValue: test.pValue, significance: test.significance,
          });
        }
      }
    }
    return results;
  }, [periodA, periodB, vehicleFilter, monthlyDetailed]);

  const handleApplyExtrapolation = useCallback(() => {
    const months = (destYear - lastPeriod.year) * 12 + (destMonth - lastPeriod.month);
    if (months > 0) setAppliedExtraMonths(months);
  }, [destMonth, destYear, lastPeriod]);

  const handleClearExtrapolation = useCallback(() => {
    setAppliedExtraMonths(0);
  }, []);

  if (!m1) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="ANPR Analyse" tooltip={PAGE_HELP.anprAnalyse} color={PAGE_COLORS.anprEmissie.bg} description="Regressie, extrapolatie en statistische vergelijking van ANPR emissiedata." />
        <p className="text-sm text-dmi-text/60">Geen ANPR M1-data geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="ANPR Analyse" tooltip={PAGE_HELP.anprAnalyse} color={PAGE_COLORS.anprEmissie.bg} description="Regressie, extrapolatie en statistische vergelijking van ANPR emissiedata." />

      {/* ─── Regression + Extrapolation ─── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <ChartTitle title="Ontwikkelingen wagenpark emissieklasse" tooltip="Lineaire regressie op het maandelijkse percentage per emissieklasse. Extrapolatie projecteert de trends naar de toekomst." />
          {appliedExtraMonths > 0 && (
            <div className="text-[10px] text-dmi-text/40 text-right leading-relaxed">
              <div>Euro-6: R² = {regressionData.euro6.r2.toFixed(3)} | {regressionData.euro6.slope >= 0 ? '+' : ''}{(regressionData.euro6.slope * 100).toFixed(3)}pp/mnd</div>
              <div>Zero-emissie: R² = {regressionData.ze.r2.toFixed(3)} | {regressionData.ze.slope >= 0 ? '+' : ''}{(regressionData.ze.slope * 100).toFixed(3)}pp/mnd</div>
              <div>Euro 0-5: R² = {regressionData.euro05.r2.toFixed(3)} | {regressionData.euro05.slope >= 0 ? '+' : ''}{(regressionData.euro05.slope * 100).toFixed(3)}pp/mnd</div>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={regressionData.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
            <XAxis dataKey="periode" tick={{ fontSize: 10 }} interval={Math.max(0, Math.ceil(regressionData.chartData.length / 12) - 1)} angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(v: number) => formatPercentage(v, 0)} domain={[0, 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => v != null ? formatPercentage(Number(v), 2) : '—'} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="euro6Pct" name="% Euro-6" stroke={DMI_COLORS.orange} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            <Line type="monotone" dataKey="zeroPct" name="% Zero-emissie" stroke={DMI_COLORS.green} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            <Line type="monotone" dataKey="euro05Pct" name="% Euro 0-5" stroke={DMI_COLORS.red} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            {appliedExtraMonths > 0 && (
              <>
                <Line type="monotone" dataKey="fittedEuro6" name="Regressie Euro-6" stroke={DMI_COLORS.orange} strokeWidth={1.5} dot={false} strokeDasharray="3 3" connectNulls strokeOpacity={0.4} />
                <Line type="monotone" dataKey="fittedZE" name="Regressie ZE" stroke={DMI_COLORS.green} strokeWidth={1.5} dot={false} strokeDasharray="3 3" connectNulls strokeOpacity={0.4} />
                <Line type="monotone" dataKey="fittedEuro05" name="Regressie 0-5" stroke={DMI_COLORS.red} strokeWidth={1.5} dot={false} strokeDasharray="3 3" connectNulls strokeOpacity={0.4} />
              </>
            )}
            {appliedExtraMonths > 0 && (
              <>
                <Line type="monotone" dataKey="extraEuro6" name="Extrapolatie Euro-6" stroke={DMI_COLORS.orange} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="6 3" connectNulls />
                <Line type="monotone" dataKey="extraZE" name="Extrapolatie ZE" stroke={DMI_COLORS.green} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="6 3" connectNulls />
                <Line type="monotone" dataKey="extraEuro05" name="Extrapolatie 0-5" stroke={DMI_COLORS.red} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="6 3" connectNulls />
                <ReferenceLine x={euro6Trend[euro6Trend.length - 1]?.periode} stroke={DMI_COLORS.text} strokeDasharray="2 2" strokeOpacity={0.3} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Extrapolation controls */}
        <div className="mt-3 pt-3 border-t border-dmi-text/10">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-dmi-text/60 mb-1">Extrapoleer tot</label>
              <div className="flex gap-1.5">
                <select
                  value={destMonth}
                  onChange={(e) => setDestMonth(Number(e.target.value))}
                  className="text-sm border rounded-md border-dmi-primary/20 px-2 py-1.5"
                >
                  {['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={destYear}
                  onChange={(e) => setDestYear(Number(e.target.value))}
                  className="text-sm border rounded-md border-dmi-primary/20 px-2 py-1.5"
                >
                  {Array.from({ length: 11 }, (_, i) => lastPeriod.year + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-dmi-text/60 mb-1">Scenario</label>
              <select
                value={extraMode}
                onChange={(e) => setExtraMode(e.target.value as 'clamp' | 'substitute')}
                className="text-sm border rounded-md border-dmi-primary/20 px-2 py-1.5"
              >
                <option value="clamp">Onafhankelijk (min. 0%)</option>
                <option value="substitute">Substitutie (som = 100%)</option>
              </select>
            </div>
            <button
              onClick={handleApplyExtrapolation}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors bg-dmi-primary text-white hover:bg-dmi-primary/90"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Extrapoleer
            </button>
            {appliedExtraMonths > 0 && (
              <button
                onClick={handleClearExtrapolation}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-dmi-text/15 text-dmi-text/60 hover:bg-dmi-text/5 transition-colors"
              >
                Wissen
              </button>
            )}
          </div>
          {appliedExtraMonths > 0 && (
            <div className="flex items-start gap-1.5 text-[10px] text-dmi-text/50 mt-2">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-dmi-text/40" />
              <span>Extrapolatie op basis van lineaire regressie ({appliedExtraMonths} maanden vooruit). Houdt geen rekening met beleidswijzigingen of verschuivingen in gebruik van oudere euroklassen buiten de stad. Werkelijke waarden kunnen significant afwijken.</span>
            </div>
          )}
        </div>
      </Card>

      {/* ─── Z-test controls ─── */}
      <Card className="p-4">
        <ChartTitle title="Statistische vergelijking per maand" tooltip="Vergelijk het aandeel per emissieklasse tussen twee periodes. Twee-proporties Z-toets (tweezijdig)." />
        <div className="flex items-end gap-4 flex-wrap mt-2">
          <div>
            <label className="block text-xs text-dmi-text/60 mb-1">Periode A (referentie)</label>
            <select value={periodA} onChange={(e) => setPeriodA(e.target.value)} className="text-sm border rounded-md border-dmi-primary/20 px-3 py-1.5">
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="text-sm text-dmi-text/40 pb-1">vs</div>
          <div>
            <label className="block text-xs text-dmi-text/60 mb-1">Periode B (vergelijking)</label>
            <select value={periodB} onChange={(e) => setPeriodB(e.target.value)} className="text-sm border rounded-md border-dmi-primary/20 px-3 py-1.5">
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-dmi-text/60 mb-1">Voertuigcategorie</label>
            <select value={vehicleFilter} onChange={(e) => { setVehicleFilter(e.target.value as 'all' | 'N1' | 'N2/N3'); setComparisonApplied(false); }} className="text-sm border rounded-md border-dmi-primary/20 px-3 py-1.5">
              <option value="all">Alle (N1 + N2/N3)</option>
              <option value="N1">N1 (Bestelwagen)</option>
              <option value="N2/N3">N2/N3 (Vrachtwagen)</option>
            </select>
          </div>
          <button
            onClick={() => setComparisonApplied(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors bg-dmi-primary text-white hover:bg-dmi-primary/90"
          >
            Vergelijk
          </button>
        </div>
      </Card>

      {comparisonApplied && (
        <div className="flex items-start gap-2 px-1">
          <Info className="w-3.5 h-3.5 text-dmi-primary/40 shrink-0 mt-0.5" />
          <p className="text-[11px] text-dmi-text/50 leading-relaxed">
            De twee-proporties Z-toets vergelijkt of het aandeel van een emissieklasse significant verschilt tussen
            twee periodes. Met grote aantallen bezoeken (N &gt; 100K) zijn zelfs kleine verschuivingen statistisch
            detecteerbaar. Let op het praktische verschil (procentpunten) naast de statistische significantie.
          </p>
        </div>
      )}

      {/* Z-test results */}
      {comparisonApplied && comparisonData && comparisonData.length > 0 ? (
        <Card className="p-4">
          <ChartTitle title={`Vergelijking: ${periodA} → ${periodB}`} tooltip="H₀: het aandeel is gelijk in beide periodes." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2" style={{ borderColor: DMI_COLORS.primary + '20' }}>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-dmi-text/60">Voertuig</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-dmi-text/60">Emissieklasse</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">n ({periodA})</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">% ({periodA})</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">n ({periodB})</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">% ({periodB})</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">Δ (pp)</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">Δ rel.</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">Z</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-dmi-text/60">p-waarde</th>
                  <th className="text-center py-2 pl-2 text-xs font-semibold text-dmi-text/60">Sig.</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((r, i) => {
                  const isFirstOfVehicle = i === 0 || comparisonData[i - 1].vehicle !== r.vehicle;
                  return (
                    <tr key={i} className={`border-b border-dmi-text/5 ${isFirstOfVehicle && i > 0 ? 'border-t-2 border-t-dmi-text/10' : ''}`}>
                      <td className="py-2 pr-3 font-medium text-dmi-text">{isFirstOfVehicle ? r.vehicle : ''}</td>
                      <td className="py-2 px-2 text-dmi-text/80">{r.emission}</td>
                      <td className="py-2 px-2 text-right text-dmi-text/60 font-mono text-[11px]">{formatLargeNumber(r.k1)}</td>
                      <td className="py-2 px-2 text-right text-dmi-text/80">{formatPercentage(r.p1, 2)}</td>
                      <td className="py-2 px-2 text-right text-dmi-text/60 font-mono text-[11px]">{formatLargeNumber(r.k2)}</td>
                      <td className="py-2 px-2 text-right text-dmi-text/80">{formatPercentage(r.p2, 2)}</td>
                      <td className={`py-2 px-2 text-right font-medium ${r.diff > 0 ? 'text-dmi-green' : r.diff < 0 ? 'text-dmi-red' : 'text-dmi-text/60'}`}>
                        {r.diff > 0 ? '+' : ''}{(r.diff * 100).toFixed(2)}
                      </td>
                      <td className={`py-2 px-2 text-right text-[11px] ${r.relChange > 0 ? 'text-dmi-green' : r.relChange < 0 ? 'text-dmi-red' : 'text-dmi-text/60'}`}>
                        {r.relChange > 0 ? '+' : ''}{(r.relChange * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-dmi-text/60 font-mono text-[11px]">{r.z.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-dmi-text/60 font-mono text-[11px]">
                        {r.pValue < 0.001 ? '<0,001' : r.pValue.toFixed(4).replace('.', ',')}
                      </td>
                      <td className={`py-2 pl-2 text-center font-bold text-sm ${r.significance !== 'n.s.' ? 'text-dmi-orange' : 'text-dmi-text/30'}`}>
                        {r.significance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-dmi-text/40">
            <span>* p &lt; 0,05</span>
            <span>** p &lt; 0,01</span>
            <span>*** p &lt; 0,001</span>
            <span>n.s. = niet significant</span>
            <span>pp = procentpunt</span>
            <span>Δ rel. = relatieve verandering</span>
            <span>Z = Z-statistiek (tweezijdig)</span>
          </div>
        </Card>
      ) : comparisonApplied ? (
        <Card className="p-4">
          <p className="text-sm text-dmi-text/50">Geen data beschikbaar voor de geselecteerde periodes.</p>
        </Card>
      ) : null}
    </div>
  );
}
