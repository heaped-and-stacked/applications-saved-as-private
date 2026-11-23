// After `vite build`: copies of index.html for GitHub Pages, which has no rewrites.
// - 404.html: any unknown path still loads the app, which then shows the right page.
// - about/ and privacy/: these pages answer with a normal 200 status, as Google
//   expects for the home page and privacy policy links on its consent screen.
import { copyFileSync, mkdirSync } from 'node:fs';

const dist = 'dist/client';
copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
for (const page of ['about', 'privacy']) {
  mkdirSync(`${dist}/${page}`, { recursive: true });
  copyFileSync(`${dist}/index.html`, `${dist}/${page}/index.html`);
}
