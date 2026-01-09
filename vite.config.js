import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
        login: './login.html'
      },
      output: {
        // Static site, no dynamic imports
        inlineDynamicImports: true
      }
    }
  },
  // Ensure static site generation
  ssr: false,
  appType: 'mpa'  // Multi-Page Application
})