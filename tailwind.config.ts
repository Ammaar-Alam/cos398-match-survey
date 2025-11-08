
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#dce9ff',
          200: '#b9d3ff',
          300: '#8ab8ff',
          400: '#5a97ff',
          500: '#2c74ff',
          600: '#1559db',
          700: '#0e43a8',
          800: '#0b357f',
          900: '#0a2d66'
        }
      }
    }
  },
  plugins: []
}
export default config
