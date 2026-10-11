import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { BottomSheet } from '../../components/misc';
import { BodyView } from '../../components/progress/body-view';
import { ConsistencyView } from '../../components/progress/consistency-view';
import { progressStyles, TF_LABELS } from '../../components/progress/shared';
import { StrengthView, type ProgressTimeframe } from '../../components/progress/strength-view';
import { RecordsView } from '../../components/progress/records-view';
import { VolumeView } from '../../components/progress/volume-view';
import { T } from '../../components/Text';
import { Icon, Row, Screen, Segmented } from '../../components/ui';
import { PromoCompactProvider, PromoReveal, PromoScreen } from '../../promo/reveal';
import { EXERCISE_MAP } from '../../data/exercises';
import { consumeProgressTab, PROGRESS_VIEWS, toProgressView, type ProgressView } from '../../lib/nav-intent';
import { usePulse } from '../../store/useStore';
import { colors, layout, spacing, useAccent } from '../../theme';

const TF_WEEKS: Record<ProgressTimeframe, number> = { '7D': 1, '1M': 4, '3M': 12, '6M': 26, '1Y': 52 };

const TIMEFRAME_VIEWS: ProgressView[] = ['Strength', 'Volume', 'Regularity'];

export default function ProgressScreen() {
  useAccent();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { width } = useWindowDimensions();
  const workouts = usePulse((s) => s.workouts);
  const plans = usePulse((s) => s.plans);
  const measurements = usePulse((s) => s.measurements);
  const profile = usePulse((s) => s.profile);
  // `?tab=` covers external deep links; in-app navigation uses the more
  // reliable nav-intent (see consumeProgressTab below). The param is watched
  // reactively so the promo HUD can jump straight to any analytics tab —
  // including when the Progress screen is already mounted.
  const [view, setView] = useState<ProgressView>(() => toProgressView(tab) ?? 'Body');
  const [tf, setTf] = useState<ProgressTimeframe>('3M');
  const [exerciseId, setExerciseId] = useState<string>('bench-press');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Analytics tab switches use "compact" motion: quick fades/redraws instead
  // of a full entrance cascade (the charts still draw).
  const [switching, setSwitching] = useState(false);
  const switchingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleViewChange = useCallback((v: ProgressView) => {
    setSwitching(true);
    setView(v);
    if (switchingTimer.current) clearTimeout(switchingTimer.current);
    switchingTimer.current = setTimeout(() => setSwitching(false), 750);
  }, []);
  useEffect(
    () => () => {
      if (switchingTimer.current) clearTimeout(switchingTimer.current);
    },
    [],
  );

  // React to `?tab=` changes (promo HUD jumps, deep links) even when this
  // screen is already mounted — the mount initializer above only runs once.
  useEffect(() => {
    const v = toProgressView(tab);
    if (v && v !== view) handleViewChange(v);
  }, [tab, view, handleViewChange]);

  // Open the requested segment when arriving with a navigation intent
  // (e.g. Home's "Personal Record → See all" opens Records).
  useFocusEffect(
    useCallback(() => {
      const intent = consumeProgressTab();
      if (intent) setView(intent);
    }, []),
  );

  const chartW = Math.min(width - 32, 600) - 32;

  // exercises for the picker sheet — includes exercises from both active plans
  // and logged workout history (deduped), falling back to core compounds when empty
  const workoutExIds = workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId));
  const planExIds = plans.flatMap((p) => p.exercises.map((e) => e.exerciseId));
  const combinedExercises = [...new Set([...planExIds, ...workoutExIds])];
  const planExercises =
    combinedExercises.length > 0
      ? combinedExercises
      : ['bench-press', 'squat', 'deadlift', 'shoulder-press', 'barbell-row', 'lat-pulldown', 'romanian-deadlift', 'leg-press'];
  const effectiveExerciseId = planExercises.includes(exerciseId) ? exerciseId : planExercises[0];

  return (
    <PromoScreen>
    <Screen
      scroll
      onSwipeRight={() => router.navigate('/(tabs)/workouts' as never)}
      onSwipeLeft={() => router.push('/profile' as never)}
      contentStyle={{ paddingBottom: layout.tabContentBottomPad, paddingTop: layout.screenTopPad }}>
      <PromoReveal observe={false}>
      <Row align="space-between" style={{ marginBottom: spacing.md }}>
        <View>
          <T variant="h2">Progress</T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            Insight on your gains
          </T>
        </View>
        {TIMEFRAME_VIEWS.includes(view) ? (
          <View style={[progressStyles.periodBadge, { backgroundColor: colors.accentSoft }]}>
            <T variant="smallMedium" accent style={{ fontSize: 12 }}>
              {TF_LABELS[tf]}
            </T>
          </View>
        ) : null}
      </Row>
      </PromoReveal>

      <Segmented options={PROGRESS_VIEWS} value={view} onChange={handleViewChange} scrollable />

      <PromoCompactProvider value={switching}>
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        {view === 'Strength' ? (
          <StrengthView
            workouts={workouts}
            exerciseId={effectiveExerciseId}
            weeks={TF_WEEKS[tf]}
            tf={tf}
            chartW={chartW}
            onExerciseChange={setExerciseId}
            onTimeframeChange={setTf}
            onOpenPicker={() => setPickerOpen(true)}
          />
        ) : null}
        {view === 'Volume' ? <VolumeView workouts={workouts} chartW={chartW} tf={tf} onTimeframeChange={setTf} /> : null}
        {view === 'Regularity' ? (
          <ConsistencyView workouts={workouts} chartW={chartW} tf={tf} onTimeframeChange={setTf} />
        ) : null}
        {view === 'Body' ? (
          <BodyView workouts={workouts} measurements={measurements} profile={profile} />
        ) : null}
        {view === 'Records' ? <RecordsView workouts={workouts} /> : null}
      </View>
      </PromoCompactProvider>

      {/* exercise picker */}
      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose exercise">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.xs }}>
            {planExercises.map((id) => {
              const e = EXERCISE_MAP[id];
              const active = id === effectiveExerciseId;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setExerciseId(id);
                    setPickerOpen(false);
                  }}
                  style={[progressStyles.exerciseOption, active && { backgroundColor: colors.accentSoft }]}>
                  <Icon name="barbell-outline" size={18} color={active ? colors.accent : colors.textDim} />
                  <T variant="bodySemi" style={{ flex: 1 }}>
                    {e?.name}
                  </T>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </Screen>
    </PromoScreen>
  );
}
