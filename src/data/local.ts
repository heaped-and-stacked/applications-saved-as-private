// The copy of the document kept in this browser.

const KEY = 'asap.document';
const BROKEN_KEY = 'asap.document.broken';

export function loadLocal(): string | null {
  return localStorage.getItem(KEY);
}

export function saveLocal(json: string): void {
  localStorage.setItem(KEY, json);
}

/** Keeps text that couldn't be read, so starting fresh never deletes it. */
export function keepBroken(json: string): void {
  localStorage.setItem(BROKEN_KEY, json);
}

/** Calls back when another tab of this app saves the document. */
export function onOtherTabSave(callback: (json: string) => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === KEY && event.newValue !== null) callback(event.newValue);
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}
