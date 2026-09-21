import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { applyAccentTheme } from '../utils/accentThemes';
import { readString, writeString } from '../utils/storage';
import { track } from '../lib/analytics';

/**
 * Theme and accent live in their own context.
 *
 * They used to sit in AppContext, so flipping the theme invalidated a context
 * that all ~45 members of the app consume, re-rendering every one of the 225
 * company cards on a change that CSS variables already handle. Splitting them
 * out is what makes the switch cheap.
 */

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readString('uae_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    // Light unless they ask for dark. The system preference is not followed:
    // this is read in daylight on a campus far more often than at night, and a
    // visitor whose laptop is set to dark was getting a theme nobody chose.
    return 'light';
  });

  useEffect(() => {
    writeString('uae_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    track('theme_toggled', { theme: next });

    const root = document.documentElement;
    const reduced = (() => {
      try {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      } catch {
        return false;
      }
    })();

    // The View Transition cross-fades a snapshot of the page; suppressing the
    // live DOM's own transitions for the duration stops both animating at
    // once, which is what made the switch smear.
    const canViewTransition = 'startViewTransition' in document && !reduced;

    if (!canViewTransition) {
      root.setAttribute('data-theme-switching', '');
      setTheme(next);
      window.setTimeout(() => root.removeAttribute('data-theme-switching'), 260);
      return;
    }

    root.setAttribute('data-theme-switching', '');
    const transition = (
      document as unknown as {
        startViewTransition: (cb: () => void) => { finished: Promise<void> };
      }
    ).startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.finished
      .catch(() => undefined)
      .finally(() => root.removeAttribute('data-theme-switching'));
  }, [theme]);

  const [accentColor, setAccentColorState] = useState<string>(
    () => readString('uae_accent_color') ?? 'blue'
  );

  useEffect(() => {
    applyAccentTheme(accentColor);
  }, [accentColor]);

  const setAccentColor = useCallback((id: string) => {
    setAccentColorState(id);
    writeString('uae_accent_color', id);
    applyAccentTheme(id);
    track('accent_changed', { accent: id });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, accentColor, setAccentColor }),
    [theme, toggleTheme, accentColor, setAccentColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
