import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/ui/info-tip';

interface PageHeaderProps {
  title: string;
  color: string;
  textColor?: string;
  description?: string;
  /** Longer "how to read this page" help shown behind a (?) icon next to the title */
  tooltip?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, color, textColor = '#ffffff', description, tooltip, children }: PageHeaderProps) {
  return (
    <div
      data-tour="page-header"
      className={cn('px-6 py-4 rounded-xl mb-6 flex items-center justify-between')}
      style={{ backgroundColor: color, color: textColor }}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold">{title}</h1>
          {tooltip && (
            <InfoTip
              text={tooltip}
              side="bottom"
              className="text-current opacity-70 hover:opacity-100 hover:text-current"
              contentClassName="max-w-[340px]"
            />
          )}
        </div>
        {description && (
          <p className="text-sm opacity-80 mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
