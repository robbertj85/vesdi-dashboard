'use client';

import { cn } from '@/lib/utils';

interface Option<V extends string | number> {
  value: V;
  label: string;
}

/**
 * 1–5 scale as a row of numbered buttons with the end labels underneath.
 * Implemented as a radio group so it works with keyboard and screen readers.
 */
export function ScaleInput({
  name,
  options,
  value,
  onChange,
  allowNvt = false,
  size = 'md',
}: {
  name: string;
  options: readonly Option<number>[];
  value: number | 'nvt' | null;
  onChange: (v: number | 'nvt') => void;
  allowNvt?: boolean;
  size?: 'sm' | 'md';
}) {
  const first = options[0];
  const last = options[options.length - 1];
  return (
    <div role="radiogroup" aria-label={name} className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${o.value} – ${o.label}`}
              title={o.label}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex-1 rounded-lg border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dmi-gold',
                size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
                selected
                  ? 'bg-dmi-primary border-dmi-primary text-white'
                  : 'bg-white border-dmi-primary/20 text-dmi-primary hover:border-dmi-primary/50 hover:bg-dmi-primary/5'
              )}
            >
              {o.value}
            </button>
          );
        })}
        {allowNvt && (
          <button
            type="button"
            role="radio"
            aria-checked={value === 'nvt'}
            onClick={() => onChange('nvt')}
            title="Weet niet / niet van toepassing"
            className={cn(
              'rounded-lg border px-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dmi-gold',
              size === 'sm' ? 'h-8 text-[11px]' : 'h-10 text-xs',
              value === 'nvt'
                ? 'bg-dmi-text/70 border-dmi-text/70 text-white'
                : 'bg-white border-dmi-text/15 text-dmi-text/60 hover:border-dmi-text/40'
            )}
          >
            n.v.t.
          </button>
        )}
      </div>
      <div className={cn('flex justify-between text-[11px] text-dmi-text/50', allowNvt && 'pr-14')}>
        <span>{first.value} = {first.label.toLowerCase()}</span>
        <span>{last.value} = {last.label.toLowerCase()}</span>
      </div>
    </div>
  );
}

/** Single-choice list of pill buttons (radio group). */
export function ChoiceGroup<V extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly Option<V>[];
  value: V | null;
  onChange: (v: V) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dmi-gold',
              selected
                ? 'bg-dmi-primary border-dmi-primary text-white'
                : 'bg-white border-dmi-primary/20 text-dmi-primary hover:border-dmi-primary/50 hover:bg-dmi-primary/5'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Multi-select list of checkboxes. */
export function CheckboxGroup<V extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly Option<V>[];
  value: V[];
  onChange: (v: V[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {options.map((o) => {
        const checked = value.includes(o.value);
        return (
          <label key={o.value} className="flex items-start gap-2 text-sm text-dmi-text/80 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className="mt-0.5 h-4 w-4 accent-[#1d3b64]"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
