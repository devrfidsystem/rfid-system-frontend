import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const palette = {
  primary: {
    50: 'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    200: 'var(--color-primary-200)',
    300: 'var(--color-primary-300)',
    400: 'var(--color-primary-400)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)',
    800: 'var(--color-primary-800)',
    900: 'var(--color-primary-900)'
  },
  secondary: {
    500: 'var(--color-secondary-500)',
    600: 'var(--color-secondary-600)'
  },
  success: {
    50: 'var(--color-success-50)',
    500: 'var(--color-success-500)',
    600: 'var(--color-success-600)'
  },
  error: {
    50: 'var(--color-error-50)',
    500: 'var(--color-error-500)',
    600: 'var(--color-error-600)'
  },
  warning: {
    50: 'var(--color-warning-50)',
    500: 'var(--color-warning-500)',
    600: 'var(--color-warning-600)'
  },
  gray: {
    50: 'var(--color-gray-50)',
    100: 'var(--color-gray-100)',
    200: 'var(--color-gray-200)',
    300: 'var(--color-gray-300)',
    400: 'var(--color-gray-400)',
    500: 'var(--color-gray-500)',
    600: 'var(--color-gray-600)',
    700: 'var(--color-gray-700)',
    800: 'var(--color-gray-800)',
    900: 'var(--color-gray-900)'
  }
};

const config: Config = {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...palette,
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--surface) / <alpha-value>)',
        'text-default': 'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'border-default': 'rgb(var(--border) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        sm: '0 1px 2px rgba(var(--shadow-sm-opacity, 15 23 42) / 0.05)',
        md: '0 6px 18px rgba(var(--shadow-md-opacity, 15 23 42) / 0.06)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)'
      }
    }
  },
  plugins: []
};

export default config;
