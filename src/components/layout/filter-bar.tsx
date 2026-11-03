'use client';

import { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVesdiStore } from '@/lib/store';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';

/** Check if the loaded data has emissiezone columns */
function useHasEmissiezoneData(): boolean {
  const zendingenByYear = useVesdiStore((s) => s.zendingenByYear);
  return useMemo(() => {
    for (const rows of zendingenByYear.values()) {
      if (rows.length > 0 && rows[0].laad_zone_emissiezonePC6 != null) {
        return true;
      }
    }
    return false;
  }, [zendingenByYear]);
}

/** A filter control with its own (?) tooltip */
function FilterItem({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      {children}
      <InfoTip text={tip} />
    </div>
  );
}

interface FilterBarProps {
  showEuronorm?: boolean;
  showEmissiezone?: boolean;
  showHandelsrichting?: boolean;
}

export function FilterBar({
  showEuronorm = false,
  showEmissiezone = false,
  showHandelsrichting = false,
}: FilterBarProps) {
  const years = useVesdiStore((s) => s.years);
  const filters = useVesdiStore((s) => s.filters);
  const setFilter = useVesdiStore((s) => s.setFilter);
  const hasEmissiezone = useHasEmissiezoneData();
  const showEZ = showEmissiezone && hasEmissiezone;

  return (
    <div data-tour="filters" className="flex flex-wrap items-center gap-3 mb-6 rounded-lg bg-muted/50 border border-border px-4 py-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        <InfoTip text={SECTION_TOOLTIPS.filterBar} />
      </span>
      {/* Year filter */}
      <FilterItem tip={SECTION_TOOLTIPS.filterYear}>
        <Select
          value={filters.year ? String(filters.year) : ''}
          onValueChange={(v) => setFilter('year', Number(v))}
        >
          <SelectTrigger className="w-[120px] bg-[#1d3b64] border-[#1d3b64] text-white">
            <SelectValue placeholder="Jaar" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterItem>

      {/* Euronorm filter */}
      {showEuronorm && (
        <FilterItem tip={SECTION_TOOLTIPS.filterEuronorm}>
          <Select
            value={filters.euronorm || 'all'}
            onValueChange={(v) => setFilter('euronorm', v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[190px] bg-[#1d3b64] border-[#1d3b64] text-white">
              <SelectValue placeholder="Euronorm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Euronorm: alle</SelectItem>
              <SelectItem value="6">Euronorm: Euro 6</SelectItem>
              <SelectItem value="0-5">Euronorm: Euro 0-5</SelectItem>
            </SelectContent>
          </Select>
        </FilterItem>
      )}

      {/* Emissiezone laden */}
      {showEZ && (
        <>
          <FilterItem tip={SECTION_TOOLTIPS.filterLaadEZ}>
            <Select
              value={filters.laadEmissiezone || 'all'}
              onValueChange={(v) => setFilter('laadEmissiezone', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px] bg-[#1d3b64] border-[#1d3b64] text-white">
                <SelectValue placeholder="Laden emissiezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Laden EZ: alle</SelectItem>
                <SelectItem value="ja">Laden EZ: ja</SelectItem>
                <SelectItem value="nee">Laden EZ: nee</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem tip={SECTION_TOOLTIPS.filterLosEZ}>
            <Select
              value={filters.losEmissiezone || 'all'}
              onValueChange={(v) => setFilter('losEmissiezone', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px] bg-[#1d3b64] border-[#1d3b64] text-white">
                <SelectValue placeholder="Lossen emissiezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lossen EZ: alle</SelectItem>
                <SelectItem value="ja">Lossen EZ: ja</SelectItem>
                <SelectItem value="nee">Lossen EZ: nee</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>
        </>
      )}

      {/* Handelsrichting */}
      {showHandelsrichting && (
        <FilterItem tip={SECTION_TOOLTIPS.filterHandelsrichting}>
          <Select
            value={filters.handelsrichting || 'all'}
            onValueChange={(v) => setFilter('handelsrichting', v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[230px] bg-[#1d3b64] border-[#1d3b64] text-white">
              <SelectValue placeholder="Handelsrichting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Richting: import + export</SelectItem>
              <SelectItem value="import">Richting: import</SelectItem>
              <SelectItem value="export">Richting: export</SelectItem>
            </SelectContent>
          </Select>
        </FilterItem>
      )}
    </div>
  );
}
