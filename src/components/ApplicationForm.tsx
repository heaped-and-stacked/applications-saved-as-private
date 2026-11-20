import { createSignal, For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { EXTRA_SUGGESTIONS, WORK_MODE_LABELS, newId, today, type Application, type WorkMode } from '../data/model';

/** The fields the form edits. Create and edit show the same ones. */
export type ApplicationFields = Pick<
  Application,
  'company' | 'role' | 'location' | 'workMode' | 'appliedDate' | 'link' | 'listing' | 'extras'
>;

interface Props {
  /** The application to edit. Leave out to create one. */
  application?: Application;
  /** `note` is the first note, only asked for when creating. */
  onSave: (fields: ApplicationFields, note: string) => void;
  onCancel: () => void;
  /** Shown only when editing. */
  onDelete?: () => void;
}

// The form is uncontrolled: inputs start from the application's values, and
// the values are read once, on submit. Only the list of custom fields is a
// signal, because rows can be added and removed while the form is open.
export default function ApplicationForm(props: Props) {
  // Each row has an id, so inputs keep their text when other rows are removed.
  // Solid 2: createSignal with a function seeds local state from props.
  const [extras, setExtras] = createSignal(() =>
    (props.application?.extras ?? []).map((extra) => ({ id: newId(), label: extra.label, value: extra.value })),
  );

  // The updater form builds on the latest list: in Solid 2, reading a signal
  // right after setting it still returns the old value until the update applies.
  const addExtra = (label: string) => setExtras((list) => [...list, { id: newId(), label, value: '' }]);
  const removeExtra = (id: string) => setExtras((list) => list.filter((extra) => extra.id !== id));

  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    props.onSave(
      {
        company: value('company'),
        role: value('role'),
        location: value('location'),
        workMode: value('workMode') as WorkMode,
        appliedDate: value('appliedDate'),
        link: value('link'),
        listing: value('listing'),
        extras: extras()
          .map((extra) => ({ label: value(`extra-label-${extra.id}`), value: value(`extra-value-${extra.id}`) }))
          .filter((extra) => extra.label && extra.value),
      },
      value('note'),
    );
  };

  return (
    <form class="form" onSubmit={submit}>
      <div class="form-grid">
        <label>
          Company
          <input name="company" required value={props.application?.company ?? ''} />
        </label>
        <label>
          Role
          <input name="role" value={props.application?.role ?? ''} />
        </label>
        <label>
          Location
          <input name="location" value={props.application?.location ?? ''} />
        </label>
        <label>
          Work mode
          <select name="workMode" value={props.application?.workMode ?? ''}>
            <For each={Object.entries(WORK_MODE_LABELS)}>
              {([value, label]) => <option value={value}>{label}</option>}
            </For>
          </select>
        </label>
        <label>
          Applied on
          <input name="appliedDate" type="date" value={props.application?.appliedDate ?? today()} />
        </label>
        <label>
          Link to the listing
          <input name="link" type="url" placeholder="https://" value={props.application?.link ?? ''} />
        </label>
      </div>

      <div class="extras">
        <For each={extras()}>
          {(extra) => (
            <div class="extra-row">
              <input name={`extra-label-${extra.id}`} value={extra.label} placeholder="Field" aria-label="Field name" />
              <input name={`extra-value-${extra.id}`} value={extra.value} placeholder="Value" aria-label="Value" />
              <button type="button" class="quiet" onClick={() => removeExtra(extra.id)} aria-label="Remove field">
                ✕
              </button>
            </div>
          )}
        </For>
        <div class="extra-add">
          <span class="muted">Add field:</span>
          <For each={EXTRA_SUGGESTIONS}>
            {(label) => (
              <button type="button" class="small" onClick={() => addExtra(label)}>
                {label}
              </button>
            )}
          </For>
          <button type="button" class="small" onClick={() => addExtra('')}>
            Other…
          </button>
        </div>
      </div>

      <label>
        Job listing
        <textarea
          name="listing"
          rows={6}
          placeholder="Paste the listing here. Links expire."
          value={props.application?.listing ?? ''}
        />
      </label>

      {/* Only when adding: notes are a list of their own, edited on the application's page. */}
      <Show when={!props.application}>
        <label>
          Note
          <textarea name="note" rows={3} placeholder="How it started, anything to remember." />
        </label>
      </Show>

      <div class="form-actions">
        <Show when={props.onDelete}>
          <button type="button" class="danger" onClick={() => props.onDelete?.()}>
            Delete
          </button>
        </Show>
        <span class="spacer" />
        <button type="button" onClick={() => props.onCancel()}>
          Cancel
        </button>
        <button type="submit" class="primary">
          Save
        </button>
      </div>
    </form>
  );
}
