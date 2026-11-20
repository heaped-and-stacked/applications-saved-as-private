import { For } from 'solid-js';
import type { Application } from '../data/model';
import { STEPS, isOngoing, stepOf } from '../data/stage';

/** One segment per step: Applied, Screening, Technical, Offer. Filled up to the step reached. */
export default function ProgressBar(props: { application: Application }) {
  return (
    <div
      class={['progress', { ended: !isOngoing(props.application) }]}
      title={STEPS.slice(0, stepOf(props.application) + 1).join(' → ')}
    >
      <For each={STEPS}>{(_, i) => <span class={{ on: i() <= stepOf(props.application) }} />}</For>
    </div>
  );
}
