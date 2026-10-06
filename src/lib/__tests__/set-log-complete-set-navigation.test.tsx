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
  hapticsSuccess: jest.fn(),
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

describe('Set logger — Complete Set navigation', () => {
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

  function pressCompleteSet(root: renderer.ReactTestRenderer) {
    const button = root.root
      .findAllByType(Button)
      .find((b) => b.props.label === 'Complete Set');
    expect(button).toBeDefined();
    act(() => {
      button!.props.onPress();
    });
  }

  it('pops back to the running workout without replacing its route (no options popup)', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    pressCompleteSet(root);

    // The set is completed and the log screen pops back to the existing workout
    // screen. It must NOT replace the workout route: doing so removed its route
    // key and tripped the workout's beforeRemove guard (the options popup).
    const set = usePulse.getState().activeWorkout?.exercises[0].sets[0];
    expect(set?.completed).toBe(true);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('falls back to replacing the workout route when there is no back stack (deep link)', () => {
    mockCanGoBack.mockReturnValue(false);

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    pressCompleteSet(root);

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/workout/w-running-1');

    act(() => {
      root.unmount();
    });
  });
});
