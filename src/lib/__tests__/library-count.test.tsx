import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('SafeAreaView', { style }, children),
  };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('../../components/muscle-icon', () => ({
  ExerciseThumb: () => null,
  planIcon: () => 'dumbbell',
}));

import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';

import LibraryScreen from '../../app/library';
import { ScreenHeader } from '../../components/ui';
import { EXERCISES } from '../../data/exercises';

describe('Exercise Library — the catalog total is never revealed (negative cases)', () => {
  let renderer: ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount());
      renderer = null;
    }
  });

  function render() {
    act(() => {
      renderer = create(<LibraryScreen />);
    });
    return renderer!;
  }

  it('has no subtitle while browsing unfiltered (no total count)', () => {
    const view = render();

    expect(view.root.findByType(ScreenHeader).props.subtitle).toBeUndefined();
  });

  it('only shows a result count after a search, and it stays below the catalog size', () => {
    const view = render();
    const input = view.root.findByType(TextInput);

    act(() => {
      input.props.onChangeText('bench');
    });

    const subtitle = view.root.findByType(ScreenHeader).props.subtitle as string;
    expect(subtitle).toMatch(/^\d+ exercises$/);
    expect(Number(subtitle.split(' ')[0])).toBeLessThan(EXERCISES.length);
  });
});
