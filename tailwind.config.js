/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:        'rgb(var(--primary) / <alpha-value>)',
        'primary-mid':  'rgb(var(--primary-mid) / <alpha-value>)',
        success:        'rgb(var(--success) / <alpha-value>)',
        error:          'rgb(var(--error) / <alpha-value>)',
        warning:        'rgb(var(--warning) / <alpha-value>)',
        'bg-body':      'rgb(var(--bg-body) / <alpha-value>)',
        'bg-card':      'rgb(var(--bg-card) / <alpha-value>)',
        'bg-surface':   'rgb(var(--bg-surface) / <alpha-value>)',
        'text-1':       'rgb(var(--text-1) / <alpha-value>)',
        'text-2':       'rgb(var(--text-2) / <alpha-value>)',
        'text-muted':   'rgb(var(--text-muted) / <alpha-value>)',
        border:         'rgb(var(--border) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
