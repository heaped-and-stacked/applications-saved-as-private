// The one data path: the document lives in memory in a Solid store, and every
// change is saved to this browser. Drive sync will be a layer on top of this.
import {
  createContext,
  createEffect,
  createSignal,
  createStore,
  deep,
  snapshot,
  onSettled,
  type ParentProps,
} from 'solid-js';
import { emptyDocument, readDocument, writeDocument, type Loaded } from './document';
import { keepBroken, loadLocal, onOtherTabSave, saveLocal } from './local';
import type { Application, AsapDocument } from './model';
import { createSync, type Sync } from './syncController';
import { SITE } from '../site';

export interface Data {
  /** The document. Read it anywhere; change it only through `update`. */
  doc: AsapDocument;
  /** True when the data came from a newer version of ASAP: nothing is saved. */
  readOnly: () => boolean;
  /** A message for the user, or empty. */
  notice: () => string;
  setNotice: (message: string) => void;
  /** Changes the document. The function edits a draft in place. */
  update: (change: (draft: AsapDocument) => void) => void;
  /** Changes one application, found by id, and stamps it as updated. */
  updateApplication: (id: string, change: (application: Application) => void) => void;
  /** Google Drive sync: sign-in, the Sync button, conflicts. */
  sync: Sync;
  /** Swaps the whole document, as after uploading a file. */
  replace: (loaded: Loaded) => void;
}

// Solid 2 context: the context object itself is the provider component.
// Created without a default, so using it outside the provider throws.
export const DataContext = createContext<Data>();

export function DataProvider(props: ParentProps) {
  const start = loadStart();
  // createStore makes every field reactive: a component re-renders just the
  // parts that read a field when that field changes.
  const [doc, setDoc] = createStore(start.loaded.document);
  const [readOnly, setReadOnly] = createSignal(start.loaded.readOnly);
  const [notice, setNotice] = createSignal(start.notice);

  // What was last saved or received, ignoring the savedAt stamp. Saving only
  // when this changes stops two open tabs from echoing saves back and forth.
  let lastContent = contentOf(start.loaded.document);

  // Solid 2 effects have two parts. The first tracks: every signal it reads
  // re-runs the effect when it changes. deep() reads every field of the store
  // and returns a plain copy. The second part does the side effect with what
  // the first returned, and must not read signals itself.
  createEffect(
    () => ({ copy: deep(doc), readOnly: readOnly() }),
    ({ copy, readOnly }) => {
      const content = contentOf(copy);
      if (readOnly || content === lastContent) return;
      lastContent = content;
      saveLocal(writeDocument(copy));
    },
  );

  // Another tab saved: take its version, since the newest save wins.
  onSettled(() =>
    onOtherTabSave((json) => {
      try {
        const loaded = readDocument(JSON.parse(json));
        lastContent = contentOf(loaded.document);
        setReadOnly(loaded.readOnly);
        setDoc(() => loaded.document);
      } catch {
        // A broken save from another tab is ignored; this tab keeps its copy.
      }
    }),
  );

  const update: Data['update'] = (change) => {
    if (readOnly()) return;
    setDoc((draft) => {
      change(draft);
    });
  };

  function replace(loaded: Loaded) {
    setReadOnly(loaded.readOnly);
    setDoc(() => loaded.document);
  }

  const data: Data = {
    doc,
    readOnly,
    notice,
    setNotice,
    update,
    updateApplication: (id, change) =>
      update((draft) => {
        const application = draft.applications.find((a) => a.id === id);
        if (!application) return;
        change(application);
        application.updatedAt = new Date().toISOString();
      }),
    replace,
    sync: createSync({
      clientId: SITE.googleClientId,
      doc: () => deep(doc),
      json: () => writeDocument(snapshot(doc)),
      readOnly,
      replace: (json) => replace(readDocument(JSON.parse(json))),
      clear: () => replace({ document: emptyDocument(), readOnly: false, converted: false }),
      notify: setNotice,
    }),
  };

  return <DataContext value={data}>{props.children}</DataContext>;
}

function loadStart(): { loaded: Loaded; notice: string } {
  const fresh = { loaded: { document: emptyDocument(), readOnly: false, converted: false }, notice: '' };
  const json = loadLocal();
  if (json === null) return fresh;
  try {
    const loaded = readDocument(JSON.parse(json));
    const notice = loaded.readOnly
      ? 'This data is from a newer version of ASAP. You can look, but changes are not saved.'
      : '';
    return { loaded, notice };
  } catch {
    keepBroken(json);
    return {
      ...fresh,
      notice: 'The data saved in this browser could not be read. It was set aside, and you are starting fresh.',
    };
  }
}

function contentOf(document: AsapDocument): string {
  return JSON.stringify({ ...document, savedAt: '' });
}
