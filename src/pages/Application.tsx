import { createMemo, createSignal, For, Show, useContext } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import ApplicationDialog from '../components/ApplicationDialog';
import Modal from '../components/Modal';
import Notes from '../components/Notes';
import Stepper from '../components/Stepper';
import Rounds from '../components/Rounds';
import { appColor, freeSlot } from '../data/color';
import { DataContext } from '../data/store';
import { RESULT_LABELS, WORK_MODE_LABELS, today, type Application, type Result } from '../data/model';
import type { JSX } from '@solidjs/web';
import { formatDay } from '../format';
import { loadPrefs, savePref } from '../prefs';

export default function ApplicationPage() {
  const data = useContext(DataContext);
  const params = useParams();
  // A memo: re-found only when the id in the URL or the list changes.
  const application = createMemo(() => data.doc.applications.find((a) => a.id === params.id));

  return (
    <Show when={application()} fallback={<NotFound />}>
      {(app) => <Details application={app()} />}
    </Show>
  );
}

function Details(props: { application: Application }) {
  const data = useContext(DataContext);
  const navigate = useNavigate();
  // Which pop-up is open, if any.
  const [dialog, setDialog] = createSignal<'edit' | 'close' | null>(null);

  const change = (edit: (app: Application) => void) => data.updateApplication(props.application.id, edit);

  function reopen() {
    const { id, color } = props.application;
    // Its color may have gone to an active application meanwhile: then it gets a free one.
    const taken = data.doc.applications.some((a) => a.id !== id && a.result === '' && a.color === color);
    const nextColor = taken ? freeSlot(data.doc.applications) : color;
    change((app) => {
      app.result = '';
      app.closedDate = '';
      app.color = nextColor;
    });
  }

  function remove() {
    const { company, id } = props.application;
    if (!window.confirm(`Delete ${company || 'this application'}, with its rounds and notes? This cannot be undone.`)) return;
    // Remove it in place, so only lists that showed it update.
    data.update((draft) => {
      const index = draft.applications.findIndex((a) => a.id === id);
      if (index >= 0) draft.applications.splice(index, 1);
    });
    navigate('/', { replace: true });
  }

  return (
    <div class="app-page">
      <header class="app-header card" style={{ '--app': appColor(props.application) }}>
        <div class="app-header-top">
          <div class="app-header-text">
            <h1 class="app-name">{props.application.company || 'No company'}</h1>
            <p class="app-header-role">{props.application.role}</p>
            <ul class="facts">
              <Show when={props.application.location}>
                <li>{props.application.location}</li>
              </Show>
              <Show when={props.application.workMode}>
                <li>{WORK_MODE_LABELS[props.application.workMode]}</li>
              </Show>
              <Show when={props.application.appliedDate}>
                <li>Applied {formatDay(props.application.appliedDate)}</li>
              </Show>
              <For each={props.application.extras}>
                {(extra) => (
                  <li>
                    {extra.label}: {extra.value}
                  </li>
                )}
              </For>
              <Show when={props.application.link}>
                <li>
                  <a class="link" href={props.application.link} target="_blank" rel="noopener noreferrer">
                    Listing ↗
                  </a>
                </li>
              </Show>
            </ul>
          </div>
          <div class="app-header-actions">
            <span class={['status', props.application.result || 'active']}>
              {props.application.result ? RESULT_LABELS[props.application.result] : 'Active'}
            </span>
            <Show
              when={props.application.result}
              fallback={
                <button type="button" onClick={() => setDialog('close')}>
                  Close
                </button>
              }
            >
              <button type="button" onClick={reopen}>
                Reopen
              </button>
            </Show>
            <button type="button" onClick={() => setDialog('edit')}>
              Edit
            </button>
          </div>
        </div>
        <Stepper application={props.application} />
      </header>

      <Show when={dialog() === 'edit'}>
        <ApplicationDialog application={props.application} onClose={() => setDialog(null)} onDelete={remove} />
      </Show>
      <Show when={dialog() === 'close'}>
        <CloseDialog
          onClose={() => setDialog(null)}
          onSave={(result, date) => {
            change((app) => {
              app.result = result;
              app.closedDate = date;
            });
            setDialog(null);
          }}
        />
      </Show>

      <Rounds application={props.application} />
      <Notes application={props.application} />
      <Show when={props.application.listing}>
        <details
          class="card listing-card"
          open={loadPrefs().listingOpen}
          onToggle={(event) => savePref('listingOpen', event.currentTarget.open)}
        >
          <summary>
            <h2>Job listing</h2>
          </summary>
          <p class="listing prewrap">{props.application.listing}</p>
        </details>
      </Show>
    </div>
  );
}

const ENDINGS: Exclude<Result, ''>[] = ['hired', 'rejected', 'withdrew', 'no-reply', 'position-closed'];

/** The pop-up to close an application: how it ended, and when. */
function CloseDialog(props: { onClose: () => void; onSave: (result: Result, date: string) => void }) {
  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = String(form.get('result') ?? '') as Result;
    if (!result) return;
    props.onSave(result, String(form.get('date') ?? '') || today());
  };

  return (
    <Modal title="Close application" onClose={props.onClose}>
      <form class="form" onSubmit={submit}>
        <fieldset class="choice">
          <legend>How it ended</legend>
          <div>
            <For each={ENDINGS}>
              {(ending) => (
                <label class="choice-option">
                  <input type="radio" name="result" value={ending} required />
                  {RESULT_LABELS[ending]}
                </label>
              )}
            </For>
          </div>
        </fieldset>
        <label>
          On
          <input name="date" type="date" value={today()} />
        </label>
        <div class="form-actions">
          <span class="spacer" />
          <button type="button" onClick={() => props.onClose()}>
            Cancel
          </button>
          <button type="submit" class="primary">
            Close application
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p class="muted">
        This application doesn't exist here. <a class="link" href="/">Go home</a>
      </p>
    </>
  );
}
