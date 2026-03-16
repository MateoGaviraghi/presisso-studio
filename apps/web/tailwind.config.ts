import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        presisso: {
          red: '#D42B2B',
          'red-hover': '#B82424',
          'red-light': '#FDF2F2',
          black: '#1A1A1A',
          charcoal: '#333333',
          gray: '#6B6B6B',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#FAFAF9',
          tertiary: '#F5F5F3',
        },
        border: {
          DEFAULT: '#E5E5E5',
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
