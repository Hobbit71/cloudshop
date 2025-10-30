import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration with sensible defaults and Vitest config
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    sourcemap: true,
    target: 'es2020',
    chunkSizeWarningLimit: 800
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'zustand', 'zod', 'axios']
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})

