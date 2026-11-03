'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVesdiStore } from '@/lib/store';
import { useDemoLoader } from '@/hooks/use-demo-loader';
import { withBase } from '@/lib/base-path';

/**
 * Landing page after login: loads the Utrecht demo dataset (unless data is
 * already present in this browser) and continues to the dashboard.
 */
/** Only same-origin dashboard/upload paths are valid continuation targets. */
function continueTo(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') && !next.startsWith('/demo')) {
    return next;
  }
  return '/dashboard/voorblad';
}

export default function DemoPage() {
  return (
    <Suspense>
      <DemoLoader />
    </Suspense>
  );
}

function DemoLoader() {
  const router = useRouter();
  const target = continueTo(useSearchParams().get('next'));
  const hydrated = useVesdiStore((s) => s._hydrated);
  const hasData = useVesdiStore((s) => s.years.length > 0 || s.anprTables.size > 0);
  const processingStatus = useVesdiStore((s) => s.processingStatus);
  const { loadDemo, downloading, error } = useDemoLoader();
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    // Data already in this browser (demo or own upload): don't overwrite it
    if (hasData) {
      router.replace(target);
      return;
    }
    loadDemo().then((ok) => {
      if (ok) router.replace(target);
    });
  }, [hydrated, hasData, loadDemo, router, target]);

  return (
    <div className="min-h-screen bg-dmi-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-dmi-primary/5 p-8 text-center">
        <img src={withBase('/images/dmi-logo.svg')} alt="DMI Ecosysteem" className="h-10 w-auto mx-auto mb-6" />
        {error ? (
          <div className="space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-dmi-red" />
            <p className="text-sm text-dmi-text">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { started.current = false; loadDemo().then((ok) => ok && router.replace(target)); }}>
                Opnieuw proberen
              </Button>
              <Link href="/"><Button variant="outline">Eigen bestanden uploaden</Button></Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 mx-auto text-dmi-orange animate-spin" />
            <h1 className="text-lg font-condensed font-bold text-dmi-primary">
              Demo gemeente Utrecht laden
            </h1>
            <p className="text-sm text-dmi-text/60">
              {downloading
                ? `Bestanden downloaden… ${downloading.done}/${downloading.total}`
                : processingStatus || 'Voorbereiden…'}
            </p>
            <p className="text-xs text-dmi-text/40">
              De data wordt alleen in je browser verwerkt en opgeslagen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
