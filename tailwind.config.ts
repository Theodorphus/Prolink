import type { Config } from 'tailwindcss'

/**
 * Typografi-, färg- och spacingskalan för Prolink.
 *
 * Manrope bär rubriker, Inter brödtext. Skalorna nedan speglar tokens i
 * globals.css så att både utility-klasser och CSS-variabler ger samma värden.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-body)', 'ui-sans-serif', 'sans-serif'],
      },

      fontSize: {
        // Typskala. Radhöjd och spärr följer graden: större text spärras tätare.
        'display-lg': ['4rem', { lineHeight: '1.04', letterSpacing: '-0.042em', fontWeight: '800' }],
        'display': ['3.5rem', { lineHeight: '1.06', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-sm': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.038em', fontWeight: '800' }],
        'section': ['2.5rem', { lineHeight: '1.14', letterSpacing: '-0.035em', fontWeight: '800' }],
        'section-sm': ['2rem', { lineHeight: '1.18', letterSpacing: '-0.032em', fontWeight: '800' }],
        'body-lg': ['1.125rem', { lineHeight: '1.78' }],
        'body': ['1rem', { lineHeight: '1.75' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.7' }],
      },

      colors: {
        ink: {
          DEFAULT: 'var(--ink-strong)',
          body: 'var(--ink-body)',
          muted: 'var(--ink-muted)',
          inverse: 'var(--ink-inverse)',
        },
        surface: {
          page: 'var(--surface-page)',
          card: 'var(--surface-card)',
          sunken: 'var(--surface-sunken)',
          inverse: 'var(--surface-inverse)',
        },
        line: {
          soft: 'var(--line-soft)',
          strong: 'var(--line-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          deep: 'var(--accent-deep)',
          tint: 'var(--accent-tint)',
        },
      },

      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        panel: 'var(--radius-panel)',
      },

      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        accent: 'var(--shadow-accent)',
      },

      spacing: {
        // 4px-bas. Sektionsrytmen använder 20/24 (80/96px) genomgående.
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },

      maxWidth: {
        prose: '68ch',
      },

      transitionTimingFunction: {
        out: 'cubic-bezier(.22, 1, .36, 1)',
        soft: 'cubic-bezier(.4, 0, .2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
