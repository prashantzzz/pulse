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
  useWindowDimensions,
  type LayoutChangeEvent,
  type ScrollView,
} from 'react-native';

import { hapticsMedium } from '../lib/haptics';
import {
  autoScrollStep,
  computeAutoScrollZone,
  contentDragDy,
  type AutoScrollDirection,
} from '../lib/auto-scroll';
import {
  computePlanDragGeometry,
  movePlanByOffset,
  type PlanDragGeometry,
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
 * - Only card heights are measured on layout; row positions are always derived
 *   from the live order (react-native-web only re-fires onLayout on size
 *   changes, so cached y coordinates would go stale after the first reorder).
 * - Dragging near the top/bottom edge auto-scrolls the parent ScrollView
 *   (`scrollRef` + `scrollOffsetRef` props), and the drag offset is converted
 *   into content coordinates so the lifted card keeps following the finger.
 */

const SETTLE_DURATION_MS = 180;
/** Snappy, non-overshooting spring for rows sliding out of the dragged card's way. */
const SHIFT_SPRING = { speed: 20, bounciness: 0 } as const;
/** Must match the flex `gap` used by the list container. */
const ROW_GAP = spacing.md;
/**
 * Consecutive auto-scroll frames without an `onScroll` confirmation before the
 * loop gives up. Protects against a platform that ignores programmatic
 * scrolling — without it the loop would keep pushing content offsets and make
 * the card/rows jitter.
 */
const AUTO_SCROLL_STAGNANT_FRAMES = 4;

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
  /** scroll offset when the gesture was claimed (content-space correction) */
  scrollOffsetAtStart: number;
  /** latest raw screen-space gesture dy (before scroll compensation) */
  lastScreenDy: number;
  /** pointer Y (window coords) when the gesture was claimed */
  startPointerY: number;
}

interface DragMoveInfo {
  dy: number;
  /** pointer position in window coordinates (for edge auto-scroll) */
  moveY: number;
}

export function DraggablePlanList({
  plans,
  onReorder,
  onStart,
  onEdit,
  onDragStateChange,
  scrollRef,
  scrollOffsetRef,
  scrollLimitRef,
}: {
  plans: WorkoutPlan[];
  /** Called on drop with the full desired order of plan ids */
  onReorder: (orderedIds: string[]) => void;
  onStart?: (plan: WorkoutPlan) => void;
  onEdit?: (plan: WorkoutPlan) => void;
  /** Lets the parent disable ScrollView scrolling while a drag is live */
  onDragStateChange?: (dragging: boolean) => void;
  /** Parent ScrollView, used for edge auto-scroll while dragging */
  scrollRef?: { current: ScrollView | null };
  /** Live ScrollView offset, mirrored from the parent's onScroll */
  scrollOffsetRef?: { current: number };
  /**
   * Maximum scrollable offset (content height − viewport height). Auto-scroll
   * targets are clamped to this, so the loop can never push past the list end
   * (which caused rubber-banding/flicker on iOS and runaway offsets on web).
   * When absent, auto-scroll stays off rather than risk unbounded scrolling.
   */
  scrollLimitRef?: { current: number };
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const plansRef = useRef(plans);
  const onReorderRef = useRef(onReorder);
  const onDragStateChangeRef = useRef(onDragStateChange);
  // Measured row heights only. Positions are derived from the live order at
  // drag time, because onLayout does not reliably re-fire when a card merely
  // moves to a new slot (react-native-web fires it on size changes only).
  const rowHeightsRef = useRef(new Map<string, number>());
  const translatesRef = useRef(new Map<string, Animated.Value>());
  const shiftsRef = useRef(new Map<string, number>());
  const dragRef = useRef<DragSession | null>(null);

  // Edge auto-scroll state
  const { height: windowHeight } = useWindowDimensions();
  const windowHeightRef = useRef(windowHeight);
  const autoScrollDirectionRef = useRef<AutoScrollDirection>(0);
  const autoScrollIntensityRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  /** Last offset confirmed by the parent's onScroll (stagnation detection). */
  const lastConfirmedOffsetRef = useRef(-1);
  const stagnantFramesRef = useRef(0);
  /** Pending gesture sample, applied once per animation frame. */
  const moveFrameRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ id: string; move: DragMoveInfo } | null>(null);

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
  useEffect(() => {
    windowHeightRef.current = windowHeight;
  }, [windowHeight]);

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

  const stopAutoScroll = useCallback(() => {
    autoScrollDirectionRef.current = 0;
    autoScrollIntensityRef.current = 0;
    lastConfirmedOffsetRef.current = -1;
    stagnantFramesRef.current = 0;
    if (autoScrollFrameRef.current != null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  // Never leave the screen-level swipe lock or any pending frame/auto-scroll
  // loop engaged if the list unmounts mid-drag.
  useEffect(
    () => () => {
      setInnerHorizontalActive(false);
      stopAutoScroll();
      if (moveFrameRef.current != null) {
        cancelAnimationFrame(moveFrameRef.current);
        moveFrameRef.current = null;
      }
      pendingMoveRef.current = null;
    },
    [stopAutoScroll],
  );

  const measureRow = useCallback((id: string, e: LayoutChangeEvent) => {
    // Only the height matters; y positions are derived from the current order.
    rowHeightsRef.current.set(id, e.nativeEvent.layout.height);
  }, []);

  const computeGeometry = useCallback(
    (dragId: string, dy: number): PlanDragGeometry | null =>
      computePlanDragGeometry(
        plansRef.current.map((p) => p.id),
        rowHeightsRef.current,
        dragId,
        dy,
        ROW_GAP,
      ),
    [],
  );

  const animateTranslate = useCallback(
    (id: string, toValue: number) => {
      const value = getTranslate(id);
      value.stopAnimation();
      // Springs handle interruption/retargeting much better than fixed-duration
      // timings, which looked stuttery when dragging quickly across rows.
      Animated.spring(value, {
        toValue,
        ...SHIFT_SPRING,
        useNativeDriver: true,
      }).start();
    },
    [getTranslate],
  );

  /**
   * Applies the current gesture position to the dragged row and the projected
   * layout. Uses content-space coordinates so auto-scrolling the page does not
   * break the card's tracking of the finger.
   */
  const applyDragOffset = useCallback(
    (session: DragSession) => {
      const offset = scrollOffsetRef?.current ?? 0;
      const contentDy = contentDragDy(session.lastScreenDy, offset, session.scrollOffsetAtStart);
      // No stopAnimation() here: no animation runs on the dragged row during a
      // drag, and calling into the native driver on every frame was costly.
      getTranslate(session.id).setValue(contentDy);

      const geometry = computeGeometry(session.id, contentDy);
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
    [animateTranslate, computeGeometry, getTranslate, scrollOffsetRef],
  );

  /** One auto-scroll frame: page scrolls, then the drag offset is refreshed. */
  // Stores the latest loop function so each frame can schedule the next one
  // without the callback referencing its own binding (React Compiler rule).
  const runAutoScrollFrameRef = useRef<() => void>(() => {});

  const runAutoScrollFrame = useCallback(() => {
    autoScrollFrameRef.current = null;
    const direction = autoScrollDirectionRef.current;
    const session = dragRef.current;
    const view = scrollRef?.current;
    if (direction === 0 || !session?.active || !view || !scrollOffsetRef) return;

    // The parent's onScroll is the single source of truth for the offset; this
    // loop never writes it, so a platform that clamps or ignores a scroll
    // cannot make the offset drift or oscillate.
    const limit = Math.max(0, scrollLimitRef?.current ?? 0);
    const before = scrollOffsetRef.current;
    const step = autoScrollStep(autoScrollIntensityRef.current);
    const target = Math.min(limit, Math.max(0, before + direction * step));

    // Already at the list end (or the list cannot scroll): stop until the
    // finger changes zone. No repeated scrollTo, so no rubber-band flicker.
    if (target === before) {
      stopAutoScroll();
      return;
    }

    // If the platform never confirms a scroll attempt (blocked programmatic
    // scrolling), give up instead of looping forever.
    if (before === lastConfirmedOffsetRef.current) {
      stagnantFramesRef.current += 1;
    } else {
      lastConfirmedOffsetRef.current = before;
      stagnantFramesRef.current = 0;
    }
    if (stagnantFramesRef.current >= AUTO_SCROLL_STAGNANT_FRAMES) {
      stopAutoScroll();
      return;
    }

    view.scrollTo({ y: target, animated: false });
    applyDragOffset(session);
    autoScrollFrameRef.current = requestAnimationFrame(runAutoScrollFrameRef.current);
  }, [applyDragOffset, scrollLimitRef, scrollOffsetRef, scrollRef, stopAutoScroll]);

  useEffect(() => {
    runAutoScrollFrameRef.current = runAutoScrollFrame;
  }, [runAutoScrollFrame]);

  /** Starts/stops the auto-scroll loop based on the pointer's window Y. */
  const refreshAutoScroll = useCallback(
    (moveY: number) => {
      if (!scrollRef || !scrollOffsetRef || !scrollLimitRef) return;
      const zone = computeAutoScrollZone(moveY, windowHeightRef.current);
      if (zone.direction !== autoScrollDirectionRef.current) {
        // Fresh direction: restart the stagnation bookkeeping.
        lastConfirmedOffsetRef.current = -1;
        stagnantFramesRef.current = 0;
      }
      autoScrollDirectionRef.current = zone.direction;
      autoScrollIntensityRef.current = zone.intensity;
      if (zone.direction === 0) {
        stopAutoScroll();
        return;
      }
      if (autoScrollFrameRef.current == null) {
        autoScrollFrameRef.current = requestAnimationFrame(runAutoScrollFrame);
      }
    },
    [runAutoScrollFrame, scrollLimitRef, scrollOffsetRef, scrollRef, stopAutoScroll],
  );

  // ── Frame-coalesced gesture updates ───────────────────────────────────────
  // PanResponder can emit several move events per display frame (especially at
  // 90/120 Hz). Applying each one re-ran the geometry and re-targeted row
  // springs, so only the latest position is applied once per animation frame.

  const cancelPendingMoveFrame = useCallback(() => {
    if (moveFrameRef.current != null) {
      cancelAnimationFrame(moveFrameRef.current);
      moveFrameRef.current = null;
    }
  }, []);

  const processPendingMove = useCallback(() => {
    moveFrameRef.current = null;
    const pending = pendingMoveRef.current;
    pendingMoveRef.current = null;
    if (!pending) return;

    const session = dragRef.current;
    if (!session || session.id !== pending.id || !session.active) return;

    // Auto-scroll zones react synchronously in handleDragMove; only the
    // geometry/animation work is coalesced to one update per frame.
    session.lastScreenDy = pending.move.dy;
    applyDragOffset(session);
  }, [applyDragOffset]);

  /** Applies any queued move immediately (used right before drop/cancel). */
  const flushPendingMove = useCallback(() => {
    cancelPendingMoveFrame();
    processPendingMove();
  }, [cancelPendingMoveFrame, processPendingMove]);

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
      if (!currentPlans.every((p) => rowHeightsRef.current.has(p.id))) return false;

      dragRef.current = {
        id,
        index,
        active: false,
        targetOrder: currentPlans.map((p) => p.id),
        snap: 0,
        hoverIndex: index,
        scrollOffsetAtStart: scrollOffsetRef?.current ?? 0,
        lastScreenDy: 0,
        startPointerY: 0,
      };
      stopAutoScroll();
      hapticsMedium();
      setDragging(id);
      return true;
    },
    [scrollOffsetRef, setDragging, stopAutoScroll],
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
    (id: string, startPointerY: number) => {
      const session = dragRef.current;
      if (!session || session.id !== id) return;
      session.active = true;
      // Capture the scroll position and finger origin at the moment the drag
      // really starts, so auto-scroll corrections are measured from here.
      session.scrollOffsetAtStart = scrollOffsetRef?.current ?? 0;
      session.startPointerY = Number.isFinite(startPointerY) ? startPointerY : 0;
      // Clear any leftover settle/snap-back animation once, so the per-frame
      // path can use plain setValue without native-driver chatter.
      getTranslate(id).stopAnimation();
      setInnerHorizontalActive(true);
      setDragging(id);
    },
    [getTranslate, scrollOffsetRef, setDragging],
  );

  const handleDragMove = useCallback(
    (id: string, move: DragMoveInfo) => {
      const session = dragRef.current;
      if (!session || session.id !== id || !session.active) return;

      // Edge auto-scroll reacts immediately (cheap zone math)...
      const pointerY =
        Number.isFinite(move.moveY) && move.moveY > 0
          ? move.moveY
          : session.startPointerY + move.dy;
      refreshAutoScroll(pointerY);

      // ...while the geometry/animation work is coalesced to one update per
      // frame (PanResponder can emit several move events per display frame).
      pendingMoveRef.current = { id, move };
      if (moveFrameRef.current == null) {
        moveFrameRef.current = requestAnimationFrame(processPendingMove);
      }
    },
    [processPendingMove, refreshAutoScroll],
  );

  const handleDragEnd = useCallback(
    (id: string) => {
      flushPendingMove();
      stopAutoScroll();
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
    [commitOrder, flushPendingMove, getTranslate, setDragging, stopAutoScroll],
  );

  const handleDragCancel = useCallback(
    (id: string) => {
      cancelPendingMoveFrame();
      pendingMoveRef.current = null;
      stopAutoScroll();
      const session = dragRef.current;
      if (!session || session.id !== id) return;
      // Animate everything back to rest; the refs are cleared immediately so a
      // new gesture can start before the snap-back finishes.
      animateTranslate(id, 0);
      for (const [rowId, shift] of shiftsRef.current) {
        if (shift !== 0) animateTranslate(rowId, 0);
      }
      shiftsRef.current.clear();
      dragRef.current = null;
      setInnerHorizontalActive(false);
      setDragging(null);
    },
    [animateTranslate, cancelPendingMoveFrame, setDragging, stopAutoScroll],
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
  onDragActivate: (id: string, startPointerY: number) => void;
  onDragMove: (id: string, move: DragMoveInfo) => void;
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
      onPanResponderGrant: (_e, g) => {
        callbacksRef.current.onDragActivate(plan.id, g?.y0 ?? 0);
      },
      onPanResponderMove: (_e, g) => {
        callbacksRef.current.onDragMove(plan.id, { dy: g.dy, moveY: g.moveY });
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
      // Promote the lifted card to a hardware layer on Android so translating
      // it stays smooth while the rest of the list animates around it.
      renderToHardwareTextureAndroid={dragging}
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
    gap: ROW_GAP,
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
