import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1600,
    host: true,
    proxy: {
      '/api': {
        target: 'https://ayphen-pm-toll-latest.onrender.com',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'https://ayphen-pm-toll-latest.onrender.com',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          'vendor-ui': ['antd', 'styled-components', 'lucide-react', 'framer-motion'],
          'vendor-charts': ['recharts', 'reactflow'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'react-beautiful-dnd', 'react-grid-layout'],
          'vendor-utils': ['axios', 'dayjs', 'date-fns', 'socket.io-client', '@tanstack/react-query']
        }
      }
    }
  }
})
