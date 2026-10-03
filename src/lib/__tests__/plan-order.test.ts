import { applyPlanOrder, computePlanDragGeometry, movePlanByOffset } from '../plan-order';
import type { WorkoutPlan } from '../../types';

function plan(id: string): WorkoutPlan {
  return { id, title: `Plan ${id}`, emoji: '💪', muscles: [], exercises: [] };
}

/** Card heights (a=100, b=150, c=120) for a 10px flex gap. */
const heights = (): Map<string, number> =>
  new Map([
    ['a', 100],
    ['b', 150],
    ['c', 120],
  ]);
const GAP = 10;

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
    const geo = computePlanDragGeometry(ids, heights(), 'b', 0, GAP);

    expect(geo).not.toBeNull();
    expect(geo!.targetOrder).toEqual(['a', 'b', 'c']);
    expect(geo!.snap).toBe(0);
    expect(geo!.shifts).toEqual(new Map([['a', 0], ['c', 0]]));
  });

  it('drops the dragged card after the next card once its centre passes it', () => {
    // b's centre (185) must pass c's midpoint (330) -> dy > 145.
    const geo = computePlanDragGeometry(ids, heights(), 'b', 150, GAP)!;

    expect(geo.targetOrder).toEqual(['a', 'c', 'b']);
    expect(geo.hoverIndex).toBe(2);
    // b settles into its new slot; c slides up by b's height + gap.
    expect(geo.snap).toBe(130);
    expect(geo.shifts).toEqual(new Map([['a', 0], ['c', -160]]));
  });

  it('drops the dragged card before the previous card when dragged up', () => {
    // b's centre (185) must pass a's midpoint (50) -> dy < -135.
    const geo = computePlanDragGeometry(ids, heights(), 'b', -200, GAP)!;

    expect(geo.targetOrder).toEqual(['b', 'a', 'c']);
    expect(geo.hoverIndex).toBe(0);
    expect(geo.snap).toBe(-110);
    // a slides down into the slot the lifted card left behind.
    expect(geo.shifts).toEqual(new Map([['a', 160], ['c', 0]]));
  });

  it('clamps at the ends when dragged far past the list', () => {
    const geo = computePlanDragGeometry(ids, heights(), 'a', 999, GAP)!;

    expect(geo.targetOrder).toEqual(['b', 'c', 'a']);
    expect(geo.hoverIndex).toBe(2);
    expect(geo.snap).toBe(290);
    // both remaining cards slide up by a's height + gap (100 + 10).
    expect(geo.shifts).toEqual(new Map([['b', -110], ['c', -110]]));
  });

  it('handles mixed card heights when a tall card moves between short ones', () => {
    const mixed = new Map<string, number>([
      ['short1', 60],
      ['tall', 240],
      ['short2', 60],
    ]);

    // Drag the tall card down past short2's midpoint (350): its centre
    // (70 + 120 = 190) must exceed it.
    const geo = computePlanDragGeometry(['short1', 'tall', 'short2'], mixed, 'tall', 200, GAP)!;

    expect(geo.targetOrder).toEqual(['short1', 'short2', 'tall']);
    // short2 slides up by the tall card's height + gap (240 + 10).
    expect(geo.shifts.get('short2')).toBe(-250);
    expect(geo.shifts.get('short1')).toBe(0);
  });

  it('returns null until every row has been measured', () => {
    const partial = heights();
    partial.delete('c');
    expect(computePlanDragGeometry(ids, partial, 'b', 100, GAP)).toBeNull();
  });

  it('returns null for an unknown dragged id or a single-card routine', () => {
    expect(computePlanDragGeometry(ids, heights(), 'missing', 100, GAP)).toBeNull();
    expect(computePlanDragGeometry(['a'], heights(), 'a', 100, GAP)).toBeNull();
  });
});

describe('computePlanDragGeometry across consecutive drags (stale-coordinate regression)', () => {
  const rowHeights = new Map<string, number>([
    ['a', 100],
    ['b', 150],
    ['c', 120],
  ]);
  const drag = (order: string[], dragId: string, dy: number): string[] =>
    computePlanDragGeometry(order, rowHeights, dragId, dy, GAP)!.targetOrder;

  it('applies a chain of swaps using only the live order and measured heights', () => {
    // c to top.
    expect(drag(['a', 'b', 'c'], 'c', -280)).toEqual(['c', 'a', 'b']);
    // b (now last) to top.
    expect(drag(['c', 'a', 'b'], 'b', -300)).toEqual(['b', 'c', 'a']);
    // a (now last) into the middle.
    expect(drag(['b', 'c', 'a'], 'a', -200)).toEqual(['b', 'a', 'c']);
    // b (now first) to the bottom.
    expect(drag(['b', 'a', 'c'], 'b', 400)).toEqual(['a', 'c', 'b']);
    // c (now middle) back to the top.
    expect(drag(['a', 'c', 'b'], 'c', -130)).toEqual(['c', 'a', 'b']);
  });

  it('resolves against the new slots immediately after a reorder (web: onLayout only fires on size changes)', () => {
    // Order changed to [b, a, c] but the cards kept their heights, so no new
    // onLayout events arrive on react-native-web. Dragging b down 150px must
    // resolve against a's *new* midpoint, not its old cached position.
    const geo = computePlanDragGeometry(['b', 'a', 'c'], rowHeights, 'b', 150, GAP)!;

    expect(geo.targetOrder).toEqual(['a', 'b', 'c']);
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
