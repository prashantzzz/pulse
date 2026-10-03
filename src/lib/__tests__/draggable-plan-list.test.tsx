import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('../../lib/haptics', () => ({
  hapticsLight: jest.fn(),
  hapticsMedium: jest.fn(),
}));

import { Animated, PanResponder } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { DraggablePlanList } from '../../components/draggable-plan-list';
import { PlanCard } from '../../components/workout-card';
import type { WorkoutPlan } from '../../types';

/**
 * Regression tests for the My Plans press-and-hold drag reorder. The gesture
 * wiring (arm on long press → PanResponder takeover → projected order on drop)
 * is exercised directly through the captured PanResponder configs.
 */

type PanConfig = {
  onMoveShouldSetPanResponderCapture: () => boolean;
  onPanResponderGrant: (_e?: unknown, g?: { y0?: number }) => void;
  onPanResponderMove: (_e: unknown, g: { dy: number; moveY: number }) => void;
  onPanResponderRelease: () => void;
  onPanResponderTerminate: () => void;
};

function plan(id: string): WorkoutPlan {
  return { id, title: `Plan ${id}`, emoji: '💪', muscles: [], exercises: [] };
}

const PLANS = [plan('a'), plan('b'), plan('c')];
/** Row heights when measured: a=100, b=150, c=120 with a 16px gap. */
const ROW_HEIGHTS = [100, 150, 120];
/** Middle of the mocked viewport (RN jest Dimensions are 750x1334). */
const MID_MOVE_Y = 600;

/** Every renderer created in a test, unmounted in afterEach so no auto-scroll
 * frame loop can outlive its test (a leaked loop makes Jest hang). */
const mountedRenderers: ReactTestRenderer[] = [];

function renderList(
  plans: WorkoutPlan[] = PLANS,
  options: { autoScroll?: boolean; maxScroll?: number; blockedScroll?: boolean } = {},
) {
  const onReorder = jest.fn();
  const configs: PanConfig[] = [];
  const originalCreate = PanResponder.create.bind(PanResponder);
  const createSpy = jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
    configs.push(config as PanConfig);
    return originalCreate(config);
  });

  // Fake parent ScrollView: scrollTo moves the offset (clamped like the real
  // list end) so the auto-scroll loop is deterministic under real timers.
  // `blockedScroll` simulates a platform that ignores programmatic scrolling.
  const maxScroll = options.maxScroll ?? 200;
  const scrollOffsetRef = { current: 0 };
  const scrollLimitRef = { current: maxScroll };
  const scrollTo = jest.fn((_options: { y: number }) => {
    if (options.blockedScroll) return;
    const { y } = _options;
    scrollOffsetRef.current = Math.max(0, Math.min(y, maxScroll));
  });
  const scrollRef = { current: { scrollTo } } as any;

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <DraggablePlanList
        plans={plans}
        onReorder={onReorder}
        scrollRef={options.autoScroll ? scrollRef : undefined}
        scrollOffsetRef={options.autoScroll ? scrollOffsetRef : undefined}
        scrollLimitRef={options.autoScroll ? scrollLimitRef : undefined}
      />,
    );
  });
  mountedRenderers.push(renderer);

  // Simulate the measurement pass for each row wrapper (host views that carry
  // the row PanResponder handlers).
  const rows = renderer.root.findAll(
    (node) =>
      typeof node.type === 'string' &&
      Boolean(node.props?.onLayout) &&
      Boolean(node.props?.onResponderTerminationRequest),
  );
  act(() => {
    let y = 0;
    rows.forEach((row, index) => {
      const height = ROW_HEIGHTS[index] ?? 100;
      row.props.onLayout({ nativeEvent: { layout: { x: 0, y, width: 320, height } } });
      y += height + 16;
    });
  });

  const cards = renderer.root.findAllByType(PlanCard);

  return { renderer, createSpy, configs, cards, onReorder, scrollTo, scrollOffsetRef, scrollRef };
}

/** Runs the (setTimeout-backed) animation-frame loop for a while. */
async function flushFrames(ms = 60) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** Flushes frames until the auto-scroll offset stops changing (or gives up). */
async function flushUntilScrollSettles(
  scrollOffsetRef: { current: number },
  maxRounds = 40,
  stepMs = 20,
) {
  let previous = Number.NaN;
  for (let round = 0; round < maxRounds && scrollOffsetRef.current !== previous; round += 1) {
    previous = scrollOffsetRef.current;
    await flushFrames(stepMs);
  }
}

describe('DraggablePlanList gesture wiring (My Plans reorder regression)', () => {
  let timingSpy: jest.SpyInstance;
  let springSpy: jest.SpyInstance;

  beforeEach(() => {
    // Complete every settle/shift animation synchronously so drop commits are
    // deterministic in tests (shifts use Animated.spring, the settle timing).
    const completeImmediately = (value: any, config: any) => ({
      start: (cb?: (result: { finished: boolean }) => void) => {
        value.setValue(config.toValue);
        cb?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    });
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(completeImmediately as any);
    springSpy = jest.spyOn(Animated, 'spring').mockImplementation(completeImmediately as any);
  });

  afterEach(() => {
    // Unmount everything first: this cancels any in-flight auto-scroll frame
    // loop, so a failing assertion before release cannot hang Jest.
    act(() => {
      while (mountedRenderers.length > 0) {
        mountedRenderers.pop()!.unmount();
      }
    });
    timingSpy.mockRestore();
    springSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('reorders a card dropped below another card', () => {
    const { configs, cards, onReorder } = renderList();

    act(() => {
      cards[0].props.onLongPress();
    });
    expect(configs[0].onMoveShouldSetPanResponderCapture()).toBe(true);

    act(() => {
      configs[0].onPanResponderGrant();
      configs[0].onPanResponderMove(null, { dy: 160, moveY: MID_MOVE_Y });
      configs[0].onPanResponderRelease();
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('reorders a card dropped above the first card', () => {
    const { configs, cards, onReorder } = renderList();

    act(() => {
      cards[2].props.onLongPress();
    });
    act(() => {
      configs[2].onPanResponderGrant();
      configs[2].onPanResponderMove(null, { dy: -320, moveY: MID_MOVE_Y });
      configs[2].onPanResponderRelease();
    });

    expect(onReorder).toHaveBeenCalledWith(['c', 'a', 'b']);
  });

  it('a long press released without dragging neither reorders nor blocks scrolling', () => {
    const { configs, cards, onReorder } = renderList();

    act(() => {
      cards[0].props.onLongPress();
    });
    act(() => {
      cards[0].props.onPressOut();
    });

    // Disarmed: a subsequent move must not be captured as a drag.
    expect(configs[0].onMoveShouldSetPanResponderCapture()).toBe(false);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('a drop that lands back in the original slot does not report a reorder', () => {
    const { configs, cards, onReorder } = renderList();

    act(() => {
      cards[1].props.onLongPress();
    });
    act(() => {
      configs[1].onPanResponderGrant();
      configs[1].onPanResponderMove(null, { dy: 5, moveY: MID_MOVE_Y });
      configs[1].onPanResponderRelease();
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('does not offer row reordering when there is only one plan', () => {
    const { cards } = renderList([plan('solo')]);

    expect(cards[0].props.onLongPress).toBeUndefined();
    expect(cards[0].props.onMoveUp).toBeUndefined();
    expect(cards[0].props.onMoveDown).toBeUndefined();
  });

  it('exposes accessible move up/down actions that reorder one slot', () => {
    const { cards, onReorder } = renderList();

    act(() => {
      cards[1].props.onMoveUp?.();
    });
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);

    onReorder.mockClear();
    act(() => {
      cards[1].props.onMoveDown?.();
    });
    expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b']);
  });

  it('reorders correctly on consecutive drags without new onLayout events (react-native-web)', () => {
    const { renderer, configs, onReorder } = renderList();
    const cardFor = (id: string) =>
      renderer.root.findAllByType(PlanCard).find((c) => c.props.plan.id === id)!;
    // PanResponder configs are created once per row at mount, in PLANS order.
    const configFor: Record<string, PanConfig> = { a: configs[0], b: configs[1], c: configs[2] };

    // First drag: a down past b -> [b, a, c].
    act(() => {
      cardFor('a').props.onLongPress();
    });
    act(() => {
      configFor.a.onPanResponderGrant();
      configFor.a.onPanResponderMove(null, { dy: 160, moveY: MID_MOVE_Y });
      configFor.a.onPanResponderRelease();
    });
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c']);

    // The parent applies the new order. On react-native-web no onLayout event
    // fires for the moved cards (heights unchanged), so a naive implementation
    // would keep using stale y positions here.
    act(() => {
      renderer.update(
        <DraggablePlanList plans={[PLANS[1], PLANS[0], PLANS[2]]} onReorder={onReorder} />,
      );
    });

    // Second drag: b (now first) down 150px -> its centre passes a's NEW
    // midpoint (210) but not c's (330) -> back to [a, b, c].
    act(() => {
      cardFor('b').props.onLongPress();
    });
    act(() => {
      configFor.b.onPanResponderGrant();
      configFor.b.onPanResponderMove(null, { dy: 150, moveY: MID_MOVE_Y });
      configFor.b.onPanResponderRelease();
    });
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'b', 'c']);
  });

  // ── Edge auto-scroll for long lists ────────────────────────────────────────

  it('auto-scrolls when dragging near the bottom edge and applies the scroll delta to the drop', async () => {
    const { configs, cards, onReorder, scrollTo, scrollOffsetRef } = renderList(PLANS, {
      autoScroll: true,
      maxScroll: 200,
    });

    act(() => {
      cards[0].props.onLongPress();
    });
    act(() => {
      configs[0].onPanResponderGrant();
      // Finger inside the bottom zone (viewport 1334, zone starts at 1164).
      configs[0].onPanResponderMove(null, { dy: 10, moveY: 1300 });
    });

    await flushUntilScrollSettles(scrollOffsetRef);
    expect(scrollTo).toHaveBeenCalled();
    expect(scrollOffsetRef.current).toBe(200); // scrolled to the (clamped) end

    act(() => {
      configs[0].onPanResponderRelease();
    });

    // Effective content dy = 10 screen + 200 scroll = 210 -> a lands below b.
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c']);
  });

  it('auto-scrolls back towards the top edge when the finger moves up', async () => {
    const { configs, cards, onReorder, scrollOffsetRef } = renderList(PLANS, {
      autoScroll: true,
      maxScroll: 200,
    });
    scrollOffsetRef.current = 100; // page already scrolled down

    act(() => {
      cards[2].props.onLongPress();
    });
    act(() => {
      configs[2].onPanResponderGrant();
      configs[2].onPanResponderMove(null, { dy: -100, moveY: 20 }); // top zone
    });

    await flushUntilScrollSettles(scrollOffsetRef);
    expect(scrollOffsetRef.current).toBe(0); // scrolled back to the top

    act(() => {
      configs[2].onPanResponderRelease();
    });

    // Effective content dy = -100 screen + (0 - 100) scroll = -200 -> c above b.
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'c', 'b']);
  });

  it('stops auto-scrolling when the finger returns to the middle', async () => {
    const { configs, cards, scrollTo } = renderList(PLANS, { autoScroll: true });

    act(() => {
      cards[1].props.onLongPress();
    });
    act(() => {
      configs[1].onPanResponderGrant();
      configs[1].onPanResponderMove(null, { dy: 5, moveY: 1300 });
    });
    await flushFrames();
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0);

    act(() => {
      configs[1].onPanResponderMove(null, { dy: 5, moveY: MID_MOVE_Y });
    });
    const callsWhenStopped = scrollTo.mock.calls.length;
    await flushFrames();
    expect(scrollTo.mock.calls.length).toBe(callsWhenStopped);

    act(() => {
      configs[1].onPanResponderRelease();
    });
  });

  it('stops auto-scrolling when the card is released', async () => {
    const { configs, cards, scrollTo } = renderList(PLANS, { autoScroll: true });

    act(() => {
      cards[1].props.onLongPress();
    });
    act(() => {
      configs[1].onPanResponderGrant();
      configs[1].onPanResponderMove(null, { dy: 5, moveY: 1300 });
    });
    await flushFrames();
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0);

    act(() => {
      configs[1].onPanResponderRelease();
    });
    const callsAfterRelease = scrollTo.mock.calls.length;
    await flushFrames();
    expect(scrollTo.mock.calls.length).toBe(callsAfterRelease);
  });

  it('does not auto-scroll when used without a parent ScrollView', async () => {
    const { configs, cards, onReorder } = renderList();

    act(() => {
      cards[0].props.onLongPress();
    });
    act(() => {
      configs[0].onPanResponderGrant();
      configs[0].onPanResponderMove(null, { dy: 5, moveY: 10 });
    });
    await flushFrames(30);
    act(() => {
      configs[0].onPanResponderRelease();
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('clamps to the list end and stops requesting scrolls once it is reached', async () => {
    const { configs, cards, scrollTo, scrollOffsetRef } = renderList(PLANS, {
      autoScroll: true,
      maxScroll: 200,
    });

    act(() => {
      cards[1].props.onLongPress();
    });
    act(() => {
      configs[1].onPanResponderGrant();
      configs[1].onPanResponderMove(null, { dy: 5, moveY: 1330 });
    });

    await flushUntilScrollSettles(scrollOffsetRef);
    expect(scrollOffsetRef.current).toBe(200);

    // Never asks the platform to scroll past the real end.
    const requested = scrollTo.mock.calls.map(([o]: any[]) => o.y as number);
    expect(Math.max(...requested)).toBeLessThanOrEqual(200);
    expect(Math.max(...requested)).toBe(200);

    // The loop stops at the end instead of re-issuing scrollTo every frame
    // (that repetition was what made the page rubber-band / flicker).
    await flushFrames(40);
    const callsAtEnd = scrollTo.mock.calls.length;
    await flushFrames(60);
    expect(scrollTo.mock.calls.length).toBe(callsAtEnd);

    act(() => {
      configs[1].onPanResponderRelease();
    });
  });

  it('gives up when the platform ignores programmatic scrolling (no runaway loop)', async () => {
    const { configs, cards, onReorder, scrollTo, scrollOffsetRef } = renderList(PLANS, {
      autoScroll: true,
      blockedScroll: true,
    });

    act(() => {
      cards[1].props.onLongPress();
    });
    act(() => {
      configs[1].onPanResponderGrant();
      configs[1].onPanResponderMove(null, { dy: 5, moveY: 1330 });
    });

    await flushFrames(150);

    // A few attempts, then the loop stops; the offset never ran away.
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0);
    expect(scrollTo.mock.calls.length).toBeLessThanOrEqual(6);
    expect(scrollOffsetRef.current).toBe(0);

    const callsWhenStopped = scrollTo.mock.calls.length;
    await flushFrames(60);
    expect(scrollTo.mock.calls.length).toBe(callsWhenStopped);

    act(() => {
      configs[1].onPanResponderRelease();
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('derives the pointer position from the drag origin when moveY is unreliable', async () => {
    const { configs, cards, scrollTo, scrollOffsetRef } = renderList(PLANS, {
      autoScroll: true,
      maxScroll: 200,
    });

    act(() => {
      cards[2].props.onLongPress();
    });
    act(() => {
      // Finger starts in the bottom zone, but the platform reports moveY = 0.
      configs[2].onPanResponderGrant(null, { y0: 1300 });
      configs[2].onPanResponderMove(null, { dy: 10, moveY: 0 });
    });

    await flushUntilScrollSettles(scrollOffsetRef);
    expect(scrollTo).toHaveBeenCalled();
    expect(scrollOffsetRef.current).toBeGreaterThan(0);

    act(() => {
      configs[2].onPanResponderRelease();
    });
  });
});
