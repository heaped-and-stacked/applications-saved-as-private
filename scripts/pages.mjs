// After `vite build`: copies of index.html for GitHub Pages, which has no rewrites.
// - 404.html: any unknown path still loads the app, which then shows the right page.
// - privacy/index.html: the privacy page answers with a normal 200 status, as
//   Google expects for the privacy policy link on its sign-in consent screen.
import { copyFileSync, mkdirSync } from 'node:fs';

const dist = 'dist/client';
copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
mkdirSync(`${dist}/privacy`, { recursive: true });
copyFileSync(`${dist}/index.html`, `${dist}/privacy/index.html`);
