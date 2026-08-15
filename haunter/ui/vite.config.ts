import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig } from 'vitest/config';
import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    solid({ start: true, extensions: ['.jsx', '.tsx'] }),
    fileRoutes({ types: true }),
  ],
  resolve: {
    conditions: ['solid', 'browser', 'import', 'module'],
  },
  ssr: {
    noExternal: ['solid-icons', 'solid-icons/io'],
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest-setup.ts'],
    isolate: false,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
