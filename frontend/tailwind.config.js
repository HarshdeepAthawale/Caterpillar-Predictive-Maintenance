/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cat: {
          yellow: '#FFCD11',
          dark:   '#1C1C1C',
          gray:   '#4B5563',
        },
        bg:      '#F3F4F6',
        surface: '#FFFFFF',
        border:  '#E5E7EB',
        fg:      '#111827',
        muted:   '#6B7280',
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',
        info:    '#2563EB',
        purple:  '#7C3AED',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 12px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
