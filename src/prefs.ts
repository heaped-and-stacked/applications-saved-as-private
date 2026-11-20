// Small display preferences remembered in this browser, such as the calendar
// view. Not part of the data file. If browser storage is unavailable
// (private window, blocked), the app works with the defaults.

const KEY = 'asap.prefs';

export interface Prefs {
  calendarView: 'week' | 'month';
  closedOpen: boolean;
  listingOpen: boolean;
  /** Light or dark. Empty follows the system setting. */
  theme: '' | 'light' | 'dark';
}

const DEFAULTS: Prefs = { calendarView: 'week', closedOpen: false, listingOpen: false, theme: '' };

export function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

export function savePref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), [key]: value }));
  } catch {
    // Not remembered this time; nothing else depends on it.
  }
}
