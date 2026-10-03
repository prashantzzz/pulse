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
  onPanResponderGrant: () => void;
  onPanResponderMove: (_e: unknown, g: { dy: number }) => void;
  onPanResponderRelease: () => void;
  onPanResponderTerminate: () => void;
};

function plan(id: string): WorkoutPlan {
  return { id, title: `Plan ${id}`, emoji: '💪', muscles: [], exercises: [] };
}

const PLANS = [plan('a'), plan('b'), plan('c')];
/** Row heights when measured: a=100, b=150, c=120 with a 10px gap. */
const ROW_HEIGHTS = [100, 150, 120];

function renderList(plans: WorkoutPlan[] = PLANS) {
  const onReorder = jest.fn();
  const configs: PanConfig[] = [];
  const originalCreate = PanResponder.create.bind(PanResponder);
  const createSpy = jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
    configs.push(config as PanConfig);
    return originalCreate(config);
  });

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<DraggablePlanList plans={plans} onReorder={onReorder} />);
  });

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
      y += height + 10;
    });
  });

  const cards = renderer.root.findAllByType(PlanCard);

  return { renderer, createSpy, configs, cards, onReorder };
}

describe('DraggablePlanList gesture wiring (My Plans reorder regression)', () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    // Complete every settle/shift animation synchronously so drop commits are
    // deterministic in tests.
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(((value: any, config: any) => ({
      start: (cb?: (result: { finished: boolean }) => void) => {
        value.setValue(config.toValue);
        cb?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    })) as any);
  });

  afterEach(() => {
    timingSpy.mockRestore();
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
      configs[0].onPanResponderMove(null, { dy: 160 });
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
      configs[2].onPanResponderMove(null, { dy: -320 });
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
      configs[1].onPanResponderMove(null, { dy: 5 });
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
      configFor.a.onPanResponderMove(null, { dy: 160 });
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
      configFor.b.onPanResponderMove(null, { dy: 150 });
      configFor.b.onPanResponderRelease();
    });
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'b', 'c']);
  });
});
