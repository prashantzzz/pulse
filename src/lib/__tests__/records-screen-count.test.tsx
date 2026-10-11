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

import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import RecordsScreen from '../../app/records';
import { T } from '../../components/Text';
import { Button } from '../../components/ui';

function collectText(renderer: ReactTestRenderer): string {
  return renderer.root
    .findAllByType(T)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.flat() : n.props.children))
    .flat()
    .filter((c) => typeof c === 'string' || typeof c === 'number')
    .join(' ')
    .replace(/\s+/g, ' ');
}

describe('Personal Records picker — catalog total is never revealed (negative case)', () => {
  let renderer: ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      act(() => renderer!.unmount());
      renderer = null;
    }
  });

  it('never shows the total exercise-library size in the PR sheet', () => {
    act(() => {
      renderer = create(<RecordsScreen />);
    });
    const view = renderer!;

    const open = view.root.findAllByType(Button).find((b) => b.props.label === 'Log a New Record');
    expect(open).toBeDefined();
    act(() => {
      open!.props.onPress();
    });

    const text = collectText(view);
    // The sheet is open (its prompt renders)...
    expect(text).toContain('Pick an exercise');
    // ...but the old "N exercises in the library" hint is gone.
    expect(text).not.toContain('exercises in the library');
    expect(text).not.toMatch(/\d+ exercises/);
  });
});
