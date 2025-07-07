// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                           // listen on 0.0.0.0
    allowedHosts: true,                   // allow any host (dev only)
    proxy: {
      '/socket.io': {                     // forward WebSocket requests
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})