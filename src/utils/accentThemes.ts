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
    id: 'sage',
    name: 'Soft Sage',
    colorHex: '#5b9279',
    vars: {
      primary: '#5b9279',
      hover: '#487661',
      c50: '#f2f7f4',
      c100: '#e1ede6',
      c200: '#c5dbd0',
      c300: '#9ec1b0',
      c400: '#75a68e',
      c500: '#5b9279',
      c700: '#487661',
      c800: '#3a5f4f',
      c900: '#304f42',
      rgb: '91, 146, 121',
    },
  },
  {
    id: 'lavender',
    name: 'Soft Lavender',
    colorHex: '#8b85ca',
    vars: {
      primary: '#8b85ca',
      hover: '#736cb7',
      c50: '#f5f4fc',
      c100: '#eae8f9',
      c200: '#d7d4f3',
      c300: '#bcb8e9',
      c400: '#9f99db',
      c500: '#8b85ca',
      c700: '#736cb7',
      c800: '#5f5898',
      c900: '#4e487c',
      rgb: '139, 133, 202',
    },
  },
  {
    id: 'blush',
    name: 'Dusty Rose',
    colorHex: '#c9707e',
    vars: {
      primary: '#c9707e',
      hover: '#ad5865',
      c50: '#fdf4f5',
      c100: '#fbe8eb',
      c200: '#f6d3d9',
      c300: '#eeb2bc',
      c400: '#dc8d9c',
      c500: '#c9707e',
      c700: '#ad5865',
      c800: '#8f4753',
      c900: '#773c46',
      rgb: '201, 112, 126',
    },
  },
  {
    id: 'sky',
    name: 'Pastel Sky',
    colorHex: '#38bdf8',
    vars: {
      primary: '#0284c7',
      hover: '#0369a1',
      c50: '#f0f9ff',
      c100: '#e0f2fe',
      c200: '#bae6fd',
      c300: '#7dd3fc',
      c400: '#38bdf8',
      c500: '#0ea5e9',
      c700: '#0369a1',
      c800: '#075985',
      c900: '#0c4a6e',
      rgb: '56, 189, 248',
    },
  },
  {
    id: 'sand',
    name: 'Warm Sand',
    colorHex: '#b48342',
    vars: {
      primary: '#b48342',
      hover: '#95682e',
      c50: '#fdf9f3',
      c100: '#f9f1e3',
      c200: '#f2e1c3',
      c300: '#e7cc9c',
      c400: '#d2ab6c',
      c500: '#b48342',
      c700: '#95682e',
      c800: '#795328',
      c900: '#644423',
      rgb: '180, 131, 66',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    colorHex: '#c86545',
    vars: {
      primary: '#c86545',
      hover: '#a84f33',
      c50: '#fdf5f2',
      c100: '#fbe8e2',
      c200: '#f7d3c7',
      c300: '#efb4a1',
      c400: '#e1896e',
      c500: '#c86545',
      c700: '#a84f33',
      c800: '#8a412b',
      c900: '#723827',
      rgb: '200, 101, 69',
    },
  },
  {
    id: 'indigo',
    name: 'Soft Indigo',
    colorHex: '#6366f1',
    vars: {
      primary: '#6366f1',
      hover: '#4f46e5',
      c50: '#eef2ff',
      c100: '#e0e7ff',
      c200: '#c7d2fe',
      c300: '#a5b4fc',
      c400: '#818cf8',
      c500: '#6366f1',
      c700: '#4338ca',
      c800: '#3730a3',
      c900: '#312e81',
      rgb: '99, 102, 241',
    },
  },
  {
    id: 'mint',
    name: 'Seafoam Mint',
    colorHex: '#34d399',
    vars: {
      primary: '#10b981',
      hover: '#059669',
      c50: '#ecfdf5',
      c100: '#d1fae5',
      c200: '#a7f3d0',
      c300: '#6ee7b7',
      c400: '#34d399',
      c500: '#10b981',
      c700: '#047857',
      c800: '#065f46',
      c900: '#064e3b',
      rgb: '52, 211, 153',
    },
  },
  {
    id: 'zinc',
    name: 'Slate Zinc',
    colorHex: '#71717a',
    vars: {
      primary: '#52525b',
      hover: '#3f3f46',
      c50: '#f4f4f5',
      c100: '#e4e4e7',
      c200: '#d4d4d8',
      c300: '#a1a1aa',
      c400: '#71717a',
      c500: '#52525b',
      c700: '#3f3f46',
      c800: '#27272a',
      c900: '#18181b',
      rgb: '113, 113, 122',
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
