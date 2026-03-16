import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        presisso: {
          dark: '#1A1A2E',
          gold: '#C4A35A',
          cream: '#FAF8F4',
          charcoal: '#2C2C2A',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F8F7F4',
          tertiary: '#F1EFE8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
