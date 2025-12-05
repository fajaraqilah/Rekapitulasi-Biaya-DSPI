import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    allowedHosts: ["8d28491fc94a.ngrok-free.app"],
  },
})