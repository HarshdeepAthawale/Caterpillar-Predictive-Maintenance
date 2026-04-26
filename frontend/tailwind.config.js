/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0f1117',
        surface: '#1a1d2e',
        border:  '#2a2d3e',
        fg:      '#e0e0e0',
        muted:   '#888',
        blue:    '#4fc3f7',
        green:   '#66bb6a',
        orange:  '#ffa726',
        purple:  '#ab47bc',
        red:     '#ef5350',
        cyan:    '#26c6da',
      },
    },
  },
  plugins: [],
}
