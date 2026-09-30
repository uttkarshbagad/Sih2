/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b192c',
          dark: '#1e3e62',
          blue: '#008dda',
          light: '#f1f5f9',
          card: '#132a48',
          border: '#1f487e'
        },
        risk: {
          low: '#10b981',
          moderate: '#f59e0b',
          high: '#f97316',
          veryHigh: '#ef4444',
          heavyRain: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        odia: ['Noto Sans Oriya', 'sans-serif']
      }
    },
  },
  plugins: [],
}
