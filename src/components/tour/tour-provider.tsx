'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, X } from 'lucide-react';
import { useVesdiStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { TOUR_STEPS, type TourStep } from './tour-steps';

const SEEN_KEY = 'vesdi-tour-seen';
const AUTO_START_PATH = '/dashboard/voorblad';
const TARGET_TIMEOUT_MS = 5000;
const CARD_WIDTH = 400;
const GAP = 14;
const EDGE = 16;
const SPOT_PAD = 6;

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // storage unavailable: the tour may simply auto-start again next time
  }
}

interface TourContextValue {
  start: () => void;
  active: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>');
  return ctx;
}

/** Where the current step's target is, tagged with the step it was measured for. */
type Placement =
  | { stepId: string; mode: 'target'; rect: { top: number; left: number; width: number; height: number } }
  | { stepId: string; mode: 'center' };

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasAnpr = useVesdiStore((s) => s.anprTables.size > 0);
  const hasVesdi = useVesdiStore((s) => s.years.length > 0);

  const steps = useMemo(
    () =>
      TOUR_STEPS.filter(
        (s) => !s.requires || (s.requires === 'anpr' ? hasAnpr : hasVesdi)
      ),
    [hasAnpr, hasVesdi]
  );

  const [index, setIndex] = useState<number | null>(null);
  const step: TourStep | null = index !== null ? steps[index] ?? null : null;

  const start = useCallback(() => setIndex(0), []);
  const close = useCallback(() => {
    writeSeen();
    setIndex(null);
  }, []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : i + 1 < steps.length ? i + 1 : (writeSeen(), null))),
    [steps.length]
  );
  const prev = useCallback(() => setIndex((i) => (i === null || i === 0 ? i : i - 1)), []);

  // Offer the tour automatically on the first visit to the cover page
  useEffect(() => {
    if (pathname !== AUTO_START_PATH || readSeen()) return;
    const t = setTimeout(() => setIndex((i) => i ?? 0), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  // Bring the user to the page the step is about
  useEffect(() => {
    if (step?.page && step.page !== pathname) router.push(step.page);
  }, [step, pathname, router]);

  const value = useMemo(() => ({ start, active: step !== null }), [start, step]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {step && index !== null && (
        <TourOverlay
          key={step.id}
          step={step}
          index={index}
          total={steps.length}
          onPage={!step.page || step.page === pathname}
          onNext={next}
          onPrev={prev}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}

interface TourOverlayProps {
  step: TourStep;
  index: number;
  total: number;
  onPage: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

function TourOverlay({ step, index, total, onPage, onNext, onPrev, onClose }: TourOverlayProps) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [cardHeight, setCardHeight] = useState(240);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const isLast = index === total - 1;

  // Track the target element every frame (it may still be rendering, scrolling or resizing)
  useEffect(() => {
    if (!onPage) return;
    let raf = 0;
    let scrolled = false;
    const startedAt = performance.now();

    const tick = () => {
      const el = step.target
        ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
        : null;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport((v) => (v.w === vw && v.h === vh ? v : { w: vw, h: vh }));

      if (el) {
        if (!scrolled) {
          const r0 = el.getBoundingClientRect();
          el.scrollIntoView({ block: r0.height > vh * 0.6 ? 'start' : 'center', behavior: 'smooth' });
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        // Clip the spotlight to the viewport so a tall element doesn't push it off-screen
        const top = Math.max(r.top, 8);
        const bottom = Math.min(r.bottom, vh - 8);
        const rect = {
          top: Math.round(top),
          left: Math.round(Math.max(r.left, 8)),
          width: Math.round(Math.min(r.right, vw - 8) - Math.max(r.left, 8)),
          height: Math.round(Math.max(bottom - top, 24)),
        };
        setPlacement((p) =>
          p?.mode === 'target' &&
          p.rect.top === rect.top &&
          p.rect.left === rect.left &&
          p.rect.width === rect.width &&
          p.rect.height === rect.height
            ? p
            : { stepId: step.id, mode: 'target', rect }
        );
      } else if (!step.target || performance.now() - startedAt > TARGET_TIMEOUT_MS) {
        setPlacement((p) => (p?.mode === 'center' ? p : { stepId: step.id, mode: 'center' }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, onPage]);

  // Measure the card so it can be placed next to the target without overflowing
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCardHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [placement?.mode]);

  // Keyboard: ← / → to move, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  const ready = placement && placement.stepId === step.id;

  useEffect(() => {
    if (ready) primaryRef.current?.focus({ preventScroll: true });
  }, [ready]);

  const cardStyle = useMemo<React.CSSProperties>(() => {
    const w = Math.min(CARD_WIDTH, viewport.w - EDGE * 2);
    if (!ready || placement.mode === 'center') {
      return { width: w, left: (viewport.w - w) / 2, top: Math.max(EDGE, (viewport.h - cardHeight) / 2) };
    }
    const r = placement.rect;
    const h = cardHeight;
    const clampTop = (t: number) => Math.min(Math.max(t, EDGE), viewport.h - h - EDGE);
    const clampLeft = (l: number) => Math.min(Math.max(l, EDGE), viewport.w - w - EDGE);
    const right = viewport.w - (r.left + r.width);
    const below = viewport.h - (r.top + r.height);
    if (right >= w + GAP + EDGE) return { width: w, left: r.left + r.width + GAP, top: clampTop(r.top) };
    if (r.left >= w + GAP + EDGE) return { width: w, left: r.left - GAP - w, top: clampTop(r.top) };
    if (below >= h + GAP + EDGE) return { width: w, left: clampLeft(r.left), top: r.top + r.height + GAP };
    if (r.top >= h + GAP + EDGE) return { width: w, left: clampLeft(r.left), top: r.top - GAP - h };
    // Target fills the screen: float the card in the bottom-right corner
    return { width: w, left: viewport.w - w - EDGE * 2, top: viewport.h - h - EDGE * 2 };
  }, [ready, placement, viewport, cardHeight]);

  return createPortal(
    <div className="fixed inset-0 z-[70]" aria-live="polite">
      {/* Click shield: the page is not interactive during the tour */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Dim layer with a spotlight hole around the target */}
      {ready && placement.mode === 'target' ? (
        <div
          className="absolute rounded-xl border-[3px] border-dmi-gold pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: placement.rect.top - SPOT_PAD,
            left: placement.rect.left - SPOT_PAD,
            width: placement.rect.width + SPOT_PAD * 2,
            height: placement.rect.height + SPOT_PAD * 2,
            boxShadow: '0 0 0 9999px rgba(16, 33, 58, 0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(16,33,58,0.55)] pointer-events-none transition-opacity" />
      )}

      {ready && (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-body"
          className="absolute bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden transition-[top,left] duration-300 ease-out animate-in fade-in-0 zoom-in-95"
          style={cardStyle}
        >
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-[3px] border-dmi-gold">
            <GraduationCap className="w-5 h-5 text-dmi-gold shrink-0" />
            <h2 id="tour-title" className="flex-1 font-condensed font-bold text-lg text-dmi-primary leading-tight">
              {step.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Rondleiding sluiten"
              className="p-1 -m-1 rounded-md text-dmi-text/50 hover:text-dmi-text hover:bg-dmi-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <p id="tour-body" className="text-sm text-dmi-text/80 leading-relaxed">
              {step.body}
            </p>
            {isLast && (
              <Link
                href="/dashboard/enquete"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dmi-gold bg-dmi-gold/10 px-4 py-2.5 text-sm font-semibold text-dmi-primary hover:bg-dmi-gold/20 transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                Naar de enquête
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5 border-t border-dmi-primary/10">
            <div className="flex items-center gap-[3px] min-w-0" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-4 bg-dmi-gold' : i < index ? 'w-1.5 bg-dmi-primary' : 'w-1.5 bg-dmi-primary/20'
                  )}
                />
              ))}
            </div>
            <span className="sr-only">
              Stap {index + 1} van {total}
            </span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {index > 0 && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="flex items-center gap-0.5 rounded-lg border border-dmi-primary/15 pl-2 pr-3 py-2 text-sm font-medium text-dmi-primary hover:bg-dmi-bg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Vorige
                </button>
              )}
              <button
                ref={primaryRef}
                type="button"
                onClick={onNext}
                className="flex items-center gap-1 rounded-lg bg-dmi-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dmi-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dmi-gold focus-visible:ring-offset-2"
              >
                {isLast ? 'Afsluiten' : index === 0 ? 'Start' : 'Volgende'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
