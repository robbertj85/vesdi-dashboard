'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardCheck, X } from 'lucide-react';
import { useVesdiStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  SCALE,
  SURVEY_ITEMS,
  emptyAnswers,
  type Score,
  type SurveyAnswers,
  type SurveyItem,
} from '@/lib/survey';
import { ScaleInput } from './choice-inputs';
import { useVisibleTime } from '@/hooks/use-visible-time';

const DRAFT_KEY = 'vesdi-survey-draft';
export const SURVEY_PAGE = '/dashboard/enquete';

interface Draft {
  answers: SurveyAnswers;
  submittedId: string | null;
}

function loadDraft(): Draft {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      const base = emptyAnswers();
      const a = (parsed.answers ?? {}) as Partial<SurveyAnswers>;
      return {
        answers: {
          respondent: { ...base.respondent, ...a.respondent },
          ratings: { ...a.ratings },
          contract: { ...base.contract, ...a.contract },
          anpr: { ...base.anpr, ...a.anpr },
          opmerkingen: a.opmerkingen ?? '',
        },
        submittedId: parsed.submittedId ?? null,
      };
    }
  } catch {
    // corrupt or unavailable storage: start fresh
  }
  return { answers: emptyAnswers(), submittedId: null };
}

interface SurveyContextValue {
  items: SurveyItem[];
  answers: SurveyAnswers;
  submittedId: string | null;
  update: (fn: (a: SurveyAnswers) => SurveyAnswers) => void;
  setRating: (id: string, patch: Partial<{ score: Score | null; comment: string }>) => void;
  markSubmitted: (id: string) => void;
  reset: () => void;
  /** Start the page-by-page rating walk, at the first unrated item by default */
  startWalk: (fromItemId?: string) => void;
  walking: boolean;
}

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function useSurvey(): SurveyContextValue {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurvey must be used inside <SurveyProvider>');
  return ctx;
}

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasAnpr = useVesdiStore((s) => s.anprTables.size > 0);
  const hasVesdi = useVesdiStore((s) => s.years.length > 0);

  const items = useMemo(
    () => SURVEY_ITEMS.filter((i) => !i.requires || (i.requires === 'anpr' ? hasAnpr : hasVesdi)),
    [hasAnpr, hasVesdi]
  );

  // The dashboard only renders client-side (after IndexedDB hydration), so
  // reading localStorage in the initializer is safe.
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [walkIndex, setWalkIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage unavailable: answers live only in memory
    }
  }, [draft]);

  const update = useCallback(
    (fn: (a: SurveyAnswers) => SurveyAnswers) => setDraft((d) => ({ ...d, answers: fn(d.answers) })),
    []
  );
  const setRating = useCallback(
    (id: string, patch: Partial<{ score: Score | null; comment: string }>) =>
      update((a) => ({
        ...a,
        ratings: { ...a.ratings, [id]: { ...(a.ratings[id] ?? { score: null, comment: '' }), ...patch } },
      })),
    [update]
  );
  const markSubmitted = useCallback((id: string) => setDraft((d) => ({ ...d, submittedId: id })), []);
  const reset = useCallback(() => setDraft({ answers: emptyAnswers(), submittedId: null }), []);

  const startWalk = useCallback(
    (fromItemId?: string) => {
      const idx = fromItemId
        ? items.findIndex((i) => i.id === fromItemId)
        : items.findIndex((i) => draft.answers.ratings[i.id]?.score == null);
      setWalkIndex(Math.max(0, idx));
    },
    [items, draft.answers.ratings]
  );

  const finishWalk = useCallback(() => {
    setWalkIndex(null);
    router.push(`${SURVEY_PAGE}#afronding`);
  }, [router]);

  const item = walkIndex !== null ? items[walkIndex] ?? null : null;

  // Bring the respondent to the page being rated (item.page may carry a query string)
  const itemPath = item?.page.split('?')[0];
  useEffect(() => {
    if (item && itemPath !== pathname) router.push(item.page);
  }, [item, itemPath, pathname, router]);

  const value = useMemo<SurveyContextValue>(
    () => ({
      items,
      answers: draft.answers,
      submittedId: draft.submittedId,
      update,
      setRating,
      markSubmitted,
      reset,
      startWalk,
      walking: item !== null,
    }),
    [items, draft, update, setRating, markSubmitted, reset, startWalk, item]
  );

  return (
    <SurveyContext.Provider value={value}>
      {children}
      {item && walkIndex !== null && (
        <SurveyPanel
          key={item.id}
          item={item}
          index={walkIndex}
          total={items.length}
          onPage={itemPath === pathname}
          rating={draft.answers.ratings[item.id]}
          onRate={(patch) => setRating(item.id, patch)}
          onPrev={() => setWalkIndex((i) => (i === null || i === 0 ? i : i - 1))}
          onNext={() => (walkIndex + 1 < items.length ? setWalkIndex(walkIndex + 1) : finishWalk())}
          onClose={() => setWalkIndex(null)}
          ratedCount={items.filter((i) => draft.answers.ratings[i.id]?.score != null).length}
        />
      )}
    </SurveyContext.Provider>
  );
}

interface SurveyPanelProps {
  item: SurveyItem;
  index: number;
  total: number;
  onPage: boolean;
  rating: { score: Score | null; comment: string } | undefined;
  ratedCount: number;
  onRate: (patch: Partial<{ score: Score | null; comment: string }>) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/**
 * Docked, non-modal panel: unlike the tour, the page stays fully usable so the
 * respondent can scroll and explore before rating. The section being rated
 * (if any) gets a gold outline.
 */
function SurveyPanel({ item, index, total, onPage, rating, ratedCount, onRate, onPrev, onNext, onClose }: SurveyPanelProps) {
  // Mounted once per item (keyed by item id): measures time spent evaluating it
  useVisibleTime('survey', item.id);
  const [collapsed, setCollapsed] = useState(false);
  const [showComment, setShowComment] = useState(Boolean(rating?.comment));
  const [outline, setOutline] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const isLast = index === total - 1;
  const score = rating?.score ?? null;

  // Outline the section being rated and bring it into view
  useEffect(() => {
    if (!onPage) return;
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = item.target ? document.querySelector<HTMLElement>(`[data-tour="${item.target}"]`) : null;
      if (!item.target && !scrolled) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        scrolled = true;
      }
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        const next = { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
        setOutline((o) =>
          o && o.top === next.top && o.left === next.left && o.width === next.width && o.height === next.height ? o : next
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item, onPage]);

  return createPortal(
    <>
      {outline && onPage && (
        <div
          aria-hidden
          className="fixed z-[64] rounded-xl border-[3px] border-dmi-gold pointer-events-none transition-all duration-300"
          style={{ top: outline.top - 6, left: outline.left - 6, width: outline.width + 12, height: outline.height + 12 }}
        />
      )}
      <section
        aria-label="Enquête"
        className="fixed z-[65] bottom-5 right-5 w-[400px] max-w-[calc(100vw-40px)] bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4"
      >
        <div className="flex items-center gap-2.5 px-5 py-3 border-b-[3px] border-dmi-gold">
          <ClipboardCheck className="w-5 h-5 text-dmi-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-dmi-text/50">
              Enquête · onderdeel {index + 1} van {total}
            </p>
            <h2 className="font-condensed font-bold text-dmi-primary leading-tight line-clamp-2">{item.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Enquête uitklappen' : 'Enquête inklappen'}
            className="p-1 rounded-md text-dmi-text/50 hover:text-dmi-text hover:bg-dmi-bg"
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Enquête onderbreken"
            title="Onderbreken – je antwoorden blijven bewaard"
            className="p-1 rounded-md text-dmi-text/50 hover:text-dmi-text hover:bg-dmi-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!collapsed && (
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-semibold text-dmi-text leading-snug">{item.what}</p>
            <p className="text-xs text-dmi-text/60">
              Hoe waardevol is deze informatie voor je werk bij de gemeente?
            </p>
            <ScaleInput
              name={`Waardering ${item.title}`}
              options={SCALE}
              value={score}
              onChange={(v) => onRate({ score: v as Score })}
              allowNvt
            />
            {showComment ? (
              <textarea
                value={rating?.comment ?? ''}
                onChange={(e) => onRate({ comment: e.target.value })}
                placeholder="Waarvoor zou je dit gebruiken, of wat mist er? (optioneel)"
                rows={2}
                maxLength={1000}
                className="w-full rounded-lg border border-dmi-primary/20 px-3 py-2 text-sm outline-none focus:border-dmi-primary focus:ring-2 focus:ring-dmi-primary/15"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowComment(true)}
                className="text-xs font-medium text-dmi-primary/70 hover:text-dmi-primary underline underline-offset-2"
              >
                + Toelichting toevoegen
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-3 border-t border-dmi-primary/10">
          <span className="text-[11px] text-dmi-text/50">{ratedCount} beoordeeld</span>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={onPrev}
                className="flex items-center gap-0.5 rounded-lg border border-dmi-primary/15 pl-2 pr-3 py-2 text-sm font-medium text-dmi-primary hover:bg-dmi-bg"
              >
                <ChevronLeft className="w-4 h-4" />
                Vorige
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className={cn(
                'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                score == null
                  ? 'border border-dmi-primary/15 text-dmi-primary hover:bg-dmi-bg'
                  : 'bg-dmi-primary text-white hover:bg-dmi-primary/90'
              )}
            >
              {isLast ? 'Naar afronding' : score == null ? 'Overslaan' : 'Volgende'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>,
    document.body
  );
}
