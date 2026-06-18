import { defineConfig } from 'vite';

export default defineConfig({
  // Base path para produção (ajuste se hospedar em subpasta)
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
