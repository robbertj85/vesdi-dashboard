'use client';

import { InfoTip } from '@/components/ui/info-tip';

interface ChartTitleProps {
  title: string;
  tooltip?: string;
}

export function ChartTitle({ title, tooltip }: ChartTitleProps) {
  if (!title) return null;
  return (
    <div className="flex items-center gap-1 mb-3">
      <h3 className="text-sm font-semibold text-dmi-text">{title}</h3>
      {tooltip && <InfoTip text={tooltip} />}
    </div>
  );
}
