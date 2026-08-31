import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '../components/misc';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { applyAccent, colors } from '../theme';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions, scheduleEveningReminder, cancelEveningReminder, setupNotificationCategories } from '../lib/notifications';

// react-native-web dev mode logs `Received false for a non-boolean attribute
// collapsable` for every RN Animated component. It is harmless and never
// happens in production — filter it so the Expo dev overlay stays quiet.
// Likewise, react-native-svg passes RNW responder props onto SVG DOM nodes on
// web, and React DOM dev warns about each one (tap handling still works —
// react-native-svg maps onPress to onClick on web).
if (Platform.OS === 'web' && typeof console !== 'undefined' && __DEV__) {
  const origError = console.error;
  const svgResponderProps = ['onStartShouldSetResponder', 'onResponderTerminationRequest', 'onResponderGrant', 'onResponderMove', 'onResponderRelease', 'onResponderTerminate'];
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    const second = typeof args[1] === 'string' ? args[1] : '';
    if (first.includes('non-boolean attribute') && (first.includes('collapsable') || first.includes('Received'))) return;
    if (first.includes('Unknown event handler property') && svgResponderProps.includes(second)) return;
    origError(...args);
  };
}

// hide native browser scrollbars on web so the app scrolls like an Android app
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'nextrep-no-scrollbars';
  style.textContent = `
    * { scrollbar-width: none; -ms-overflow-style: none; }
    *::-webkit-scrollbar { display: none; width: 0; height: 0; }
  `;
  document.head.appendChild(style);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = usePulse((s) => s.hydrated);
  const accentKey = usePulse((s) => s.accentKey);
  const initializeAuth = useAuth((s) => s.initialize);
  const isInitialized = useAuth((s) => s.isInitialized);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  // Initialize Supabase auth session check and subscription
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe();
    };
  }, [initializeAuth]);

  // Request notification permissions, setup categories, and schedule/cancel daily evening reminder
  useEffect(() => {
    if (!hydrated) return;
    async function setupNotifications() {
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      await setupNotificationCategories();

      const workouts = usePulse.getState().workouts;
      const todayStr = new Date().toDateString();
      const workedOutToday = workouts.some((w) => new Date(w.startTime).toDateString() === todayStr);

      if (workedOutToday) {
        await cancelEveningReminder();
      } else {
        await scheduleEveningReminder();
      }
    }
    setupNotifications();
  }, [hydrated]);

  // Handle interaction with notification action buttons ('Start Workout', 'Pause', 'Finish') and notification taps
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as { url?: string; workoutId?: string } | undefined;

      if (actionId === 'START_WORKOUT') {
        router.push('/(tabs)/workouts' as never);
      } else if (actionId === 'PAUSE_WORKOUT') {
        usePulse.getState().pauseActiveWorkout();
      } else if (actionId === 'RESUME_WORKOUT') {
        usePulse.getState().resumeActiveWorkout();
      } else if (actionId === 'FINISH_WORKOUT') {
        import('../lib/notifications').then(({ dismissActiveWorkoutNotification }) => dismissActiveWorkoutNotification()).catch(() => {});
        const finished = usePulse.getState().finishWorkout();
        if (finished) {
          router.replace(`/workout/${finished.id}/summary` as never);
        } else if (data?.workoutId) {
          router.push(`/workout/${data.workoutId}` as never);
        }
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        if (data?.url) {
          router.push(data.url as never);
        } else if (data?.workoutId) {
          router.push(`/workout/${data.workoutId}` as never);
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [router]);

  // Global Route Guard: strictly allow only auth and challenge invite routes when not authenticated
  useEffect(() => {
    if (!fontsLoaded || !hydrated || !isInitialized) return;

    const segList = segments as string[];
    const inAuthGroup = segList[0] === 'auth';
    const isIndex = segList.length === 0;
    const isChallengeInvite = segList[0] === 'challenge';
    const isPublicLegal = segList[0] === 'privacy' || segList[0] === 'terms';

    if (!isAuthenticated) {
      if (!inAuthGroup && !isIndex && !isChallengeInvite && !isPublicLegal) {
        router.replace('/auth/login' as never);
      }
    }
  }, [fontsLoaded, hydrated, isInitialized, isAuthenticated, segments, router]);

  // apply the user's accent palette when it changes
  useEffect(() => {
    applyAccent(accentKey);
  }, [accentKey]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/reset-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="workout/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout/[id]/summary" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="gym-mode" options={{ animation: 'fade' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
