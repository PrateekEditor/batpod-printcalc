import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // '/' on Vercel. GitHub Pages serves project sites under /<repo>/, so the
  // Pages workflow sets VITE_BASE=/batpod-printcalc/.
  base: process.env.VITE_BASE || '/',
  // 5173 belongs to the admin.
  server: { port: 5174, strictPort: true },
  build: { outDir: 'dist' },
});
