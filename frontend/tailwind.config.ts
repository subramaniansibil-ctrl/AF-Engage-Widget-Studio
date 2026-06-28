import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#071f35',
        mist: '#f3f8fb',
        sage: '#00a878',
        coral: '#ef5b5b',
        gold: '#f2b84b',
        ocean: '#006a8e',
        sky: '#d7f1f4',
      },
      boxShadow: {
        panel: '0 22px 70px rgba(7, 31, 53, 0.14)',
        glass: '0 20px 60px rgba(7, 31, 53, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.62)',
      },
    },
  },
  plugins: [],
} satisfies Config;
