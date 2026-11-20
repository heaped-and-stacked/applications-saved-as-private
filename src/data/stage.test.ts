import { describe, expect, it } from 'vitest';
import { readDocument } from './document';
import { lastActivity } from './stage';

describe('lastActivity', () => {
  it('is the latest of the applied date, rounds and notes', () => {
    const [app] = readDocument({
      app: 'asap',
      version: 1,
      applications: [
        {
          appliedDate: '2026-11-01',
          rounds: [{ id: 'r', at: '2026-11-05T10:00:00Z' }],
          notes: [{ id: 'n', date: '2026-11-12', text: 'Called.' }],
        },
      ],
    }).document.applications;
    expect(lastActivity(app)).toBe('2026-11-12');
  });
});
