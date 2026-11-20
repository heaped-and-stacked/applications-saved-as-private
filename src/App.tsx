import { createSignal, Show, useContext } from 'solid-js';
import { Router } from './router';
import { DataContext, DataProvider } from './data/store';
import DataMenu from './components/DataMenu';
import Logo from './components/Logo';
import SyncControls from './components/SyncControls';
import { SITE } from './site';
import { formatDay } from './format';
import { loadPrefs, savePref } from './prefs';
// The title font, served with the app (no request to Google Fonts).
import '@fontsource/outfit/latin-700.css';
import './theme.css';

export default function App() {
  return (
    <DataProvider>
      <Router>
        {(props) => (
          <>
            <TopBar />
            <Notice />
            <main class="page">{props.children}</main>
            <Footer />
          </>
        )}
      </Router>
    </DataProvider>
  );
}

function TopBar() {
  return (
    <header class="topbar">
      <a href="/" class="brand">
        <Logo />
        <span>
          ASAP <span class="brand-name">- Applications Saved as Private</span>
        </span>
      </a>
      <span class="topbar-date">{formatToday()}</span>
      <div class="topbar-end">
        <SyncControls />
        <ThemeButton />
        <DataMenu />
        <Show when={SITE.donateUrl}>
          <a
            class="button"
            href={SITE.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee (opens in a new tab)"
          >
            ☕ Buy me a coffee
          </a>
        </Show>
      </div>
    </header>
  );
}

function Notice() {
  const data = useContext(DataContext);
  return (
    <Show when={data.notice()}>
      <div class="notice" role="status">
        <p>{data.notice()}</p>
        <button type="button" onClick={() => data.setNotice('')}>
          OK
        </button>
      </div>
    </Show>
  );
}

function Footer() {
  return (
    <footer class="footer">
      <a href="/privacy">Privacy</a>
      <Show when={SITE.donateUrl}>
        <a href={SITE.donateUrl} target="_blank" rel="noopener noreferrer">
          ☕ Buy me a coffee
        </a>
      </Show>
    </footer>
  );
}

/** "Friday, 20 Nov 2026": the date the page was opened. */
function formatToday(): string {
  const now = new Date();
  return `${now.toLocaleDateString('en-GB', { weekday: 'long' })}, ${formatDay(now.toISOString())}`;
}

/** Switches between light and dark. Until then, the system setting decides. */
function ThemeButton() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = loadPrefs().theme;
  const [dark, setDark] = createSignal(saved ? saved === 'dark' : systemDark);
  if (saved) document.documentElement.dataset.theme = saved;

  function toggle() {
    const theme = dark() ? 'light' : 'dark';
    setDark(!dark());
    document.documentElement.dataset.theme = theme;
    savePref('theme', theme);
  }

  return (
    <button type="button" class="theme-button" onClick={toggle} title={dark() ? 'Light mode' : 'Dark mode'}>
      {dark() ? '☀' : '☾'}
    </button>
  );
}
