import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import { BackHandler } from 'react-native';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('../../lib/haptics', () => ({
  hapticsLight: jest.fn(),
  hapticsMedium: jest.fn(),
  hapticsHeavy: jest.fn(),
  hapticsSuccess: jest.fn(),
  hapticsWarning: jest.fn(),
  hapticsError: jest.fn(),
  hapticsSelection: jest.fn(),
}));
jest.mock('../../lib/notifications', () => ({
  syncActiveWorkoutNotification: jest.fn(),
  presentActiveWorkoutNotification: jest.fn(),
  dismissActiveWorkoutNotification: jest.fn(),
}));
jest.mock('../../lib/sound', () => ({
  playRestOverSound: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('SafeAreaView', { style }, children),
  };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true }),
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()), removeListener: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'w-running-1' }),
}));

import ActiveWorkoutScreen from '../../app/workout/[id]/index';
import { usePulse } from '../../store/useStore';
import type { Workout } from '../../types';

function makeCompletedSet(weightKg: number, reps: number) {
  return {
    id: 's-hist-1',
    setIndex: 1,
    setType: 'working',
    weightKg,
    reps,
    distanceKm: null,
    durationSec: null,
    rpe: null,
    notes: null,
    supersetId: null,
    completed: true,
    completedAt: '2026-09-20T10:15:00.000Z',
  };
}

describe('Running workout — exercise card PR badge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(
      () => ({ remove: jest.fn() } as any),
    );

    const history: Workout = {
      id: 'w-hist-1',
      title: 'Leg Day',
      description: '',
      startTime: '2026-09-20T10:00:00.000Z',
      endTime: '2026-09-20T11:00:00.000Z',
      source: 'user',
      exercises: [
        {
          id: 'we-hist-1',
          exerciseId: 'squat',
          order: 1,
          notes: null,
          plannedSets: 1,
          targetReps: '5',
          sets: [makeCompletedSet(45, 4)],
        },
      ],
    };

    usePulse.setState({
      weightUnit: 'kg',
      workouts: [history],
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
            sets: [
              {
                id: 's-1',
                setIndex: 1,
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
              },
            ],
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

  it('shows the exercise all-time PR instead of the NEXT label', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ActiveWorkoutScreen));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('45kg × 4');
    expect(json).not.toContain('NEXT');

    act(() => {
      root.unmount();
    });
  });

  it('shows no PR badge for an exercise with no completed history', () => {
    usePulse.setState({
      workouts: [],
      activeWorkout: {
        ...usePulse.getState().activeWorkout!,
        exercises: [
          {
            ...usePulse.getState().activeWorkout!.exercises[0],
            exerciseId: 'front-squat',
          },
        ],
      } as any,
    });

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ActiveWorkoutScreen));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).not.toContain('NEXT');
    expect(json).not.toContain('45kg × 4');

    act(() => {
      root.unmount();
    });
  });
});
