/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '.dark'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#ffffff',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#121214',
        },
        brand: {
          50: 'var(--accent-50, #eff6ff)',
          100: 'var(--accent-100, #dbeafe)',
          200: 'var(--accent-200, #bfdbfe)',
          300: 'var(--accent-300, #93c5fd)',
          400: 'var(--accent-400, #60a5fa)',
          500: 'var(--accent-500, #3b82f6)',
          600: 'var(--accent-primary, #2563eb)',
          700: 'var(--accent-hover, #1d4ed8)',
          800: 'var(--accent-800, #1e40af)',
          900: 'var(--accent-900, #1e3a8a)',
        },
        accent: {
          light: 'var(--accent-50, #eff6ff)',
          border: 'var(--accent-200, #bfdbfe)',
          text: 'var(--accent-hover, #1d4ed8)',
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'drawer': '-4px 0 24px rgba(15, 23, 42, 0.12)',
        'popup': '0 4px 20px -2px rgba(15, 23, 42, 0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
