export interface AccentTheme {
  id: string;
  name: string;
  colorHex: string;
  vars: {
    primary: string;
    hover: string;
    c50: string;
    c100: string;
    c200: string;
    c300: string;
    c400: string;
    c500: string;
    c700: string;
    c800: string;
    c900: string;
    rgb: string;
  };
}

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: 'blue',
    name: 'Blue',
    colorHex: '#2563eb',
    vars: {
      primary: '#2563eb',
      hover: '#1d4ed8',
      c50: '#eff6ff',
      c100: '#dbeafe',
      c200: '#bfdbfe',
      c300: '#93c5fd',
      c400: '#60a5fa',
      c500: '#3b82f6',
      c700: '#1d4ed8',
      c800: '#1e40af',
      c900: '#1e3a8a',
      rgb: '37, 99, 235',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    colorHex: '#059669',
    vars: {
      primary: '#059669',
      hover: '#047857',
      c50: '#ecfdf5',
      c100: '#d1fae5',
      c200: '#a7f3d0',
      c300: '#6ee7b7',
      c400: '#34d399',
      c500: '#10b981',
      c700: '#047857',
      c800: '#065f46',
      c900: '#064e3b',
      rgb: '5, 150, 105',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    colorHex: '#7c3aed',
    vars: {
      primary: '#7c3aed',
      hover: '#6d28d9',
      c50: '#f5f3ff',
      c100: '#ede9fe',
      c200: '#ddd6fe',
      c300: '#c4b5fd',
      c400: '#a78bfa',
      c500: '#8b5cf6',
      c700: '#6d28d9',
      c800: '#5b21b6',
      c900: '#4c1d95',
      rgb: '124, 58, 237',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colorHex: '#e11d48',
    vars: {
      primary: '#e11d48',
      hover: '#be123c',
      c50: '#fff1f2',
      c100: '#ffe4e6',
      c200: '#fecdd3',
      c300: '#fda4af',
      c400: '#fb7185',
      c500: '#f43f5e',
      c700: '#be123c',
      c800: '#9f1239',
      c900: '#881337',
      rgb: '225, 29, 72',
    },
  },
  {
    id: 'amber',
    name: 'Amber',
    colorHex: '#d97706',
    vars: {
      primary: '#d97706',
      hover: '#b45309',
      c50: '#fffbeb',
      c100: '#fef3c7',
      c200: '#fde68a',
      c300: '#fcd34d',
      c400: '#fbbf24',
      c500: '#f59e0b',
      c700: '#b45309',
      c800: '#92400e',
      c900: '#78350f',
      rgb: '217, 119, 6',
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    colorHex: '#0d9488',
    vars: {
      primary: '#0d9488',
      hover: '#0f766e',
      c50: '#f0fdfa',
      c100: '#ccfbf1',
      c200: '#99f6e4',
      c300: '#5eead4',
      c400: '#2dd4bf',
      c500: '#14b8a6',
      c700: '#0f766e',
      c800: '#115e59',
      c900: '#134e4a',
      rgb: '13, 148, 136',
    },
  },
  {
    id: 'zinc',
    name: 'Zinc',
    colorHex: '#3f3f46',
    vars: {
      primary: '#27272a',
      hover: '#18181b',
      c50: '#f4f4f5',
      c100: '#e4e4e7',
      c200: '#d4d4d8',
      c300: '#a1a1aa',
      c400: '#71717a',
      c500: '#52525b',
      c700: '#27272a',
      c800: '#18181b',
      c900: '#09090b',
      rgb: '39, 39, 42',
    },
  },
];

export const applyAccentTheme = (accentId: string): void => {
  const theme = ACCENT_THEMES.find(t => t.id === accentId) || ACCENT_THEMES[0];
  const root = document.documentElement;

  root.style.setProperty('--accent-primary', theme.vars.primary);
  root.style.setProperty('--accent-hover', theme.vars.hover);
  root.style.setProperty('--accent-50', theme.vars.c50);
  root.style.setProperty('--accent-100', theme.vars.c100);
  root.style.setProperty('--accent-200', theme.vars.c200);
  root.style.setProperty('--accent-300', theme.vars.c300);
  root.style.setProperty('--accent-400', theme.vars.c400);
  root.style.setProperty('--accent-500', theme.vars.c500);
  root.style.setProperty('--accent-700', theme.vars.c700);
  root.style.setProperty('--accent-800', theme.vars.c800);
  root.style.setProperty('--accent-900', theme.vars.c900);
  root.style.setProperty('--accent-rgb', theme.vars.rgb);

  // Dynamic card border and tag border resembling accent color
  root.style.setProperty('--accent-card-border', `rgba(${theme.vars.rgb}, 0.22)`);
  root.style.setProperty('--accent-card-border-hover', `rgba(${theme.vars.rgb}, 0.45)`);
  root.style.setProperty('--accent-tag-bg', `rgba(${theme.vars.rgb}, 0.14)`);
  root.style.setProperty('--accent-tag-border', `rgba(${theme.vars.rgb}, 0.4)`);
  root.style.setProperty('--accent-tag-text', theme.vars.c300);
};
