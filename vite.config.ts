import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const inPkg = (id: string, pkgs: string[]) => pkgs.some((p) => id.includes(`/node_modules/${p}/`));

export default defineConfig({
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  preview: { port: 5175, strictPort: true },
  build: {
    // vendor-three (three + r3f + drei) ~1.3 MB là không thể tránh; nâng ngưỡng cảnh báo cho chunk này
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(rawId: string) {
          const id = rawId.replace(/\\/g, '/');
          if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) return 'vendor-react';
          if (inPkg(id, ['react', 'react-dom', 'scheduler'])) return 'vendor-react';
          if (inPkg(id, ['three', '@react-three/fiber', '@react-three/drei'])) return 'vendor-three';
          if (inPkg(id, ['lucide-react', 'framer-motion'])) return 'vendor-ui';
          return undefined;
        },
      },
    },
  },
});
