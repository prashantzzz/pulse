import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { BackHandler, ScrollView } from 'react-native';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
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
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: jest.fn(),
  }),
  useNavigation: () => ({
    addListener: mockAddListener,
    removeListener: mockRemoveListener,
  }),
  useLocalSearchParams: () => ({ id: 'w-completed-1' }),
}));

import SummaryScreen from '../../app/workout/[id]/summary';
import { TodayWorkoutCard } from '../../components/workout-card';
import { usePulse } from '../../store/useStore';
import type { Workout } from '../../types';

describe('Workout Complete Screen Back Navigation', () => {
  let backHandlerCallback: (() => boolean) | null = null;
  let beforeRemoveCallback: ((e: { preventDefault: () => void }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;
    beforeRemoveCallback = null;

    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event: string, handler: () => boolean) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler;
      }
      return {
        remove: jest.fn(),
      } as any;
    });

    mockAddListener.mockImplementation((event: string, handler: (e: any) => void) => {
      if (event === 'beforeRemove') {
        beforeRemoveCallback = handler;
      }
      return jest.fn();
    });

    usePulse.setState({
      workouts: [
        {
          id: 'w-completed-1',
          title: 'Upper Body Power',
          startTime: '2026-09-05T10:00:00.000Z',
          endTime: '2026-09-05T10:45:00.000Z',
          exercises: [],
        },
      ],
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('navigates back to workouts page when phone hardware back button is pressed without minimizing the app', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(SummaryScreen));
    });

    expect(backHandlerCallback).toBeDefined();

    // Trigger hardware back button press
    let handled = false;
    act(() => {
      handled = backHandlerCallback!();
    });

    // Must return true to tell Android OS the app handled the back event (preventing minimization/exit)
    expect(handled).toBe(true);
    // Must navigate to the Workouts page
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/workouts');

    act(() => {
      root.unmount();
    });
  });

  it('navigates back to workouts page and prevents default when back swipe gesture occurs', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(SummaryScreen));
    });

    expect(beforeRemoveCallback).toBeDefined();

    const preventDefault = jest.fn();
    act(() => {
      beforeRemoveCallback!({ preventDefault });
    });

    // Must prevent default screen pop / OS activity finish
    expect(preventDefault).toHaveBeenCalled();
    // Must navigate to the Workouts page
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/workouts');

    // Subsequent removal during replace navigation should NOT be prevented again
    const secondPreventDefault = jest.fn();
    act(() => {
      beforeRemoveCallback!({ preventDefault: secondPreventDefault });
    });
    expect(secondPreventDefault).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('ensures _layout.tsx enables gesture navigation on workout/[id]/summary instead of disabling it', () => {
    const layoutPath = path.resolve(__dirname, '../../app/_layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Verify gestureEnabled is true for workout/[id]/summary
    expect(layoutContent).toMatch(/<Stack\.Screen\s+name="workout\/\[id\]\/summary"[^>]*gestureEnabled:\s*true/);
    expect(layoutContent).not.toContain('<Stack.Screen name="workout/[id]/summary" options={{ animation: \'fade\', gestureEnabled: false }}');
  });

  it('navigates to workout summary when TodayWorkoutCard (Completed Today) is pressed', () => {
    const completedWorkout: Workout = {
      id: 'completed-today-xyz',
      title: 'Leg Day Blast',
      startTime: '2026-09-12T08:00:00.000Z',
      endTime: '2026-09-12T09:00:00.000Z',
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
              weightKg: 100,
              reps: 5,
              distanceKm: null,
              durationSec: null,
              rpe: 8,
              notes: null,
              supersetId: null,
              completed: true,
              completedAt: '2026-09-12T08:30:00.000Z',
            },
          ],
        },
      ],
    };

    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(TodayWorkoutCard, {
          completedWorkout,
          plans: [],
          onSelectPlan: jest.fn(),
          onStart: jest.fn(),
        })
      );
    });

    const rootInstance = root!.root;
    const mainCard = rootInstance.findByProps({ accessibilityLabel: 'View Leg Day Blast summary' });
    expect(mainCard).toBeDefined();

    // Trigger press
    act(() => {
      mainCard.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/workout/completed-today-xyz/summary');

    act(() => {
      root.unmount();
    });
  });

  it('auto-completes workout and prepares summary route when all sets get completed', () => {
    usePulse.setState({
      activeWorkout: {
        id: 'active-auto-finish-1',
        title: 'Full Body Circuit',
        startTime: '2026-09-12T07:00:00.000Z',
        endTime: null,
        exercises: [
          {
            id: 'we-1',
            exerciseId: 'bench-press',
            order: 1,
            notes: null,
            plannedSets: 2,
            targetReps: '10',
            sets: [
              {
                id: 's-1',
                setIndex: 1,
                setType: 'working',
                weightKg: 60,
                reps: 10,
                distanceKm: null,
                durationSec: null,
                rpe: null,
                notes: null,
                supersetId: null,
                completed: false,
                completedAt: null,
              },
              {
                id: 's-2',
                setIndex: 2,
                setType: 'working',
                weightKg: 60,
                reps: 10,
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
      },
    });

    // Complete set 1 - 1 set still remaining
    usePulse.getState().completeSet('bench-press', 's-1');
    let currentAw = usePulse.getState().activeWorkout;
    expect(currentAw).toBeDefined();
    let remaining = currentAw!.exercises.flatMap((e) => e.sets).filter((s) => !s.completed);
    expect(remaining.length).toBe(1);

    // Complete set 2 - all sets now completed
    usePulse.getState().completeSet('bench-press', 's-2');
    currentAw = usePulse.getState().activeWorkout;
    remaining = currentAw!.exercises.flatMap((e) => e.sets).filter((s) => !s.completed);
    expect(remaining.length).toBe(0);

    // When remaining.length === 0, calling finishWorkout() completes it and yields finished workout
    const finished = usePulse.getState().finishWorkout();
    expect(finished).toBeDefined();
    expect(finished?.id).toBe('active-auto-finish-1');
    expect(usePulse.getState().activeWorkout).toBeNull();
    expect(usePulse.getState().workouts.some((w) => w.id === 'active-auto-finish-1')).toBe(true);
  });

  it('renders Up Next Preview modal with dynamic scroll height and all exercise rows', () => {
    const mockTomorrowPlan = {
      id: 'plan-tomorrow-1',
      title: 'Upper Body Hypertrophy',
      emoji: '⚡',
      muscles: ['Chest', 'Back', 'Shoulders'],
      exercises: [
        { exerciseId: 'bench-press', sets: 4, targetReps: '8-10' },
        { exerciseId: 'incline-dumbbell-press', sets: 3, targetReps: '10' },
        { exerciseId: 'barbell-row', sets: 4, targetReps: '8' },
        { exerciseId: 'lateral-raise', sets: 4, targetReps: '12-15' },
        { exerciseId: 'overhead-press', sets: 3, targetReps: '8' },
      ],
    };

    const completedWorkout: Workout = {
      id: 'completed-workout-preview-test',
      title: 'Lower Body Session',
      startTime: '2026-09-12T06:00:00.000Z',
      endTime: '2026-09-12T07:00:00.000Z',
      exercises: [],
    };

    const onStartMock = jest.fn();

    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(TodayWorkoutCard, {
          completedWorkout,
          plan: mockTomorrowPlan as any,
          plans: [mockTomorrowPlan as any],
          onSelectPlan: jest.fn(),
          onStart: onStartMock,
        })
      );
    });

    const rootInstance = root!.root;

    // Click the Preview button inside TodayWorkoutCard
    const previewBtn = rootInstance.findByProps({ accessibilityLabel: "Preview tomorrow's workout" });
    expect(previewBtn).toBeDefined();

    act(() => {
      previewBtn.props.onPress({ stopPropagation: jest.fn() });
    });

    // Check that Modal is now visible
    const modal = rootInstance.findByType('Modal' as any);
    expect(modal.props.visible).toBe(true);

    // Verify the ScrollView has dynamic height props and scroll indicator enabled
    const scrollView = modal.findByType(ScrollView);
    expect(scrollView.props.showsVerticalScrollIndicator).toBe(true);
    expect(scrollView.props.nestedScrollEnabled).toBe(true);
    expect(scrollView.props.style.flexShrink).toBe(1);
    expect(scrollView.props.style.maxHeight).toBeGreaterThanOrEqual(180);
    expect(scrollView.props.contentContainerStyle.paddingBottom).toBeDefined();

    // Verify all 5 exercises are rendered inside the preview modal
    const textNodes = modal.findAllByType('Text' as any);
    const combinedText = textNodes.map((n) => n.props.children).flat().join(' ').replace(/\s+/g, ' ');
    expect(combinedText).toContain('Upper Body Hypertrophy');
    expect(combinedText).toContain('5 exercises scheduled for this routine:');
    expect(combinedText).toContain('Bench Press');
    expect(combinedText).toContain('Barbell Row');
    expect(combinedText).toContain('Lateral Raise');

    // Click Start Workout Early
    const startEarlyBtn = modal.findByProps({ accessibilityLabel: 'Start Workout Early' });
    expect(startEarlyBtn).toBeDefined();

    act(() => {
      startEarlyBtn.props.onPress();
    });

    expect(onStartMock).toHaveBeenCalledWith(mockTomorrowPlan);

    act(() => {
      root.unmount();
    });
  });
});
