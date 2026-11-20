// Reading and writing the document as JSON. Pure functions, no Solid, so
// they are easy to test. See the rules at the top of model.ts.
import {
  FORMAT_VERSION,
  localDay,
  newId,
  type Application,
  type AsapDocument,
  type Note,
  type Result,
  type Round,
  type RoundType,
} from './model';
import { assignMissingColors } from './color';

export function emptyDocument(): AsapDocument {
  return { app: 'asap', version: FORMAT_VERSION, savedAt: '', applications: [] };
}

export interface Loaded {
  document: AsapDocument;
  /** True when the file is from a newer version of the app: show it, don't save it. */
  readOnly: boolean;
  /** True when the file was exported from Job Hunt Command Center and converted. */
  converted: boolean;
}

/** Turns parsed JSON into a document, or throws an Error that can be shown to the user. */
export function readDocument(json: unknown): Loaded {
  if (!isObject(json)) throw new Error('This file is not an ASAP data file.');
  if (json.app === 'asap') {
    const version = typeof json.version === 'number' ? json.version : 0;
    const document = withDefaults(json);
    assignMissingColors(document.applications);
    return { document, readOnly: version > FORMAT_VERSION, converted: false };
  }
  if (Array.isArray(json.jobs)) {
    const document = fromCommandCenter(json);
    assignMissingColors(document.applications);
    return { document, readOnly: false, converted: true };
  }
  throw new Error('This file is not an ASAP data file.');
}

/** The JSON text to save, stamped with the time it was written. */
export function writeDocument(document: AsapDocument): string {
  return JSON.stringify({ ...document, savedAt: new Date().toISOString() }, null, 2);
}

// Defaults fill in missing fields. Spreading the raw object last keeps every
// field the file has, including ones this version of the app doesn't know.
function withDefaults(raw: Record<string, unknown>): AsapDocument {
  const applications = Array.isArray(raw.applications) ? raw.applications.filter(isObject) : [];
  return {
    ...emptyDocument(),
    ...raw,
    applications: applications.map(applicationWithDefaults),
  } as AsapDocument;
}

function applicationWithDefaults(input: Record<string, unknown>): Application {
  const raw = withSalariesAsExtras(input);
  const rounds = Array.isArray(raw.rounds) ? raw.rounds.filter(isObject) : [];
  const notes = Array.isArray(raw.notes) ? raw.notes.filter(isObject) : [];
  return {
    id: newId(),
    company: '',
    role: '',
    location: '',
    workMode: '',
    appliedDate: '',
    result: '',
    closedDate: '',
    color: -1,
    extras: [],
    link: '',
    listing: '',
    createdAt: '',
    updatedAt: '',
    ...raw,
    rounds: rounds.map(roundWithDefaults),
    notes: notes.map(noteWithDefaults),
  } as Application;
}

// Before custom fields, salaries had fields of their own (salaryExpectation,
// salaryOffer). They move into extras, so no value is lost.
function withSalariesAsExtras(input: Record<string, unknown>): Record<string, unknown> {
  const { salaryExpectation, salaryOffer, ...raw } = input;
  const extras = Array.isArray(raw.extras) ? raw.extras.filter(isObject) : [];
  if (text(salaryExpectation)) extras.push({ label: 'Salary asked', value: text(salaryExpectation) });
  if (text(salaryOffer)) extras.push({ label: 'Salary offered', value: text(salaryOffer) });
  return { ...raw, extras };
}

function roundWithDefaults(raw: Record<string, unknown>): Round {
  return {
    id: newId(),
    type: 'other',
    at: null,
    outcome: 'pending',
    felt: null,
    difficulty: null,
    questions: '',
    thoughts: '',
    ...raw,
  } as Round;
}

function noteWithDefaults(raw: Record<string, unknown>): Note {
  return { id: newId(), date: '', text: '', ...raw } as Note;
}

// Job Hunt Command Center exports flat lists (jobs, rounds, notes) linked by
// numeric ids and uses upper-case names like TAKE_HOME. Rounds and notes move
// inside their application here.
//
// Its statuses become a result: open statuses (Applied, Interviewing, Offer)
// become ongoing, since ASAP works out the stage from the rounds.
const RESULTS: Record<string, Result> = {
  ACCEPTED: 'hired',
  REJECTED: 'rejected',
  GHOSTED: 'no-reply',
  WITHDRAWN: 'withdrew',
  DECLINED: 'withdrew',
};

// Its round types map to the steps ASAP knows.
const ROUND_TYPES: Record<string, RoundType> = {
  SCREENING: 'screening',
  HIRING_MANAGER: 'screening',
  TECHNICAL: 'technical',
  TAKE_HOME: 'technical',
  FINAL: 'technical',
};

function fromCommandCenter(raw: Record<string, unknown>): AsapDocument {
  const jobs = list(raw.jobs);
  const rounds = list(raw.rounds);
  const notes = list(raw.notes);

  const applications = jobs.map((job) =>
    applicationWithDefaults({
      company: text(job.company).trim(),
      role: text(job.roleTitle).trim(),
      location: text(job.location),
      workMode: job.workMode === 'UNKNOWN' ? '' : lower(job.workMode),
      appliedDate: text(job.appliedDate),
      result: RESULTS[text(job.status)] ?? '',
      closedDate: text(job.closedDate),
      salaryExpectation: text(job.salaryExpectation),
      salaryOffer: text(job.salaryOffer),
      link: text(job.jobUrl),
      listing: text(job.jobDescription),
      createdAt: text(job.createdAt),
      updatedAt: text(job.updatedAt),
      rounds: [
        ...rounds
          .filter((round) => round.jobId === job.id)
          .map((round) => ({
            type: ROUND_TYPES[text(round.type)] ?? 'other',
            at: text(round.scheduledAt) || null,
            outcome: lower(round.outcome) || 'pending',
            felt: number(round.feltScore),
            difficulty: number(round.difficultyScore),
            questions: text(round.questionsAsked),
            thoughts: text(round.debrief),
          })),
        ...offerRound(text(job.status)),
      ],
      // Oldest first, so notes from the same day keep the order they were written in.
      notes: notes
        .filter((note) => note.jobId === job.id)
        .sort((a, b) => text(a.createdAt).localeCompare(text(b.createdAt)))
        .map((note) => ({ date: dayOf(note.createdAt), text: text(note.text) })),
    }),
  );

  return { ...emptyDocument(), applications };
}

// The old app had no offer round, only offer statuses. ASAP knows a job got
// to the offer from an Offer round, so one is added, without a date.
function offerRound(status: string): Partial<Round>[] {
  if (status === 'OFFER') return [{ type: 'offer', outcome: 'pending' }];
  if (status === 'ACCEPTED' || status === 'DECLINED') return [{ type: 'offer', outcome: 'passed' }];
  return [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function number(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

/** The local calendar day of an ISO instant. */
function dayOf(value: unknown): string {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime()) ? '' : localDay(date);
}
