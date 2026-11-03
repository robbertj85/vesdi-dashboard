'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatAxisTick } from '@/lib/format';
import { ChartTitle } from './chart-title';

interface DualAxisLineChartProps {
  title: string;
  titleTooltip?: string;
  data: { year: number; value: number; value2?: number }[];
  line1Label: string;
  line2Label?: string;
  line1Color?: string;
  line2Color?: string;
  line2Dashed?: boolean;
  height?: number;
}

export function DualAxisLineChart({
  title,
  data,
  line1Label,
  line2Label,
  line1Color = '#F58030',
  line2Color = '#F58030',
  line2Dashed = true,
  height = 280,
  titleTooltip,
}: DualAxisLineChartProps) {
  const hasLine2 = data.some((d) => d.value2 !== undefined);

  return (
    <Card className="p-4">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tickFormatter={formatAxisTick}
            tick={{ fontSize: 11 }}
            width={60}
          />
          {hasLine2 && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 11 }}
              width={60}
            />
          )}
          <Tooltip
            formatter={(value) => [
              (value as number).toLocaleString('nl-NL'),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            name={line1Label}
            stroke={line1Color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          {hasLine2 && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="value2"
              name={line2Label}
              stroke={line2Color}
              strokeWidth={2}
              strokeDasharray={line2Dashed ? '5 5' : undefined}
              dot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
