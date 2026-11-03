'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartTitle } from './chart-title';

interface PercentageLineChartProps {
  title: string;
  titleTooltip?: string;
  data: { year: number; value: number }[];
  color?: string;
  height?: number;
}

export function PercentageLineChart({
  title,
  data,
  color = '#F58030',
  height = 280,
  titleTooltip,
}: PercentageLineChartProps) {
  const chartData = data.map((d) => ({
    year: d.year,
    percentage: Math.round(d.value * 100),
  }));

  return (
    <Card className="p-4">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip
            formatter={(value) => [`${value} %`, 'Percentage']}
          />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
