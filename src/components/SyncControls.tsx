import { createSignal, Show, useContext } from 'solid-js';
import Modal from './Modal';
import { DataContext } from '../data/store';
import { formatDateTime } from '../format';

/** Where the data lives, and the buttons to sign in, sync and sign out. */
export default function SyncControls() {
  const data = useContext(DataContext);
  const sync = data.sync;
  const [signingOut, setSigningOut] = createSignal(false);

  return (
    <>
      <Show
        when={sync.account()}
        fallback={
          <>
            <span class="storage" title="Your data is saved in this browser only.">
              Offline mode
            </span>
            <button
              type="button"
              disabled={!sync.available || sync.busy()}
              title={
                sync.available
                  ? 'Sign in with Google to keep your data in your own Google Drive.'
                  : 'Google Drive sync is not set up yet.'
              }
              onClick={() => void sync.signIn()}
            >
              Sign in
            </button>
          </>
        }
      >
        {(account) => (
          <>
            <span
              class={['storage', { synced: !sync.unsynced() }]}
              title={sync.unsynced() ? 'This browser has changes that are not in Google Drive yet.' : `In sync with ${account()}'s Google Drive.`}
            >
              {sync.busy() ? 'Syncing…' : sync.unsynced() ? 'Not synced' : 'Synced'}
            </span>
            <button
              type="button"
              class={{ primary: sync.unsynced() }}
              disabled={sync.busy()}
              title="Save to Google Drive, or load changes made on another device."
              onClick={() => void sync.syncNow()}
            >
              Sync
            </button>
            <button type="button" title={`Signed in as ${account()}`} onClick={() => setSigningOut(true)}>
              Sign out
            </button>
          </>
        )}
      </Show>

      <Show when={signingOut()}>
        <SignOutDialog
          unsynced={sync.unsynced()}
          onClose={() => setSigningOut(false)}
          onSignOut={(removeLocal) => {
            sync.signOut(removeLocal);
            setSigningOut(false);
          }}
        />
      </Show>

      <Show when={sync.conflict()}>
        {(conflict) => (
          <Modal title="Changed on another device" onClose={() => sync.cancelConflict()}>
            <div class="form">
              <p>
                Google Drive has changes from another device, and this browser has changes that are not in Drive. ASAP
                doesn't merge them: pick the copy to keep. The other one is replaced.
              </p>
              <ul class="conflict-sides">
                <li>
                  <strong>Google Drive</strong>: {count(conflict().remote.applications)}
                  <Show when={conflict().remote.savedAt}>, saved {formatDateTime(conflict().remote.savedAt)}</Show>
                </li>
                <li>
                  <strong>This browser</strong>: {count(conflict().local.applications)}
                </li>
              </ul>
              <p class="muted">To be safe, Download keeps a copy of this browser's data first.</p>
              <div class="form-actions">
                <button type="button" onClick={() => sync.cancelConflict()}>
                  Cancel
                </button>
                <span class="spacer" />
                <button type="button" disabled={sync.busy()} onClick={() => void sync.resolve('remote')}>
                  Keep Drive's
                </button>
                <button type="button" class="primary" disabled={sync.busy()} onClick={() => void sync.resolve('local')}>
                  Keep this browser's
                </button>
              </div>
            </div>
          </Modal>
        )}
      </Show>
    </>
  );
}

function SignOutDialog(props: { unsynced: boolean; onClose: () => void; onSignOut: (removeLocal: boolean) => void }) {
  let remove!: HTMLInputElement;
  return (
    <Modal title="Sign out" onClose={props.onClose}>
      <div class="form">
        <p>ASAP stops syncing with Google Drive. Your Drive file stays where it is.</p>
        <Show when={props.unsynced}>
          <p class="warning">This browser has changes that are not in Drive yet. Sync first to keep them there.</p>
        </Show>
        <label class="check">
          <input ref={remove} type="checkbox" />
          Also remove the data from this browser (for a shared computer)
        </label>
        <div class="form-actions">
          <span class="spacer" />
          <button type="button" onClick={() => props.onClose()}>
            Cancel
          </button>
          <button type="button" class="primary" onClick={() => props.onSignOut(remove.checked)}>
            Sign out
          </button>
        </div>
      </div>
    </Modal>
  );
}

function count(n: number): string {
  return n === 1 ? '1 application' : `${n} applications`;
}
