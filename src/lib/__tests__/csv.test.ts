import { resolveExercise } from '../csv';

// ---------------------------------------------------------------------------
// Canonical exercise identity: every common name variant must land on the
// same stable canonical id, never on a display-name guess or a custom entry.
// ---------------------------------------------------------------------------

describe('resolveExercise — canonical identity', () => {
  it('resolves the canonical name to its own id', () => {
    expect(resolveExercise('Bench Press').id).toBe('bench-press');
    expect(resolveExercise('Squat').id).toBe('squat');
    expect(resolveExercise('Deadlift').id).toBe('deadlift');
  });

  it('resolves aliases to the canonical id (never a custom exercise)', () => {
    expect(resolveExercise('Flat Bench Press').id).toBe('bench-press');
    expect(resolveExercise('Barbell Bench Press').id).toBe('bench-press');
    expect(resolveExercise('BB Bench Press').id).toBe('bench-press');
    expect(resolveExercise('Overhead Press').id).toBe('barbell-overhead-press');
    expect(resolveExercise('Military Press').id).toBe('barbell-overhead-press');
    expect(resolveExercise('Bent-Over Row').id).toBe('barbell-row');
    expect(resolveExercise('Lat Pull Down').id).toBe('lat-pulldown');
    expect(resolveExercise('RDL').id).toBe('romanian-deadlift');
  });

  it('honours the equipment suffix over a bare-name match', () => {
    // the classic trap: "Bench Press (Dumbbell)" must NOT become barbell bench
    expect(resolveExercise('Bench Press (Dumbbell)').id).toBe('dumbbell-bench-press');
    expect(resolveExercise('Bench Press (Barbell)').id).toBe('bench-press');
    expect(resolveExercise('Squat (Barbell)').id).toBe('squat');
    expect(resolveExercise('Lat Pulldown (Cable)').id).toBe('lat-pulldown');
  });

  it('falls back to the base exercise when no equipment-qualified variant exists', () => {
    // no dumbbell shoulder press in the knowledge base → keep the canonical one
    expect(resolveExercise('Shoulder Press (Dumbbell)').id).toBe('shoulder-press');
    // a bilateral dumbbell RDL now exists, so the equipment suffix resolves to it
    expect(resolveExercise('Romanian Deadlift (Dumbbell)').id).toBe('dumbbell-romanian-deadlift');
  });

  it('resolves ambiguous bench variants to their specific canonical ids', () => {
    expect(resolveExercise('Incline Bench Press').id).toBe('incline-bench-press');
    expect(resolveExercise('Decline Bench Press').id).toBe('decline-bench-press');
    expect(resolveExercise('Close-Grip Bench Press').id).toBe('close-grip-bench-press');
    // "Incline Bench Press (Dumbbell)" keeps the incline variant (seed data)
    expect(resolveExercise('Incline Bench Press (Dumbbell)').id).toBe('incline-bench-press');
  });

  it('matches seed-CSV-style titles that the old matcher missed or mis-routed', () => {
    expect(resolveExercise('Bent-Over Row (Barbell)').id).toBe('barbell-row');
    expect(resolveExercise('Declined Bench Press (Dumbbell)').id).toBe('decline-bench-press');
    expect(resolveExercise('Seated Bicep Curl (Dumbbell)').id).toBe('bicep-curl');
    expect(resolveExercise('Triceps Pushdown (Cable)').id).toBe('triceps-pushdown');
    expect(resolveExercise('Seated Cable Row (Cable)').id).toBe('seated-cable-row');
    expect(resolveExercise('Leg Press Horizontal (Machine)').id).toBe('leg-press');
  });

  it('tolerates suffix notes like "- Bar Wide Grip" via containment', () => {
    expect(resolveExercise('Seated Cable Row - Bar Wide Grip').id).toBe('seated-cable-row');
  });

  it('still creates a custom exercise for genuinely unknown titles', () => {
    const e = resolveExercise('Hyper-Explosive Zorp Pogo Press');
    expect(e.id.startsWith('custom-')).toBe(true);
    expect(e.name).toBe('Hyper-Explosive Zorp Pogo Press');
  });
});
