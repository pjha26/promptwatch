import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-dim": "var(--color-surface-dim)",
        "surface-container": "var(--color-surface-container)",
        "inverse-surface": "var(--color-inverse-surface)",
        "on-primary-container": "var(--color-on-primary-container)",
        "on-tertiary-fixed-variant": "#484645",
        "on-tertiary-fixed": "#1d1b1a",
        "on-secondary-fixed-variant": "#92001c",
        "on-secondary": "#ffffff",
        "surface-tint": "#5f5e5e",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "on-error-container": "#93000a",
        "primary-fixed": "#e5e2e1",
        "surface": "var(--color-surface)",
        "on-error": "#ffffff",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "tertiary-fixed": "#e6e1df",
        "on-tertiary-container": "#868381",
        "secondary-fixed": "#ffdad8",
        "on-primary-fixed": "#1c1b1b",
        "tertiary-container": "#1d1b1a",
        "on-surface": "var(--color-on-surface)",
        "on-secondary-fixed": "#410007",
        "inverse-primary": "#c9c6c5",
        "secondary-container": "#db313f",
        "tertiary-fixed-dim": "#cac6c3",
        "on-secondary-container": "#fffbff",
        "secondary-fixed-dim": "#ffb3b1",
        "primary": "var(--color-primary)",
        "on-background": "var(--color-on-surface)",
        "primary-container": "#1c1b1b",
        "surface-bright": "var(--color-surface-bright)",
        "tertiary": "#000000",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "surface-container-high": "var(--color-surface-container-high)",
        "secondary": "var(--color-secondary)",
        "error": "var(--color-error)",
        "on-primary": "var(--color-on-primary)",
        "surface-container-low": "var(--color-surface-container-low)",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#474646",
        "inverse-on-surface": "#ebf1ff",
        "outline-variant": "var(--color-outline-variant)",
        "on-tertiary": "#ffffff",
        "outline": "var(--color-outline)",
        "surface-variant": "var(--color-surface-variant)",
        "background": "var(--color-background)",
        "primary-fixed-dim": "#c9c6c5"
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "full": "9999px"
      },
      spacing: {
        "margin-mobile": "20px",
        "unit": "4px",
        "margin-desktop": "64px",
        "gutter": "24px",
        "column-gap": "32px"
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)'],
        condensed: ['var(--font-barlow-condensed)'],
        mono: ['var(--font-dm-mono)'],
        "headline-lg": ["var(--font-barlow-condensed)", "sans-serif"],
        "data-mono": ["var(--font-dm-mono)", "monospace"],
        "section-header": ["var(--font-dm-sans)", "sans-serif"],
        "display-xl": ["var(--font-barlow-condensed)", "sans-serif"],
        "label-caps": ["var(--font-dm-sans)", "sans-serif"],
        "body-md": ["var(--font-dm-sans)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-barlow-condensed)", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["48px", {"lineHeight": "1.1", "letterSpacing": "0.04em", "fontWeight": "700"}],
        "data-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "-0.02em", "fontWeight": "500"}],
        "section-header": ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "700"}],
        "display-xl": ["72px", {"lineHeight": "1.1", "letterSpacing": "0.05em", "fontWeight": "700"}],
        "label-caps": ["11px", {"lineHeight": "12px", "letterSpacing": "0.08em", "fontWeight": "700"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg-mobile": ["36px", {"lineHeight": "1.1", "fontWeight": "700"}]
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
