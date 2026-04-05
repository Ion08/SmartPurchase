import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          50: '#EAF4EF',
          100: '#D4E8DE',
          200: '#A9D0BD',
          300: '#7EB99C',
          400: '#53A27B',
          500: '#2D8B5A',
          600: '#24704A',
          700: '#1B4332',
          800: '#153427',
          900: '#10251D'
        },
        cream: '#F8F4E3',
        amber: '#F59E0B',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          muted: 'hsl(var(--surface-muted))',
          elevated: 'hsl(var(--surface-elevated))'
        },
        text: {
          DEFAULT: 'hsl(var(--text))',
          muted: 'hsl(var(--text-muted))'
        },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(11, 31, 23, 0.08)',
        insetSoft: 'inset 0 1px 0 rgba(255,255,255,0.6)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace']
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.75' }
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.45s ease-out',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
