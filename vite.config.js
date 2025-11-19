import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    allowedHosts: ["a7dbee3dc4c9.ngrok-free.app"],
  },
})