import { createRouter } from '@solidjs/router';
import Home from './pages/Home';
import Application from './pages/Application';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import About from './pages/About';

// Plain browser history, so URLs look like /applications/…. GitHub Pages has
// no rewrites, so the build adds copies of index.html (see scripts/pages.mjs).
export const Router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/applications/:id', component: Application },
    { path: '/about', component: About },
    { path: '/privacy', component: Privacy },
    { path: '*404', component: NotFound },
  ],
});

