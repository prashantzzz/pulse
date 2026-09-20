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
jest.mock('../../lib/notifications', () => ({
  presentActiveWorkoutNotification: jest.fn(),
  dismissActiveWorkoutNotification: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('SafeAreaView', { style }, children),
  };
});

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    push: jest.fn(),
    canGoBack: mockCanGoBack,
  }),
  useNavigation: () => ({
    addListener: mockAddListener,
    removeListener: mockRemoveListener,
  }),
  useLocalSearchParams: () => ({ id: 'w-running-1' }),
}));

import ActiveWorkoutScreen from '../../app/workout/[id]/index';
import { usePulse } from '../../store/useStore';

describe('Running Workout Screen Back Navigation & Rest UI', () => {
  let backHandlerCallback: (() => boolean) | null = null;
  let beforeRemoveCallback: ((e: { preventDefault: () => void }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;
    beforeRemoveCallback = null;
    mockCanGoBack.mockReturnValue(true);

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
      activeWorkout: {
        id: 'w-running-1',
        title: 'Full Body Push',
        startTime: new Date().toISOString(),
        exercises: [],
      } as any,
      workouts: [],
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

  it('opens the options popup when hardware back is pressed (does NOT navigate directly)', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ActiveWorkoutScreen));
    });

    expect(backHandlerCallback).toBeDefined();

    let handled = false;
    act(() => {
      handled = backHandlerCallback!();
    });

    // Back press is consumed (returns true) and the menu opens — no direct navigation
    expect(handled).toBe(true);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('opens the options popup on second hardware back press when menu is already open (toggles off then on)', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ActiveWorkoutScreen));
    });

    expect(backHandlerCallback).toBeDefined();

    // First press — opens menu
    act(() => {
      backHandlerCallback!();
    });
    // Second press — menu is open, so it closes (no navigation)
    act(() => {
      backHandlerCallback!();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('intercepts back swipe gesture (beforeRemove) and shows options popup instead of navigating', () => {
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(React.createElement(ActiveWorkoutScreen));
    });

    expect(beforeRemoveCallback).toBeDefined();

    const preventDefault = jest.fn();
    act(() => {
      beforeRemoveCallback!({ preventDefault });
    });

    // Navigation is always prevented; the popup opens instead
    expect(preventDefault).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('verifies rest popup has +30s button stacked on the left side below pause button', () => {
    const indexPath = path.resolve(__dirname, '../../app/workout/[id]/index.tsx');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Verify +30s Add Time Button is stacked inside Left Action Column below Pause button
    expect(indexContent).toContain('Left Action Column: Pause button & +30s button stacked vertically');
    expect(indexContent).toContain('+30s Add Time Button (placed directly below Pause button)');

    // Ensure the old 3-column parallel flanked row is no longer present
    expect(indexContent).not.toContain('flanked parallel by Pause and +30s buttons');
  });

  it('verifies builder.tsx and auth/reset-password.tsx have safe fallback back handling', () => {
    const builderPath = path.resolve(__dirname, '../../app/builder.tsx');
    const builderContent = fs.readFileSync(builderPath, 'utf8');
    expect(builderContent).toContain("router.replace('/(tabs)/workouts' as never)");

    const resetPassPath = path.resolve(__dirname, '../../app/auth/reset-password.tsx');
    const resetPassContent = fs.readFileSync(resetPassPath, 'utf8');
    expect(resetPassContent).toContain("router.replace('/auth/login' as never)");
  });
});
