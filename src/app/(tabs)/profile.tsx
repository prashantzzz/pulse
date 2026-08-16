import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressRing } from '../../components/ring';
import { T } from '../../components/Text';
import { AchievementBadge, Avatar } from '../../components/misc';
import { Card, Icon, ProgressBar, Row, Screen, Section } from '../../components/ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { currentStreak, detectPRs, longestStreak, totalVolume, volumeByMuscle, workoutStats } from '../../lib/stats';
import { usePulse } from '../../store/useStore';
import { colors, gradients, radius, spacing } from '../../theme';
import type { IonName } from '../../components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = usePulse((s) => s.profile);
  const workouts = usePulse((s) => s.workouts);
  const favorites = usePulse((s) => s.favorites);

  const streak = currentStreak(workouts);
  const volume = totalVolume(workouts);
  const sets = workouts.reduce((s, w) => s + workoutStats(w).sets, 0);
  const prCount = workouts.reduce((n, w) => n + detectPRs(w, workouts).length, 0);
  const exercisesUsed = new Set(workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId))).size;

  const achievements: { icon: IonName; title: string; desc: string; earned: boolean; progress?: number }[] = [
    { icon: 'trophy', title: 'First PR', desc: 'Break your first record', earned: prCount > 0 },
    { icon: 'barbell', title: '10 Workouts', desc: 'Complete 10 sessions', earned: workouts.length >= 10, progress: Math.min(1, workouts.length / 10) },
    { icon: 'layers', title: '100 Sets', desc: 'Log 100 working sets', earned: sets >= 100, progress: Math.min(1, sets / 100) },
    { icon: 'scale', title: '100K kg Lifted', desc: 'Move 100,000 kg total', earned: volume >= 100000, progress: Math.min(1, volume / 100000) },
    { icon: 'flame', title: '30 Day Streak', desc: 'Train 30 days in a row', earned: longestStreak(workouts) >= 30, progress: Math.min(1, longestStreak(workouts) / 30) },
    { icon: 'calendar', title: 'Consistency Master', desc: '4+ sessions/week for a month', earned: workouts.length >= 16, progress: Math.min(1, workouts.length / 16) },
    { icon: 'star', title: '5 PRs', desc: 'Set 5 personal records', earned: prCount >= 5, progress: Math.min(1, prCount / 5) },
    { icon: 'git-network', title: 'Exercise Variety', desc: 'Train with 12+ exercises', earned: exercisesUsed >= 12, progress: Math.min(1, exercisesUsed / 12) },
  ];

  const byMuscle = volumeByMuscle(workouts, 60);
  const strongest = byMuscle[0];
  const weakest = byMuscle[byMuscle.length - 1];

  return (
    <Screen scroll contentStyle={{ paddingBottom: 130, paddingTop: 14 }}>
      {/* header */}
      <View style={styles.headerCard}>
        <LinearGradient colors={['#182112', '#0D0F12']} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerGlow, { backgroundColor: `${colors.accent}14` }]} />
        <Row align="space-between">
          <Avatar name={profile?.name ?? 'Athlete'} size={64} hue={90} showRing={streak > 0} />
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings' as never)}>
            <Icon name="settings-outline" size={20} color={colors.textDim} />
          </Pressable>
        </Row>
        <T variant="h2" style={{ marginTop: spacing.md }}>
          {profile?.name ?? 'Athlete'}
        </T>
        <T variant="small" dim style={{ marginTop: 2 }}>
          {profile?.experience ?? 'Beginner'} · {profile?.trainingAgeMonths ?? 3} months training · Goal: {profile?.goal.join(', ') ?? 'Get Stronger'}
        </T>
        <Row gap={spacing.lg} style={{ marginTop: spacing.lg }}>
          <HeaderStat label="Streak" value={`${streak}d`} accent />
          <HeaderStat label="Workouts" value={`${workouts.length}`} />
          <HeaderStat label="Total volume" value={`${(volume / 1000).toFixed(1)}k`} />
          <HeaderStat label="PRs" value={`${prCount}`} accent />
        </Row>
      </View>

      {/* weekly progress ring */}
      <Section title="This Month">
        <Card style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <View style={{ flex: 1 }}>
              <T variant="label" dim>
                Training load
              </T>
              <T variant="numLg" style={{ marginTop: 4 }}>
                {(volume / 1000).toFixed(1)}k
              </T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                kg lifted · {sets} sets · {workouts.length} workouts
              </T>
            </View>
            <View style={{ width: 110, alignItems: 'center' }}>
              <ProgressRingBig value={Math.min(100, Math.round((workouts.length / 16) * 100))} />
            </View>
          </Row>
        </Card>
      </Section>

      {/* favorites */}
      <Section title="Favorite Exercises">
        <Card style={{ padding: spacing.md, gap: spacing.sm }}>
          {favorites.length === 0 ? (
            <T variant="small" dim>
              Bookmark exercises in the library to see them here.
            </T>
          ) : (
            favorites.slice(0, 4).map((id) => {
              const e = EXERCISE_MAP[id];
              if (!e) return null;
              return (
                <Row key={id} gap={10}>
                  <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                    <Icon name="barbell-outline" size={15} color={colors.accent} />
                  </View>
                  <T variant="bodySemi" style={{ flex: 1 }}>
                    {e.name}
                  </T>
                  <T variant="small" muted style={{ fontSize: 12 }}>
                    {e.muscleGroup}
                  </T>
                </Row>
              );
            })
          )}
        </Card>
      </Section>

      {/* strongest / weakest */}
      <Section title="Muscle Balance">
        <Card style={{ padding: spacing.lg, gap: spacing.md }}>
          {strongest ? (
            <Row align="space-between">
              <Row gap={12}>
                <View style={styles.balanceIcon}>
                  <Icon name="trending-up" size={16} color={colors.success} />
                </View>
                <View>
                  <T variant="bodySemi">Strongest: {strongest.muscle}</T>
                  <T variant="small" dim style={{ fontSize: 12 }}>
                    {strongest.volume.toLocaleString()} kg volume
                  </T>
                </View>
              </Row>
            </Row>
          ) : null}
          {weakest && weakest.muscle !== strongest?.muscle ? (
            <Row align="space-between">
              <Row gap={12}>
                <View style={[styles.balanceIcon, { backgroundColor: 'rgba(255,91,102,0.12)' }]}>
                  <Icon name="alert-circle-outline" size={16} color={colors.orange} />
                </View>
                <View>
                  <T variant="bodySemi">Needs attention: {weakest.muscle}</T>
                  <T variant="small" dim style={{ fontSize: 12 }}>
                    {weakest.volume.toLocaleString()} kg volume — add a dedicated day
                  </T>
                </View>
              </Row>
            </Row>
          ) : null}
          <ProgressBar value={60} color={colors.success} height={8} />
        </Card>
      </Section>

      {/* achievements */}
      <Section title="Achievements" action="View all" onAction={() => router.push('/achievements' as never)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {achievements.slice(0, 4).map((a) => (
            <AchievementBadge key={a.title} icon={a.icon} title={a.title} desc={a.desc} earned={a.earned} progress={a.progress} />
          ))}
        </View>
      </Section>

      {/* social */}
      <Section title="Social" style={{ marginBottom: 20 }}>
        <Card style={{ padding: spacing.md }}>
          <Row align="space-between" style={{ paddingVertical: 6 }}>
            <Row gap={12}>
              <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="podium-outline" size={16} color={colors.accent} />
              </View>
              <T variant="bodySemi">Leaderboard</T>
            </Row>
            <Pressable onPress={() => router.push('/leaderboard' as never)}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Row>
          <Row align="space-between" style={{ paddingVertical: 6 }}>
            <Row gap={12}>
              <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="ribbon-outline" size={16} color={colors.accent} />
              </View>
              <T variant="bodySemi">Friend Challenges</T>
            </Row>
            <Pressable onPress={() => router.push('/challenge' as never)}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Row>
          <Row align="space-between" style={{ paddingVertical: 6 }}>
            <Row gap={12}>
              <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="medal-outline" size={16} color={colors.accent} />
              </View>
              <T variant="bodySemi">Achievements</T>
            </Row>
            <Pressable onPress={() => router.push('/achievements' as never)}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Row>
        </Card>
      </Section>
    </Screen>
  );
}

function HeaderStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <T variant="numSm" style={{ color: accent ? colors.accent : colors.text }}>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function ProgressRingBig({ value }: { value: number }) {
  return (
    <ProgressRing size={100} strokeWidth={10} progress={value}>
      <T variant="h3" accent>
        {value}%
      </T>
    </ProgressRing>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  headerGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(43,210,126,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
