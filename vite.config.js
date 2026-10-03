import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 5173 belongs to the admin.
  server: { port: 5174, strictPort: true },
  build: { outDir: 'dist' },
});
