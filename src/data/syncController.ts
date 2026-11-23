// Connects the sync logic (sync.ts) to the app: who is signed in, whether the
// local copy has changes Drive doesn't have, and what to ask on a conflict.
import { createMemo, createSignal, onSettled } from 'solid-js';
import { emptyDocument, readDocument, writeDocument } from './document';
import { googleAuth, loadGoogle } from './google';
import type { AsapDocument } from './model';
import { driveRemote, type RemoteFile } from './remote';
import { hashText, hasLocalChanges, isAccountSwitch, keepLocal, keepRemote, NO_SYNC, sync, type Local, type SyncState } from './sync';

const KEY = 'asap.sync';

export interface Conflict {
  file: RemoteFile;
  json: string;
  /** What the Drive copy holds, to help the user choose. */
  remote: { applications: number; savedAt: string };
  local: { applications: number };
}

/** Someone signed in with a different account than the one whose data this browser holds. */
export interface AccountSwitch {
  previous: string;
  next: string;
}

export interface Sync {
  /** False until a Google client ID is set (see site.ts). */
  available: boolean;
  /** The signed-in Google account, or null in offline mode. */
  account: () => string | null;
  busy: () => boolean;
  /** True when the local copy has changes Drive doesn't have yet. */
  unsynced: () => boolean;
  conflict: () => Conflict | null;
  accountSwitch: () => AccountSwitch | null;
  /** After an account switch: remove this browser's data and load the new account's, or keep it. */
  resolveAccountSwitch: (choice: 'remove' | 'keep') => Promise<void>;
  cancelAccountSwitch: () => void;
  signIn: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolve: (keep: 'local' | 'remote') => Promise<void>;
  cancelConflict: () => void;
  signOut: (removeLocal: boolean) => void;
}

interface Deps {
  clientId: string;
  /** A tracking read of the whole document (deep), for the unsynced check. */
  doc: () => AsapDocument;
  /** The document as JSON to upload. */
  json: () => string;
  readOnly: () => boolean;
  /** Replaces the local document with downloaded JSON. */
  replace: (json: string) => void;
  /** Empties the local copy (signing out with "remove the data"). */
  clear: () => void;
  notify: (message: string) => void;
}

/** The content of a document, without the "saved at" stamp, as a short hash. */
export function contentHash(document: AsapDocument): string {
  return hashText(JSON.stringify({ ...document, savedAt: '' }));
}

function hashOfJson(json: string): string {
  return contentHash(readDocument(JSON.parse(json)).document);
}

export function createSync(deps: Deps): Sync {
  const available = deps.clientId !== '';
  const auth = available ? googleAuth(deps.clientId) : null;
  const remote = driveRemote(() => auth!.token());

  const [state, setState] = createSignal<SyncState>(loadState());
  const [busy, setBusy] = createSignal(false);
  const [conflict, setConflict] = createSignal<Conflict | null>(null);
  const [accountSwitch, setAccountSwitch] = createSignal<AccountSwitch | null>(null);

  const localHash = createMemo(() => contentHash(deps.doc()));
  const empty = createMemo(() => deps.doc().applications.length === 0);
  const unsynced = createMemo(() => state().account !== null && hasLocalChanges(state(), { json: '', hash: localHash(), empty: empty() }));

  function save(next: SyncState) {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Without storage, the sync state lasts until the page closes.
    }
  }

  // Values are read here, in event handlers, not in tracking scopes.
  const local = (): Local => ({ json: deps.json(), hash: localHash(), empty: empty() });

  onSettled(() => {
    if (available && state().account) void loadGoogle().catch(() => {});
    // The browser's own "Leave site?" warning, while Drive is missing changes.
    const warn = (event: BeforeUnloadEvent) => {
      if (unsynced()) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  });

  async function run(task: () => Promise<void>) {
    if (busy()) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      deps.notify(error instanceof Error ? error.message : 'Sync did not complete.');
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    if (!available) return;
    if (deps.readOnly()) {
      deps.notify('This data is from a newer version of ASAP, so it is not synced.');
      return;
    }
    // Read everything first: the work below happens after the click, outside any tracking.
    let current = state();
    const copy = local();
    const localCount = deps.doc().applications.length;
    await run(async () => {
      const account = await remote.account();
      // This browser holds someone else's data: ask before anything moves.
      if (isAccountSwitch(current, account, copy)) {
        setAccountSwitch({ previous: current.owner!, next: account });
        return;
      }
      if (current.account !== account) {
        current = { ...NO_SYNC, account, owner: current.owner };
        save(current);
      }
      await syncAs(account, current, copy, localCount);
    });
  }

  /** One sync for `account`, from the given state and local copy. */
  async function syncAs(account: string, current: SyncState, copy: Local, localCount: number) {
    const result = await sync(remote, current, copy, hashOfJson);
    const outcome = result.outcome;
    if (outcome.kind === 'conflict') {
      const remoteDoc = readDocument(JSON.parse(outcome.json)).document;
      setConflict({
        file: outcome.file,
        json: outcome.json,
        remote: { applications: remoteDoc.applications.length, savedAt: remoteDoc.savedAt },
        local: { applications: localCount },
      });
      return;
    }
    if (outcome.kind === 'downloaded') {
      deps.replace(outcome.json);
      deps.notify('Loaded the latest data from Google Drive.');
    }
    save({ ...result.state, owner: account });
  }

  return {
    available,
    account: () => state().account,
    busy,
    unsynced,
    conflict,
    accountSwitch,
    async resolveAccountSwitch(choice) {
      const open = accountSwitch();
      if (!open) return;
      setAccountSwitch(null);
      // Removing: the local copy becomes empty now, so build the empty copy
      // directly (in Solid 2, store reads lag writes until the update applies).
      const copy = choice === 'remove' ? emptyLocal() : local();
      const localCount = choice === 'remove' ? 0 : deps.doc().applications.length;
      if (choice === 'remove') deps.clear();
      const fresh: SyncState = { ...NO_SYNC, account: open.next, owner: open.next };
      save(fresh);
      await run(() => syncAs(open.next, fresh, copy, localCount));
    },
    cancelAccountSwitch: () => setAccountSwitch(null),
    signIn: syncNow,
    syncNow,
    async resolve(keep) {
      const open = conflict();
      if (!open) return;
      const current = state();
      const copy = local();
      await run(async () => {
        if (keep === 'local') {
          save({ ...(await keepLocal(remote, current, open.file, copy)), owner: current.account });
        } else {
          deps.replace(open.json);
          save({ ...keepRemote(current, open.file, hashOfJson(open.json)), owner: current.account });
        }
        setConflict(null);
      });
    },
    cancelConflict: () => setConflict(null),
    signOut(removeLocal) {
      auth?.forget();
      // Remember whose data stays here, so another account signing in later is asked first.
      save({ ...NO_SYNC, owner: removeLocal ? null : state().owner });
      if (removeLocal) deps.clear();
    },
  };
}

/** The local copy as it is right after removing the data. */
function emptyLocal(): Local {
  const document = emptyDocument();
  return { json: writeDocument(document), hash: contentHash(document), empty: true };
}

function loadState(): SyncState {
  try {
    return { ...NO_SYNC, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return NO_SYNC;
  }
}
