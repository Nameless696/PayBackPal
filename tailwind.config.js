/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:        '#6C63FF',
        'primary-mid':  '#4F9EFF',
        'primary-bg':   'rgba(108,99,255,0.12)',
        success:        '#22C55E',
        error:          '#EF4444',
        warning:        '#F59E0B',
        'bg-body':      '#0F0F1A',
        'bg-card':      '#1A1A2E',
        'bg-surface':   '#242438',
        'text-1':       '#F1F0FF',
        'text-2':       '#B8B5D1',
        'text-muted':   '#6B6890',
        border:         '#2D2B45',
        // Light mode
        'light-bg':      '#F5F5FF',
        'light-card':    '#FFFFFF',
        'light-surface': '#EEF0FF',
        'light-text-1':  '#1A1A2E',
        'light-text-2':  '#4A4870',
        'light-border':  '#D8D5F5',
      },
    },
  },
  plugins: [],
};
