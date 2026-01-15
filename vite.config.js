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
      }
    }
  },
  // Ensure static site generation
  ssr: false,
  appType: 'mpa'  // Multi-Page Application
})