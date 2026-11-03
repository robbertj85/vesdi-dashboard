'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatAxisTick, prettyLabel } from '@/lib/format';
import { ChartTitle } from './chart-title';

interface HorizontalBarChartProps {
  title: string;
  titleTooltip?: string;
  data: { name: string; value: number }[];
  color?: string;
  xLabel?: string;
  maxItems?: number;
}

export function HorizontalBarChart({
  title,
  data,
  color = '#1d3b64',
  xLabel,
  maxItems = 15,
  titleTooltip,
}: HorizontalBarChartProps) {
  const chartData = data.slice(0, maxItems);

  return (
    <Card className="p-4">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 28 + 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, bottom: xLabel ? 12 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxisTick}
            tick={{ fontSize: 11 }}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -5, fontSize: 11 } : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11 }}
            tickFormatter={prettyLabel}
          />
          <Tooltip
            formatter={(value) => [(value as number).toLocaleString('nl-NL'), 'Aantal']}
            labelFormatter={prettyLabel}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
