'use client';

import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTipProps {
  text: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Icon size/colour overrides, e.g. for use on dark backgrounds */
  className?: string;
  contentClassName?: string;
}

/** Small (?) icon that shows an explanatory tooltip on hover or keyboard focus. */
export function InfoTip({ text, side = 'top', className, contentClassName }: InfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Meer informatie"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex shrink-0 cursor-help rounded-full text-dmi-primary/55 hover:text-dmi-orange data-[state=delayed-open]:text-dmi-orange data-[state=instant-open]:text-dmi-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dmi-primary/30',
            className
          )}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className={cn('max-w-[280px] leading-relaxed', contentClassName)}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

interface SectionTitleProps {
  title: React.ReactNode;
  tooltip?: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}

/** Section heading with an optional InfoTip, for blocks that are not chart components. */
export function SectionTitle({ title, tooltip, as: Tag = 'h3', className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Tag className={Tag === 'h2' ? 'text-lg font-bold text-dmi-primary' : 'text-sm font-semibold text-dmi-text'}>
        {title}
      </Tag>
      {tooltip && <InfoTip text={tooltip} />}
    </div>
  );
}
