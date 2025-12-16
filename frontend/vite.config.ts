import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages deployment base path
// Set this to your repository name if deploying to GitHub Pages
// For example: '/SmartApp/' or '/' for root domain
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
