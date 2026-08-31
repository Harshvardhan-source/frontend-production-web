import { useEffect, useRef } from 'react';

/**
 * Calls `fn` immediately and then every `intervalMs`, but only while the tab
 * is actually visible — background-mounted keep-alive pages (see App.jsx's
 * KEEP_ALIVE_ROUTES) should not keep polling the server when hidden.
 */
export default function usePolling(fn, intervalMs, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let timer = null;

    const tick = () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        fnRef.current();
      }
      timer = setTimeout(tick, intervalMs);
    };

    tick();

    const onVisible = () => {
      if (document.visibilityState === 'visible') fnRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);
}
