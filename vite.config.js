import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths are required for Capacitor's locally bundled Android assets.
  base: './',
  plugins: [react()]
});
