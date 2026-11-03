'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DummyBanner } from '@/components/layout/dummy-banner';
import { DataTable } from '@/components/charts/data-table';
import { StackedBarAbsolute } from '@/components/charts/stacked-bar-absolute';
import { PAGE_COLORS } from '@/lib/colors';
import { PAGE_DESCRIPTIONS, CHART_TOOLTIPS, PAGE_HELP } from '@/lib/descriptions';
import { useAnprTable, useAnprLookup } from '@/lib/anpr-selectors';
import {
  anprTimeOfDayByWeekday,
  anprTimeOfDayBySbi,
} from '@/lib/anpr-aggregate';
import { formatLargeNumber } from '@/lib/format';

export default function AnprTijdpatronenPage() {
  const j5 = useAnprTable('J5');
  const j6 = useAnprTable('J6');
  const lookup = useAnprLookup();

  const j5Rows = j5?.rows ?? [];
  const j6Rows = j6?.rows ?? [];

  const timeByWeekday = useMemo(() => anprTimeOfDayByWeekday(j6Rows, lookup), [j6Rows, lookup]);
  const timeBySbi = useMemo(() => anprTimeOfDayBySbi(j5Rows, lookup), [j5Rows, lookup]);

  const weekdayColumns = useMemo(() => {
    if (timeByWeekday.length === 0) return [];
    const days = Object.keys(timeByWeekday[0]).filter((k) => k !== 'tijdstip');
    return days.map((day) => ({
      key: day,
      label: day,
      format: (v: number | string) => formatLargeNumber(Number(v)),
    }));
  }, [timeByWeekday]);

  const sbiSeries = useMemo(
    () => [...new Set(timeBySbi.flatMap((d) => Object.keys(d).filter((k) => k !== 'tijdstip')))],
    [timeBySbi]
  );

  const hasData = j5Rows.length > 0 || j6Rows.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="ANPR Tijdpatronen"
          tooltip={PAGE_HELP.anprTijdpatronen}
          color={PAGE_COLORS.anprTijdpatronen.bg}
          description={PAGE_DESCRIPTIONS.anprTijdpatronen}
        />
        <p className="text-sm text-dmi-text/60">Geen ANPR tijdpatroon-data geladen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader
        title="ANPR Tijdpatronen"
        tooltip={PAGE_HELP.anprTijdpatronen}
        color={PAGE_COLORS.anprTijdpatronen.bg}
        description={PAGE_DESCRIPTIONS.anprTijdpatronen}
      />

      <DummyBanner tableIds={['J5', 'J6']} />

      {/* Time-of-day × Weekday heatmap table */}
      {timeByWeekday.length > 0 && (
        <DataTable
          title="Dagdeel x Weekdag"
          titleTooltip={CHART_TOOLTIPS.anprWeekdag}
          data={timeByWeekday}
          columns={[
            { key: 'tijdstip', label: 'Dagdeel' },
            ...weekdayColumns,
          ]}
          accentColor={PAGE_COLORS.anprTijdpatronen.bg}
        />
      )}

      {/* Time-of-day by SBI */}
      {timeBySbi.length > 0 && (
        <StackedBarAbsolute
          title="Dagdeel per bedrijfstak"
          titleTooltip={CHART_TOOLTIPS.anprTijdstip}
          data={timeBySbi}
          categoryKey="tijdstip"
          series={sbiSeries}
          colors={[...PAGE_COLORS.anprTijdpatronen.chartColors]}
        />
      )}
    </div>
  );
}
