import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06263d',
        mist: '#f4f8f8',
        sage: '#00a76f',
        coral: '#df4f5f',
        gold: '#e7ad35',
        ocean: '#006f84',
        sky: '#dff3f1',
      },
      boxShadow: {
        panel: '0 12px 36px rgba(6, 38, 61, 0.09)',
        glass: '0 16px 42px rgba(6, 38, 61, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
      },
    },
  },
  plugins: [],
} satisfies Config;
