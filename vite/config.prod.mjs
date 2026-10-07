import { defineConfig } from 'vite'

const phasermsg = () => {
  return {
    name: 'phasermsg',
    buildStart() {
      process.stdout.write(`Building for production...\n`)
    },
    buildEnd() {
      const line = '---------------------------------------------------------'
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`
      process.stdout.write(`${line}\n${msg}\n${line}\n`)

      process.stdout.write(`✨ Done ✨\n`)
    },
  }
}

export default defineConfig({
  base: './',
  // Build de laboratorio (panel LAB + modos analógicos): solo con VITE_LAB=true,
  // que se define únicamente para las vistas previas de Vercel. En producción es
  // false y el código del laboratorio se elimina del bundle.
  define: {
    __LAB__: JSON.stringify(process.env.VITE_LAB === 'true'),
  },
  logLevel: 'warn',
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
  },
  server: {
    port: 8080,
  },
  plugins: [phasermsg()],
})
