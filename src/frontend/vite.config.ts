import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Prefer 5173 (whitelisted in backend CORS). Falls back to 5174 if busy.
    // Both are whitelisted. strictPort is intentionally omitted so startup
    // never fails just because a port is in use.
    port: 5173,

    // Proxy every /api/* and /health call through the dev server so the
    // browser never makes a cross-origin request during development.
    // This removes CORS as a failure mode entirely.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/predict': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})