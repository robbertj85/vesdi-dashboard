'use client';

import { useCallback, useState } from 'react';
import { useVesdiStore } from '@/lib/store';
import { generateDummyData } from '@/lib/anpr-generate-dummy';
import { withBase } from '@/lib/base-path';

interface Manifest {
  municipality: string;
  files: { name: string; size: number }[];
}

/**
 * Download the Utrecht demo dataset from /api/demo and run it through the
 * normal upload pipeline (detect → parse → transform → IndexedDB), exactly as
 * if the user had dropped the files on the upload page.
 */
export function useDemoLoader() {
  const processFiles = useVesdiStore((s) => s.processFiles);
  const clear = useVesdiStore((s) => s.clear);
  const [downloading, setDownloading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDemo = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(withBase('/api/demo'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Manifest niet beschikbaar (${res.status})`);
      const manifest: Manifest = await res.json();
      if (manifest.files.length === 0) {
        throw new Error('Er staat geen demodata op de server (zie scripts/prepare-demo-data.sh).');
      }

      setDownloading({ done: 0, total: manifest.files.length });
      let done = 0;
      const files = await Promise.all(
        manifest.files.map(async ({ name }) => {
          const r = await fetch(withBase(`/api/demo/${encodeURIComponent(name)}`), { cache: 'no-store' });
          if (!r.ok) throw new Error(`Download mislukt: ${name} (${r.status})`);
          const blob = await r.blob();
          setDownloading({ done: ++done, total: manifest.files.length });
          return new File([blob], name, { type: blob.type });
        })
      );
      setDownloading(null);

      // Replace whatever was loaded before with the demo dataset
      clear();
      await processFiles(files);

      // The ANPR tables marked DUMMY ship with all-zero counts. Fill them with
      // synthetic values derived from the real M1 table so the ANPR pages have
      // something to show; they stay labelled "Dummy-data" on each page.
      const { anprTables, anprLookup, setAnprTables } = useVesdiStore.getState();
      const m1 = anprTables.get('M1');
      const dummies = [...anprTables.values()].filter((t) => t.isDummy);
      if (m1 && dummies.length > 0 && dummies.every((t) => t.rows.every((r) => r.aantalBezoeken === 0))) {
        setAnprTables(generateDummyData(m1, anprTables, anprLookup));
      }
      return true;
    } catch (e) {
      setDownloading(null);
      setError(e instanceof Error ? e.message : 'Demo laden mislukt');
      return false;
    }
  }, [clear, processFiles]);

  return { loadDemo, downloading, error };
}
