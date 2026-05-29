
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        vic: {
          bg: '#06090e',
          surface: '#0d131a',
          accent: '#4fd1c5',
          accentDark: '#319795',
          text: '#e2e8f0',
          muted: '#64748b',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
