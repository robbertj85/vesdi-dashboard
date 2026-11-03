'use client';

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
import { Card } from '@/components/ui/card';
import { CHART_SERIES_COLORS } from '@/lib/colors';
import { formatAxisTick } from '@/lib/format';
import { ChartTitle } from './chart-title';

interface StackedBarAbsoluteProps {
  title: string;
  titleTooltip?: string;
  data: Record<string, number | string>[];
  categoryKey: string;
  series: string[];
  colors?: string[];
  layout?: 'horizontal' | 'vertical';
  /** Render without the card frame, e.g. inside another card */
  bare?: boolean;
}

export function StackedBarAbsolute({
  title,
  data,
  categoryKey,
  series,
  colors = CHART_SERIES_COLORS,
  layout = 'horizontal',
  titleTooltip,
  bare = false,
}: StackedBarAbsoluteProps) {
  const isVertical = layout === 'vertical';

  return (
    <Card className={bare ? 'p-0 border-0 shadow-none bg-transparent gap-0' : 'p-4'}>
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={isVertical ? Math.max(200, data.length * 30 + 60) : 280}>
        <BarChart data={data} layout={isVertical ? 'vertical' : 'horizontal'}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
          {isVertical ? (
            <>
              <XAxis type="number" tickFormatter={formatAxisTick} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey={categoryKey} width={160} tick={{ fontSize: 11 }} />
            </>
          ) : (
            <>
              <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatAxisTick} tick={{ fontSize: 11 }} />
            </>
          )}
          <Tooltip
            formatter={(value) => [
              (value as number).toLocaleString('nl-NL'),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="stack"
              fill={colors[i % colors.length]}
              radius={i === series.length - 1 ? [0, 4, 4, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
