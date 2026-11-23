// The shape of the one JSON document that holds all of a user's data.
//
// Rules that keep old files working:
// 1. Only add fields, never rename. New fields are optional and get a
//    default when missing (see document.ts), so `version` stays the same.
// 2. Fields the app doesn't know are kept as they are, and saved again.
// 3. `version` goes up only for a breaking change, with a function in
//    document.ts that upgrades the old shape once, on load.
// 4. A file with a higher `version` than the app knows opens read-only.

export const FORMAT_VERSION = 1;

/** How an application ended. Empty while it is ongoing. */
/**
 * How an application ended. Empty while it is ongoing. 'position-closed' is
 * for an ending that isn't about you: the role was filled, the posting pulled,
 * or hiring frozen.
 */
export type Result = '' | 'hired' | 'rejected' | 'withdrew' | 'no-reply' | 'position-closed';

export type WorkMode = '' | 'remote' | 'hybrid' | 'onsite';

/** The steps of a hiring process, plus Other for anything that doesn't fit. */
export type RoundType = 'screening' | 'technical' | 'offer' | 'other';

export type Outcome = 'pending' | 'passed' | 'failed' | 'cancelled';

export interface Round {
  id: string;
  type: RoundType;
  /** Start time as an ISO instant. For a take-home, the due date. Null if not planned yet. */
  at: string | null;
  outcome: Outcome;
  /** How it felt, 1 to 5. */
  felt: number | null;
  /** How hard it was, 1 to 5. */
  difficulty: number | null;
  questions: string;
  thoughts: string;
}

/** A field the user adds when it matters, such as a salary. */
export interface Extra {
  label: string;
  value: string;
}

export interface Note {
  id: string;
  /** A calendar day, YYYY-MM-DD. */
  date: string;
  text: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  /** A calendar day, YYYY-MM-DD, or empty. */
  appliedDate: string;
  /**
   * How it ended, or empty while ongoing. The stage of an ongoing application
   * is not stored: it follows from its rounds (see stage.ts).
   */
  result: Result;
  /** The day it ended, YYYY-MM-DD. Set when a result is chosen, empty while ongoing. */
  closedDate: string;
  /** Its slot in the color sequence (see color.ts). Set once, when it is added. */
  color: number;
  /** Optional fields the user adds, such as salaries. Values are free text. */
  extras: Extra[];
  link: string;
  /** The job listing as pasted, since links expire. */
  listing: string;
  createdAt: string;
  updatedAt: string;
  rounds: Round[];
  notes: Note[];
}

export interface AsapDocument {
  app: 'asap';
  version: number;
  /** When the document was last written, as an ISO instant. */
  savedAt: string;
  applications: Application[];
}

export const RESULT_LABELS: Record<Result, string> = {
  '': 'Ongoing',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrew: 'Withdrew',
  'no-reply': 'No reply',
  'position-closed': 'Position closed',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  '': 'Not set',
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  screening: 'Screening',
  technical: 'Technical',
  offer: 'Offer',
  other: 'Other',
};

/** Suggestions offered when adding a field. Any other label works too. */
export const EXTRA_SUGGESTIONS = ['Salary asked', 'Salary offered'];

export const OUTCOME_LABELS: Record<Outcome, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function newId(): string {
  return crypto.randomUUID();
}

/** Today as YYYY-MM-DD, in the user's own time zone. */
export function today(): string {
  return localDay(new Date());
}

export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
