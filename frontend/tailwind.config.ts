import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17212f',
        mist: '#eef3f7',
        sage: '#5a7f71',
        coral: '#dc6b57',
        gold: '#c7933d',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(23, 33, 47, 0.10)',
      },
    },
  },
  plugins: [],
} satisfies Config;
