// The numbers in the row at the top of Home.
import { localDay, type Application, type Round } from './model';
import { assess } from './situation';
import { isOngoing } from './stage';

export interface NextRound {
  application: Application;
  round: Round;
}

/** The soonest planned round of an ongoing application, or null. */
export function nextRound(applications: Application[], now: Date): NextRound | null {
  let next: NextRound | null = null;
  for (const application of applications.filter(isOngoing)) {
    for (const round of application.rounds) {
      if (!round.at || round.outcome === 'cancelled' || Date.parse(round.at) < now.getTime()) continue;
      if (!next || round.at < next.round.at!) next = { application, round };
    }
  }
  return next;
}

export interface Week {
  /** Applications sent this week, Monday to Sunday. */
  sent: number;
  /** Rounds this week that have already happened. */
  held: number;
}

export function thisWeek(applications: Application[], now: Date): Week {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const start = localDay(monday);
  const end = localDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
  const inWeek = (day: string) => day >= start && day <= end;

  let sent = 0;
  let held = 0;
  for (const application of applications) {
    if (application.appliedDate && inWeek(application.appliedDate)) sent++;
    for (const round of application.rounds) {
      if (!round.at || round.outcome === 'cancelled') continue;
      const at = new Date(round.at);
      if (inWeek(localDay(at)) && at.getTime() < now.getTime()) held++;
    }
  }
  return { sent, held };
}

/** Active applications with no news for two weeks: no reply, or no result after a round. */
export function goneQuiet(applications: Application[], now: Date): number {
  return applications
    .filter(isOngoing)
    .filter((a) => ['no-reply', 'result-overdue'].includes(assess(a, now).situation)).length;
}
