import { useEffect, useState } from 'react';

/**
 * Subscribes to a media query.
 *
 * Used so the desktop drawer and the mobile bottom sheet are mounted
 * exclusively. Previously both rendered at every breakpoint with one merely
 * `display:none` — which meant two `role="dialog"` elements open at once, the
 * hidden one stealing focus and breaking the focus trap, plus two Leaflet
 * instances' worth of setup for one visible panel.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `md` breakpoint. */
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 48rem)');
