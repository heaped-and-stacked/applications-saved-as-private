// Dates and times, always in the same format, whatever the browser's language:
// "21 Nov 2026" and "21 Nov 2026, 14:00" (24-hour clock), in the user's time zone.

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** "21 Nov 2026" from YYYY-MM-DD, or from an ISO instant. */
export function formatDay(value: string): string {
  const date = toDate(value);
  return date ? DAY.format(date) : value;
}

/** "21 Nov 2026, 14:00" from an ISO instant. */
export function formatDateTime(value: string): string {
  const date = toDate(value);
  return date ? `${DAY.format(date)}, ${TIME.format(date)}` : value;
}

/** "14:00" from a Date. */
export function formatTime(date: Date): string {
  return TIME.format(date);
}

function toDate(value: string): Date | null {
  // A plain day is read as local midnight, not UTC.
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A datetime-local input works in local time without a zone ("2026-11-20T14:00").
// The document stores ISO instants, so these convert both ways.

export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
