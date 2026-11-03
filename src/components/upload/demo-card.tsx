'use client';

import { useRouter } from 'next/navigation';
import { Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { useVesdiStore } from '@/lib/store';
import { useDemoLoader } from '@/hooks/use-demo-loader';

/** "Bekijk de Utrecht-demo" call-to-action: loads the bundled demo dataset and opens the dashboard. */
export function DemoCard({
  compact = false,
  redirectTo = '/dashboard/voorblad',
}: {
  compact?: boolean;
  /** Where to go after loading; null = stay on the current page */
  redirectTo?: string | null;
}) {
  const router = useRouter();
  const isProcessing = useVesdiStore((s) => s.isProcessing);
  const processingStatus = useVesdiStore((s) => s.processingStatus);
  const { loadDemo, downloading, error } = useDemoLoader();
  const busy = !!downloading || isProcessing;

  const onClick = async () => {
    if ((await loadDemo()) && redirectTo) router.push(redirectTo);
  };

  return (
    <div className={`rounded-xl border border-dmi-orange/30 bg-dmi-orange/5 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start gap-3">
        <PlayCircle className="w-6 h-6 text-dmi-orange shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm text-dmi-text">Demo: gemeente Utrecht</p>
            <InfoTip text={SECTION_TOOLTIPS.demoCard} />
          </div>
          <p className="text-xs text-dmi-text/60 leading-relaxed mt-0.5">
            Bekijk wat VESDI-wegvervoersdata (2021–2023) en ANPR-cameradata (2025) samen
            laten zien, zonder zelf bestanden te uploaden.
          </p>
          {busy && (
            <p className="text-xs text-dmi-text/60 mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {downloading
                ? `Bestanden downloaden… ${downloading.done}/${downloading.total}`
                : processingStatus}
            </p>
          )}
          {error && <p className="text-xs text-dmi-red mt-2">{error}</p>}
        </div>
        <Button
          onClick={onClick}
          disabled={busy}
          className="shrink-0 bg-dmi-orange hover:bg-dmi-orange/90 text-white"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Demo laden
        </Button>
      </div>
    </div>
  );
}
