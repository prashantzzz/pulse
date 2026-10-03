import type { WorkoutPlan } from '../types';

export interface PlanRowLayout {
  /** y offset of the row within the list container */
  y: number;
  height: number;
}

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
 * The dragged card's centre picks its slot against the original centres of the
 * remaining rows (monotonic thresholds, so mixed card heights reorder
 * correctly). The projected order is then laid out cumulatively using each
 * row's measured height plus the constant flex gap, which yields the translate
 * every row needs to show the drop slot.
 *
 * Pure function: the drag list feeds it measured layouts and animates the
 * resulting offsets.
 */
export function computePlanDragGeometry(
  orderedIds: readonly string[],
  layouts: ReadonlyMap<string, PlanRowLayout>,
  dragId: string,
  dy: number,
): PlanDragGeometry | null {
  const ids = [...orderedIds];
  if (ids.length < 2 || !ids.includes(dragId)) return null;
  if (!ids.every((id) => layouts.has(id))) return null;

  const first = layouts.get(ids[0])!;
  const second = layouts.get(ids[1])!;
  const dragged = layouts.get(dragId)!;

  // Constant gap between rows (the list uses flex `gap`), derived from layout.
  const gap = Math.max(0, second.y - (first.y + first.height));
  const baseY = first.y;

  const draggedCenter = dragged.y + dragged.height / 2 + dy;
  const remaining = ids.filter((id) => id !== dragId);
  let hoverIndex = 0;
  for (const id of remaining) {
    const row = layouts.get(id)!;
    if (row.y + row.height / 2 < draggedCenter) hoverIndex += 1;
    else break;
  }

  const targetOrder = [
    ...remaining.slice(0, hoverIndex),
    dragId,
    ...remaining.slice(hoverIndex),
  ];

  // Cumulative layout of the projected order defines where every row lands.
  let cursor = baseY;
  const projected = new Map<string, number>();
  for (const id of targetOrder) {
    projected.set(id, cursor);
    cursor += layouts.get(id)!.height + gap;
  }

  const shifts = new Map<string, number>();
  for (const id of targetOrder) {
    if (id === dragId) continue;
    shifts.set(id, (projected.get(id) ?? 0) - layouts.get(id)!.y);
  }

  return {
    targetOrder,
    snap: (projected.get(dragId) ?? dragged.y) - dragged.y,
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

