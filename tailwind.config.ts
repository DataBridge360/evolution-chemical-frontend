import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: {
          DEFAULT: 'hsl(var(--background))',
          100: 'var(--ds-background-100)',
          200: 'var(--ds-background-200)',
        },
        foreground: 'hsl(var(--foreground))',
        'context-card-border': 'var(--context-card-border)',
        'geist-foreground': 'var(--geist-foreground)',
        error: 'var(--geist-error)',
        accents: {
          2: 'var(--accents-2)',
          5: 'var(--ds-gray-900)',
        },
        'gray-alpha': {
          100: 'var(--ds-gray-alpha-100)',
          200: 'var(--ds-gray-alpha-200)',
          300: 'var(--ds-gray-alpha-300)',
          400: 'var(--ds-gray-alpha-400)',
          500: 'var(--ds-gray-alpha-500)',
          600: 'var(--ds-gray-alpha-600)',
        },
        gray: {
          100: 'var(--ds-gray-100)',
          200: 'var(--ds-gray-200)',
          400: 'var(--ds-gray-400)',
          700: 'var(--ds-gray-700)',
          900: 'var(--ds-gray-900)',
          1000: 'var(--ds-gray-1000)',
          '1000-h': 'var(--ds-gray-1000-h)',
        },
        blue: {
          700: 'var(--ds-blue-700)',
          900: 'var(--ds-blue-900)',
        },
        red: {
          800: 'var(--ds-red-800)',
          900: 'var(--ds-red-900)',
          '900-alpha-160': 'var(--ds-red-900-alpha-160)',
        },
        amber: {
          800: 'var(--ds-amber-800)',
          850: 'var(--ds-amber-850)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'focus-calendar-date': 'var(--ds-focus-calendar-date-ring)',
        'focus-ring': 'var(--ds-focus-ring)',
        'border-small': 'var(--ds-shadow-border-small)',
        border: 'var(--ds-shadow-border)',
        'border-medium': 'var(--ds-shadow-border-medium)',
        'border-large': 'var(--ds-shadow-border-large)',
        tooltip: 'var(--ds-shadow-tooltip)',
        menu: 'var(--ds-shadow-menu)',
        modal: 'var(--ds-shadow-modal)',
        fullscreen: 'var(--ds-shadow-fullscreen)',
        'focus-input': 'var(--ds-input-ring)',
        'error-input': 'var(--ds-input-error-ring)',
        'error-input-hover': 'var(--ds-input-error-hover-ring)',
      },
      keyframes: {
        'fade-spin': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.15' },
        },
      },
      animation: {
        'fade-spin': 'fade-spin 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
