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
import { ChartTitle } from './chart-title';

interface StackedBar100Props {
  title: string;
  titleTooltip?: string;
  data: Record<string, number | string>[];
  categoryKey: string;
  series: string[];
  colors?: string[];
  height?: number;
}

export function StackedBar100({
  title,
  data,
  categoryKey,
  series,
  colors = CHART_SERIES_COLORS,
  height = 280,
  titleTooltip,
}: StackedBar100Props) {
  return (
    <Card className="p-4">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} stackOffset="expand">
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
          <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              `${((value as number) * 100).toFixed(1)} %`,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="stack"
              fill={colors[i % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
