import { describe, expect, it } from 'vitest';
import { readDocument } from './document';
import type { Application, Round } from './model';
import { assess } from './situation';

const NOW = new Date('2026-11-20T12:00:00Z');

function app(fields: Omit<Partial<Application>, 'rounds'> & { rounds?: Partial<Round>[] } = {}): Application {
  return readDocument({ app: 'asap', version: 1, applications: [{ appliedDate: '2026-11-15', ...fields }] }).document
    .applications[0];
}

const hoursFromNow = (hours: number) => new Date(NOW.getTime() + hours * 3600_000).toISOString();
const daysAgo = (days: number) => hoursFromNow(-24 * days);
const debriefed = { felt: 3 };

describe('assess', () => {
  it('waits after a fresh application', () => {
    expect(assess(app(), NOW)).toMatchObject({ situation: 'waiting', days: 5 });
  });

  it('asks to follow up after two weeks without a reply', () => {
    expect(assess(app({ appliedDate: '2026-11-01' }), NOW).situation).toBe('no-reply');
  });

  it('puts a round within 48 hours first, before anything else', () => {
    const a = app({ rounds: [{ type: 'screening', at: daysAgo(1) }, { type: 'technical', at: hoursFromNow(30) }] });
    expect(assess(a, NOW).situation).toBe('round-soon');
  });

  it('shows a round further away as planned', () => {
    expect(assess(app({ rounds: [{ type: 'technical', at: hoursFromNow(72) }] }), NOW).situation).toBe('round-later');
  });

  it('treats an offer round like any other round', () => {
    expect(assess(app({ rounds: [{ type: 'offer', at: hoursFromNow(100) }] }), NOW).situation).toBe('round-later');
    expect(assess(app({ rounds: [{ type: 'offer' }] }), NOW).situation).toBe('waiting');
  });

  it('asks for a debrief after a round, until anything is written', () => {
    expect(assess(app({ rounds: [{ type: 'screening', at: daysAgo(1) }] }), NOW).situation).toBe('needs-debrief');
    expect(assess(app({ rounds: [{ type: 'screening', at: daysAgo(1), thoughts: 'Fine.' }] }), NOW).situation).toBe(
      'waiting',
    );
  });

  it('flags a pending result after two weeks', () => {
    const a = app({ rounds: [{ type: 'technical', at: daysAgo(15), ...debriefed }] });
    expect(assess(a, NOW)).toMatchObject({ situation: 'result-overdue', days: 15 });
  });

  it('flags a passed round with nothing next, and a failed one still open', () => {
    expect(assess(app({ rounds: [{ at: daysAgo(2), outcome: 'passed', ...debriefed }] }), NOW).situation).toBe(
      'passed-no-next',
    );
    expect(assess(app({ rounds: [{ at: daysAgo(2), outcome: 'failed', ...debriefed }] }), NOW).situation).toBe(
      'failed-open',
    );
  });

  it('ignores cancelled rounds', () => {
    const a = app({ rounds: [{ type: 'technical', at: hoursFromNow(5), outcome: 'cancelled' }] });
    expect(assess(a, NOW).situation).toBe('waiting');
  });
});

