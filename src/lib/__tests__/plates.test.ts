import { platesForTarget, roundToPlateStep } from '../plates';

describe('roundToPlateStep', () => {
  it('rounds down to the nearest 2.5 kg step', () => {
    expect(roundToPlateStep(21.25)).toBe(20);
    expect(roundToPlateStep(22.4)).toBe(20);
    expect(roundToPlateStep(22.6)).toBe(22.5);
    expect(roundToPlateStep(23.75)).toBe(22.5);
  });

  it('never goes negative and returns 0 for tiny values', () => {
    expect(roundToPlateStep(0)).toBe(0);
    expect(roundToPlateStep(1.2)).toBe(0);
  });
});

describe('platesForTarget', () => {
  it('is bar-only when the target is at or below the bar', () => {
    expect(platesForTarget(20, 20)).toEqual({ perSideKg: 0, plates: [], remainderKg: 0, barOnly: true });
    expect(platesForTarget(15, 20)).toEqual({ perSideKg: 0, plates: [], remainderKg: 0, barOnly: true });
  });

  it('splits the load evenly and uses the fewest standard plates', () => {
    // 100 kg total on a 20 kg bar → 40 kg per side → 25 + 15
    expect(platesForTarget(100, 20)).toEqual({
      perSideKg: 40,
      plates: [25, 15],
      remainderKg: 0,
      barOnly: false,
    });
  });

  it('handles 2.5 kg plates', () => {
    // 65 kg total → 22.5 kg per side → 20 + 2.5
    const r = platesForTarget(65, 20);
    expect(r.plates).toEqual([20, 2.5]);
    expect(r.remainderKg).toBe(0);
  });

  it('reports a remainder instead of overshooting when the load is off-step', () => {
    // 62.5 kg total → 21.25 kg per side → 20 kg + 1.25 kg remainder
    const r = platesForTarget(62.5, 20);
    expect(r.plates).toEqual([20]);
    expect(r.perSideKg).toBe(20);
    expect(r.remainderKg).toBe(1.25);
  });

  it('supports a 15 kg bar (women’s bar / training bar)', () => {
    // 60 kg total on a 15 kg bar → 22.5 per side
    const r = platesForTarget(60, 15);
    expect(r.perSideKg).toBe(22.5);
    expect(r.plates).toEqual([20, 2.5]);
    expect(r.barOnly).toBe(false);
  });

  it('never produces plates for a weight lighter than the bar', () => {
    expect(platesForTarget(10, 20).barOnly).toBe(true);
  });
});
