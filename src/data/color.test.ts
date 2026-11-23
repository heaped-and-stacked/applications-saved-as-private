import { describe, expect, it } from 'vitest';
import { readDocument } from './document';
import { appColor, CLOSED_COLOR, freeSlot, slotColor } from './color';

const load = (applications: object[]) =>
  readDocument({ app: 'asap', version: 1, applications }).document.applications;

describe('colors', () => {
  it('gives older files a slot per application, in the order they were added', () => {
    const apps = load([
      { id: 'b', createdAt: '2026-11-02T00:00:00Z' },
      { id: 'a', createdAt: '2026-11-01T00:00:00Z' },
      { id: 'c', createdAt: '2026-11-03T00:00:00Z' },
    ]);
    expect(Object.fromEntries(apps.map((a) => [a.id, a.color]))).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('keeps a slot once it is set', () => {
    expect(load([{ id: 'a', color: 7 }])[0].color).toBe(7);
  });

  it('reuses the slot of a closed application for a new one', () => {
    const apps = load([
      { id: 'a', color: 0, result: 'rejected' },
      { id: 'b', color: 1 },
    ]);
    expect(freeSlot(apps)).toBe(0);
  });

  it('shows closed applications in grey, active ones in their own color', () => {
    const [active, closed] = load([
      { id: 'a', color: 3 },
      { id: 'b', color: 3, result: 'rejected' },
    ]);
    expect(appColor(active)).toBe(slotColor(3));
    expect(appColor(closed)).toBe(CLOSED_COLOR);
  });

  it('gives different colors to the first 50 slots', () => {
    const colors = Array.from({ length: 50 }, (_, slot) => slotColor(slot));
    expect(new Set(colors).size).toBe(50);
  });
});
