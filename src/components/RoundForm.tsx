import { For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { OUTCOME_LABELS, ROUND_TYPE_LABELS, type Outcome, type Round, type RoundType } from '../data/model';
import { fromLocalInput, toLocalInput } from '../format';

export type RoundFields = Omit<Round, 'id'>;

interface Props {
  /** The round to edit. Leave out to add one. */
  round?: Round;
  onSave: (fields: RoundFields) => void;
  onCancel: () => void;
  /** Shown only when editing. */
  onDelete?: () => void;
}

// Adding and editing show the same fields. The debrief sits in its own
// section, folded until it has content, since it is written after the round.
export default function RoundForm(props: Props) {
  const hasDebrief = () =>
    !!props.round && (props.round.felt !== null || props.round.difficulty !== null || !!props.round.questions || !!props.round.thoughts);

  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const score = (name: string) => (value(name) ? Number(value(name)) : null);
    props.onSave({
      type: value('type') as RoundType,
      at: fromLocalInput(value('at')),
      outcome: value('outcome') as Outcome,
      felt: score('felt'),
      difficulty: score('difficulty'),
      questions: value('questions'),
      thoughts: value('thoughts'),
    });
  };

  return (
    <form class="form" onSubmit={submit}>
      <div class="form-grid">
        <label>
          Type
          <select name="type" value={props.round?.type ?? 'screening'}>
            <For each={Object.entries(ROUND_TYPE_LABELS)}>{([value, label]) => <option value={value}>{label}</option>}</For>
          </select>
        </label>
        <label>
          When
          <input name="at" type="datetime-local" value={toLocalInput(props.round?.at ?? null)} />
        </label>
        <label>
          Outcome
          <select name="outcome" value={props.round?.outcome ?? 'pending'}>
            <For each={Object.entries(OUTCOME_LABELS)}>{([value, label]) => <option value={value}>{label}</option>}</For>
          </select>
        </label>
      </div>

      <details class="debrief" open={hasDebrief()}>
        <summary>Debrief</summary>
        <div class="form">
          <div class="form-grid">
            <Score name="felt" label="How it felt" low="Bad" high="Great" value={props.round?.felt ?? null} />
            <Score name="difficulty" label="How hard it was" low="Easy" high="Hard" value={props.round?.difficulty ?? null} />
          </div>
          <label>
            Questions asked, and what you answered
            <textarea name="questions" rows={5} value={props.round?.questions ?? ''} />
          </label>
          <label>
            Thoughts
            <textarea name="thoughts" rows={3} value={props.round?.thoughts ?? ''} />
          </label>
        </div>
      </details>

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

/** A 1 to 5 scale as radio buttons, with "–" for not set. */
function Score(props: { name: string; label: string; low: string; high: string; value: number | null }) {
  return (
    <fieldset class="score">
      <legend>
        {props.label} <span class="muted">(1 {props.low.toLowerCase()}, 5 {props.high.toLowerCase()})</span>
      </legend>
      <div>
        <For each={['', '1', '2', '3', '4', '5']}>
          {(option) => (
            <label class="score-option">
              <input
                type="radio"
                name={props.name}
                value={option}
                checked={option === (props.value === null ? '' : String(props.value))}
              />
              {option || '–'}
            </label>
          )}
        </For>
      </div>
    </fieldset>
  );
}
