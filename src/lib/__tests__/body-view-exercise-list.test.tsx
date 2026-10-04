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
// selection callbacks. The exercise thumbnails are irrelevant here too.
jest.mock('../../components/muscle-map', () => ({
  MuscleMap: () => null,
  MuscleLegend: () => null,
}));
jest.mock('../../components/muscle-icon', () => ({
  ExerciseThumb: () => null,
  planIcon: () => 'dumbbell',
}));

import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { MuscleMap } from '../../components/muscle-map';
import { BodyView } from '../../components/progress/body-view';
import { T } from '../../components/Text';

/** Finds a rendered label and invokes the nearest pressable ancestor. */
function pressText(renderer: ReactTestRenderer, text: string) {
  const label = renderer.root.findAllByType(T).find((node) => node.props.children === text);
  if (!label) throw new Error(`Text not found: ${text}`);
  let node = label.parent;
  while (node && typeof node.props?.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for: ${text}`);
  act(() => node!.props.onPress());
}

describe('Body tab — "Exercises for <muscle>" opens the list route', () => {
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

  function renderBodyView() {
    act(() => {
      renderer = create(<BodyView workouts={[]} measurements={[]} profile={null} />);
    });
    return renderer!;
  }

  it('navigates to the muscle list screen instead of opening an overlay', () => {
    const view = renderBodyView();

    act(() => {
      (view.root.findByType(MuscleMap).props as any).onSelect('Chest');
    });
    pressText(view, 'Exercises for Chest');

    expect(mockPush).toHaveBeenCalledWith('/muscle/chest');
  });

  it('uses the selected anatomy region slug and its curated label', () => {
    const view = renderBodyView();

    act(() => {
      (view.root.findByType(MuscleMap).props as any).onSelectSlug('upper-back', 'Back');
    });
    pressText(view, 'Exercises for Lats & Upper Back');

    expect(mockPush).toHaveBeenCalledWith('/muscle/upper-back');
  });
});
