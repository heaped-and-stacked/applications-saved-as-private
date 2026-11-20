import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

// Turnkey mode: no index.html or mount file. The plugin builds the page from
// src/Document.tsx (the HTML shell) and src/App.tsx (the app).
// `vite build` writes a static site to dist/client.
export default defineConfig({
  plugins: [solid({ start: true, diagnostics: true })],
  server: { port: 3000 },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
