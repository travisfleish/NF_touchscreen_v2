/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        genius: {
          blue: '#0000dc',
          dark: '#0000a0',
          deeper: '#00008a',
          light: '#2222ff',
          muted: 'rgba(0,0,220,0.6)',
        },
      },
      fontFamily: {
        display: ['Klarheit', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['RedHatText', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '1' }],
        '11xl': ['12rem', { lineHeight: '1' }],
      },
      backgroundImage: {
        'blue-radial': 'radial-gradient(ellipse at center, #0000ff 0%, #0000a0 60%, #000070 100%)',
      },
    },
  },
  plugins: [],
}
