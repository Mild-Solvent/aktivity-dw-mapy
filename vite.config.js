import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  // Use root path - let the trackLoader handle path adjustments
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
