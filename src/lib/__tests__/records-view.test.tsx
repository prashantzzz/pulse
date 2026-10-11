import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('../../components/muscle-icon', () => ({ ExerciseThumb: () => null }));
jest.mock('../../components/charts', () => ({ Sparkline: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { RecordsView } from '../../components/progress/records-view';
import { T } from '../../components/Text';
import { usePulse } from '../../store/useStore';
import type { ExerciseSet, Workout, WorkoutExercise } from '../../types';

let uid = 0;
const nextId = (p: string) => `${p}-${++uid}`;

function makeSet(weightKg: number, reps: number): ExerciseSet {
  return {
    id: nextId('s'),
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
    completedAt: null,
  };
}

function makeWorkout(id: string, endTime: string, exerciseId: string, weightKg: number, reps: number): Workout {
  const we: WorkoutExercise = {
    id: nextId('we'),
    exerciseId,
    order: 1,
    notes: null,
    plannedSets: 1,
    targetReps: '5',
    sets: [makeSet(weightKg, reps)],
  };
  return {
    id,
    title: 'Session',
    description: '',
    startTime: endTime,
    endTime,
    source: 'user',
    exercises: [we],
  };
}

// Bench wins on estimated 1RM (100×10 → 133.3) but Squat is the heaviest lift (110).
const WORKOUTS: Workout[] = [
  makeWorkout('w1', '2026-05-20T10:00:00.000Z', 'squat', 100, 5),
  makeWorkout('w2', '2026-09-15T10:00:00.000Z', 'squat', 110, 5),
  makeWorkout('w3', '2026-09-20T10:00:00.000Z', 'bench-press', 100, 10),
];

function collectText(root: renderer.ReactTestRenderer): string {
  return root.root
    .findAllByType(T)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.flat() : n.props.children))
    .flat()
    .filter((c) => typeof c === 'string' || typeof c === 'number')
    .join(' ')
    .replace(/\s+/g, ' ');
}

/** Rendered order of the record rows (accessibility labels in tree order). */
function recordOrder(root: renderer.ReactTestRenderer): string[] {
  const labels = root.root
    .findAll(
      (node) =>
        typeof node.props?.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.startsWith('Open ') &&
        node.props.accessibilityLabel.endsWith(' record'),
    )
    .map((n) => n.props.accessibilityLabel as string);
  // Composite and host instances both carry the label — keep one per row.
  return [...new Set(labels)];
}

/** Finds a label and presses the nearest pressable ancestor. */
function pressText(root: renderer.ReactTestRenderer, text: string) {
  const label = root.root.findAllByType(T).find((n) => n.props.children === text);
  if (!label) throw new Error(`Text not found: ${text}`);
  let node = label.parent;
  while (node && typeof node.props?.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for: ${text}`);
  act(() => node!.props.onPress());
}

describe('Records tab redesign (real data only)', () => {
  let root!: renderer.ReactTestRenderer;

  beforeEach(() => {
    jest.clearAllMocks();
    usePulse.setState({ manualPRs: [], weightUnit: 'kg' });
    act(() => {
      root = renderer.create(React.createElement(RecordsView, { workouts: WORKOUTS }));
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
  });

  it('renders the summary cards and the ranked records from real workout history', () => {
    const text = collectText(root);
    expect(text).toContain('PRs (all lifts)');
    expect(text).toContain('Best 1RM');
    expect(text).toContain('All Time Records');
    expect(text).toContain('Squat');
    expect(text).toContain('Bench Press');
    // Best e1RM = bench 100×10 → Epley 133.3 → "133.3 kg"
    expect(text).toContain('133.3 kg');
    // The real set behind the record is shown (weight × reps)
    expect(text).toContain('100 kg × 10');
    // No standalone 'Highest' pill (it overlapped the name) — rank lives on the
    // thumbnails. Note: the sort pill reads 'Highest 1RM', which is unaffected.
    const pill = root.root
      .findAllByType(T)
      .find((n) => n.props.children === 'Highest');
    expect(pill).toBeUndefined();
  });

  it('overlays ranks 1–3 on the top thumbnails instead of a number column', () => {
    const ranks = root.root.findAll(
      (node) =>
        typeof node.props?.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.startsWith('Rank '),
    );
    // One overlay per row for the fixture's two records (ranks 1 and 2).
    expect([...new Set(ranks.map((n) => n.props.accessibilityLabel))]).toEqual(['Rank 1', 'Rank 2']);
  });

  it('opens the exercise when a record row is pressed', () => {
    const row = root.root.findAll(
      (node) => node.props?.accessibilityLabel === 'Open Squat record',
    )[0];
    expect(row).toBeDefined();
    act(() => {
      row.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/exercise/squat');
  });

  it('re-sorts the ranked list when another sort option is chosen', () => {
    // Default: highest 1RM → Bench (133.3) before Squat (128.3).
    expect(recordOrder(root)).toEqual(['Open Bench Press record', 'Open Squat record']);

    // Open the sort sheet, then pick "Heaviest Weight".
    const sortButton = root.root.findAll(
      (node) =>
        typeof node.props?.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.startsWith('Sort records'),
    )[0];
    act(() => {
      sortButton.props.onPress();
    });
    pressText(root, 'Heaviest Weight');

    // Heaviest weight → Squat (110 kg) before Bench (100 kg).
    expect(recordOrder(root)).toEqual(['Open Squat record', 'Open Bench Press record']);
  });
});
