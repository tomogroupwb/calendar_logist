import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Для GitHub Pages нужно указать базовый путь
  base: process.env.NODE_ENV === 'production' ? '/calendar_logist/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
