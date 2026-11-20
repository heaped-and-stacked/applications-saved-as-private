import { For, Show } from 'solid-js';
import { RESULT_LABELS, type Application } from '../data/model';
import { STEPS, isOngoing, stepOf } from '../data/stage';
import { formatDay } from '../format';

/** The steps with their names, filled up to the one reached, and the result once it ended. */
export default function Stepper(props: { application: Application }) {
  const step = () => stepOf(props.application);
  return (
    <ol class={['stepper', { ended: !isOngoing(props.application) }]}>
      <For each={STEPS}>
        {(name, i) => <li class={{ done: i() < step(), current: i() === step() }}>{name}</li>}
      </For>
      <Show when={!isOngoing(props.application)}>
        <li class="result-step">
          {RESULT_LABELS[props.application.result]}
          <Show when={props.application.closedDate}>
            <span class="muted"> · {formatDay(props.application.closedDate)}</span>
          </Show>
        </li>
      </Show>
    </ol>
  );
}
