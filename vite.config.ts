import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // opentype.js and paper are large and never change between deploys, so they
    // get their own chunks and stay in the browser cache across releases.
    rollupOptions: {
      output: {
        manualChunks: {
          fontlib: ['opentype.js'],
          geometry: ['paper'],
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});
