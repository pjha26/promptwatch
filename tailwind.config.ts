import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)'],
        condensed: ['var(--font-barlow-condensed)'],
        mono: ['var(--font-dm-mono)'],
      },
      colors: {
        editorial: {
          white: '#FFFFFF',
          black: '#0A0A0A',
          red: '#E63946',
          grey: '#6B7280',
          light: '#E5E5E5'
        }
      },
      animation: {
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
