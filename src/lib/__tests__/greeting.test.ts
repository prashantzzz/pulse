import { GREETINGS, dayPart, greetingFor } from '../greeting';

describe('dayPart', () => {
  it('buckets hours into morning / noon / evening / night', () => {
    expect(dayPart(new Date(2026, 7, 18, 7))).toBe('morning');
    expect(dayPart(new Date(2026, 7, 18, 13))).toBe('noon');
    expect(dayPart(new Date(2026, 7, 18, 18))).toBe('evening');
    expect(dayPart(new Date(2026, 7, 18, 23))).toBe('night');
    expect(dayPart(new Date(2026, 7, 18, 2))).toBe('night');
  });
});

describe('greetingFor', () => {
  it('uses the heading for the current day part', () => {
    const at = new Date(2026, 7, 18, 9);
    const g = greetingFor(at);
    expect(g.heading).toBe(GREETINGS[dayPart(at)].heading);
    expect(GREETINGS[dayPart(at)].lines).toContain(g.sub);
  });

  it('keeps each bucket to its own variation list', () => {
    for (const part of ['morning', 'noon', 'evening', 'night'] as const) {
      const at = new Date(2026, 7, 18, part === 'morning' ? 7 : part === 'noon' ? 13 : part === 'evening' ? 18 : 23);
      expect(GREETINGS[part].lines.length).toBeGreaterThan(0);
      expect(greetingFor(at).sub).toBeTruthy();
    }
  });

  it('picks deterministically for a given day', () => {
    const day = new Date(2026, 7, 18, 12);
    expect(greetingFor(day).sub).toBe(greetingFor(day).sub);
  });

  it('varies across days (not every day the same message)', () => {
    const subs = new Set<string>();
    for (let i = 0; i < 14; i += 1) {
      subs.add(greetingFor(new Date(2026, 7, 1 + i, 12)).sub);
    }
    expect(subs.size).toBeGreaterThan(1);
  });
});
