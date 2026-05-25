import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0C10',
        surface: '#12151C',
        elevated: '#1A1E2A',
        card: '#181C27',
        border: '#1F2535',
        'border-subtle': '#252B3B',
        accent: '#0099FF',
        'accent-muted': 'rgba(0,153,255,0.12)',
        teal: '#00E0D3',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F0F4FF',
        'text-secondary': '#8892A4',
        'text-tertiary': '#4B5563',
        background: '#0B0C10',
        foreground: '#F0F4FF',
        input: '#252B3B',
        ring: '#0099FF',
        muted: { DEFAULT: '#1A1E2A', foreground: '#8892A4' },
        destructive: { DEFAULT: '#EF4444', foreground: '#F0F4FF' },
        primary: { DEFAULT: '#0099FF', foreground: '#FFFFFF' },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        elevated: '0 4px 24px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(0,153,255,0.15)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
