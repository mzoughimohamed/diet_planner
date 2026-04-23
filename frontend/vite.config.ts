import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/recipes': 'http://localhost:8000',
      '/meal-plans': 'http://localhost:8000',
      '/shopping-lists': 'http://localhost:8000',
      '/progress': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
    },
  },
})
