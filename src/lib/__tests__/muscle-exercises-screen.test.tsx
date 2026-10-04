import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('../../components/muscle-icon', () => ({
  ExerciseThumb: () => null,
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockParams: { slug?: string } = { slug: 'chest' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => mockParams,
}));

import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MuscleExercisesScreen from '../../app/muscle/[slug]';
import { T } from '../../components/Text';
import { exercisesForSlug } from '../../data/exercises';

const SAFE_AREA_METRICS = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

function renderScreen() {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <MuscleExercisesScreen />
      </SafeAreaProvider>,
    );
  });
  return renderer;
}

/** Finds a rendered label and invokes the nearest pressable ancestor. */
function pressText(renderer: ReactTestRenderer, text: string) {
  const label = renderer.root.findAllByType(T).find((node) => node.props.children === text);
  if (!label) throw new Error(`Text not found: ${text}`);
  let node = label.parent;
  while (node && typeof node.props?.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for: ${text}`);
  act(() => node!.props.onPress());
}

describe('Muscle exercises screen (/muscle/[slug])', () => {
  let renderer: ReactTestRenderer | null = null;

  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockCanGoBack.mockReturnValue(true);
    mockParams.slug = 'chest';
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount());
      renderer = null;
    }
  });

  it('lists the exercises for the slug and opens one on tap', () => {
    renderer = renderScreen();

    // Header shows the curated label.
    expect(
      renderer!.root.findAllByType(T).some((n) => n.props.children === 'Exercises for Chest'),
    ).toBe(true);

    // Primary targets sort first, matching the old modal ordering.
    const first = exercisesForSlug('chest')
      .slice()
      .sort((a, b) => {
        const aPrimary = (a.targetSlugs ?? []).includes('chest' as any) ? 0 : 1;
        const bPrimary = (b.targetSlugs ?? []).includes('chest' as any) ? 0 : 1;
        return aPrimary - bPrimary;
      })[0];
    expect(first).toBeDefined();
    expect(renderer!.root.findAllByType(T).some((n) => n.props.children === first.name)).toBe(true);

    pressText(renderer!, first.name);

    // Pushing keeps this list in the stack, so Back returns to it.
    expect(mockPush).toHaveBeenCalledWith(`/exercise/${first.id}`);
  });

  it('goes back to the previous screen', () => {
    renderer = renderScreen();

    const backButton = renderer!.root.findAll(
      (node) => node.props?.accessibilityLabel === 'Go back' && typeof node.props?.onPress === 'function',
    )[0];
    expect(backButton).toBeDefined();
    act(() => backButton.props.onPress());

    expect(mockBack).toHaveBeenCalled();
  });

  it('falls back to the Progress tab when there is no back entry', () => {
    mockCanGoBack.mockReturnValue(false);
    renderer = renderScreen();

    const backButton = renderer!.root.findAll(
      (node) => node.props?.accessibilityLabel === 'Go back' && typeof node.props?.onPress === 'function',
    )[0];
    act(() => backButton.props.onPress());

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/progress');
  });
});
