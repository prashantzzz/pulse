import type { WorkoutPlan } from '../types';

export interface PlanDragGeometry {
  /** full order of plan ids if the drag were released now */
  targetOrder: string[];
  /** translateY that settles the dragged card into its slot */
  snap: number;
  /** translateY every other row needs to reveal the drop slot */
  shifts: Map<string, number>;
  /** slot (in the list without the dragged row) the card sits over */
  hoverIndex: number;
}

/**
 * Applies a drag-and-drop order to the active plan list.
 *
 * - `orderedIds` is the full desired order of plan ids (as produced by the
 *   My Plans drag gesture).
 * - Ids that no longer exist on a plan are ignored.
 * - Plans missing from `orderedIds` (e.g. added while a drag was in flight)
 *   keep their relative order and are appended at the end.
 *
 * Returns the original array reference when nothing changes so callers can
 * cheaply skip state updates and cloud pushes.
 */
export function applyPlanOrder(
  plans: WorkoutPlan[],
  orderedIds: readonly string[],
): WorkoutPlan[] {
  if (plans.length <= 1 || orderedIds.length === 0) return plans;

  const byId = new Map(plans.map((p) => [p.id, p] as const));
  const placed = new Set<string>();
  const next: WorkoutPlan[] = [];

  for (const id of orderedIds) {
    const plan = byId.get(id);
    if (!plan || placed.has(id)) continue;
    placed.add(id);
    next.push(plan);
  }

  for (const plan of plans) {
    if (!placed.has(plan.id)) next.push(plan);
  }

  const changed = next.length !== plans.length || next.some((p, i) => p !== plans[i]);
  return changed ? next : plans;
}

/**
 * Computes the projected layout for a drag of `dragId` by `dy` pixels.
 *
 * Row tops are always derived from the live id order plus each row's measured
 * height and the constant flex gap — never from cached `onLayout` coordinates.
 * On web (react-native-web) `onLayout` is driven by a `ResizeObserver` and
 * therefore only fires on size changes: a card that merely moves to a new slot
 * keeps its stale y, which used to corrupt every drag after the first. Heights
 * do change (a card expands/collapses), so this stays accurate on native and
 * web alike.
 *
 * The dragged card's centre picks its slot against the other rows' midpoints;
 * the projected order is then laid out cumulatively to obtain the translate
 * each row needs to reveal the drop slot.
 *
 * Pure function: the drag list feeds it the current order and measured heights
 * and animates the resulting offsets.
 */
export function computePlanDragGeometry(
  orderedIds: readonly string[],
  rowHeights: ReadonlyMap<string, number>,
  dragId: string,
  dy: number,
  gap: number,
): PlanDragGeometry | null {
  const ids = [...orderedIds];
  if (ids.length < 2 || !ids.includes(dragId)) return null;
  if (!ids.every((id) => rowHeights.has(id))) return null;

  // Current top of every row under the live order.
  const tops = new Map<string, number>();
  let cursor = 0;
  for (const id of ids) {
    tops.set(id, cursor);
    cursor += (rowHeights.get(id) ?? 0) + gap;
  }

  const draggedTop = tops.get(dragId) ?? 0;
  const draggedHeight = rowHeights.get(dragId) ?? 0;
  const draggedCenter = draggedTop + draggedHeight / 2 + dy;

  const remaining = ids.filter((id) => id !== dragId);
  let hoverIndex = 0;
  for (const id of remaining) {
    const midpoint = (tops.get(id) ?? 0) + (rowHeights.get(id) ?? 0) / 2;
    if (midpoint < draggedCenter) hoverIndex += 1;
    else break;
  }

  const targetOrder = [
    ...remaining.slice(0, hoverIndex),
    dragId,
    ...remaining.slice(hoverIndex),
  ];

  // Cumulative layout of the projected order defines where every row lands.
  let projectedCursor = 0;
  const projectedTops = new Map<string, number>();
  for (const id of targetOrder) {
    projectedTops.set(id, projectedCursor);
    projectedCursor += (rowHeights.get(id) ?? 0) + gap;
  }

  const shifts = new Map<string, number>();
  for (const id of targetOrder) {
    if (id === dragId) continue;
    shifts.set(id, (projectedTops.get(id) ?? 0) - (tops.get(id) ?? 0));
  }

  return {
    targetOrder,
    snap: (projectedTops.get(dragId) ?? draggedTop) - draggedTop,
    shifts,
    hoverIndex,
  };
}

/**
 * Moves a plan by one slot (used by accessibility actions and keyboard
 * reordering). Returns an ordered id list, or null when the move is a no-op.
 */
export function movePlanByOffset(
  plans: WorkoutPlan[],
  planId: string,
  offset: number,
): string[] | null {
  const index = plans.findIndex((p) => p.id === planId);
  if (index < 0) return null;
  const target = index + offset;
  if (target < 0 || target >= plans.length) return null;

  const ids = plans.map((p) => p.id);
  const [moved] = ids.splice(index, 1);
  ids.splice(target, 0, moved);
  return ids;
}

