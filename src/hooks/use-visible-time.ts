'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/base-path';

/** Shorter visits are flicker from clicking through, not reading. */
const MIN_MS = 1000;

function send(kind: 'tour' | 'survey', step: string, ms: number) {
  if (ms < MIN_MS) return;
  // keepalive: still delivered when the page is being closed
  fetch(withBase('/api/survey/activity'), {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, step, ms: Math.round(ms) }),
  }).catch(() => {});
}

/**
 * Measure how long a tour step or survey item is on screen while the tab is
 * visible, and log it when the component unmounts (next step, closed) or the
 * page is closed. The server only stores it for invited respondents.
 */
export function useVisibleTime(kind: 'tour' | 'survey', step: string) {
  useEffect(() => {
    let total = 0;
    let since: number | null = document.visibilityState === 'visible' ? performance.now() : null;

    const pause = () => {
      if (since !== null) {
        total += performance.now() - since;
        since = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') since ??= performance.now();
      else pause();
    };
    const onPageHide = () => {
      pause();
      send(kind, step, total);
      total = 0;
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      pause();
      send(kind, step, total);
    };
  }, [kind, step]);
}
