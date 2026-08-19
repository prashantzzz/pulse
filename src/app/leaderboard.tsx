import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { Avatar } from '../components/misc';
import { Button, Chip, Row, Screen, ScreenHeader } from '../components/ui';
import { consistencyPct, currentStreak, detectPRs, progressScore, totalVolume, workoutsInLastDays } from '../lib/stats';
import { fetchCloudFriends } from '../lib/social';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { accentTint, colors, radius, spacing, useAccent } from '../theme';
import type { Friend } from '../types';

const FILTERS = ['This Week', 'This Month', 'All Time'] as const;

export default function LeaderboardScreen() {
  useAccent();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const friends = usePulse((s) => s.friends);
  const setFriends = usePulse((s) => s.setFriends);
  const workouts = usePulse((s) => s.workouts);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('This Week');

  useEffect(() => {
    if (user?.id) {
      fetchCloudFriends(user.id).then((cloudFriends) => {
        if (cloudFriends.length > 0) {
          setFriends(cloudFriends);
        }
      }).catch(() => {});
    }
  }, [user?.id, setFriends]);

  const myScore = progressScore({
    workoutsThisWeek: workoutsInLastDays(workouts, 7).length,
    prsThisMonth: workouts.slice(-30).reduce((n, w) => n + detectPRs(w, workouts).length, 0),
    streak: currentStreak(workouts),
    volumeKg: totalVolume(workoutsInLastDays(workouts, 30)),
    consistency: consistencyPct(workouts, 28),
    goalCompletion: 0.8,
  });

  const me: Friend = { id: 'me', name: 'You', isContact: true, score: myScore, workoutsThisWeek: workoutsInLastDays(workouts, 7).length, prsThisMonth: 3, streak: currentStreak(workouts), volumeKg: totalVolume(workoutsInLastDays(workouts, 7)), avatarHue: 90 };

  // drop any persisted "You" placeholder so the live-computed row is the only one
  const realFriends = friends.filter((f) => f.id !== 'me' && f.name !== 'You');
  const ranked = [...realFriends, me].sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((f) => f.id === 'me') + 1;

  return (
    <Screen scroll>
      <ScreenHeader
        title="Leaderboard"
        subtitle={realFriends.length > 0 ? `You're ranked #${myRank}` : `Your Score: ${myScore}`}
        back
      />
      <View>
        <Row gap={8}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </Row>

        {/* podium (shown when friends are connected) */}
        {realFriends.length > 0 ? (
          <View style={styles.podium}>
            <LinearGradient colors={[accentTint(colors.accent, 0.17), colors.surface]} style={StyleSheet.absoluteFill} />
            <View style={[styles.podiumGlow, { backgroundColor: `${colors.accent}14` }]} />
            <Row align="space-between">
              {ranked.slice(0, 3).map((f, i) => {
                const medal = ['gold', 'emerald', 'teal'][i] as 'gold' | 'emerald' | 'teal';
                const isMe = f.id === 'me';
                return (
                  <View key={f.id} style={{ alignItems: 'center', gap: 6, width: 90 }}>
                    <View style={[styles.medal, { backgroundColor: colors[medal] }]}>
                      <T variant="micro" style={{ color: colors.bg, fontWeight: '700' }}>
                        #{i + 1}
                      </T>
                    </View>
                    <Avatar name={f.name} size={52} hue={f.avatarHue} showRing={isMe} />
                    <T variant="smallSemi" style={{ fontSize: 12 }} numberOfLines={1}>
                      {f.name}
                    </T>
                    <T variant="micro" accent>
                      {f.score}
                    </T>
                  </View>
                );
              })}
            </Row>
          </View>
        ) : null}

        {/* list */}
        <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
          {ranked.map((f, i) => {
            const isMe = f.id === 'me';
            return (
              <View key={f.id} style={[styles.row, isMe && { borderColor: `${colors.accent}73`, backgroundColor: `${colors.accent}0D` }]}>
                <View style={styles.rank}>
                  <T variant="smallSemi" style={{ color: isMe ? colors.accent : colors.textMuted }}>
                    {i + 1}
                  </T>
                </View>
                <Avatar name={f.name} size={40} hue={f.avatarHue} />
                <View style={{ flex: 1 }}>
                  <Row align="space-between">
                    <T variant="bodySemi" style={{ fontSize: 14 }}>
                      {f.name} {isMe ? '(you)' : ''}
                    </T>
                    <T variant="numSm" accent style={{ fontSize: 16 }}>
                      {f.score}
                    </T>
                  </Row>
                  <View style={styles.scoreTrack}>
                    <View style={[styles.scoreFill, { width: `${f.score}%`, backgroundColor: colors.accent }]} />
                  </View>
                  <Row gap={10} style={{ marginTop: 4 }}>
                    <MiniStat icon="flame-outline" text={`${f.streak}d`} />
                    <MiniStat icon="barbell-outline" text={`${f.workoutsThisWeek}/wk`} />
                    <MiniStat icon="trophy-outline" text={`${f.prsThisMonth} PRs`} />
                    <MiniStat icon="layers-outline" text={`${(f.volumeKg / 1000).toFixed(1)}k kg`} />
                  </Row>
                </View>
              </View>
            );
          })}
        </View>

        {/* Empty friends state */}
        {realFriends.length === 0 ? (
          <View style={styles.emptyFriendsCard}>
            <Ionicons name="people-outline" size={32} color={colors.accent} />
            <T variant="bodySemi" center style={{ marginTop: spacing.sm }}>
              No friends on your leaderboard yet
            </T>
            <T variant="small" dim center style={{ marginTop: 4, paddingHorizontal: spacing.md }}>
              Invite workout partners or send a friend challenge to compare workout streaks, PRs, and weekly volume!
            </T>
          </View>
        ) : null}

        <Pressable onPress={() => router.push('/challenge' as never)} style={styles.challengeCta}>
          <View style={[styles.challengeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="flash" size={20} color={colors.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="bodySemi">Challenge a friend</T>
            <T variant="small" dim style={{ fontSize: 12 }}>
              Most workouts, biggest lift, longest streak — you pick.
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </Screen>
  );
}

function MiniStat({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <Row gap={3}>
      <Ionicons name={icon} size={11} color={colors.textMuted} />
      <T variant="micro" muted style={{ fontSize: 10 }}>
        {text}
      </T>
    </Row>
  );
}

const styles = StyleSheet.create({
  podium: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  podiumGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  medal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rank: { width: 26, alignItems: 'center' },
  scoreTrack: { height: 3, borderRadius: 2, backgroundColor: colors.surface3, overflow: 'hidden', marginTop: 4 },
  scoreFill: { height: '100%' },
  challengeCta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFriendsCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
