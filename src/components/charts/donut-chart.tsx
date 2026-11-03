'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { CHART_SERIES_COLORS } from '@/lib/colors';
import { ChartTitle } from './chart-title';

interface DonutChartProps {
  title: string;
  titleTooltip?: string;
  data: { name: string; value: number }[];
  colors?: string[];
  showPercentage?: boolean;
  height?: number;
  /** Render without the card frame, e.g. inside another card */
  bare?: boolean;
}

export function DonutChart({
  title,
  data,
  colors = CHART_SERIES_COLORS,
  showPercentage = true,
  height = 280,
  titleTooltip,
  bare = false,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className={bare ? 'p-0 border-0 shadow-none bg-transparent gap-0' : 'p-4'}>
      <ChartTitle title={title} tooltip={titleTooltip} />
      {total === 0 ? (
        <div className="flex items-center justify-center text-sm text-dmi-text/40" style={{ height }}>
          Geen data voor deze selectie
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={
              showPercentage
                ? ({ percent }: { percent?: number }) => `${Math.round((percent ?? 0) * 100)}%`
                : false
            }
            labelLine={showPercentage}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${(value as number).toLocaleString('nl-NL')} (${Math.round(((value as number) / total) * 100)}%)`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
}
