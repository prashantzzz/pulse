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
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '../components/misc';
import { AuthLoadingScreen } from '../components/auth-loading';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { applyAccent, colors } from '../theme';
import * as Notifications from 'expo-notifications';
import {
  EVENING_REMINDER_ID,
  isReminderSuppressed,
  requestNotificationPermissions,
  resolveNotificationRoute,
  setupNotificationCategories,
  syncWorkoutReminder,
} from '../lib/notifications';
import * as QuickActions from 'expo-quick-actions';
import { getRouteForQuickAction, setupQuickActions } from '../lib/quick-actions';
import { schedulePlayStoreUpdateCheck } from '../lib/in-app-update';

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
  const isVerifyingUser = useAuth((s) => s.isVerifyingUser);
  const segments = useSegments();
  const pathname = usePathname();
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
    if (!hydrated || Platform.OS === 'web') return;
    async function setupNotifications() {
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      await setupNotificationCategories();
      await syncWorkoutReminder();
    }
    setupNotifications();
  }, [hydrated]);

  // Keep evening reminder synchronized on AppState changes and dismiss if delivered while suppressed
  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return;

    // 1. Re-sync reminder whenever app comes to foreground
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncWorkoutReminder().catch(() => {});
        // A rest timer may have expired while the app was away: flip the live
        // notification back to the next set (silent — the workout screen owns
        // the chime/toast when it is open).
        import('../lib/notifications').then(({ reconcileExpiredRestTimer }) => {
          reconcileExpiredRestTimer().catch(() => {});
        }).catch(() => {});
      }
    });

    // 2. Dismiss evening reminder immediately if received while suppressed
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      if (notification?.request?.identifier === EVENING_REMINDER_ID) {
        const state = usePulse.getState();
        if (isReminderSuppressed({ workouts: state.workouts, activeWorkout: state.activeWorkout })) {
          Notifications.dismissNotificationAsync(EVENING_REMINDER_ID).catch(() => {});
        }
      }
    });

    // 3. Set a timer to sync schedule right after 7:00 PM today if app is open before 7:00 PM
    const now = new Date();
    const today7PM = new Date(now);
    today7PM.setHours(19, 0, 5, 0); // 7:00:05 PM
    const msUntil7PM = today7PM.getTime() - now.getTime();
    let eveningTimer: ReturnType<typeof setTimeout> | null = null;
    if (msUntil7PM > 0 && msUntil7PM < 86400000) {
      eveningTimer = setTimeout(() => {
        syncWorkoutReminder().catch(() => {});
      }, msUntil7PM);
    }

    return () => {
      appStateSub?.remove?.();
      receivedSub?.remove?.();
      if (eveningTimer) clearTimeout(eveningTimer);
    };
  }, [hydrated]);

  // Register and handle home screen / app drawer quick actions (Workout, Progress)
  useEffect(() => {
    if (Platform.OS === 'web' || !hydrated) return;

    setupQuickActions().catch(() => {});

    const handleAction = (action: QuickActions.Action | null | undefined) => {
      const targetRoute = getRouteForQuickAction(action);
      if (targetRoute) {
        router.push(targetRoute as never);
      }
    };

    if (QuickActions.initial) {
      handleAction(QuickActions.initial);
    }

    const sub = QuickActions.addListener((action) => {
      handleAction(action);
    });

    return () => {
      sub.remove();
    };
  }, [hydrated, router]);

  // Play Store in-app update prompt (release Android builds only): deferred,
  // fire-and-forget, at most once per day, and skipped during an active workout.
  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return;
    const check = () =>
      schedulePlayStoreUpdateCheck(() => Boolean(usePulse.getState().activeWorkout));
    check();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check();
    });
    return () => sub?.remove?.();
  }, [hydrated]);

  // Handle interaction with notification action buttons ('Start Workout', 'Next Rep', 'Pause', 'Resume', 'Skip Rest', 'Finish') and notification taps
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Open a route from a tapped notification without stacking a duplicate of
    // the screen that is already focused (e.g. the live-workout screen).
    const openRoute = (target: string | null) => {
      if (!target || pathname === target) return;
      router.navigate(target as never);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as { url?: string; workoutId?: string } | undefined;

      // A rest timer may have expired while the app was away: clear it first so
      // every branch below (and its notification sync) observes fresh state
      // instead of a stuck "Resting" timer.
      try {
        const { reconcileExpiredRestTimer } = await import('../lib/notifications');
        await reconcileExpiredRestTimer();
      } catch {
        // A failed reconcile must never block the tapped action.
      }

      if (actionId === 'START_WORKOUT') {
        openRoute('/(tabs)/workouts');
      } else if (actionId === 'NEXT_REP') {
        usePulse.getState().completeNextSetAndStartRest();
        const curr = usePulse.getState().activeWorkout;
        if (curr) {
          const allComplete = curr.exercises.flatMap((e) => e.sets).every((s) => s.completed);
          if (allComplete) {
            import('../lib/notifications').then(({ dismissActiveWorkoutNotification }) => {
              dismissActiveWorkoutNotification();
            }).catch(() => {});
            const finished = usePulse.getState().finishWorkout();
            if (finished) {
              router.replace(`/workout/${finished.id}/summary` as never);
            }
            return;
          }
          import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
            syncActiveWorkoutNotification(curr);
          }).catch(() => {});
        }
      } else if (actionId === 'PAUSE_WORKOUT') {
        usePulse.getState().pauseActiveWorkout();
        const curr = usePulse.getState().activeWorkout;
        if (curr) {
          import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
            syncActiveWorkoutNotification(curr);
          }).catch(() => {});
        }
      } else if (actionId === 'RESUME_WORKOUT') {
        usePulse.getState().resumeActiveWorkout();
        const curr = usePulse.getState().activeWorkout;
        if (curr) {
          import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
            syncActiveWorkoutNotification(curr);
          }).catch(() => {});
        }
      } else if (actionId === 'SKIP_REST') {
        usePulse.getState().clearRestTimer();
        const curr = usePulse.getState().activeWorkout;
        if (curr) {
          import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
            syncActiveWorkoutNotification(curr);
          }).catch(() => {});
        }
      } else if (actionId === 'FINISH_WORKOUT') {
        const curr = usePulse.getState().activeWorkout;
        const targetId = data?.workoutId;
        if (curr && (!targetId || curr.id === targetId)) {
          // Do NOT finish here. Open the running workout with the options menu
          // so the user explicitly confirms. Finishing first used to strand this
          // screen on a history copy with dead buttons: the beforeRemove guard
          // blocked the summary route because the finish came from outside.
          usePulse.getState().requestWorkoutMenu(curr.id);
          openRoute(`/workout/${curr.id}`);
        } else {
          // Stale notification — the workout was already finished or discarded.
          openRoute('/(tabs)/home');
        }
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        openRoute(resolveNotificationRoute(data));
      }
    });

    return () => {
      sub.remove();
    };
  }, [router, pathname]);

  // Global active workout rest timer listener:
  // When rest timer expires on its own (without user clicking Skip Rest), play rest_over.mp3 once
  // (with audio ducking so Spotify/YT Music does not pause), clear the rest timer,
  // and update the notification to the next set.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let timer: any = null;

    const checkRestTimer = () => {
      const aw = usePulse.getState().activeWorkout;
      const rt = aw?.restTimer;
      if (!rt || rt.paused) {
        if (timer) clearTimeout(timer);
        return;
      }

      const msRemaining = rt.targetEndTimeMs - Date.now();
      if (msRemaining <= 0) {
        // Expired naturally on its own
        import('../lib/sound').then(({ playRestOverSound }) => {
          playRestOverSound(rt.targetEndTimeMs);
        }).catch(() => {});
        usePulse.getState().clearRestTimer();
        const updated = usePulse.getState().activeWorkout;
        if (updated) {
          import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
            syncActiveWorkoutNotification(updated);
          }).catch(() => {});
        }
      } else {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const latestAw = usePulse.getState().activeWorkout;
          const latestRt = latestAw?.restTimer;
          // Ensure rest timer was not cancelled or skipped in the meantime
          if (latestRt && !latestRt.paused && latestRt.targetEndTimeMs === rt.targetEndTimeMs) {
            import('../lib/sound').then(({ playRestOverSound }) => {
              playRestOverSound(latestRt.targetEndTimeMs);
            }).catch(() => {});
            usePulse.getState().clearRestTimer();
            const latestUpdated = usePulse.getState().activeWorkout;
            if (latestUpdated) {
              import('../lib/notifications').then(({ syncActiveWorkoutNotification }) => {
                syncActiveWorkoutNotification(latestUpdated);
              }).catch(() => {});
            }
          }
        }, msRemaining);
      }
    };

    checkRestTimer();
    // Align the OS-level alert with any rest timer restored from storage
    // (an expired one just cancels; a live one is re-scheduled idempotently).
    import('../lib/notifications').then(({ syncRestOverNotification }) => {
      const aw = usePulse.getState().activeWorkout;
      syncRestOverNotification(aw?.restTimer ?? null, aw ?? null).catch(() => {});
    }).catch(() => {});

    const unsub = usePulse.subscribe((state, prevState) => {
      const prevRt = prevState.activeWorkout?.restTimer;
      const currRt = state.activeWorkout?.restTimer;
      if (
        prevRt?.targetEndTimeMs !== currRt?.targetEndTimeMs ||
        prevRt?.paused !== currRt?.paused
      ) {
        checkRestTimer();
        // Keep the OS-level "rest over" alert in lockstep with the timer:
        // a fresh/changed timer (re)schedules it, a pause/clear/finish cancels
        // it. Single identifier, so alerts can never stack.
        import('../lib/notifications').then(({ syncRestOverNotification }) => {
          syncRestOverNotification(currRt ?? null, state.activeWorkout ?? null).catch(() => {});
        }).catch(() => {});
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);

  // Global Route Guard: strictly allow only auth and challenge invite routes when not authenticated
  useEffect(() => {
    if (!fontsLoaded || !hydrated || !isInitialized) return;
    // CRITICAL: Do not route or show onboarding while the user's cloud status is being verified!
    if (isVerifyingUser) return;

    const segList = segments as string[];
    const inAuthGroup = segList[0] === 'auth';
    const isIndex = segList.length === 0;
    const isChallengeInvite = segList[0] === 'challenge';
    const isPublicLegal = segList[0] === 'privacy' || segList[0] === 'terms';

    const isAuthRecovery = segList[1] === 'reset-password' || segList[1] === 'callback';

    if (!isAuthenticated) {
      if (!inAuthGroup && !isIndex && !isChallengeInvite && !isPublicLegal) {
        router.replace('/auth/login' as never);
      }
    } else {
      if (inAuthGroup && !isAuthRecovery) {
        const onboarded = usePulse.getState().onboarded;
        router.replace(onboarded ? '/(tabs)/home' : '/onboarding');
      }
    }
  }, [fontsLoaded, hydrated, isInitialized, isAuthenticated, isVerifyingUser, segments, router]);

  // apply the user's accent palette when it changes
  useEffect(() => {
    applyAccent(accentKey);
  }, [accentKey]);

  if (!fontsLoaded || !hydrated || isVerifyingUser) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        {isVerifyingUser ? <AuthLoadingScreen /> : null}
        <ToastHost />
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
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="auth/login" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/reset-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="workout/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="workout/[id]/summary" options={{ animation: 'fade', gestureEnabled: true }} />
        <Stack.Screen name="gym-mode" options={{ animation: 'fade' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
