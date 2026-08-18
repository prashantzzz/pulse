import { SEED_WORKOUTS } from '../seed-workouts';

describe('SEED_WORKOUTS (parsed from the user CSV)', () => {
  it('contains the expected number of sessions', () => {
    expect(SEED_WORKOUTS.length).toBeGreaterThanOrEqual(30);
  });

  it('maps log session titles onto the app plan titles', () => {
    const titles = new Set(SEED_WORKOUTS.map((w) => w.title));
    expect(titles.has('Push Day')).toBe(true);
    expect(titles.has('Pull Day')).toBe(true);
    expect(titles.has('Leg Day')).toBe(true);
    // no unmapped raw titles from the CSV remain
    expect(titles.has('Push')).toBe(false);
    expect(titles.has('Pull')).toBe(false);
    expect(titles.has('Legs')).toBe(false);
  });

  it('every workout has exercises with logged sets', () => {
    for (const w of SEED_WORKOUTS) {
      expect(w.exercises.length).toBeGreaterThan(0);
      for (const we of w.exercises) {
        expect(we.sets.length).toBeGreaterThan(0);
        expect(we.sets.some((s) => s.completed)).toBe(true);
      }
    }
  });

  it('resolves every seed exercise title to the canonical knowledge base (no custom fallbacks)', () => {
    const custom = SEED_WORKOUTS.flatMap((w) => w.exercises.map((e) => e.exerciseId)).filter((id) => id.startsWith('custom-'));
    expect(custom).toEqual([]);
  });

  it('sessions are stamped as seed data with real dates', () => {
    for (const w of SEED_WORKOUTS) {
      expect(w.source).toBe('seed');
      expect(new Date(w.startTime).getTime()).not.toBeNaN();
      expect(new Date(w.endTime).getTime()).toBeGreaterThanOrEqual(new Date(w.startTime).getTime());
    }
  });
});
