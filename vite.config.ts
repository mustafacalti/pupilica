import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api/emotion': {
        target: 'http://40.66.54.232:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/emotion/, '')
      }
    }
  },
});
