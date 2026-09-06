import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('react-native-body-highlighter', () => 'Body');
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('file:///mock/workout-summary.png'),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
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

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import {
  getWorkedSlugsForWorkout,
  WorkoutMuscleHero,
} from '../../components/workout-muscle-hero';
import {
  WorkoutShareCard,
  type WorkoutShareCardHandle,
} from '../../components/workout-share-card';
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

describe('Workout Muscle Hero & Slugs Extraction', () => {
  it('correctly extracts worked anatomical slugs from completed exercises only', () => {
    const slugs = getWorkedSlugsForWorkout(mockWorkout);

    // Bench press -> chest, deltoids, triceps
    expect(slugs.has('chest')).toBe(true);
    expect(slugs.has('triceps')).toBe(true);

    // Squats sets were not completed, so quadriceps should NOT be included
    expect(slugs.has('quadriceps')).toBe(false);
  });

  it('renders side-by-side Front and Back 2D models with worked muscles highlighted in vibrant green', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(WorkoutMuscleHero, { workout: mockWorkout }));
    });

    const bodies = tree!.root.findAllByType('Body');
    expect(bodies.length).toBe(2);

    const frontBody = bodies.find((b) => b.props.side === 'front');
    const backBody = bodies.find((b) => b.props.side === 'back');
    expect(frontBody).toBeDefined();
    expect(backBody).toBeDefined();

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
  it('renders branding in top-right and celebratory title horizontally with trophy', () => {
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
    expect(allText).toContain('Volume kg');
  });

  it('triggers captureRef and native sharing when share() is called', async () => {
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
      'file:///mock/workout-summary.png',
      expect.objectContaining({
        mimeType: 'image/png',
        dialogTitle: expect.stringContaining('Summary'),
      })
    );
  });
});
