import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Static site, no dynamic imports
        inlineDynamicImports: true
      }
    }
  },
  // Ensure static site generation
  ssr: false,
  appType: 'spa'  // Single Page Application
})