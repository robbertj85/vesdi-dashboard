'use client';

import { useCallback, useState } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2, Database, Trash2, ArrowRight, FolderUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVesdiStore } from '@/lib/store';
import type { DetectedFile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { InfoTip } from '@/components/ui/info-tip';
import { SECTION_TOOLTIPS } from '@/lib/descriptions';
import { municipalityName } from '@/lib/format';

const ACCEPTED_EXTENSIONS = new Set(['.csv', '.xlsx', '.xls', '.docx', '.png', '.jpg', '.jpeg']);

/** Recursively extract files from dropped items (supports folders) */
async function extractFilesFromItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];
  const entries: FileSystemEntry[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  async function readEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (ACCEPTED_EXTENSIONS.has(ext)) {
        files.push(file);
      }
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const childEntries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      for (const child of childEntries) {
        await readEntry(child);
      }
    }
  }

  for (const entry of entries) {
    await readEntry(entry);
  }

  return files;
}

const STATUS_STYLES = {
  valid: 'bg-dmi-green/10 text-dmi-green border-dmi-green/30',
  warning: 'bg-dmi-gold/10 text-dmi-gold border-dmi-gold/30',
  error: 'bg-dmi-red/10 text-dmi-red border-dmi-red/30',
} as const;

const STATUS_BADGE = {
  valid: 'bg-dmi-green text-white',
  warning: 'bg-dmi-gold text-white',
  error: 'bg-dmi-red text-white',
} as const;

export function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const processFiles = useVesdiStore((s) => s.processFiles);
  const detectedFiles = useVesdiStore((s) => s.detectedFiles);
  const isProcessing = useVesdiStore((s) => s.isProcessing);
  const processingStatus = useVesdiStore((s) => s.processingStatus);
  const municipality = useVesdiStore((s) => s.municipality);
  const years = useVesdiStore((s) => s.years);
  const clear = useVesdiStore((s) => s.clear);
  const hydrated = useVesdiStore((s) => s._hydrated);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      // Support folders via DataTransferItem.webkitGetAsEntry()
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const allFiles = await extractFilesFromItems(items);
        if (allFiles.length > 0) {
          await processFiles(allFiles);
          return;
        }
      }
      // Fallback: plain file list
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const anprTables = useVesdiStore((s) => s.anprTables);
  const hasData = years.length > 0 || anprTables.size > 0;
  const hasNewFiles = detectedFiles.some(
    (f) => f.type === 'ZENDINGEN' || f.type === 'DEELRITTEN' || f.type === 'ANPR_CSV'
  );

  // Show loading skeleton while hydrating from IndexedDB
  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-dashed rounded-xl p-12 text-center border-dmi-primary/10">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-dmi-primary/30 animate-spin" />
          <p className="text-sm text-dmi-text/40">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Persisted data indicator */}
      {hasData && detectedFiles.length === 0 && (
        <Card className="p-4 border-dmi-primary/20 bg-dmi-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dmi-primary/10">
              <Database className="w-4 h-4 text-dmi-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-dmi-text">
                {municipalityName(municipality?.name)} &mdash; {years.join(', ')}
              </p>
              <p className="text-xs text-dmi-text/50">
                Data uit vorige sessie beschikbaar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-dmi-red hover:text-dmi-red/80 hover:bg-dmi-red/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Wissen
            </Button>
          </div>
        </Card>
      )}

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
          isDragging
            ? 'border-dmi-orange bg-dmi-orange/5 scale-[1.01]'
            : 'border-dmi-primary/20 hover:border-dmi-orange/50 hover:bg-dmi-orange/3'
        } ${hasData && detectedFiles.length === 0 ? 'p-8' : 'p-10'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => { e.stopPropagation(); document.getElementById('file-input')?.click(); }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept=".csv,.xlsx,.xls,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInput}
        />
        <input
          id="folder-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          ref={(el) => { if (el) el.setAttribute('webkitdirectory', ''); }}
        />

        <div className="text-center">
          <div className={`inline-flex p-4 rounded-2xl mb-4 transition-colors ${
            isDragging ? 'bg-dmi-orange/10' : 'bg-dmi-primary/5 group-hover:bg-dmi-orange/8'
          }`}>
            {isDragging ? (
              <FolderUp className="w-10 h-10 text-dmi-orange" />
            ) : (
              <Upload className={`w-10 h-10 transition-colors ${
                hasData ? 'text-dmi-primary/30 group-hover:text-dmi-orange/60' : 'text-dmi-primary/40 group-hover:text-dmi-orange/60'
              }`} />
            )}
          </div>
          <h3 className="text-base font-semibold text-dmi-text mb-1">
            {isDragging
              ? 'Bestanden loslaten om te uploaden'
              : hasData
                ? 'Extra bestanden toevoegen'
                : 'Sleep CBS- of ANPR-bestanden hierheen'}
          </h3>
          <p className="text-sm text-dmi-text/50">
            of{' '}
            <span className="text-dmi-orange font-medium underline underline-offset-2">
              klik om bestanden te selecteren
            </span>
            {' '}&middot;{' '}
            <span
              className="text-dmi-primary font-medium underline underline-offset-2 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); document.getElementById('folder-input')?.click(); }}
            >
              map selecteren
            </span>
          </p>
          <p className="text-xs text-dmi-text/35 mt-2">
            CSV &middot; XLSX &middot; PNG / JPG &middot; mappen worden recursief gelezen
          </p>
        </div>
      </div>

      {/* Processing status */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 bg-dmi-primary/5 rounded-lg animate-pulse">
          <Loader2 className="w-5 h-5 text-dmi-primary animate-spin shrink-0" />
          <span className="text-sm text-dmi-text">{processingStatus}</span>
        </div>
      )}

      {/* Detected files list — clustered by type and year */}
      {detectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-xs text-dmi-text/50 uppercase tracking-wide">
              Gedetecteerde bestanden ({detectedFiles.length})
            </h4>
            <InfoTip text={SECTION_TOOLTIPS.detectedFiles} />
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {clusterFiles(detectedFiles).map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dmi-text/40">
                    {group.label}
                  </span>
                  <div className="flex-1 border-t border-dmi-text/10" />
                </div>
                <div className="space-y-1.5">
                  {group.files.map((df, i) => (
                    <FileResultCard key={i} detected={df} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Municipality and years info */}
      {municipality && detectedFiles.length > 0 && (
        <Card className="p-4 border-dmi-green/30 bg-dmi-green/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dmi-green/10">
              <FileCheck className="w-4 h-4 text-dmi-green" />
            </div>
            <div>
              <p className="font-semibold text-sm text-dmi-text">
                Gemeente: {municipalityName(municipality.name)} ({municipality.code})
              </p>
              <p className="text-xs text-dmi-text/50">
                Jaren: {years.join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Generate dashboard button */}
      {(hasData || hasNewFiles) && !isProcessing && (
        <div className="space-y-2 pt-1">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full h-12 text-base font-semibold bg-dmi-orange hover:bg-dmi-orange/90 text-white shadow-md shadow-dmi-orange/20 transition-all hover:shadow-lg hover:shadow-dmi-orange/25"
          >
            Dashboard genereren
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {hasData && detectedFiles.length > 0 && (
            <Button
              variant="outline"
              onClick={clear}
              className="w-full text-dmi-red border-dmi-red/30 hover:bg-dmi-red/5"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Alle data wissen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface FileGroup {
  label: string;
  sortKey: string;
  files: DetectedFile[];
}

function clusterFiles(files: DetectedFile[]): FileGroup[] {
  const groups = new Map<string, FileGroup>();

  for (const df of files) {
    const isAnpr = df.type === 'ANPR_CSV' || df.type === 'ANPR_LOOKUP';
    const isVesdi = df.type === 'ZENDINGEN' || df.type === 'DEELRITTEN' || df.type === 'CODETABEL_GEMEENTE' || df.type === 'CODETABEL_KLASSE' || df.type === 'VESDI_LOOKUP' || df.type === 'CODETABELLEN_GEMEENTE' || df.type === 'NUTS_SCHEMA';

    let category: string;
    if (isAnpr) category = 'ANPR';
    else if (isVesdi) category = 'VESDI Wegvervoersenquête';
    else category = 'Overig';

    const year = df.year ?? 0;
    // Try to extract municipality from filename for VESDI files
    let municipality = '';
    if (isVesdi) {
      const match = df.file.name.match(/_PC6_([A-Za-z\s''-]+?)_\d{4}/);
      if (match) municipality = match[1];
    }

    const key = `${category}|${year || ''}|${municipality}`;
    const yearStr = year ? ` ${year}` : '';
    const munStr = municipality ? ` — ${municipality}` : '';
    const label = `${category}${yearStr}${munStr}`;

    if (!groups.has(key)) {
      groups.set(key, { label, sortKey: `${category}|${String(year).padStart(4, '0')}|${municipality}`, files: [] });
    }
    groups.get(key)!.files.push(df);
  }

  return [...groups.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function FileResultCard({ detected }: { detected: DetectedFile }) {
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg border ${STATUS_STYLES[detected.status]}`}
    >
      {detected.status === 'error' ? (
        <AlertCircle className="w-4 h-4 shrink-0" />
      ) : (
        <FileCheck className="w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{detected.file.name}</p>
        <p className="text-xs opacity-70">{detected.message}</p>
      </div>
      <Badge className={`shrink-0 text-[10px] ${STATUS_BADGE[detected.status]}`}>
        {detected.type.replace(/_/g, ' ')}
      </Badge>
    </div>
  );
}
