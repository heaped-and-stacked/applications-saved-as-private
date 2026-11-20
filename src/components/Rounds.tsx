import { createMemo, createSignal, For, Show, useContext } from 'solid-js';
import Modal from './Modal';
import RoundForm, { type RoundFields } from './RoundForm';
import { DataContext } from '../data/store';
import { newId, OUTCOME_LABELS, ROUND_TYPE_LABELS, type Application, type Round } from '../data/model';
import { formatDateTime } from '../format';

/** The rounds of one application, in date order, with their debriefs. */
export default function Rounds(props: { application: Application }) {
  const data = useContext(DataContext);
  // Which pop-up is open: 'new', a round id, or none.
  const [editing, setEditing] = createSignal<string | null>(null);

  // Dated rounds by date, then rounds without a date, in the order added.
  const rounds = createMemo(() =>
    [...props.application.rounds].sort((a, b) => {
      if (a.at && b.at) return a.at.localeCompare(b.at);
      return a.at ? -1 : b.at ? 1 : 0;
    }),
  );

  const change = (edit: (app: Application) => void) => data.updateApplication(props.application.id, edit);

  function remove(round: Round) {
    if (!window.confirm(`Delete this ${ROUND_TYPE_LABELS[round.type].toLowerCase()} round and its debrief?`)) return;
    change((app) => {
      const index = app.rounds.findIndex((r) => r.id === round.id);
      if (index >= 0) app.rounds.splice(index, 1);
    });
    setEditing(null);
  }

  // The round being edited, when the pop-up is open for one.
  const editingRound = () => props.application.rounds.find((r) => r.id === editing());

  function save(fields: RoundFields) {
    const id = editing();
    change((app) => {
      const target = app.rounds.find((r) => r.id === id);
      if (target) Object.assign(target, fields);
      else app.rounds.push({ id: newId(), ...fields });
    });
    setEditing(null);
  }

  return (
    <section class="card">
      <div class="card-head">
        <h2>Rounds</h2>
        <button type="button" onClick={() => setEditing('new')}>
          Add round
        </button>
      </div>

      <div class="rounds">
        <For each={rounds()} fallback={<p class="muted">No rounds yet.</p>}>
          {(round) => <RoundView round={round} onEdit={() => setEditing(round.id)} />}
        </For>
      </div>

      <Show when={editing()}>
        <Modal title={editingRound() ? 'Edit round' : 'Add round'} onClose={() => setEditing(null)}>
          <RoundForm
            round={editingRound()}
            onSave={save}
            onCancel={() => setEditing(null)}
            onDelete={editingRound() ? () => remove(editingRound()!) : undefined}
          />
        </Modal>
      </Show>
    </section>
  );
}

function RoundView(props: { round: Round; onEdit: () => void }) {
  return (
    <article class={['round', { cancelled: props.round.outcome === 'cancelled' }]}>
      <div class="round-head">
        <strong>{ROUND_TYPE_LABELS[props.round.type]}</strong>
        <span class="muted">{props.round.at ? formatDateTime(props.round.at) : 'No date yet'}</span>
        <span class={['tag', props.round.outcome]}>{OUTCOME_LABELS[props.round.outcome]}</span>
        <span class="spacer" />
        <button type="button" onClick={() => props.onEdit()}>
          Edit
        </button>
      </div>
      <Show when={props.round.felt !== null || props.round.difficulty !== null}>
        <p class="scores muted">
          <Show when={props.round.felt !== null}>Felt {props.round.felt}/5</Show>
          <Show when={props.round.felt !== null && props.round.difficulty !== null}> · </Show>
          <Show when={props.round.difficulty !== null}>Difficulty {props.round.difficulty}/5</Show>
        </p>
      </Show>
      <Field label="Questions and answers" text={props.round.questions} />
      <Field label="Thoughts" text={props.round.thoughts} />
    </article>
  );
}

function Field(props: { label: string; text: string }) {
  return (
    <Show when={props.text}>
      <div class="round-field">
        <span class="label">{props.label}</span>
        <p class="prewrap">{props.text}</p>
      </div>
    </Show>
  );
}
