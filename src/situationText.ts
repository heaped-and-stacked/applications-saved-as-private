// The short line on each Home card, plus a hint shown on hover. Lines state
// facts; hints suggest, without telling the user what to do.
import { ROUND_TYPE_LABELS } from './data/model';
import type { Assessment } from './data/situation';
import { formatDateTime, formatDay } from './format';

export interface SituationText {
  line: string;
  hint: string;
}

export function situationText(assessment: Assessment, appliedDate: string): SituationText {
  const { situation, round, days } = assessment;
  const type = round ? ROUND_TYPE_LABELS[round.type] : '';
  const at = round?.at ? formatDateTime(round.at) : '';
  const on = round?.at ? formatDay(round.at) : '';
  const daysText = `${days} ${days === 1 ? 'day' : 'days'}`;
  switch (situation) {
    case 'round-soon':
      return { line: `${type} · ${at}`, hint: 'Within 48 hours. A good moment to prepare.' };
    case 'needs-debrief':
      return { line: `${type} on ${on} · no debrief`, hint: 'A debrief is easiest while the round is fresh.' };
    case 'result-overdue':
      return { line: `${type} on ${on} · no result for ${daysText}`, hint: 'A follow-up message could help.' };
    case 'passed-no-next':
      return { line: `Passed ${type.toLowerCase()} on ${on} · nothing planned`, hint: 'The next step may need asking about.' };
    case 'failed-open':
      return { line: `Failed ${type.toLowerCase()} on ${on}`, hint: 'Still ongoing. It could be closed as Rejected.' };
    case 'no-reply':
      return {
        line: appliedDate ? `Applied ${formatDay(appliedDate)} · no reply for ${daysText}` : `No reply for ${daysText}`,
        hint: 'A follow-up, or closing it as No reply.',
      };
    case 'round-later':
      return { line: `${type} · ${at}`, hint: 'Planned.' };
    case 'waiting':
      return round
        ? { line: `${type} on ${on} · ${daysText} ago`, hint: 'Waiting to hear back.' }
        : { line: appliedDate ? `Applied ${formatDay(appliedDate)}` : 'Added', hint: 'Waiting to hear back.' };
  }
}
