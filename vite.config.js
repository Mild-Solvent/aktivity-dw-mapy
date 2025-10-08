import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  server: {
    port: 3000
  },
  // Use different base paths: GitHub Pages subpath for build, root for dev
  base: command === 'build' ? '/aktivity-dw-mapy/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}))
