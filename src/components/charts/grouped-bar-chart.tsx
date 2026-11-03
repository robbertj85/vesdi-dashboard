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
import { formatAxisTick, prettyLabel } from '@/lib/format';
import { YEAR_COLORS } from '@/lib/colors';
import { ChartTitle } from './chart-title';

interface GroupedBarChartProps {
  title: string;
  titleTooltip?: string;
  data: Record<string, string | number>[];
  years: number[];
  maxItems?: number;
}

export function GroupedBarChart({
  title,
  data,
  years,
  maxItems = 15,
  titleTooltip,
}: GroupedBarChartProps) {
  const chartData = data.slice(0, maxItems);

  return (
    <Card className="p-4">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 32 + 60)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxisTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="klasse"
            width={180}
            tick={{ fontSize: 11 }}
            tickFormatter={prettyLabel}
          />
          <Tooltip
            formatter={(value) => [
              (value as number).toLocaleString('nl-NL'),
            ]}
            labelFormatter={prettyLabel}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {years.map((year) => (
            <Bar
              key={year}
              dataKey={String(year)}
              fill={YEAR_COLORS[year] || '#999'}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
