import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  // Custom domain - use root base path
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure public assets are copied properly
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: undefined
      }
    }
  },
  // Ensure all public assets including CNAME and manifest are copied
  publicDir: 'public'
})
