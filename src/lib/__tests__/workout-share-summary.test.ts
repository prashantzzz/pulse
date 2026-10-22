import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import { Platform } from 'react-native';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('react-native-body-highlighter', () => 'Body');
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('data:image/png;base64,mockbase64data'),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => ({
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

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
  useNavigation: () => ({
    addListener: jest.fn().mockReturnValue(jest.fn()),
  }),
  useLocalSearchParams: () => ({ id: 'w-summary-test' }),
}));

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import SummaryScreen from '../../app/workout/[id]/summary';
import {
  getWorkedSlugsForWorkout,
  WorkoutMuscleHero,
} from '../../components/workout-muscle-hero';
import {
  WorkoutShareCard,
  type WorkoutShareCardHandle,
} from '../../components/workout-share-card';
import { usePulse } from '../../store/useStore';
import type { Workout } from '../../types';

const mockWorkout: Workout = {
  id: 'w-summary-test',
  title: 'Chest & Triceps Hypertrophy',
  description: 'Chest pressing and tricep isolation',
  startTime: '2026-09-06T10:00:00.000Z',
  endTime: '2026-09-06T10:50:00.000Z',
  exercises: [
    {
      id: 'we-1',
      exerciseId: 'bench-press',
      order: 1,
      notes: null,
      plannedSets: 3,
      targetReps: '8-10',
      sets: [
        {
          id: 's-1',
          setIndex: 1,
          setType: 'working',
          weightKg: 80,
          reps: 8,
          distanceKm: null,
          durationSec: null,
          rpe: 8,
          notes: null,
          supersetId: null,
          completed: true,
          completedAt: '2026-09-06T10:15:00.000Z',
        },
        {
          id: 's-2',
          setIndex: 2,
          setType: 'working',
          weightKg: 80,
          reps: 7,
          distanceKm: null,
          durationSec: null,
          rpe: 9,
          notes: null,
          supersetId: null,
          completed: true,
          completedAt: '2026-09-06T10:20:00.000Z',
        },
      ],
    },
    {
      id: 'we-2',
      exerciseId: 'triceps-pushdown',
      order: 2,
      notes: null,
      plannedSets: 3,
      targetReps: '10-12',
      sets: [
        {
          id: 's-3',
          setIndex: 1,
          setType: 'working',
          weightKg: 35,
          reps: 12,
          distanceKm: null,
          durationSec: null,
          rpe: 8,
          notes: null,
          supersetId: null,
          completed: true,
          completedAt: '2026-09-06T10:35:00.000Z',
        },
      ],
    },
    {
      id: 'we-3',
      exerciseId: 'squat',
      order: 3,
      notes: null,
      plannedSets: 3,
      targetReps: '5',
      sets: [
        {
          id: 's-4',
          setIndex: 1,
          setType: 'working',
          weightKg: 100,
          reps: 5,
          distanceKm: null,
          durationSec: null,
          rpe: 8,
          notes: null,
          supersetId: null,
          completed: false, // NOT completed
          completedAt: null,
        },
      ],
    },
  ],
};

const emptyWorkout: Workout = {
  id: 'w-empty',
  title: 'Rest Day / Zero Sets',
  description: '',
  startTime: '2026-09-06T12:00:00.000Z',
  endTime: '2026-09-06T12:05:00.000Z',
  exercises: [],
};

describe('Workout Muscle Hero & Slugs Extraction', () => {
  it('correctly extracts worked anatomical slugs from completed exercises only', () => {
    const slugs = getWorkedSlugsForWorkout(mockWorkout);

    // Bench press -> chest, deltoids, triceps
    expect(slugs.has('chest')).toBe(true);
    expect(slugs.has('triceps')).toBe(true);

    // Squats sets were not completed, so quadriceps should NOT be included
    expect(slugs.has('quadriceps')).toBe(false);
  });

  it('handles empty workouts gracefully without highlighting any muscles', () => {
    const slugs = getWorkedSlugsForWorkout(emptyWorkout);
    expect(slugs.size).toBe(0);

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(WorkoutMuscleHero, { workout: emptyWorkout }));
    });

    const bodies = tree!.root.findAllByType('Body');
    expect(bodies.length).toBe(2);

    const frontBody = bodies.find((b) => b.props.side === 'front');
    // None of the slugs should have green styles
    const coloredParts = frontBody!.props.data.filter((p: any) => p.styles?.fill);
    expect(coloredParts.length).toBe(0);
  });

  it('renders side-by-side Front and Back 2D models with worked muscles highlighted in vibrant green', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(WorkoutMuscleHero, { workout: mockWorkout, gender: 'female' }));
    });

    const bodies = tree!.root.findAllByType('Body');
    expect(bodies.length).toBe(2);

    const frontBody = bodies.find((b) => b.props.side === 'front');
    const backBody = bodies.find((b) => b.props.side === 'back');
    expect(frontBody).toBeDefined();
    expect(backBody).toBeDefined();
    expect(frontBody!.props.gender).toBe('female');

    // Verify chest slug has vibrant green fill (#22C55E)
    const chestPart = frontBody!.props.data.find((p: any) => p.slug === 'chest');
    expect(chestPart).toBeDefined();
    expect(chestPart.styles.fill).toBe('#22C55E');

    // Verify no text elements exist inside WorkoutMuscleHero (strictly no labels/lines)
    const textNodes = tree!.root.findAllByType('Text' as any);
    expect(textNodes.length).toBe(0);
  });
});

describe('WorkoutShareCard 9:16 Social Story Asset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the branded completion card with all primary workout metrics', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(WorkoutShareCard, { workout: mockWorkout }));
    });

    const textNodes = tree!.root.findAll((node) => node.type === 'Text' || (node.props && node.props.children));
    const allText = textNodes.map((n) => (typeof n.props.children === 'string' ? n.props.children : '')).join(' ');

    expect(allText).toContain('NextRep');
    expect(allText).toContain('Workout Complete!');
    expect(allText).toContain('Exercises');
    expect(allText).toContain('Sets');
    expect(allText).toContain('1.6k kg');
    expect(allText).toContain('Duration');
    expect(allText).toContain('Total Volume');
    expect(allText).toContain('PRs');
    expect(allText).toContain('MUSCLES WORKED');
    expect(allText).not.toContain('Targeted Muscles');
    expect(allText).toContain('STRONGER EVERY REP');
  });

  it('adapts volume unit dynamically to lbs mode in 9:16 share card', () => {
    act(() => {
      usePulse.setState({ weightUnit: 'lbs' });
    });
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(WorkoutShareCard, { workout: mockWorkout }));
    });

    const textNodes = tree!.root.findAll((node) => node.type === 'Text' || (node.props && node.props.children));
    const allText = textNodes.map((n) => (typeof n.props.children === 'string' ? n.props.children : '')).join(' ');

    expect(allText).toContain('3.6k lbs');
    expect(allText).toContain('lbs');
    act(() => {
      tree.unmount();
      usePulse.setState({ weightUnit: 'kg' });
    });
  });

  it('triggers captureRef and native sharing when share() is called on native', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    const ref = React.createRef<WorkoutShareCardHandle>();
    act(() => {
      renderer.create(React.createElement(WorkoutShareCard, { ref, workout: mockWorkout }));
    });

    expect(ref.current).toBeDefined();

    await act(async () => {
      await ref.current!.share();
    });

    expect(captureRef).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'data:image/png;base64,mockbase64data',
      expect.objectContaining({
        mimeType: 'image/png',
        dialogTitle: expect.stringContaining('Summary'),
      })
    );
  });

  it('falls back to browser document download on web platform when native sharing is unavailable', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    const originalPlatform = Platform.OS;
    (Platform as any).OS = 'web';

    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    const mockClick = jest.fn();
    const mockAnchor = { href: '', download: '', click: mockClick };

    const originalDocument = global.document;
    (global as any).document = {
      createElement: jest.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    };

    const ref = React.createRef<WorkoutShareCardHandle>();
    act(() => {
      renderer.create(React.createElement(WorkoutShareCard, { ref, workout: mockWorkout }));
    });

    await act(async () => {
      await ref.current!.share();
    });

    expect(mockAnchor.download).toContain('nextrep-chest-&-triceps-hypertrophy-summary.png');
    expect(mockClick).toHaveBeenCalled();

    // Restore
    (Platform as any).OS = originalPlatform;
    (global as any).document = originalDocument;
  });
});

describe('SummaryScreen Component Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      usePulse.setState({
        workouts: [mockWorkout],
        profile: { gender: 'male', name: 'Alex' } as any,
      });
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders SummaryScreen with 9:16 card and footer controls without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(SummaryScreen));
    });

    expect(tree!.root).toBeDefined();
    const textNodes = tree!.root.findAll((node) => node.type === 'Text' || (node.props && node.props.children));
    const allText = textNodes.map((n) => (typeof n.props.children === 'string' ? n.props.children : '')).join(' ');
    expect(allText).toContain('Share');
    expect(allText).toContain('Home');
    expect(allText).toContain('Workout Complete');

    act(() => {
      tree.unmount();
    });
  });
});
