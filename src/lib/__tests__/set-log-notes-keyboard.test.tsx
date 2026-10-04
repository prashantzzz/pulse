import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import { ScrollView, TextInput } from 'react-native';
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
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'w-running-1', exercise: 'squat', set: 's-1' }),
}));

import LogSetScreen from '../../app/workout/[id]/log';
import { usePulse } from '../../store/useStore';

describe('Set logger — notes field stays above the keyboard', () => {
  beforeEach(() => {
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

  it('scrolls to the notes card on focus and while the multiline field grows', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(LogSetScreen));
    });

    const scrollView = root.root.findAllByType(ScrollView)[0];
    expect(scrollView).toBeDefined();
    // Keyboard-friendly scroll settings are applied to the screen scroll view.
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scrollView.props.keyboardDismissMode).toBe('on-drag');

    const scrollSpy = jest
      .spyOn(scrollView.instance as any, 'scrollToEnd')
      .mockImplementation(() => {});

    const notesInput = root.root.findAllByType(TextInput)[0];
    expect(notesInput).toBeDefined();

    // Focusing the notes field must bring it into view (after rAF).
    act(() => {
      notesInput.props.onFocus();
      jest.advanceTimersByTime(50);
    });
    expect(scrollSpy).toHaveBeenCalled();
    const callsAfterFocus = scrollSpy.mock.calls.length;

    // Typing a new line grows the field — it must stay visible.
    act(() => {
      notesInput.props.onContentSizeChange();
      jest.advanceTimersByTime(50);
    });
    expect(scrollSpy.mock.calls.length).toBeGreaterThan(callsAfterFocus);

    act(() => {
      root.unmount();
    });
  });
});
