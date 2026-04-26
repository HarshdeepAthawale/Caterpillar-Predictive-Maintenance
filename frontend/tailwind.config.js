/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Light ── */
        bg      : '#F7F7F8',
        surface : '#FFFFFF',
        border  : '#E8E8EC',
        fg      : '#0A0A0A',
        muted   : '#6E6E80',
        subtle  : '#A1A1AA',
        yellow  : '#FFCD11',
        success : '#17C964',
        warning : '#F5A524',
        danger  : '#F31260',
        info    : '#006FEE',
        violet  : '#7828C8',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },
      boxShadow: {
        card : '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        float: '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
