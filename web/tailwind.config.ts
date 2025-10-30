import type { Config } from 'tailwindcss'

export default {
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1e40af',
          light: '#60a5fa'
        }
      }
    }
  },
  plugins: []
} satisfies Config


