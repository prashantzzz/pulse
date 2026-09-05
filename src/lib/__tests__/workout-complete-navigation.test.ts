import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { BackHandler } from 'react-native';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
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
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
  useNavigation: () => ({
    addListener: mockAddListener,
    removeListener: mockRemoveListener,
  }),
  useLocalSearchParams: () => ({ id: 'w-completed-1' }),
}));

import SummaryScreen from '../../app/workout/[id]/summary';
import { usePulse } from '../../store/useStore';

describe('Workout Complete Screen Back Navigation', () => {
  let backHandlerCallback: (() => boolean) | null = null;
  let beforeRemoveCallback: ((e: { preventDefault: () => void }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;
    beforeRemoveCallback = null;

    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event: string, handler: () => boolean) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler;
      }
      return {
        remove: jest.fn(),
      } as any;
    });

    mockAddListener.mockImplementation((event: string, handler: (e: any) => void) => {
      if (event === 'beforeRemove') {
        beforeRemoveCallback = handler;
      }
      return jest.fn();
    });

    usePulse.setState({
      workouts: [
        {
          id: 'w-completed-1',
          title: 'Upper Body Power',
          startTime: '2026-09-05T10:00:00.000Z',
          endTime: '2026-09-05T10:45:00.000Z',
          exercises: [],
        },
      ],
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('navigates back to workouts page when phone hardware back button is pressed without minimizing the app', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(SummaryScreen));
    });

    expect(backHandlerCallback).toBeDefined();

    // Trigger hardware back button press
    let handled = false;
    act(() => {
      handled = backHandlerCallback!();
    });

    // Must return true to tell Android OS the app handled the back event (preventing minimization/exit)
    expect(handled).toBe(true);
    // Must navigate to the Workouts page
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/workouts');

    act(() => {
      root.unmount();
    });
  });

  it('navigates back to workouts page and prevents default when back swipe gesture occurs', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(SummaryScreen));
    });

    expect(beforeRemoveCallback).toBeDefined();

    const preventDefault = jest.fn();
    act(() => {
      beforeRemoveCallback!({ preventDefault });
    });

    // Must prevent default screen pop / OS activity finish
    expect(preventDefault).toHaveBeenCalled();
    // Must navigate to the Workouts page
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/workouts');

    // Subsequent removal during replace navigation should NOT be prevented again
    const secondPreventDefault = jest.fn();
    act(() => {
      beforeRemoveCallback!({ preventDefault: secondPreventDefault });
    });
    expect(secondPreventDefault).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('ensures _layout.tsx enables gesture navigation on workout/[id]/summary instead of disabling it', () => {
    const layoutPath = path.resolve(__dirname, '../../app/_layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Verify gestureEnabled is true for workout/[id]/summary
    expect(layoutContent).toMatch(/<Stack\.Screen\s+name="workout\/\[id\]\/summary"[^>]*gestureEnabled:\s*true/);
    expect(layoutContent).not.toContain('<Stack.Screen name="workout/[id]/summary" options={{ animation: \'fade\', gestureEnabled: false }}');
  });
});
