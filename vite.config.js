import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  // GitHub Pages base path
  base: '/aktivity-dw-mapy/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
