import { describe, expect, it } from 'vitest';
import type { Remote, RemoteFile } from './remote';
import { hashText, isAccountSwitch, keepLocal, NO_SYNC, sync, type Local, type SyncState } from './sync';

/** A Drive with at most one file, in memory. */
function fakeDrive(initial?: string) {
  let file: (RemoteFile & { json: string }) | null = initial ? { id: 'f1', version: '1', json: initial } : null;
  let writes = 0;
  const remote: Remote = {
    account: async () => 'me@example.com',
    find: async () => (file ? { id: file.id, version: file.version } : null),
    read: async () => file!.json,
    create: async (json) => {
      writes++;
      file = { id: 'f1', version: '1', json };
      return { id: file.id, version: file.version };
    },
    update: async (_id, json) => {
      writes++;
      file = { ...file!, version: String(Number(file!.version) + 1), json };
      return { id: file.id, version: file.version };
    },
  };
  return {
    remote,
    get json() {
      return file?.json;
    },
    get writes() {
      return writes;
    },
    /** Another device syncs a new version. */
    changeElsewhere(json: string) {
      file = { ...file!, version: String(Number(file!.version) + 1), json };
    },
  };
}

const local = (json: string): Local => ({ json, hash: hashText(json), empty: json === 'empty' });

describe('sync', () => {
  it('creates the Drive file on the first sync', async () => {
    const drive = fakeDrive();
    const { outcome, state } = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    expect(outcome.kind).toBe('uploaded');
    expect(drive.json).toBe('A');
    expect(state).toMatchObject({ fileId: 'f1', version: '1', syncedHash: hashText('A') });
  });

  it('does nothing when neither side changed', async () => {
    const drive = fakeDrive();
    const first = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    const second = await sync(drive.remote, first.state, local('A'), hashText);
    expect(second.outcome.kind).toBe('up-to-date');
    expect(drive.writes).toBe(1);
  });

  it('uploads local changes when Drive did not change', async () => {
    const drive = fakeDrive();
    const { state } = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    const result = await sync(drive.remote, state, local('B'), hashText);
    expect(result.outcome.kind).toBe('uploaded');
    expect(drive.json).toBe('B');
  });

  it('downloads when only Drive changed', async () => {
    const drive = fakeDrive();
    const { state } = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    drive.changeElsewhere('C');
    const result = await sync(drive.remote, state, local('A'), hashText);
    expect(result.outcome).toEqual({ kind: 'downloaded', json: 'C' });
    expect(result.state.syncedHash).toBe(hashText('C'));
  });

  it('asks when both sides changed, and never writes on its own', async () => {
    const drive = fakeDrive();
    const { state } = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    drive.changeElsewhere('C');
    const result = await sync(drive.remote, state, local('B'), hashText);
    expect(result.outcome.kind).toBe('conflict');
    expect(drive.json).toBe('C');
  });

  it('keeps this browser’s copy when the user picks it', async () => {
    const drive = fakeDrive();
    const { state } = await sync(drive.remote, NO_SYNC, local('A'), hashText);
    drive.changeElsewhere('C');
    const result = await sync(drive.remote, state, local('B'), hashText);
    if (result.outcome.kind !== 'conflict') throw new Error('expected a conflict');
    const after: SyncState = await keepLocal(drive.remote, state, result.outcome.file, local('B'));
    expect(drive.json).toBe('B');
    expect(after.syncedHash).toBe(hashText('B'));
  });

  it('loads Drive on a new device that has nothing yet', async () => {
    const drive = fakeDrive('C');
    const result = await sync(drive.remote, NO_SYNC, local('empty'), hashText);
    expect(result.outcome).toEqual({ kind: 'downloaded', json: 'C' });
  });

  it('asks on a new device that already has different data', async () => {
    const drive = fakeDrive('C');
    const result = await sync(drive.remote, NO_SYNC, local('B'), hashText);
    expect(result.outcome.kind).toBe('conflict');
  });

  it('treats the same content on both sides as in sync', async () => {
    const drive = fakeDrive('B');
    const result = await sync(drive.remote, NO_SYNC, local('B'), hashText);
    expect(result.outcome.kind).toBe('up-to-date');
    expect(result.state.fileId).toBe('f1');
  });
});

describe('isAccountSwitch', () => {
  it('notices another account signing in while this browser holds data', () => {
    const state = { ...NO_SYNC, owner: 'a@example.com' };
    expect(isAccountSwitch(state, 'b@example.com', local('A'))).toBe(true);
    expect(isAccountSwitch(state, 'a@example.com', local('A'))).toBe(false);
  });

  it('does not ask when there is nothing local, or no known owner', () => {
    expect(isAccountSwitch({ ...NO_SYNC, owner: 'a@example.com' }, 'b@example.com', local('empty'))).toBe(false);
    expect(isAccountSwitch(NO_SYNC, 'b@example.com', local('A'))).toBe(false);
  });
});
