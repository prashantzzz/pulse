import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Toggle } from '../../components/ui';
import { usePulse } from '../../store/useStore';
import { applyAccent, colors, ACCENTS } from '../../theme';
import { hapticsLight } from '../haptics';
import * as Haptics from 'expo-haptics';

describe('Theme-Specific Toggle Component', () => {
  beforeEach(() => {
    act(() => {
      applyAccent('mint');
    });
    jest.clearAllMocks();
  });

  it('renders with accessibilityRole switch and correct checked state', () => {
    const onValueChange = jest.fn();
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(Toggle, { value: true, onValueChange, accessibilityLabel: 'Auto-start rest timer' })
      );
    });

    const toggle = root!.root.findByProps({ accessibilityRole: 'switch' });
    expect(toggle).toBeTruthy();
    expect(toggle.props.accessibilityState.checked).toBe(true);

    act(() => {
      root.update(
        React.createElement(Toggle, { value: false, onValueChange, accessibilityLabel: 'Auto-start rest timer' })
      );
    });
    const updatedToggle = root!.root.findByProps({ accessibilityRole: 'switch' });
    expect(updatedToggle.props.accessibilityState.checked).toBe(false);
  });

  it('triggers onValueChange and haptics when pressed', () => {
    const onValueChange = jest.fn();
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(Toggle, { value: false, onValueChange })
      );
    });

    const toggle = root!.root.findByProps({ accessibilityRole: 'switch' });
    act(() => {
      toggle.props.onPress();
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger onValueChange when disabled', () => {
    const onValueChange = jest.fn();
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(Toggle, { value: false, onValueChange, disabled: true })
      );
    });

    const toggle = root!.root.findByProps({ accessibilityRole: 'switch' });
    act(() => {
      toggle.props.onPress();
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('dynamically adapts active track color to the selected theme accent', () => {
    const accents = ['mint', 'coral', 'sky', 'rose', 'gold', 'lime'] as const;

    for (const acc of accents) {
      act(() => {
        applyAccent(acc);
      });
      const expectedAccentColor = ACCENTS[acc].accent;
      expect(colors.accent).toBe(expectedAccentColor);

      let root: renderer.ReactTestRenderer;
      act(() => {
        root = renderer.create(
          React.createElement(Toggle, { value: true, onValueChange: () => {} })
        );
      });
      const switchEl = root!.root.findByProps({ accessibilityRole: 'switch' });
      const trackStyle = Array.isArray(switchEl.props.style)
        ? Object.assign({}, ...switchEl.props.style.flat())
        : switchEl.props.style;

      expect(trackStyle.backgroundColor).toBe(expectedAccentColor);
    }
  });

  it('uses dark surface background when inactive', () => {
    act(() => {
      applyAccent('mint');
    });
    let root: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(
        React.createElement(Toggle, { value: false, onValueChange: () => {} })
      );
    });
    const switchEl = root!.root.findByProps({ accessibilityRole: 'switch' });
    const trackStyle = Array.isArray(switchEl.props.style)
      ? Object.assign({}, ...switchEl.props.style.flat())
      : switchEl.props.style;

    expect(trackStyle.backgroundColor).toBe(colors.surface4);
  });
});

describe('Settings Preferences & Store Integration', () => {
  beforeEach(() => {
    usePulse.setState({
      autoRestTimer: true,
      hapticsEnabled: true,
    });
    jest.clearAllMocks();
  });

  it('allows toggling autoRestTimer in the store', () => {
    expect(usePulse.getState().autoRestTimer).toBe(true);
    usePulse.getState().setAutoRestTimer(false);
    expect(usePulse.getState().autoRestTimer).toBe(false);
    usePulse.getState().setAutoRestTimer(true);
    expect(usePulse.getState().autoRestTimer).toBe(true);
  });

  it('allows toggling hapticsEnabled in the store and suppresses haptics when disabled', () => {
    expect(usePulse.getState().hapticsEnabled).toBe(true);
    hapticsLight();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);

    // Disable haptics
    usePulse.getState().setHapticsEnabled(false);
    expect(usePulse.getState().hapticsEnabled).toBe(false);

    jest.clearAllMocks();
    hapticsLight();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('respects autoRestTimer=false during active workout set completion', () => {
    usePulse.setState({
      autoRestTimer: false,
      activeWorkout: {
        id: 'test-w1',
        title: 'Push Day',
        startTime: new Date().toISOString(),
        endTime: null,
        notes: null,
        description: null,
        exercises: [
          {
            id: 'we1',
            exerciseId: 'bench-press',
            order: 0,
            notes: null,
            plannedSets: 2,
            targetReps: '10',
            sets: [
              {
                id: 's1',
                setIndex: 1,
                setType: 'working',
                weightKg: 80,
                reps: 10,
                distanceKm: null,
                durationSec: null,
                rpe: null,
                notes: null,
                supersetId: null,
                completed: false,
                completedAt: null,
              },
              {
                id: 's2',
                setIndex: 2,
                setType: 'working',
                weightKg: 80,
                reps: 10,
                distanceKm: null,
                durationSec: null,
                rpe: null,
                notes: null,
                supersetId: null,
                completed: false,
                completedAt: null,
              },
            ],
          },
        ],
        restTimer: null,
      },
    });

    usePulse.getState().completeSet('bench-press', 's1');
    const workout = usePulse.getState().activeWorkout;
    expect(workout?.exercises[0].sets[0].completed).toBe(true);
    // restTimer should NOT be started because autoRestTimer is false
    expect(workout?.restTimer).toBeNull();
  });
});
