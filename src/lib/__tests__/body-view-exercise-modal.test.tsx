import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
// Avoid async font loads that resolve after the test environment tears down.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// The heatmap library renders SVG heavy content; the test only needs the
// selection callback. The exercise thumbnails are irrelevant here too.
jest.mock('../../components/muscle-map', () => ({
  MuscleMap: () => null,
  MuscleLegend: () => null,
}));
jest.mock('../../components/muscle-icon', () => ({
  ExerciseThumb: () => null,
  planIcon: () => 'dumbbell',
}));

import { Modal } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { MuscleMap } from '../../components/muscle-map';
import { BodyView } from '../../components/progress/body-view';
import { T } from '../../components/Text';
import { exercisesForSlug } from '../../data/exercises';

/** Finds a rendered label and invokes the nearest pressable ancestor. */
function pressText(renderer: ReactTestRenderer, text: string) {
  const label = renderer.root.findAllByType(T).find((node) => node.props.children === text);
  if (!label) throw new Error(`Text not found: ${text}`);
  let node = label.parent;
  while (node && typeof node.props?.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for: ${text}`);
  act(() => node!.props.onPress());
}

describe('Body tab — "Exercises for <muscle>" list (modal navigation regression)', () => {
  let renderer: ReactTestRenderer | null = null;

  beforeEach(() => {
    mockPush.mockClear();
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount());
      renderer = null;
    }
  });

  it('closes the list before opening the tapped exercise so the screen is visible', () => {
    act(() => {
      renderer = create(<BodyView workouts={[]} measurements={[]} profile={null} />);
    });

    // Select a muscle on the heatmap, then open its exercise list.
    act(() => {
      (renderer!.root.findByType(MuscleMap).props as any).onSelect('Chest');
    });
    pressText(renderer!, 'Exercises for Chest');
    expect(renderer!.root.findByType(Modal).props.visible).toBe(true);

    // The first row is the same one the UI shows (primary targets first).
    const firstShown = exercisesForSlug('chest')
      .slice()
      .sort((a, b) => {
        const aPrimary = (a.targetSlugs ?? []).includes('chest' as any) ? 0 : 1;
        const bPrimary = (b.targetSlugs ?? []).includes('chest' as any) ? 0 : 1;
        return aPrimary - bPrimary;
      })[0];
    expect(firstShown).toBeDefined();

    pressText(renderer!, firstShown.name);

    // Regression: the modal must be dismissed as part of the tap, otherwise the
    // pushed exercise screen renders underneath it and stays invisible.
    expect(renderer!.root.findByType(Modal).props.visible).toBe(false);
    expect(mockPush).toHaveBeenCalledWith(`/exercise/${firstShown.id}`);
  });
});
