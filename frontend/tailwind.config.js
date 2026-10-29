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
        forest: {
          50: '#F2F6F3',
          100: '#E2EBE5',
          200: '#C5D7CC',
          300: '#9EBCAB',
          400: '#6E9C82',
          500: '#3D7957',
          600: '#1D5A3A',
          700: '#14462C',
          800: '#0C3520',
          900: '#082818',
          950: '#04180E',
        },
        cream: {
          50: '#FCFDFB',
          100: '#F7F8F5', // Signature luxury off-white
          200: '#F1F3ED',
          300: '#E5E8DF',
          400: '#D5DACE',
          500: '#B8C0AF',
        },
        champagne: {
          400: '#D4AF37',
          500: '#C5A059',
          600: '#B38B42',
        },
        brand: {
          50: '#F2F6F3',
          100: '#E2EBE5',
          200: '#C5D7CC',
          300: '#9EBCAB',
          400: '#4A8763',
          500: '#145334', // Rich deep green
          600: '#0E442A',
          700: '#0A3420', // Signature British racing deep green
          800: '#082919',
          900: '#051E12',
          950: '#03140B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

