import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/index.css'
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
        target: 'http://localhost',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
}))
