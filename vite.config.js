import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    // There is no PHP in `npm run dev`, so /api/* and the uploaded photos
    // under /tracks/ have nowhere to go and the trail grid comes up empty.
    // Borrowing the live backend is what the README already suggests doing by
    // hand; this makes it the default. Note that it is the *live* backend —
    // sign in from a dev session deliberately or not at all.
    proxy: {
      '/api': { target: 'https://aktivity.ceaeurope.sk', changeOrigin: true, secure: true },
      '/tracks': { target: 'https://aktivity.ceaeurope.sk', changeOrigin: true, secure: true }
    }
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
