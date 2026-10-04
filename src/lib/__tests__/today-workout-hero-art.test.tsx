import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
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
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
}));

import { TodayWorkoutCard } from '../../components/workout-card';
import { ExerciseThumb } from '../../components/muscle-icon';
import { usePulse } from '../../store/useStore';
import type { WorkoutPlan } from '../../types';

describe("Today's Workout hero art", () => {
  const plan: WorkoutPlan = {
    id: 'plan-leg-day',
    title: 'Leg Day',
    emoji: '🦵',
    muscles: ['Quads'],
    exercises: [{ exerciseId: 'squat', sets: 3, targetReps: '5', targetWeightKg: 80 }],
  };

  beforeEach(() => {
    usePulse.setState({ weightUnit: 'kg', plans: [plan], workouts: [], activeWorkout: null });
  });

  it('uses the themed vector glyph (no exercise photo) on the ready-to-start hero', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        React.createElement(TodayWorkoutCard, { plan, onStart: jest.fn(), plans: [plan] }),
      );
    });

    const heroThumb = tree.root
      .findAllByType(ExerciseThumb)
      .find((node) => node.props.size === 110);

    expect(heroThumb).toBeDefined();
    // No `exerciseId` means ExerciseThumb never overlays the video first-frame
    // photo — it renders the muscle glyph on the theme accent gradient.
    expect(heroThumb!.props.exerciseId).toBeUndefined();
    expect(heroThumb!.props.useThemeAccent).toBe(true);

    act(() => {
      tree.unmount();
    });
  });
});
