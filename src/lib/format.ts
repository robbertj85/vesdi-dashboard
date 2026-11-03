// Dutch number formatting utilities

/**
 * Format a large number with Dutch abbreviations
 * 1.856.747 → "1,9M"
 * 17.302.742.578 → "17,3 mld"
 * 555.045.321 → "555,0M"
 */
export function formatLargeNumber(value: number): string {
  if (value === 0) return '0';

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const mld = abs / 1_000_000_000;
    return `${sign}${mld.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld`;
  }
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}${m.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}${k.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
  }

  return `${sign}${abs.toLocaleString('nl-NL')}`;
}

/**
 * Format a number with Dutch locale (dots as thousands separator, comma as decimal)
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format as percentage
 * 0.39 → "39 %"
 */
export function formatPercentage(value: number, decimals = 0): string {
  const pct = value * 100;
  return `${pct.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

/**
 * Format percentage from already-percentage value (e.g. 39 → "39 %")
 */
export function formatPct(value: number, decimals = 0): string {
  return `${value.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

/**
 * Format axis tick value for charts
 */
export function formatAxisTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}K`;
  return value.toLocaleString('nl-NL');
}

/** Turn raw CBS codes into readable chart labels (e.g. '***Lege_rit***' → 'Lege rit'). */
export function prettyLabel(value: unknown): string {
  const s = String(value ?? '');
  if (/^\*+lege_rit\*+$/i.test(s)) return 'Lege rit';
  return s;
}

/** CBS/NUTS names carry suffixes like "Utrecht (gemeente)"; show just the name. */
export function municipalityName(name: string | null | undefined, fallback = 'Gemeente'): string {
  if (!name) return fallback;
  return name.replace(/\s*\((gemeente|gem\.)\)\s*$/i, '').trim() || fallback;
}
