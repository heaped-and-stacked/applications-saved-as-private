// What an ongoing application needs from the user right now. A pure function
// of the application and the current time, so the rules are easy to read and
// test. The first rule that matches wins. The result is shown as one line of
// facts on each card; it never tells the user what to do.
//
// Cancelled rounds are ignored. A round is "next" until its start time
// passes, and "past" after that. Rounds without a date are neither.
import type { Application, Round } from './model';

const SOON_MS = 48 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FOLLOW_UP_DAYS = 14;

/** Where an application stands. When several apply, the first in this list wins. */
export const SITUATIONS = [
  'round-soon', // a round within 48 hours: prepare
  'needs-debrief', // a round has passed and nothing is written about it
  'result-overdue', // two weeks since the last round, its outcome still pending
  'passed-no-next', // the last round was passed, nothing planned after it
  'failed-open', // the last round was failed, but the application is still ongoing
  'no-reply', // two weeks since applying, no round at all
  'round-later', // a round is planned, more than 48 hours away
  'waiting', // nothing to do yet
] as const;

export type Situation = (typeof SITUATIONS)[number];

export interface Assessment {
  situation: Situation;
  /** The round it is about, if any. */
  round: Round | null;
  /** Days since the last round, else since applying, else since it was added. */
  days: number;
}

export function hasDebrief(round: Round): boolean {
  return round.felt !== null || round.difficulty !== null || !!round.questions || !!round.thoughts;
}

export function assess(application: Application, now: Date): Assessment {
  const time = now.getTime();
  const live = application.rounds.filter((r) => r.outcome !== 'cancelled');
  const dated = live.filter((r) => r.at).sort((a, b) => a.at!.localeCompare(b.at!));
  const next = dated.find((r) => Date.parse(r.at!) >= time) ?? null;
  const past = dated.filter((r) => Date.parse(r.at!) < time);
  const last = past.at(-1) ?? null;
  const days = daysSince(last?.at || application.appliedDate || application.createdAt, time);

  const result = (situation: Situation, round: Round | null): Assessment => ({ situation, round, days });

  if (next && Date.parse(next.at!) - time <= SOON_MS) return result('round-soon', next);

  const undebriefed = [...past].reverse().find((r) => !hasDebrief(r));
  if (undebriefed) return result('needs-debrief', undebriefed);

  if (!next && last) {
    if (last.outcome === 'pending' && days >= FOLLOW_UP_DAYS) return result('result-overdue', last);
    if (last.outcome === 'passed') return result('passed-no-next', last);
    if (last.outcome === 'failed') return result('failed-open', last);
  }

  if (dated.length === 0 && days >= FOLLOW_UP_DAYS) return result('no-reply', null);
  if (next) return result('round-later', next);
  return result('waiting', last);
}

function daysSince(value: string, time: number): number {
  if (!value) return 0;
  // A plain day (YYYY-MM-DD) counts from local midnight.
  const start = value.length === 10 ? new Date(`${value}T00:00:00`).getTime() : Date.parse(value);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((time - start) / DAY_MS));
}
