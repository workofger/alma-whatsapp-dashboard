import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './**/*.{js,ts,jsx,tsx}',
    '!./node_modules/**',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'wa-dark': '#0b141a',
        'wa-dark-paper': '#0b141a',
        'wa-panel': '#111b21',
        'wa-teal': '#00a884',
        'wa-teal-dark': '#008069',
        'wa-outgoing': '#005c4b',
        'wa-incoming': '#202c33',
        'wa-blue': '#53bdeb',
        'wa-green': '#25d366',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
