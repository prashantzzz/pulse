import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));

import { chartColor, DISTINCT_CHART_COLORS } from '../../components/progress/shared';
import { getExerciseAnimation } from '../../data/exercise-animations';
import { applyAccent, colors } from '../../theme';

describe('Chart Color Distinctness & Palette', () => {
  it('assigns the active accent color to the first series slice (index 0)', () => {
    applyAccent('mint');
    expect(chartColor(0)).toBe(colors.accent);

    applyAccent('coral');
    expect(chartColor(0)).toBe(colors.accent);

    applyAccent('sky');
    expect(chartColor(0)).toBe(colors.accent);
  });

  it('produces completely distinct colors across all 6 top muscle slices without duplicates', () => {
    applyAccent('mint');
    const sliceColors = [0, 1, 2, 3, 4, 5].map((i) => chartColor(i).toLowerCase());
    const uniqueColors = new Set(sliceColors);
    expect(uniqueColors.size).toBe(6);
  });

  it('never clashes with the live accent color on subsequent slices', () => {
    for (const accent of ['mint', 'sky', 'teal', 'coral', 'rose', 'gold'] as const) {
      applyAccent(accent);
      const currentAccent = colors.accent.toLowerCase();
      for (let i = 1; i <= 8; i += 1) {
        expect(chartColor(i).toLowerCase()).not.toBe(currentAccent);
      }
    }
  });

  it('has at least 15 distinct colors in DISTINCT_CHART_COLORS', () => {
    expect(DISTINCT_CHART_COLORS.length).toBeGreaterThanOrEqual(15);
    const uniquePalette = new Set(DISTINCT_CHART_COLORS.map((c) => c.toLowerCase()));
    expect(uniquePalette.size).toBe(DISTINCT_CHART_COLORS.length);
  });
});

describe('Exercise Animation Aspect Ratios & Scaling', () => {
  it('returns valid animation asset with exact aspectRatio for square exercises', () => {
    const bench = getExerciseAnimation('bench-press');
    expect(bench).not.toBeNull();
    expect(bench?.type).toBe('video');
    expect(bench?.aspectRatio).toBe(1.0);

    const squat = getExerciseAnimation('squat');
    expect(squat).not.toBeNull();
    expect(squat?.aspectRatio).toBe(1.0);

    const pushup = getExerciseAnimation('push-up');
    expect(pushup).not.toBeNull();
    expect(pushup?.aspectRatio).toBe(1.0);
  });

  it('returns valid animation asset with landscape aspectRatio >= 1.7 for landscape exercises', () => {
    const latPulldown = getExerciseAnimation('lat-pulldown');
    expect(latPulldown).not.toBeNull();
    expect(latPulldown?.aspectRatio).toBeCloseTo(1.778, 2);

    const declineBench = getExerciseAnimation('decline-bench-press');
    expect(declineBench).not.toBeNull();
    expect(declineBench?.aspectRatio).toBeCloseTo(1.778, 2);

    const machinePress = getExerciseAnimation('machine-press');
    expect(machinePress).not.toBeNull();
    expect(machinePress?.aspectRatio).toBeCloseTo(1.778, 2);
  });

  it('returns null for non-mapped exercises so fallback anatomical map renders cleanly', () => {
    expect(getExerciseAnimation('non-existent-exercise')).toBeNull();
  });
});

describe('Swipe Gesture Mathematics', () => {
  const isSwipe = (dx: number, dy: number, vx: number): boolean => {
    const isHorizontal = Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy) * 1.25;
    const hasVelocity = Math.abs(vx) > 0.15 || Math.abs(dx) > 40;
    return isHorizontal && hasVelocity;
  };

  it('accepts natural diagonal thumb swipe at 35 degrees from horizontal', () => {
    // at 35 degrees: dx = 50, dy = 50 * tan(35°) ≈ 35. dx/dy = 1.42 > 1.25
    expect(isSwipe(50, 35, 0.2)).toBe(true);
    expect(isSwipe(-50, -35, -0.2)).toBe(true);
  });

  it('accepts comfortable horizontal flicks', () => {
    expect(isSwipe(45, 10, 0.3)).toBe(true);
    expect(isSwipe(-60, 15, -0.25)).toBe(true);
  });

  it('strictly rejects vertical scroll gestures', () => {
    // predominantly vertical: dy = 80, dx = 20
    expect(isSwipe(20, 80, 0.05)).toBe(false);
    // pure vertical: dy = 100, dx = 5
    expect(isSwipe(5, 100, 0.01)).toBe(false);
    // 45 degrees diagonal (ambiguous / vertical bias): dx = 40, dy = 40 (dx/dy = 1.0 < 1.25)
    expect(isSwipe(40, 40, 0.2)).toBe(false);
  });
});

describe('All-Time Cumulative Muscle Heatmap Analysis', () => {
  it('accumulates 100% of workouts across entire history when days filter is omitted', () => {
    const testWorkouts = [
      {
        id: 'w1',
        title: 'Push Day',
        description: '',
        startTime: '2025-01-01T10:00:00.000Z',
        endTime: '2025-01-01T11:00:00.000Z',
        source: 'user' as const,
        exercises: [
          {
            id: 'we1',
            exerciseId: 'bench-press',
            sets: [
              { id: 's1', setNumber: 1, reps: 10, weightKg: 80, completed: true },
              { id: 's2', setNumber: 2, reps: 10, weightKg: 80, completed: true },
            ],
          },
        ],
      },
      {
        id: 'w2',
        title: 'Pull Day',
        description: '',
        startTime: '2026-08-01T10:00:00.000Z',
        endTime: '2026-08-01T11:00:00.000Z',
        source: 'user' as const,
        exercises: [
          {
            id: 'we2',
            exerciseId: 'lat-pulldown',
            sets: [
              { id: 's3', setNumber: 1, reps: 12, weightKg: 60, completed: true },
            ],
          },
        ],
      },
    ];

    // With days = 30, only 2026 workout is returned (lat pulldown only)
    // Without days (all-time), both 2025 and 2026 workouts are accumulated
    const { volumeByMuscle, volumeBySlug } = require('../../lib/stats');
    const allMuscles = volumeByMuscle(testWorkouts);
    const chestEntry = allMuscles.find((m: any) => m.muscle === 'Chest');
    const backEntry = allMuscles.find((m: any) => m.muscle === 'Back');

    expect(chestEntry).toBeDefined();
    expect(chestEntry?.sets).toBe(2);
    expect(chestEntry?.volume).toBe(1600);

    expect(backEntry).toBeDefined();
    expect(backEntry?.sets).toBe(1);
    expect(backEntry?.volume).toBe(720);

    const allSlugs = volumeBySlug(testWorkouts);
    const chestSlug = allSlugs.find((s: any) => s.slug === 'chest');
    const backSlug = allSlugs.find((s: any) => s.slug === 'upper-back');

    expect(chestSlug).toBeDefined();
    expect(chestSlug?.sets).toBe(2);
    expect(backSlug).toBeDefined();
    expect(backSlug?.sets).toBe(1);
  });
});

