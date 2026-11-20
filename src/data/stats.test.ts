import { describe, expect, it } from 'vitest';
import { readDocument } from './document';
import { goneQuiet, nextRound, thisWeek } from './stats';

// Friday 20 November 2026, noon local time. Its week runs Monday 16 to Sunday 22.
const NOW = new Date(2026, 10, 20, 12, 0);
const local = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).toISOString();

const applications = readDocument({
  app: 'asap',
  version: 1,
  applications: [
    { id: 'a', company: 'A', appliedDate: '2026-11-17', rounds: [{ id: 'a1', at: local(19, 14) }] },
    { id: 'b', company: 'B', appliedDate: '2026-11-15', rounds: [{ id: 'b1', at: local(24, 10) }] },
    { id: 'c', company: 'C', appliedDate: '2026-11-18', rounds: [{ id: 'c1', at: local(23, 9) }] },
    { id: 'd', company: 'D', result: 'rejected', rounds: [{ id: 'd1', at: local(21, 9) }] },
    { id: 'e', company: 'E', rounds: [{ id: 'e1', at: local(22, 9), outcome: 'cancelled' }] },
  ],
}).document.applications;

describe('nextRound', () => {
  it('finds the soonest planned round of an ongoing application', () => {
    expect(nextRound(applications, NOW)?.application.company).toBe('C');
  });

  it('is null when nothing is planned', () => {
    expect(nextRound([], NOW)).toBeNull();
  });
});

describe('thisWeek', () => {
  it('counts applications sent and rounds held from Monday to Sunday', () => {
    // Sent: A (17th) and C (18th), not B (15th, last week). Held: A's round on the 19th.
    // D's round on the 21st hasn't happened yet, and E's was cancelled.
    expect(thisWeek(applications, NOW)).toEqual({ sent: 2, held: 1 });
  });
});

describe('goneQuiet', () => {
  it('counts active applications with two weeks of silence', () => {
    const apps = readDocument({
      app: 'asap',
      version: 1,
      applications: [
        { id: 'a', appliedDate: '2026-11-01' }, // 19 days, no reply
        { id: 'b', appliedDate: '2026-11-15' }, // recent
        { id: 'c', appliedDate: '2026-10-01', result: 'no-reply' }, // already closed
        { id: 'd', appliedDate: '2026-10-20', rounds: [{ id: 'd1', at: local(1, 10), felt: 3 }] }, // result overdue
      ],
    }).document.applications;
    expect(goneQuiet(apps, NOW)).toBe(2);
  });
});
