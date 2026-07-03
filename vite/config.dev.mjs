import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    port: 9876,
    strictPort: true,
    // Escucha en todas las interfaces: el HMR funciona igual entrando por
    // localhost o por 127.0.0.1 (con host fijo, el websocket de HMR falla
    // desde el otro nombre y el navegador puede quedarse con módulos viejos)
    host: true,
  },
})
