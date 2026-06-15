import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev: proxy al backend. Por defecto `php artisan serve` (CLI tiene pdo_pgsql).
  // Laragon Apache: VITE_API_PROXY=http://localhost/Hotel/backend/public
  const apiTarget = env.VITE_API_PROXY ?? 'http://127.0.0.1:8000'

  return {
  // En build, Nginx sirve desde /var/www/html/public/app/ (los chunks dinámicos
  // de Vite necesitan este prefijo). En dev no hay Nginx, así que servimos en '/'.
  base: command === 'build' ? '/app/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ names }) => {
          if (names[0]?.endsWith('.css')) return 'assets/index.css'
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-dateFns':['date-fns'],
          'vendor-echo':   ['laravel-echo', 'pusher-js'],
        },
      },
    },
  },
  server: {
    port: 3007,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/sanctum': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
}})
