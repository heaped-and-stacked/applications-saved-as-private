import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

/**
 * The day the Privacy page last changed: the date of the last git commit that
 * touched it, so "Last updated" can't go stale. Falls back to today when git
 * has no answer (no history, or git missing).
 */
function privacyUpdated(): string {
  try {
    const day = execSync('git log -1 --follow --format=%cs -- src/pages/Privacy.tsx', { encoding: 'utf8' }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  } catch {
    // No git here: use today.
  }
  return new Date().toISOString().slice(0, 10);
}

// Turnkey mode: no index.html or mount file. The plugin builds the page from
// src/Document.tsx (the HTML shell) and src/App.tsx (the app).
// `vite build` writes a static site to dist/client.
export default defineConfig({
  plugins: [solid({ start: true, diagnostics: true })],
  define: { __PRIVACY_UPDATED__: JSON.stringify(privacyUpdated()) },
  server: { port: 3000 },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
