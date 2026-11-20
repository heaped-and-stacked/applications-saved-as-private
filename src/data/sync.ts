// What a press of Sync does. Plain async functions with no Solid, tested with
// a fake Remote.
//
// The rule: the local copy is the working copy, and Sync is the only step that
// writes to Drive. Before writing, ASAP checks whether Drive changed since the
// last sync. It never merges: when both sides changed, the user picks one.
import type { Remote, RemoteFile } from './remote';

/** What this browser remembers about the last sync. */
export interface SyncState {
  /** The Google account the local copy belongs to. */
  account: string | null;
  fileId: string | null;
  /** Drive's version of the file at the last sync. */
  version: string | null;
  /** A hash of the document's content at the last sync, to tell if it changed since. */
  syncedHash: string | null;
}

export const NO_SYNC: SyncState = { account: null, fileId: null, version: null, syncedHash: null };

export interface Local {
  /** The document as JSON, ready to upload. */
  json: string;
  /** A hash of its content (see hashContent). */
  hash: string;
  /** True when it has no applications: then there is nothing local to lose. */
  empty: boolean;
}

export type Outcome =
  | { kind: 'up-to-date' }
  | { kind: 'uploaded' }
  | { kind: 'downloaded'; json: string }
  | { kind: 'conflict'; json: string; file: RemoteFile };

export interface Result {
  outcome: Outcome;
  state: SyncState;
}

/** True when the local copy changed since the last sync. */
export function hasLocalChanges(state: SyncState, local: Local): boolean {
  return state.syncedHash === null ? !local.empty : local.hash !== state.syncedHash;
}

/**
 * One sync. `hashOf` turns a downloaded file into the same kind of hash as
 * `local.hash`, so the same content compares equal however it was written.
 */
export async function sync(remote: Remote, state: SyncState, local: Local, hashOf: (json: string) => string): Promise<Result> {
  const file = await remote.find(state.fileId);
  const localChanged = hasLocalChanges(state, local);

  // Nothing in Drive yet: this browser's copy becomes the Drive copy.
  if (!file) {
    const created = await remote.create(local.json);
    return { outcome: { kind: 'uploaded' }, state: synced(state, created, local.hash) };
  }

  const remoteChanged = file.id !== state.fileId || file.version !== state.version;
  if (!remoteChanged) {
    if (!localChanged) return { outcome: { kind: 'up-to-date' }, state };
    const updated = await remote.update(file.id, local.json);
    return { outcome: { kind: 'uploaded' }, state: synced(state, updated, local.hash) };
  }

  // Drive changed since the last sync (or this browser never synced): look at it.
  const json = await remote.read(file.id);
  const remoteHash = hashOf(json);
  if (remoteHash === local.hash) return { outcome: { kind: 'up-to-date' }, state: synced(state, file, local.hash) };
  if (!localChanged) return { outcome: { kind: 'downloaded', json }, state: synced(state, file, remoteHash) };
  return { outcome: { kind: 'conflict', json, file }, state };
}

/** After a conflict, the user kept this browser's copy: it replaces the Drive copy. */
export async function keepLocal(remote: Remote, state: SyncState, file: RemoteFile, local: Local): Promise<SyncState> {
  const updated = await remote.update(file.id, local.json);
  return synced(state, updated, local.hash);
}

/** After a conflict, the user kept the Drive copy: it replaces this browser's copy. */
export function keepRemote(state: SyncState, file: RemoteFile, remoteHash: string): SyncState {
  return synced(state, file, remoteHash);
}

function synced(state: SyncState, file: RemoteFile, hash: string): SyncState {
  return { ...state, fileId: file.id, version: file.version, syncedHash: hash };
}

/** A short fingerprint of a text (FNV-1a, 32 bits). Enough to notice a change, not a security measure. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
