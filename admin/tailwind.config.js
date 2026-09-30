/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        side: '#1E231F',
        'side-2': '#2A302B',
        cream: '#EFE8DC',
        brand: { DEFAULT: '#B4532A', dark: '#96431F', light: '#F6E7DF' },
        ink: '#23201D',
        muted: '#7C746B',
        line: '#E9E5DE',
        canvas: '#F6F5F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(20,18,15,.04), 0 4px 16px rgba(20,18,15,.04)' },
    },
  },
  plugins: [],
};
