import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://CloudCampus-ALB-1161527073.us-east-1.elb.amazonaws.com',
        changeOrigin: true,
      },
    },
  },
});
