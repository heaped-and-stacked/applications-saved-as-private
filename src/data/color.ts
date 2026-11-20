import type { Application } from './model';

// Each application has its own color, the same on its card, its page and in
// the calendar. Colors come from one fixed sequence, the same for everybody:
// each slot turns by the golden angle (about 137.5°) around the color wheel,
// which keeps neighbors far apart, and the lightness steps too. The steps
// are CSS variables (--app-l0..2), darker in the light theme.
//
// A new application takes the first slot no ongoing application uses, so
// slots of closed applications get reused. An application keeps its slot for
// good: its color never changes once it is added.
const GOLDEN_ANGLE = 137.508;

export function slotColor(slot: number): string {
  return `hsl(${(slot * GOLDEN_ANGLE) % 360} 60% var(--app-l${slot % 3}))`;
}

export function appColor(application: Application): string {
  return slotColor(application.color);
}

/** The first slot no ongoing application uses. */
export function freeSlot(applications: Application[]): number {
  const taken = new Set(applications.filter((a) => a.result === '' && a.color >= 0).map((a) => a.color));
  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
}

/**
 * Gives a slot to every application that has none yet (older files), in the
 * order they were added. Changes the applications in place.
 */
export function assignMissingColors(applications: Application[]): void {
  const missing = applications
    .filter((a) => !(a.color >= 0))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const application of missing) application.color = freeSlot(applications);
}
