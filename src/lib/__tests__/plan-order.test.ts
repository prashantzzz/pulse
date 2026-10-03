import { applyPlanOrder, computePlanDragGeometry, movePlanByOffset } from '../plan-order';
import type { PlanRowLayout } from '../plan-order';
import type { WorkoutPlan } from '../../types';

function plan(id: string): WorkoutPlan {
  return { id, title: `Plan ${id}`, emoji: '💪', muscles: [], exercises: [] };
}

/** Three cards of different heights with a 10px flex gap. */
const layouts = (): Map<string, PlanRowLayout> =>
  new Map<string, PlanRowLayout>([
    ['a', { y: 0, height: 100 }],
    ['b', { y: 110, height: 150 }],
    ['c', { y: 270, height: 120 }],
  ]);

describe('applyPlanOrder (My Plans drag & drop)', () => {
  it('returns plans in the dragged id order', () => {
    const plans = [plan('a'), plan('b'), plan('c')];

    const next = applyPlanOrder(plans, ['c', 'a', 'b']);

    expect(next.map((p) => p.id)).toEqual(['c', 'a', 'b']);
    // Original plan objects are preserved (no copies / data loss).
    expect(next[0]).toBe(plans[2]);
    expect(next[1]).toBe(plans[0]);
    expect(next[2]).toBe(plans[1]);
  });

  it('ignores unknown ids and keeps plans missing from the order at the end', () => {
    const plans = [plan('a'), plan('b'), plan('c')];

    const next = applyPlanOrder(plans, ['missing', 'c', 'a']);

    expect(next.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('ignores duplicate ids', () => {
    const plans = [plan('a'), plan('b')];

    const next = applyPlanOrder(plans, ['b', 'b', 'a']);

    expect(next.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('returns the same array reference when the order is unchanged', () => {
    const plans = [plan('a'), plan('b'), plan('c')];

    expect(applyPlanOrder(plans, ['a', 'b', 'c'])).toBe(plans);
  });

  it('handles empty or single-plan routines without changes', () => {
    const empty: WorkoutPlan[] = [];
    const single = [plan('a')];

    expect(applyPlanOrder(empty, ['a'])).toBe(empty);
    expect(applyPlanOrder(single, ['a'])).toBe(single);
    expect(applyPlanOrder(single, [])).toBe(single);
  });
});

describe('computePlanDragGeometry (drag projection)', () => {
  const ids = ['a', 'b', 'c'];

  it('keeps everything at rest when the card has not moved', () => {
    const geo = computePlanDragGeometry(ids, layouts(), 'b', 0);

    expect(geo).not.toBeNull();
    expect(geo!.targetOrder).toEqual(['a', 'b', 'c']);
    expect(geo!.snap).toBe(0);
    expect(geo!.shifts).toEqual(new Map([['a', 0], ['c', 0]]));
  });

  it('drops the dragged card after the next card once its centre passes it', () => {
    // b's centre (185) must pass c's original centre (330) -> dy > 145.
    const geo = computePlanDragGeometry(ids, layouts(), 'b', 150)!;

    expect(geo.targetOrder).toEqual(['a', 'c', 'b']);
    expect(geo.hoverIndex).toBe(2);
    // b settles into its new slot; c slides up by b's height + gap.
    expect(geo.snap).toBe(130);
    expect(geo.shifts).toEqual(new Map([['a', 0], ['c', -160]]));
  });

  it('drops the dragged card before the previous card when dragged up', () => {
    // b's centre (185) must pass a's centre (50) -> dy < -135.
    const geo = computePlanDragGeometry(ids, layouts(), 'b', -200)!;

    expect(geo.targetOrder).toEqual(['b', 'a', 'c']);
    expect(geo.hoverIndex).toBe(0);
    expect(geo.snap).toBe(-110);
    // a slides down into the slot the lifted card left behind.
    expect(geo.shifts).toEqual(new Map([['a', 160], ['c', 0]]));
  });

  it('clamps at the ends when dragged far past the list', () => {
    const geo = computePlanDragGeometry(ids, layouts(), 'a', 999)!;

    expect(geo.targetOrder).toEqual(['b', 'c', 'a']);
    expect(geo.hoverIndex).toBe(2);
    expect(geo.snap).toBe(290);
    // both remaining cards slide up by a's height + gap (100 + 10).
    expect(geo.shifts).toEqual(new Map([['b', -110], ['c', -110]]));
  });

  it('handles mixed card heights when a tall card moves between short ones', () => {
    const mixed = new Map<string, PlanRowLayout>([
      ['short1', { y: 0, height: 60 }],
      ['tall', { y: 70, height: 240 }],
      ['short2', { y: 320, height: 60 }],
    ]);

    // Drag the tall card down past short2's centre (350): its centre
    // (70 + 120 = 190) must exceed it.
    const geo = computePlanDragGeometry(['short1', 'tall', 'short2'], mixed, 'tall', 200)!;

    expect(geo.targetOrder).toEqual(['short1', 'short2', 'tall']);
    // short2 slides up by the tall card's height + gap (240 + 10).
    expect(geo.shifts.get('short2')).toBe(-250);
    expect(geo.shifts.get('short1')).toBe(0);
  });

  it('returns null until every row has been measured', () => {
    const partial = layouts();
    partial.delete('c');
    expect(computePlanDragGeometry(ids, partial, 'b', 100)).toBeNull();
  });

  it('returns null for an unknown dragged id or a single-card routine', () => {
    expect(computePlanDragGeometry(ids, layouts(), 'missing', 100)).toBeNull();
    expect(computePlanDragGeometry(['a'], layouts(), 'a', 100)).toBeNull();
  });
});

describe('movePlanByOffset (accessibility move up/down)', () => {
  const plans = [plan('a'), plan('b'), plan('c')];

  it('moves a plan one slot in either direction', () => {
    expect(movePlanByOffset(plans, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(movePlanByOffset(plans, 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('returns null when the move would fall outside the list', () => {
    expect(movePlanByOffset(plans, 'a', -1)).toBeNull();
    expect(movePlanByOffset(plans, 'c', 1)).toBeNull();
    expect(movePlanByOffset(plans, 'missing', 1)).toBeNull();
  });
});
