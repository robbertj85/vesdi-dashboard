import { Card } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/info-tip';

interface KPICardProps {
  label: string;
  value: string;
  color?: string;
  tooltip?: string;
}

export function KPICard({ label, value, color = '#1d3b64', tooltip }: KPICardProps) {
  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs text-dmi-text/60">{label}</p>
        {tooltip && <InfoTip text={tooltip} contentClassName="max-w-[220px]" />}
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </Card>
  );
}
