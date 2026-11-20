// Where an application stands, worked out from its rounds. Nothing here is
// stored: the rounds are the record of what happened.
import { RESULT_LABELS, type Application } from './model';

/** The steps of a hiring process, in order. */
export const STEPS = ['Applied', 'Screening', 'Technical', 'Offer'] as const;

const STEP_OF_TYPE: Record<string, number> = { screening: 1, technical: 2, offer: 3 };

/** How far it got: an index into STEPS. Cancelled and Other rounds don't count. */
export function stepOf(application: Application): number {
  let step = 0;
  for (const round of application.rounds) {
    if (round.outcome === 'cancelled') continue;
    step = Math.max(step, STEP_OF_TYPE[round.type] ?? 0);
  }
  return step;
}

export function isOngoing(application: Application): boolean {
  return application.result === '';
}

/** A short label: the result once it ended, else the step reached. */
export function stageLabel(application: Application): string {
  return isOngoing(application) ? STEPS[stepOf(application)] : RESULT_LABELS[application.result];
}

/**
 * The latest thing that happened or is planned, as a sortable string: the
 * applied date, a round (also a planned one), or a note. Falls back to when it
 * was added. Plain edits, like fixing a typo, don't count.
 */
export function lastActivity(application: Application): string {
  let last = application.appliedDate || application.createdAt;
  for (const round of application.rounds) {
    if (round.at && round.at > last) last = round.at;
  }
  for (const note of application.notes) {
    if (note.date > last) last = note.date;
  }
  return last;
}
