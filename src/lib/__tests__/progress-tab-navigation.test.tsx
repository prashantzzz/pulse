import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('../../components/misc', () => ({
  BottomSheet: () => null,
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('SafeAreaView', { style }, children),
  };
});
jest.mock('../../components/progress/body-view', () => ({ BodyView: () => 'BodyView' }));
jest.mock('../../components/progress/strength-view', () => ({ StrengthView: () => 'StrengthView' }));
jest.mock('../../components/progress/volume-view', () => ({ VolumeView: () => 'VolumeView' }));
jest.mock('../../components/progress/consistency-view', () => ({ ConsistencyView: () => 'ConsistencyView' }));
jest.mock('../../components/progress/records-view', () => ({ RecordsView: () => 'RecordsView' }));

// Capture focus callbacks so tests can simulate "the tab is focused again".
const mockFocusCallbacks: (() => void)[] = [];
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), navigate: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    mockFocusCallbacks.push(callback);
    // Simulate the tab receiving focus on mount, like expo-router does.
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

import ProgressScreen from '../../app/(tabs)/progress';
import { BodyView } from '../../components/progress/body-view';
import { RecordsView } from '../../components/progress/records-view';
import { Segmented } from '../../components/ui';
import { consumeProgressTab, requestProgressTab } from '../../lib/nav-intent';
import { usePulse } from '../../store/useStore';

describe('Progress tab — opening a requested segment', () => {
  beforeEach(() => {
    mockFocusCallbacks.length = 0;
    // Clear any intent left over from other tests.
    consumeProgressTab();
    usePulse.setState({ workouts: [], plans: [], measurements: [], profile: null });
  });

  it('opens on Body by default', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ProgressScreen));
    });

    expect(root.root.findAllByType(BodyView)).toHaveLength(1);
    expect(root.root.findAllByType(RecordsView)).toHaveLength(0);

    act(() => root.unmount());
  });

  it("opens the Records segment when Home's See all requests it", () => {
    requestProgressTab('Records');

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ProgressScreen));
    });

    expect(root.root.findAllByType(RecordsView)).toHaveLength(1);
    expect(root.root.findAllByType(BodyView)).toHaveLength(0);

    act(() => root.unmount());
  });

  it('does not snap back to the requested segment on later focus', () => {
    requestProgressTab('Records');

    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ProgressScreen));
    });
    expect(root.root.findAllByType(RecordsView)).toHaveLength(1);

    // User manually switches to another segment…
    const segmented = root.root.findByType(Segmented);
    act(() => {
      segmented.props.onChange('Body');
    });
    expect(root.root.findAllByType(BodyView)).toHaveLength(1);
    expect(root.root.findAllByType(RecordsView)).toHaveLength(0);

    // …then the tab is focused again (no new intent): must stay on Body.
    act(() => {
      mockFocusCallbacks[0]();
    });
    expect(root.root.findAllByType(BodyView)).toHaveLength(1);
    expect(root.root.findAllByType(RecordsView)).toHaveLength(0);

    act(() => root.unmount());
  });
});
