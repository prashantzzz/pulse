import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('../../components/muscle-map', () => ({
  MuscleMap: () => null,
  MuscleLegend: () => null,
}));
jest.mock('../../components/muscle-icon', () => ({
  ExerciseThumb: () => null,
  planIcon: () => 'dumbbell',
}));

import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { BodyView } from '../../components/progress/body-view';
import { T } from '../../components/Text';
import type { Workout } from '../../types';

function makeWorkout(id: string): Workout {
  return {
    id,
    title: 'Session',
    description: '',
    startTime: '2026-09-01T10:00:00.000Z',
    endTime: '2026-09-01T11:00:00.000Z',
    source: 'user',
    exercises: [],
  };
}

function collectText(renderer: ReactTestRenderer): string {
  return renderer.root
    .findAllByType(T)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.flat() : n.props.children))
    .flat()
    .filter((c) => typeof c === 'string' || typeof c === 'number')
    .join(' ')
    .replace(/\s+/g, ' ');
}

describe('Body tab — journey badge copy (negative cases)', () => {
  let renderer: ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount());
      renderer = null;
    }
  });

  function render(workouts: Workout[]) {
    act(() => {
      renderer = create(<BodyView workouts={workouts} measurements={[]} profile={null} />);
    });
    return renderer!;
  }

  it('shows "N logged" and never the old "N workouts logged" copy', () => {
    const text = collectText(render([makeWorkout('w1'), makeWorkout('w2'), makeWorkout('w3')]));

    expect(text).toContain('3 logged');
    expect(text).not.toContain('workouts logged');
    expect(text).not.toContain('workout logged');
  });

  it('does not pluralize the badge for a single workout', () => {
    const text = collectText(render([makeWorkout('w1')]));

    expect(text).toContain('1 logged');
    expect(text).not.toMatch(/1 workouts? logged/);
  });

  it('keeps the empty-state copy and never renders "0 logged"', () => {
    const text = collectText(render([]));

    expect(text).toContain('No workouts yet');
    expect(text).not.toContain('0 logged');
  });
});
