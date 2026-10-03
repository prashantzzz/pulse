/* eslint-disable react-hooks/refs --
 * Drag reordering intentionally keeps Animated values, row measurements and
 * PanResponder handlers in refs: they are imperative gesture state that must
 * not trigger re-renders, and the React Compiler lint rules do not model them.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { hapticsMedium } from '../lib/haptics';
import {
  computePlanDragGeometry,
  movePlanByOffset,
  type PlanDragGeometry,
  type PlanRowLayout,
} from '../lib/plan-order';
import { colors, radius, shadows, spacing } from '../theme';
import type { WorkoutPlan } from '../types';
import { setInnerHorizontalActive } from './ui';
import { PlanCard } from './workout-card';

/**
 * Vertical drag-and-drop list for the "My Plans" tab.
 *
 * A press-and-hold on a plan card lifts it, then dragging moves it up/down.
 * Other cards slide out of the way to reveal the drop slot. Releasing commits
 * the new order through `onReorder(orderedIds)`.
 *
 * Implementation notes:
 * - Built on RN core Animated + PanResponder so it works on native and web
 *   inside the existing screen ScrollView (no extra dependencies).
 * - The long press is detected by the PlanCard Pressable itself; the row's
 *   PanResponder only claims the gesture once a drag has been armed and the
 *   finger starts moving, so normal taps / Start / Edit keep working.
 * - Card heights are measured on layout, so expanded cards and mixed card
 *   heights reorder correctly.
 */

const SHIFT_DURATION_MS = 170;
const SETTLE_DURATION_MS = 180;

interface DragSession {
  id: string;
  index: number;
  /** true once the PanResponder claimed the gesture */
  active: boolean;
  /** projected id order if the finger were released now */
  targetOrder: string[];
  /** translateY that settles the dragged card into its slot */
  snap: number;
  hoverIndex: number;
}

export function DraggablePlanList({
  plans,
  onReorder,
  onStart,
  onEdit,
  onDragStateChange,
}: {
  plans: WorkoutPlan[];
  /** Called on drop with the full desired order of plan ids */
  onReorder: (orderedIds: string[]) => void;
  onStart?: (plan: WorkoutPlan) => void;
  onEdit?: (plan: WorkoutPlan) => void;
  /** Lets the parent disable ScrollView scrolling while a drag is live */
  onDragStateChange?: (dragging: boolean) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const plansRef = useRef(plans);
  const onReorderRef = useRef(onReorder);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const layoutsRef = useRef(new Map<string, PlanRowLayout>());
  const translatesRef = useRef(new Map<string, Animated.Value>());
  const shiftsRef = useRef(new Map<string, number>());
  const dragRef = useRef<DragSession | null>(null);

  // Keep the gesture handlers reading the latest props without re-creating them.
  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);
  useEffect(() => {
    onDragStateChangeRef.current = onDragStateChange;
  }, [onDragStateChange]);

  const getTranslate = useCallback((id: string): Animated.Value => {
    let value = translatesRef.current.get(id);
    if (!value) {
      value = new Animated.Value(0);
      translatesRef.current.set(id, value);
    }
    return value;
  }, []);

  const setDragging = useCallback((id: string | null) => {
    setDraggingId(id);
    onDragStateChangeRef.current?.(id != null);
  }, []);

  // Never leave the screen-level swipe lock engaged if the list unmounts mid-drag.
  useEffect(
    () => () => {
      setInnerHorizontalActive(false);
    },
    [],
  );

  const measureRow = useCallback((id: string, e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    layoutsRef.current.set(id, { y, height });
  }, []);

  const computeGeometry = useCallback(
    (dragId: string, dy: number): PlanDragGeometry | null =>
      computePlanDragGeometry(
        plansRef.current.map((p) => p.id),
        layoutsRef.current,
        dragId,
        dy,
      ),
    [],
  );

  const animateTranslate = useCallback(
    (id: string, toValue: number, duration = SHIFT_DURATION_MS) => {
      const value = getTranslate(id);
      value.stopAnimation();
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [getTranslate],
  );

  const resetRows = useCallback(() => {
    for (const value of translatesRef.current.values()) {
      value.stopAnimation();
      value.setValue(0);
    }
    shiftsRef.current.clear();
    dragRef.current = null;
  }, []);

  const commitOrder = useCallback(
    (order: string[]) => {
      resetRows();
      setInnerHorizontalActive(false);
      setDragging(null);
      // Skip no-op drops so the store/cloud are only touched when something moved.
      const currentIds = plansRef.current.map((p) => p.id);
      const changed =
        order.length !== currentIds.length || order.some((id, i) => id !== currentIds[i]);
      if (changed) onReorderRef.current(order);
    },
    [resetRows, setDragging],
  );

  // ── Gesture callbacks (passed down to each row) ────────────────────────────

  const handleDragBegin = useCallback(
    (id: string): boolean => {
      const existing = dragRef.current;
      if (existing && !existing.active) dragRef.current = null; // replace stale session
      if (dragRef.current) return false;

      const currentPlans = plansRef.current;
      if (currentPlans.length < 2) return false;
      const index = currentPlans.findIndex((p) => p.id === id);
      if (index < 0) return false;
      if (!currentPlans.every((p) => layoutsRef.current.has(p.id))) return false;

      dragRef.current = {
        id,
        index,
        active: false,
        targetOrder: currentPlans.map((p) => p.id),
        snap: 0,
        hoverIndex: index,
      };
      hapticsMedium();
      setDragging(id);
      return true;
    },
    [setDragging],
  );

  /** Long press released before the finger moved: undo the lift. */
  const handleDragBeginEnd = useCallback(
    (id: string) => {
      const session = dragRef.current;
      if (!session || session.id !== id || session.active) return;
      setDragging(null);
      // If the press was actually handed over to the row PanResponder, its grant
      // callback marks the session active synchronously — clear only stale ones.
      setTimeout(() => {
        const current = dragRef.current;
        if (current && current.id === id && !current.active) dragRef.current = null;
      }, 0);
    },
    [setDragging],
  );

  /** The row PanResponder claimed the gesture (finger moved after the hold). */
  const handleDragActivate = useCallback(
    (id: string) => {
      const session = dragRef.current;
      if (!session || session.id !== id) return;
      session.active = true;
      setInnerHorizontalActive(true);
      setDragging(id);
    },
    [setDragging],
  );

  const handleDragMove = useCallback(
    (id: string, dy: number) => {
      const session = dragRef.current;
      if (!session || session.id !== id || !session.active) return;

      const translate = getTranslate(id);
      translate.stopAnimation();
      translate.setValue(dy);

      const geometry = computeGeometry(id, dy);
      if (!geometry) return;
      session.targetOrder = geometry.targetOrder;
      session.snap = geometry.snap;
      session.hoverIndex = geometry.hoverIndex;

      for (const [rowId, shift] of geometry.shifts) {
        if (shiftsRef.current.get(rowId) === shift) continue;
        shiftsRef.current.set(rowId, shift);
        animateTranslate(rowId, shift);
      }
    },
    [animateTranslate, computeGeometry, getTranslate],
  );

  const handleDragEnd = useCallback(
    (id: string) => {
      const session = dragRef.current;
      if (!session || session.id !== id) {
        getTranslate(id).setValue(0);
        return;
      }
      if (!session.active) {
        dragRef.current = null;
        setDragging(null);
        return;
      }
      const settle = getTranslate(id);
      settle.stopAnimation();
      Animated.timing(settle, {
        toValue: session.snap,
        duration: SETTLE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        commitOrder(session.targetOrder);
      });
    },
    [commitOrder, getTranslate, setDragging],
  );

  const handleDragCancel = useCallback(
    (id: string) => {
      const session = dragRef.current;
      if (!session || session.id !== id) return;
      // Animate everything back to rest; the refs are cleared immediately so a
      // new gesture can start before the snap-back finishes.
      animateTranslate(id, 0, SETTLE_DURATION_MS);
      for (const [rowId, shift] of shiftsRef.current) {
        if (shift !== 0) animateTranslate(rowId, 0, SETTLE_DURATION_MS);
      }
      shiftsRef.current.clear();
      dragRef.current = null;
      setInnerHorizontalActive(false);
      setDragging(null);
    },
    [animateTranslate, setDragging],
  );

  /** Accessibility / keyboard move by one slot. */
  const handleMoveBy = useCallback(
    (id: string, offset: number) => {
      if (dragRef.current) return;
      const order = movePlanByOffset(plansRef.current, id, offset);
      if (order) onReorderRef.current(order);
    },
    [],
  );

  return (
    <View style={styles.list}>
      {plans.map((plan, index) => (
        <DraggablePlanRow
          key={plan.id}
          plan={plan}
          dragEnabled={plans.length > 1}
          dragging={draggingId === plan.id}
          translateY={getTranslate(plan.id)}
          onRowLayout={measureRow}
          onStart={onStart}
          onEdit={onEdit}
          onMoveUp={index > 0 && !draggingId ? () => handleMoveBy(plan.id, -1) : undefined}
          onMoveDown={
            index < plans.length - 1 && !draggingId ? () => handleMoveBy(plan.id, 1) : undefined
          }
          onDragBegin={handleDragBegin}
          onDragBeginEnd={handleDragBeginEnd}
          onDragActivate={handleDragActivate}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row wrapper: long-press arming + PanResponder takeover
// ---------------------------------------------------------------------------

function DraggablePlanRow({
  plan,
  dragEnabled,
  dragging,
  translateY,
  onRowLayout,
  onStart,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDragBegin,
  onDragBeginEnd,
  onDragActivate,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: {
  plan: WorkoutPlan;
  /** false when there is nothing to reorder (single plan) */
  dragEnabled: boolean;
  dragging: boolean;
  translateY: Animated.Value;
  onRowLayout: (id: string, e: LayoutChangeEvent) => void;
  onStart?: (plan: WorkoutPlan) => void;
  onEdit?: (plan: WorkoutPlan) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragBegin: (id: string) => boolean;
  onDragBeginEnd: (id: string) => void;
  onDragActivate: (id: string) => void;
  onDragMove: (id: string, dy: number) => void;
  onDragEnd: (id: string) => void;
  onDragCancel: (id: string) => void;
}) {
  const armedRef = useRef(false);

  const callbacksRef = useRef({
    onDragBegin,
    onDragBeginEnd,
    onDragActivate,
    onDragMove,
    onDragEnd,
    onDragCancel,
  });
  useEffect(() => {
    callbacksRef.current = {
      onDragBegin,
      onDragBeginEnd,
      onDragActivate,
      onDragMove,
      onDragEnd,
      onDragCancel,
    };
  }, [onDragBegin, onDragBeginEnd, onDragActivate, onDragMove, onDragEnd, onDragCancel]);

  // PanResponder is created once; every callback reads the latest props through
  // callbacksRef so the gesture handlers never go stale.
  const responder = useRef(
    PanResponder.create({
      // Never claim a plain tap — the PlanCard Pressable handles those.
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      // Take over from the PlanCard Pressable once a long press armed the drag.
      onMoveShouldSetPanResponderCapture: () => armedRef.current,
      onPanResponderGrant: () => {
        callbacksRef.current.onDragActivate(plan.id);
      },
      onPanResponderMove: (_e, g) => {
        callbacksRef.current.onDragMove(plan.id, g.dy);
      },
      onPanResponderRelease: () => {
        armedRef.current = false;
        callbacksRef.current.onDragEnd(plan.id);
      },
      onPanResponderTerminate: () => {
        armedRef.current = false;
        callbacksRef.current.onDragCancel(plan.id);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const handleLongPress = useCallback(() => {
    // Only arm the drag when a session can actually start; arming otherwise
    // would let the PanResponder capture (and block) an ordinary scroll.
    armedRef.current = callbacksRef.current.onDragBegin(plan.id);
  }, [plan.id]);

  const handlePressOut = useCallback(() => {
    armedRef.current = false;
    callbacksRef.current.onDragBeginEnd(plan.id);
  }, [plan.id]);

  return (
    <Animated.View
      onLayout={(e) => onRowLayout(plan.id, e)}
      style={[
        styles.row,
        dragging && styles.rowDragging,
        {
          zIndex: dragging ? 20 : 0,
          transform: [{ translateY }, ...(dragging ? [{ scale: 1.02 }] : [])],
        },
      ]}
      {...responder.panHandlers}>
      <PlanCard
        plan={plan}
        onStart={onStart ? () => onStart(plan) : undefined}
        onEdit={onEdit ? () => onEdit(plan) : undefined}
        onLongPress={dragEnabled ? handleLongPress : undefined}
        onPressOut={handlePressOut}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    position: 'relative',
  },
  rowDragging: {
    zIndex: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    // Prevent text selection / native drag ghosts while dragging on web.
    userSelect: 'none' as const,
    ...shadows.float,
  },
});
