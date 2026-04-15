import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark': '#0f0f0f',
        'dark-secondary': '#1a1a1a',
        'dark-tertiary': '#222222',
        'dark-input': '#151515',
        'dark-subtle': '#2a2a2a',
        'dark-primary': '#f5f5f5',
        'dark-muted': '#6b7280',
        'status': {
          'success': '#22c55e',
          'warning': '#f97316',
          'critical': '#ef4444',
          'info': '#06b6d4',
          'accent': '#3b82f6',
        }
      },
      borderColor: {
        'dark-subtle': '#2a2a2a',
      },
      backgroundColor: {
        'dark': '#0f0f0f',
        'dark-secondary': '#1a1a1a',
        'dark-input': '#151515',
      },
      textColor: {
        'dark-primary': '#f5f5f5',
        'dark-secondary': '#a0aec0',
        'dark-muted': '#6b7280',
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
