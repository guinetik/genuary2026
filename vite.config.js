import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    port: 5171,
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
});
