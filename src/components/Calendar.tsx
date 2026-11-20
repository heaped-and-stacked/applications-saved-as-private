import { createMemo, createSignal, For, Show } from 'solid-js';
import { appColor } from '../data/color';
import { localDay, RESULT_LABELS, ROUND_TYPE_LABELS, type Application, type Round } from '../data/model';
import { formatTime } from '../format';
import { loadPrefs, savePref } from '../prefs';

// The week is an hour grid from 08:00 to 20:00, with a lane on top for days
// that have no time (applied and closed). Rounds outside those hours sit at
// the nearest edge. The month is a compact grid.
const FIRST_HOUR = 8;
const LAST_HOUR = 20;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
const MONTH_CHIPS = 3;
// The week's top lane stays short: a busy day shows two, then "+N more".
const LANE_CHIPS = 2;

type View = 'week' | 'month';

interface RoundEvent {
  round: Round;
  application: Application;
  at: Date;
}

interface DayMark {
  application: Application;
  label: string;
}

/** Rounds by week or month. Weeks start on Monday. */
export default function Calendar(props: { applications: Application[]; now: Date }) {
  const [view, setView] = createSignal<View>(loadPrefs().calendarView);
  // Any day inside the period shown. Starts on today.
  const [anchor, setAnchor] = createSignal(new Date());

  function choose(next: View) {
    setView(next);
    savePref('calendarView', next);
  }

  // Dated rounds, by local day (YYYY-MM-DD), in time order.
  const roundsByDay = createMemo(() => {
    const byDay = new Map<string, RoundEvent[]>();
    for (const application of props.applications) {
      for (const round of application.rounds) {
        if (!round.at) continue;
        const at = new Date(round.at);
        push(byDay, localDay(at), { round, application, at });
      }
    }
    for (const events of byDay.values()) events.sort((a, b) => a.at.getTime() - b.at.getTime());
    return byDay;
  });

  // Days without a time: when each application was sent and when it closed.
  // An application shows once per day: a round on that day wins, and closing
  // wins over applying.
  const marksByDay = createMemo(() => {
    const byDay = new Map<string, DayMark[]>();
    for (const application of props.applications) {
      const roundDays = new Set(application.rounds.filter((r) => r.at).map((r) => localDay(new Date(r.at!))));
      const closed = application.closedDate;
      if (closed && !roundDays.has(closed)) {
        push(byDay, closed, { application, label: RESULT_LABELS[application.result] });
      }
      const applied = application.appliedDate;
      if (applied && applied !== closed && !roundDays.has(applied)) {
        push(byDay, applied, { application, label: 'Applied' });
      }
    }
    return byDay;
  });

  const days = createMemo(() => (view() === 'week' ? weekDays(anchor()) : monthDays(anchor())));

  const title = createMemo(() => {
    if (view() === 'month') return anchor().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const [first, last] = [days()[0], days()[6]];
    const short = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${short(first)} – ${short(last)} ${last.getFullYear()}`;
  });

  function move(step: number) {
    const next = new Date(anchor());
    if (view() === 'week') next.setDate(next.getDate() + 7 * step);
    else next.setMonth(next.getMonth() + step, 1);
    setAnchor(next);
  }

  const today = () => localDay(props.now);
  const rounds = (day: Date) => roundsByDay().get(localDay(day)) ?? [];
  const marks = (day: Date) => marksByDay().get(localDay(day)) ?? [];
  const weekday = (day: Date) => day.toLocaleDateString('en-GB', { weekday: 'short' });

  return (
    <section class="calendar card">
      <div class="calendar-bar">
        <h2>{title()}</h2>
        <div class="calendar-nav">
          <button type="button" onClick={() => move(-1)} aria-label="Previous">
            ‹
          </button>
          <button type="button" onClick={() => setAnchor(new Date())}>
            Today
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next">
            ›
          </button>
        </div>
        <div class="segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view() === 'week' ? 'true' : 'false'} onClick={() => choose('week')}>
            Week
          </button>
          <button type="button" aria-pressed={view() === 'month' ? 'true' : 'false'} onClick={() => choose('month')}>
            Month
          </button>
        </div>
      </div>

      <Show
        when={view() === 'month'}
        fallback={
          <div class="week">
            <div class="week-row">
              <span />
              <For each={days()}>
                {(day) => (
                  <div class={['week-head', { today: localDay(day) === today() }]}>
                    {weekday(day)} <strong>{day.getDate()}</strong>
                  </div>
                )}
              </For>
            </div>
            <div class="week-row lane-row">
              <span class="lane-label">Events</span>
              <For each={days()}>
                {(day) => (
                  <div class="lane">
                    <For each={marks(day).slice(0, LANE_CHIPS)}>{(mark) => <MarkChip mark={mark} />}</For>
                    <Show when={marks(day).length > LANE_CHIPS}>
                      <span
                        class="more-events"
                        title={marks(day)
                          .slice(LANE_CHIPS)
                          .map((mark) => `${mark.label} · ${mark.application.company}`)
                          .join('\n')}
                      >
                        +{marks(day).length - LANE_CHIPS} more
                      </span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
            <div class="week-row week-body">
              <div class="week-hours">
                <For each={HOURS}>{(hour) => <span>{String(hour).padStart(2, '0')}:00</span>}</For>
              </div>
              <For each={days()}>
                {(day) => (
                  <div class={['week-col', { today: localDay(day) === today() }]}>
                    <For each={placed(rounds(day))}>
                      {(item) => <WeekEvent event={item.event} left={item.left} width={item.width} />}
                    </For>
                    <Show when={localDay(day) === today() && hourOf(props.now) >= FIRST_HOUR && hourOf(props.now) <= LAST_HOUR}>
                      <div class="now-line" style={{ top: `${percentOfDay(hourOf(props.now))}%` }} />
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        }
      >
        <div class="month">
          <For each={days().slice(0, 7)}>{(day) => <div class="month-head">{weekday(day)}</div>}</For>
          <For each={days()}>
            {(day) => (
              <div
                class={[
                  'month-day',
                  { today: localDay(day) === today(), outside: day.getMonth() !== anchor().getMonth() },
                ]}
              >
                <span class="month-num">{day.getDate()}</span>
                <For each={rounds(day).slice(0, MONTH_CHIPS)}>{(event) => <RoundChip event={event} />}</For>
                <For each={marks(day).slice(0, Math.max(0, MONTH_CHIPS - rounds(day).length))}>
                  {(mark) => <MarkChip mark={mark} />}
                </For>
                <Show when={rounds(day).length + marks(day).length > MONTH_CHIPS}>
                  <span class="more-events">+{rounds(day).length + marks(day).length - MONTH_CHIPS} more</span>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}

function WeekEvent(props: { event: RoundEvent; left: number; width: number }) {
  const start = () => Math.min(Math.max(hourOf(props.event.at), FIRST_HOUR), LAST_HOUR - 1);
  return (
    <a
      class={['week-event', { cancelled: props.event.round.outcome === 'cancelled' }]}
      href={`/applications/${props.event.application.id}`}
      style={{
        '--app': appColor(props.event.application),
        top: `${percentOfDay(start())}%`,
        height: `${100 / (LAST_HOUR - FIRST_HOUR)}%`,
        left: `${props.left}%`,
        width: `${props.width}%`,
      }}
      title={`${props.event.application.company} · ${ROUND_TYPE_LABELS[props.event.round.type]} · ${formatTime(props.event.at)}`}
    >
      <strong>{props.event.application.company}</strong>
      <span>
        {formatTime(props.event.at)} · {ROUND_TYPE_LABELS[props.event.round.type]}
      </span>
    </a>
  );
}

function RoundChip(props: { event: RoundEvent }) {
  return (
    <a
      class={['round-chip', { cancelled: props.event.round.outcome === 'cancelled' }]}
      style={{ '--app': appColor(props.event.application) }}
      href={`/applications/${props.event.application.id}`}
      title={`${props.event.application.company} · ${ROUND_TYPE_LABELS[props.event.round.type]} · ${formatTime(props.event.at)}`}
    >
      {formatTime(props.event.at)} {props.event.application.company}
    </a>
  );
}

function MarkChip(props: { mark: DayMark }) {
  return (
    <a
      class="mark-chip"
      style={{ '--app': appColor(props.mark.application) }}
      href={`/applications/${props.mark.application.id}`}
      title={`${props.mark.application.company} · ${props.mark.label}`}
    >
      {props.mark.label} · {props.mark.application.company}
    </a>
  );
}

/**
 * Rounds of one day, placed side by side when they overlap. Rounds starting
 * within the same hour share the column's width.
 */
function placed(events: RoundEvent[]): { event: RoundEvent; left: number; width: number }[] {
  const groups: RoundEvent[][] = [];
  for (const event of events) {
    const group = groups.at(-1);
    if (group && event.at.getTime() - group[0].at.getTime() < 3_600_000) group.push(event);
    else groups.push([event]);
  }
  return groups.flatMap((group) =>
    group.map((event, i) => ({ event, left: (i * 100) / group.length, width: 100 / group.length })),
  );
}

function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

function percentOfDay(hour: number): number {
  return ((hour - FIRST_HOUR) / (LAST_HOUR - FIRST_HOUR)) * 100;
}

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

/** The 7 days, Monday to Sunday, of the week holding `date`. */
function weekDays(date: Date): Date[] {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

/** Whole weeks, Monday to Sunday, covering the month holding `date`. */
function monthDays(date: Date): Date[] {
  const first = weekDays(new Date(date.getFullYear(), date.getMonth(), 1))[0];
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = first; d <= lastOfMonth || days.length % 7 !== 0; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    days.push(d);
  }
  return days;
}
