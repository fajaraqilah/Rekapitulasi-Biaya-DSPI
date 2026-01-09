import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',      // default, tapi eksplisit lebih aman
    sourcemap: false     // disable source map di production
  }
})