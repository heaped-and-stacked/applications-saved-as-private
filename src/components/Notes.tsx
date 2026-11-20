import { createMemo, createSignal, For, Show, useContext } from 'solid-js';
import Modal from './Modal';
import type { JSX } from '@solidjs/web';
import { DataContext } from '../data/store';
import { newId, today, type Application, type Note } from '../data/model';
import { formatDay } from '../format';

/** Short dated notes on one application, newest first. */
export default function Notes(props: { application: Application }) {
  const data = useContext(DataContext);
  // Which note the dialog is open for: 'new', a note id, or none.
  const [open, setOpen] = createSignal<string | null>(null);

  // Newest day first. Notes from the same day: the last one written first.
  const notes = createMemo(() =>
    props.application.notes
      .map((note, index) => ({ note, index }))
      .sort((a, b) => b.note.date.localeCompare(a.note.date) || b.index - a.index)
      .map(({ note }) => note),
  );
  const editing = () => props.application.notes.find((n) => n.id === open());

  const change = (edit: (app: Application) => void) => data.updateApplication(props.application.id, edit);

  function save(date: string, text: string) {
    const id = open();
    change((app) => {
      const target = app.notes.find((n) => n.id === id);
      if (target) Object.assign(target, { date, text });
      else app.notes.push({ id: newId(), date, text });
    });
    setOpen(null);
  }

  function remove() {
    const id = open();
    if (!window.confirm('Delete this note?')) return;
    change((app) => {
      const index = app.notes.findIndex((n) => n.id === id);
      if (index >= 0) app.notes.splice(index, 1);
    });
    setOpen(null);
  }

  return (
    <section class="card">
      <div class="card-head">
        <h2>Notes</h2>
        <button type="button" onClick={() => setOpen('new')}>
          Add note
        </button>
      </div>
      <div class="notes">
        <For each={notes()} fallback={<p class="muted">No notes yet.</p>}>
          {(note) => (
            <div class="note">
              <div class="note-head">
                <span class="muted">{note.date ? formatDay(note.date) : 'No date'}</span>
                <button type="button" class="quiet" onClick={() => setOpen(note.id)}>
                  Edit
                </button>
              </div>
              <p class="prewrap">{note.text}</p>
            </div>
          )}
        </For>
      </div>

      <Show when={open()}>
        <NoteDialog note={editing()} onSave={save} onDelete={remove} onClose={() => setOpen(null)} />
      </Show>
    </section>
  );
}

/** A pop-up to write a note. With `note`, it edits that note and offers Delete. */
function NoteDialog(props: {
  note?: Note;
  onSave: (date: string, text: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get('text') ?? '').trim();
    if (!text) return;
    props.onSave(String(form.get('date') ?? '') || today(), text);
  };

  return (
    <Modal title={props.note ? 'Edit note' : 'Add note'} onClose={props.onClose}>
      <form class="form" onSubmit={submit}>
        <label>
          Date
          <input name="date" type="date" value={props.note?.date ?? today()} />
        </label>
        <label>
          Note
          <textarea
            name="text"
            rows={6}
            placeholder="How it started, what to prepare, anything to remember."
            value={props.note?.text ?? ''}
            autofocus
          />
        </label>
        <div class="form-actions">
          <Show when={props.note}>
            <button type="button" class="danger" onClick={() => props.onDelete()}>
              Delete
            </button>
          </Show>
          <span class="spacer" />
          <button type="button" onClick={() => props.onClose()}>
            Cancel
          </button>
          <button type="submit" class="primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
