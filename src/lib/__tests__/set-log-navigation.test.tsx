import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('SafeAreaView', { style }, children),
  };
});
jest.mock('../../lib/haptics', () => ({
  hapticsLight: jest.fn(),
}));
jest.mock('../../lib/notifications', () => ({
  dismissActiveWorkoutNotification: jest.fn(),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    push: mockPush,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => ({ id: 'w-running-1', exercise: 'squat', set: 's-1' }),
}));

import LogSetScreen from '../../app/workout/[id]/log';
import { Button } from '../../components/ui';
import { usePulse } from '../../store/useStore';

function makeSet(id: string, setIndex: number) {
  return {
    id,
    setIndex,
    setType: 'working',
    weightKg: 45,
    reps: 4,
    distanceKm: null,
    durationSec: null,
    rpe: null,
    notes: null,
    supersetId: null,
    completed: false,
    completedAt: null,
  };
}

function findButton(root: renderer.ReactTestRenderer, label: string) {
  return root.root.findAllByType(Button).find((b) => b.props.label === label);
}

describe('Set logger — Save navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    jest.useFakeTimers();
    usePulse.setState({
      weightUnit: 'kg',
      workouts: [],
      exerciseDefaults: {},
      activeWorkout: {
        id: 'w-running-1',
        title: 'Leg Day',
        description: '',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        source: 'user',
        planId: null,
        exercises: [
          {
            id: 'we-1',
            exerciseId: 'squat',
            order: 1,
            notes: null,
            plannedSets: 3,
            targetReps: '5',
            sets: [makeSet('s-1', 1), makeSet('s-2', 2)],
          },
        ],
      } as any,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('no longer renders a Complete Set action — only Save remains', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    expect(findButton(root, 'Complete Set')).toBeUndefined();
    expect(findButton(root, 'Save')).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('Save pops back to the running workout without replacing its route', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    const save = findButton(root, 'Save');
    expect(save).toBeDefined();
    act(() => {
      save!.props.onPress();
    });

    // Values are saved but the set is NOT completed here — completion happens
    // from the running workout screen. The log screen pops back to the existing
    // workout route and must not replace it (that tripped the options popup).
    const set = usePulse.getState().activeWorkout?.exercises[0].sets[0];
    expect(set?.completed).toBe(false);
    expect(set?.weightKg).toBe(45);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('Save falls back to replacing the workout route when there is no back stack (deep link)', () => {
    mockCanGoBack.mockReturnValue(false);

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    const save = findButton(root, 'Save');
    act(() => {
      save!.props.onPress();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/workout/w-running-1');

    act(() => {
      root.unmount();
    });
  });

  it('Save never completes a set — even when it is the last incomplete one', () => {
    // Make the current set the only remaining incomplete set in the workout.
    act(() => {
      usePulse.getState().patchSet('squat', 's-2', { completed: true, completedAt: new Date().toISOString() });
    });

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    const save = findButton(root, 'Save');
    act(() => {
      save!.props.onPress();
    });

    const sets = usePulse.getState().activeWorkout?.exercises[0].sets;
    expect(sets?.[0].completed).toBe(false);
    expect(sets?.[1].completed).toBe(true);
    // The logger must not finish the workout or navigate to the summary.
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
