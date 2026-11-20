import { describe, expect, it } from 'vitest';
import { readDocument, writeDocument } from './document';

describe('readDocument', () => {
  it('fills in missing fields with defaults', () => {
    const { document } = readDocument({
      app: 'asap',
      version: 1,
      applications: [{ id: 'a', company: 'Acme', rounds: [{ id: 'r' }], notes: [{ id: 'n', text: 'Hi' }] }],
    });
    const application = document.applications[0];
    expect(application.result).toBe('');
    expect(application.closedDate).toBe('');
    expect(application.listing).toBe('');
    expect(application.rounds[0]).toMatchObject({ id: 'r', outcome: 'pending', at: null, felt: null });
    expect(application.notes[0]).toMatchObject({ id: 'n', text: 'Hi', date: '' });
  });

  it('keeps fields it does not know, and saves them again', () => {
    const { document } = readDocument({
      app: 'asap',
      version: 1,
      futureTopLevel: true,
      applications: [{ id: 'a', recruiter: 'Ana', rounds: [{ id: 'r', venue: 'Zoom' }] }],
    });
    const saved = JSON.parse(writeDocument(document));
    expect(saved.futureTopLevel).toBe(true);
    expect(saved.applications[0].recruiter).toBe('Ana');
    expect(saved.applications[0].rounds[0].venue).toBe('Zoom');
  });

  it('moves salaries from their old fields into custom fields', () => {
    const { document } = readDocument({
      app: 'asap',
      version: 1,
      applications: [{ id: 'a', salaryExpectation: '25000 RON', salaryOffer: '', extras: [{ label: 'Bonus', value: '10%' }] }],
    });
    const application = document.applications[0];
    expect(application.extras).toEqual([
      { label: 'Bonus', value: '10%' },
      { label: 'Salary asked', value: '25000 RON' },
    ]);
    expect(application).not.toHaveProperty('salaryExpectation');
    expect(application).not.toHaveProperty('salaryOffer');
  });

  it('opens a file from a newer version read-only', () => {
    expect(readDocument({ app: 'asap', version: 99, applications: [] }).readOnly).toBe(true);
    expect(readDocument({ app: 'asap', version: 1, applications: [] }).readOnly).toBe(false);
  });

  it('rejects files that are not ASAP data', () => {
    expect(() => readDocument([])).toThrow('not an ASAP data file');
    expect(() => readDocument({ hello: 'world' })).toThrow('not an ASAP data file');
  });

  it('converts a Job Hunt Command Center export', () => {
    const loaded = readDocument({
      exportedAt: '2026-11-18T10:00:00Z',
      jobs: [
        {
          id: 7,
          company: 'Acme',
          roleTitle: 'Backend Engineer ',
          jobUrl: 'https://example.com/job',
          workMode: 'UNKNOWN',
          status: 'INTERVIEWING',
          appliedDate: '2026-11-01',
          closedDate: null,
          jobDescription: 'Java, Spring',
          archived: false,
          colorIndex: 7,
        },
        { id: 8, company: 'Other', roleTitle: 'Dev', workMode: 'REMOTE', status: 'REJECTED', closedDate: '2026-11-10' },
        { id: 9, company: 'Ghost', status: 'GHOSTED' },
        { id: 10, company: 'Nope', status: 'DECLINED' },
        { id: 11, company: 'Yes', status: 'ACCEPTED' },
        { id: 12, company: 'Open', status: 'OFFER' },
      ],
      rounds: [
        {
          id: 1,
          jobId: 7,
          type: 'HIRING_MANAGER',
          scheduledAt: '2026-11-05T09:00:00Z',
          outcome: 'PASSED',
          feltScore: 4,
          difficultyScore: 2,
          questionsAsked: 'Why us?',
          debrief: 'Went well.',
        },
      ],
      notes: [
        { id: 2, jobId: 7, text: 'Later the same day.', createdAt: '2026-11-01T15:00:00Z' },
        { id: 1, jobId: 7, text: 'Found on LinkedIn.', createdAt: '2026-11-01T08:00:00Z' },
      ],
    });

    expect(loaded.converted).toBe(true);
    const [acme, other] = loaded.document.applications;
    expect(acme).toMatchObject({
      company: 'Acme',
      role: 'Backend Engineer',
      link: 'https://example.com/job',
      workMode: '',
      result: '',
      listing: 'Java, Spring',
    });
    expect(acme).not.toHaveProperty('colorIndex');
    expect(acme.rounds).toHaveLength(1);
    expect(acme.rounds[0]).toMatchObject({
      type: 'screening',
      at: '2026-11-05T09:00:00Z',
      outcome: 'passed',
      felt: 4,
      difficulty: 2,
      questions: 'Why us?',
      thoughts: 'Went well.',
    });
    expect(acme.notes.map((n) => n.text)).toEqual(['Found on LinkedIn.', 'Later the same day.']);
    expect(other.workMode).toBe('remote');
    expect(loaded.document.applications.slice(2).map((a) => a.result)).toEqual(['no-reply', 'withdrew', 'hired', '']);
    expect(other.result).toBe('rejected');
    expect(other).toMatchObject({ closedDate: '2026-11-10' });
    expect(other.notes).toEqual([]);
    const [, , ghost, declined, accepted, offer] = loaded.document.applications;
    expect(ghost.rounds).toEqual([]);
    expect(declined.rounds).toEqual([expect.objectContaining({ type: 'offer', outcome: 'passed', at: null })]);
    expect(accepted.rounds).toEqual([expect.objectContaining({ type: 'offer', outcome: 'passed' })]);
    expect(offer.rounds).toEqual([expect.objectContaining({ type: 'offer', outcome: 'pending' })]);
  });
});
