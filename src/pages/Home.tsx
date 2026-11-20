import { createMemo, createSignal, For, onSettled, Show, useContext } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import ApplicationDialog from '../components/ApplicationDialog';
import Calendar from '../components/Calendar';
import ProgressBar from '../components/ProgressBar';
import { appColor } from '../data/color';
import { DataContext } from '../data/store';
import { RESULT_LABELS, ROUND_TYPE_LABELS, type Application } from '../data/model';
import { assess } from '../data/situation';
import { isOngoing, lastActivity, stageLabel } from '../data/stage';
import { goneQuiet, nextRound, thisWeek } from '../data/stats';
import { formatDateTime, formatDay } from '../format';
import { loadPrefs, savePref } from '../prefs';
import { situationText } from '../situationText';

const CLOSED_PAGE = 20;
const MINUTE_MS = 60_000;

export default function Home() {
  const data = useContext(DataContext);
  const navigate = useNavigate();
  const [adding, setAdding] = createSignal(false);

  // The current time, refreshed every minute, so lines like "within 48 hours"
  // stay true while the page is open.
  const [now, setNow] = createSignal(new Date());
  onSettled(() => {
    const timer = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(timer);
  });

  // Active ones, the latest activity first: untouched ones sink to the bottom.
  const active = createMemo(() =>
    data.doc.applications.filter(isOngoing).sort((a, b) => lastActivity(b).localeCompare(lastActivity(a))),
  );
  // Closed ones, most recently closed first.
  const closed = createMemo(() =>
    data.doc.applications.filter((a) => !isOngoing(a)).sort((a, b) => closedOn(b).localeCompare(closedOn(a))),
  );
  const [shown, setShown] = createSignal(CLOSED_PAGE);

  const next = createMemo(() => nextRound(data.doc.applications, now()));
  const week = createMemo(() => thisWeek(data.doc.applications, now()));
  const quiet = createMemo(() => goneQuiet(data.doc.applications, now()));

  return (
    <div class="home">
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Active applications</span>
          <span class="stat-value">{active().length}</span>
          <span class="stat-note">{closed().length} closed</span>
        </div>
        <div class="stat">
          <span class="stat-label">Next round</span>
          <Show when={next()} fallback={<span class="stat-value">—</span>}>
            {(n) => (
              <>
                <a
                  class="stat-value"
                  style={{ color: appColor(n().application) }}
                  href={`/applications/${n().application.id}`}
                >
                  {n().application.company}
                </a>
                <span class="stat-note">
                  {ROUND_TYPE_LABELS[n().round.type]}, {formatDateTime(n().round.at!)}
                </span>
              </>
            )}
          </Show>
        </div>
        <div class="stat">
          <span class="stat-label">This week</span>
          <span class="stat-value">{week().sent}</span>
          <span class="stat-note">
            {week().sent === 1 ? '1 application sent' : `${week().sent} applications sent`},{' '}
            {week().held === 1 ? '1 round held' : `${week().held} rounds held`}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Gone quiet</span>
          <span class="stat-value">{quiet()}</span>
          <span class="stat-note">no news for two weeks or more</span>
        </div>
      </div>

      <section class="panel list">
        <div class="list-head">
          <h2>
            Active <span class="count">{active().length}</span>
          </h2>
          <button type="button" class="primary small" onClick={() => setAdding(true)}>
            + Add
          </button>
        </div>
        <div class="cards">
          <For each={active()} fallback={<p class="empty">No active applications.</p>}>
            {(application) => <Card application={application} now={now()} />}
          </For>
        </div>

        <Show when={closed().length > 0}>
          <details
            class="closed"
            open={loadPrefs().closedOpen}
            onToggle={(event) => savePref('closedOpen', event.currentTarget.open)}
          >
            <summary>
              Closed <span class="count">{closed().length}</span>
            </summary>
            <For each={closed().slice(0, shown())}>
              {(application) => (
                <a class="closed-row" href={`/applications/${application.id}`}>
                  <span>
                    <span style={{ color: appColor(application) }}>{application.company}</span>
                    <span class="muted"> · {application.role}</span>
                  </span>
                  <span class="muted">
                    {RESULT_LABELS[application.result]}, {formatDay(closedOn(application))}
                  </span>
                </a>
              )}
            </For>
            <Show when={closed().length > shown()}>
              <button type="button" class="more" onClick={() => setShown(shown() + CLOSED_PAGE)}>
                Show more
              </button>
            </Show>
          </details>
        </Show>
      </section>

      <Calendar applications={data.doc.applications} now={now()} />

      <Show when={adding()}>
        <ApplicationDialog onClose={() => setAdding(false)} onSaved={(id) => navigate(`/applications/${id}`)} />
      </Show>
    </div>
  );
}

/** When it ended. Older data may have no closed date: then its last activity. */
function closedOn(application: Application): string {
  return application.closedDate || lastActivity(application);
}

function Card(props: { application: Application; now: Date }) {
  const text = () => situationText(assess(props.application, props.now), props.application.appliedDate);
  return (
    <a class="app-card" style={{ '--app': appColor(props.application) }} href={`/applications/${props.application.id}`}>
      <div class="app-card-top">
        <span class="app-card-name">
          <strong>{props.application.company}</strong>
          <span class="app-card-role">{props.application.role}</span>
        </span>
        <span class="pill">{stageLabel(props.application)}</span>
      </div>
      <ProgressBar application={props.application} />
      <span class="situation" title={text().hint}>
        {text().line}
      </span>
    </a>
  );
}
