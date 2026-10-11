import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, BackHandler, Dimensions, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { T } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, useAccent } from '../../theme';
import { hapticsLight } from '../../lib/haptics';
import { PROMO } from '../../promo/config';
import { EASE, useReducedMotion } from '../../promo/motion';
import { usePromoPlay } from '../../promo/reveal';

// Tab switches pan left/right: each scene translates by its progress relative
// to the active tab (-1 left … +1 right), so the incoming screen slides in from
// the direction of the tapped tab and the outgoing one slides out the other way.
const TAB_SLIDE = Dimensions.get('window').width;

const tabSceneStyleInterpolator = ({ current: { progress } }: { current: { progress: Animated.Value } }) => ({
  sceneStyle: {
    transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_SLIDE] }) }],
  },
});

const tabTransitionSpec = {
  animation: 'timing' as const,
  config: { duration: 280, easing: Easing.out(Easing.cubic) },
};

type RouteName = 'home' | 'workouts' | 'log' | 'progress' | 'profile';

const TAB_META: { name: RouteName; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconActive: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'workouts', label: 'Workouts', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'log', label: 'Log', icon: 'add', iconActive: 'add' },
  { name: 'progress', label: 'Progress', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

/** Tab icon pill — selection crossfades + pops (promo build). */
function TabIconPill({
  focused,
  name,
  nameActive,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
  nameActive: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const sel = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const prevFocused = useRef(focused);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!PROMO.enabled || reduced) {
      sel.setValue(focused ? 1 : 0);
      return;
    }
    Animated.timing(sel, {
      toValue: focused ? 1 : 0,
      duration: PROMO.duration.selection,
      easing: EASE.standard,
      useNativeDriver: false,
    }).start();
  }, [focused, sel]);

  useEffect(() => {
    if (PROMO.enabled && !reduced && focused && !prevFocused.current) {
      pop.setValue(0.85);
      Animated.spring(pop, { toValue: 1, damping: 12, stiffness: 240, mass: 0.7, useNativeDriver: true }).start();
    }
    prevFocused.current = focused;
  }, [focused, pop]);

  const backgroundColor = sel.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', colors.accent],
  });

  return (
    <Animated.View style={[styles.iconWrap, { backgroundColor, transform: [{ scale: pop }] }]}>
      <Ionicons name={focused ? nameActive : name} size={22} color={focused ? colors.bg : colors.textDim} />
    </Animated.View>
  );
}

function PulseTabBar({
  state,
  navigation,
}: {
  state: { index: number; routeNames: string[] };
  navigation: { emit: (e: { type: string; target: string }) => { defaultPrevented?: boolean } };
}) {
  // keep the tab bar (FAB gradient, focused icon pill) in sync with the accent live
  useAccent();
  const { replay } = usePromoPlay();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Only intercept if we are actively viewing a top-level tab screen.
        // If a stack screen (settings, workout, gym-mode, history, etc.) is open,
        // do not intercept — allow that screen or stack navigator to handle back.
        const isTabScreen = segments[0] === '(tabs)' && segments.length <= 2;
        if (!isTabScreen) {
          return false;
        }

        const currentRoute = state?.routeNames?.[state?.index] ?? 'home';
        if (currentRoute !== 'home') {
          router.replace('/(tabs)/home');
          return true;
        }
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }
  }, [segments, state?.index, state?.routeNames, router]);

  return (
    <View
      style={[
        styles.bar,
        {
          marginBottom: Math.max(insets.bottom, 12),
        },
      ]}>
      {TAB_META.map((tab, i) => {
        const focused = state.index === i;
        const isCenter = tab.name === 'log';
        if (isCenter) {
          return (
            <View key={tab.name} style={styles.centerSlot}>
              <Pressable
                onPress={() => {
                  hapticsLight();
                  // Re-tapping the active Log tab replays the choreography.
                  if (focused && PROMO.enabled) replay();
                  else router.navigate('/(tabs)/log' as never);
                }}
                accessibilityRole="button"
                accessibilityLabel="Log"
                style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}>
                <LinearGradient colors={[...gradients.accent]} style={[styles.fab, { boxShadow: `0 10px 30px ${colors.accent}59` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="add" size={30} color={colors.bg} />
                </LinearGradient>
              </Pressable>
              <T variant="micro" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Log
              </T>
            </View>
          );
        }
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={focused ? { selected: true } : undefined}
            onPress={() => {
              hapticsLight();
              // Re-tapping the active tab replays the screen choreography —
              // every tap performs, never no-ops.
              if (focused && PROMO.enabled) {
                replay();
                return;
              }
              const target = state.routeNames[i];
              const evt = navigation.emit({ type: 'tabPress', target });
              if (!evt.defaultPrevented) {
                router.navigate(`/(tabs)/${tab.name}` as never);
              }
            }}>
            <TabIconPill focused={focused} name={tab.icon} nameActive={tab.iconActive} />
            <T variant="micro" style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {tab.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const accentKey = useAccent();
  return (
    <Tabs
      key={accentKey}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: tabTransitionSpec,
        sceneStyleInterpolator: tabSceneStyleInterpolator,
      }}
      tabBar={(props) => (
        <PulseTabBar
          state={props.state as never}
          navigation={props.navigation as never}
        />
      )}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: { flex: 1, alignItems: 'center', gap: 3, marginTop: -30 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontFamily: 'Inter_500Medium', marginTop: 2 },
  tabLabelActive: { color: colors.text, fontFamily: 'Inter_600SemiBold' },
});
