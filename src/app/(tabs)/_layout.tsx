import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';

import { T } from '../../components/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radius } from '../../theme';

type RouteName = 'home' | 'workouts' | 'log' | 'progress' | 'profile';

const TAB_META: { name: RouteName; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconActive: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'workouts', label: 'Workouts', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'log', label: 'Log', icon: 'add', iconActive: 'add' },
  { name: 'progress', label: 'Progress', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

function PulseTabBar({
  state,
  navigation,
}: {
  state: { index: number; routeNames: string[] };
  navigation: { emit: (e: { type: string; target: string }) => { defaultPrevented?: boolean } };
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TAB_META.map((tab, i) => {
        const focused = state.index === i;
        const isCenter = tab.name === 'log';
        if (isCenter) {
          return (
            <View key={tab.name} style={styles.centerSlot}>
              <Pressable
                onPress={() => router.push('/log' as never)}
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
            onPress={() => {
              const target = state.routeNames[i];
              const evt = navigation.emit({ type: 'tabPress', target });
              if (!evt.defaultPrevented) {
                router.push(`/${tab.name}` as never);
              }
            }}>
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent }]}>
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={22} color={focused ? colors.bg : colors.textDim} />
            </View>
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
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 999,
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
    borderWidth: 4,
    borderColor: colors.bg,
  },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontFamily: 'Inter_500Medium', marginTop: 2 },
  tabLabelActive: { color: colors.text, fontFamily: 'Inter_600SemiBold' },
});
