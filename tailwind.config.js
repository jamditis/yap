/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        'terminal-black': '#0c0c0c',
        'terminal-green': '#00ff41',
        'terminal-green-dim': '#008f11',
        'terminal-gray': '#1a1a1a',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ff41' },
          '100%': { boxShadow: '0 0 20px #00ff41, 0 0 10px #00ff41' },
        }
      }
    },
  },
  plugins: [],
}
