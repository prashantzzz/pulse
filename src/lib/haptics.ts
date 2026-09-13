import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function isHapticsDisabled(): boolean {
  try {
    const { usePulse } = require('../store/useStore');
    return usePulse.getState().hapticsEnabled === false;
  } catch {
    return false;
  }
}

export function hapticsLight() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticsMedium() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticsHeavy() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticsSuccess() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticsWarning() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function hapticsError() {
  if (Platform.OS === 'web' || isHapticsDisabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
