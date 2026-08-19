import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { Avatar, toast } from '../components/misc';
import { Button, Card, Icon, ProgressBar, Row, Screen, ScreenHeader, type IonName } from '../components/ui';
import {
  addFriendConnection,
  clearPendingInvite,
  createCloudChallenge,
  fetchCloudFriends,
  generateChallengeShareText,
  getPendingInvite,
  joinCloudChallenge,
  savePendingInvite,
  type PendingInvite,
} from '../lib/social';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { accentTint, colors, gradients, radius, spacing, useAccent } from '../theme';

const CHALLENGES: { icon: IonName; title: string; desc: string; type: string; grad: keyof typeof gradients }[] = [
  { icon: 'barbell-outline', title: 'Most workouts this week', desc: 'Who trains more? Winner takes the streak crown.', type: 'most_workouts', grad: 'accent' },
  { icon: 'trending-up-outline', title: 'Biggest Bench improvement', desc: 'Most kg added to bench press in 2 weeks.', type: 'strength_improvement', grad: 'emerald' },
  { icon: 'flame-outline', title: 'Longest streak', desc: 'Most consecutive training days. No breaks allowed.', type: 'longest_streak', grad: 'orange' },
  { icon: 'calendar-outline', title: 'Most consistent', desc: 'Best attendance over 14 days.', type: 'goal_completion', grad: 'teal' },
];

interface ActiveDuel {
  id: string;
  title: string;
  friendName: string;
  friendHue: number;
  myScore: number;
  friendScore: number;
  daysLeft: number;
}

export default function ChallengeScreen() {
  useAccent();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const friends = usePulse((s) => s.friends);
  const addFriend = usePulse((s) => s.addFriend);
  const setFriends = usePulse((s) => s.setFriends);
  const workouts = usePulse((s) => s.workouts);
  const profile = usePulse((s) => s.profile);

  const params = useLocalSearchParams<{ from?: string; name?: string; title?: string; type?: string; cid?: string }>();

  const [challenge, setChallenge] = useState(0);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<PendingInvite | null>(null);
  const [activeDuels, setActiveDuels] = useState<ActiveDuel[]>([
    {
      id: 'duel-1',
      title: 'Most workouts this week',
      friendName: 'Marcus',
      friendHue: 200,
      myScore: Math.min(workouts.length, 4),
      friendScore: 3,
      daysLeft: 4,
    },
  ]);

  // Check incoming invite params or stored pending invite
  useEffect(() => {
    async function checkInvites() {
      if (params.from && params.from !== user?.id) {
        const inv: PendingInvite = {
          fromUserId: params.from,
          fromName: params.name || 'A friend',
          challengeTitle: params.title || 'Most workouts this week',
          challengeType: params.type || 'most_workouts',
          challengeId: params.cid,
          timestamp: Date.now(),
        };
        await savePendingInvite(inv);
        setIncomingInvite(inv);
      } else {
        const stored = await getPendingInvite();
        if (stored && stored.fromUserId !== user?.id) {
          setIncomingInvite(stored);
        }
      }
    }
    checkInvites();
  }, [params.from, params.name, params.title, params.type, params.cid, user?.id]);

  // Sync cloud friends on mount
  useEffect(() => {
    if (user?.id) {
      fetchCloudFriends(user.id).then((cloudFriends) => {
        if (cloudFriends.length > 0) {
          setFriends(cloudFriends);
        }
      }).catch(() => {});
    }
  }, [user?.id, setFriends]);

  const c = CHALLENGES[challenge];
  const friend = friends.find((f) => f.id === friendId);

  // Accept incoming invite
  const acceptIncomingInvite = async () => {
    if (!incomingInvite) return;
    if (!isAuthenticated) {
      router.push('/auth/login' as never);
      return;
    }

    if (user?.id) {
      // Connect friends in Supabase
      await addFriendConnection(user.id, incomingInvite.fromUserId);
      if (incomingInvite.challengeId) {
        await joinCloudChallenge(incomingInvite.challengeId, user.id);
      }

      // Add to local state
      addFriend({
        id: incomingInvite.fromUserId,
        name: incomingInvite.fromName,
        isContact: true,
        score: 65,
        workoutsThisWeek: 2,
        prsThisMonth: 1,
        streak: 2,
        volumeKg: 4500,
        avatarHue: 210,
      });

      setActiveDuels((prev) => [
        {
          id: `duel-${Date.now()}`,
          title: incomingInvite.challengeTitle || 'Workout Duel',
          friendName: incomingInvite.fromName,
          friendHue: 210,
          myScore: Math.min(workouts.length, 1),
          friendScore: 0,
          daysLeft: 7,
        },
        ...prev,
      ]);
    }

    await clearPendingInvite();
    setIncomingInvite(null);
    toast(`Challenge accepted! You and ${incomingInvite.fromName} are now competing. 🤝`);
  };

  // Create & Share new challenge
  const sendChallenge = async () => {
    const creatorName = profile?.name || user?.user_metadata?.full_name || 'Athlete';
    const creatorId = user?.id || 'me';

    let cloudChallengeId: string | null = null;
    if (user?.id) {
      cloudChallengeId = await createCloudChallenge({
        creatorId: user.id,
        title: c.title,
        type: c.type,
      });
    }

    const { shareMessage } = generateChallengeShareText({
      creatorId,
      creatorName,
      title: c.title,
      type: c.type,
      challengeId: cloudChallengeId || undefined,
    });

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `NextRep: ${c.title}`, text: shareMessage });
      } else {
        await Share.share({
          message: shareMessage,
          title: `NextRep: ${c.title}`,
        });
      }

      const targetFriendName = friend ? friend.name : 'Your Friend';
      const targetFriendHue = friend ? friend.avatarHue : 180;

      setActiveDuels((prev) => [
        {
          id: `duel-${Date.now()}`,
          title: c.title,
          friendName: targetFriendName,
          friendHue: targetFriendHue,
          myScore: Math.min(workouts.length, 1),
          friendScore: 0,
          daysLeft: 7,
        },
        ...prev,
      ]);
      toast('Challenge invite sent! Link copied to share sheet.');
    } catch {
      toast('Challenge created!');
    }
  };

  // Unauthenticated landing view for friends opening SMS/link without having signed in yet
  if (!isAuthenticated && incomingInvite) {
    return (
      <Screen scroll>
        <ScreenHeader title="NextRep Challenge" subtitle="You received an invite!" back />

        <View style={{ gap: spacing.lg, marginTop: spacing.md }}>
          <View style={styles.incomingHero}>
            <LinearGradient colors={[accentTint(colors.accent, 0.18), colors.surface]} style={StyleSheet.absoluteFill} />
            <Avatar name={incomingInvite.fromName} size={64} hue={210} showRing />
            <T variant="h2" center style={{ marginTop: spacing.md }}>
              {incomingInvite.fromName} challenged you!
            </T>
            <T variant="bodySemi" accent center style={{ marginTop: 4 }}>
              &quot;{incomingInvite.challengeTitle}&quot;
            </T>
            <T variant="small" dim center style={{ marginTop: spacing.sm, maxWidth: 300 }}>
              Turn training into friendly rivalry. Compare volume, streaks, and personal records in real time.
            </T>
          </View>

          {/* Instructions */}
          <Card style={{ padding: spacing.lg, gap: spacing.md }}>
            <T variant="label" dim>HOW IT WORKS</T>
            <Row gap={12} align="center">
              <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                <T variant="smallSemi" accent>1</T>
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Download or Open NextRep</T>
                <T variant="micro" muted>Use the web app or install the Android APK</T>
              </View>
            </Row>
            <Row gap={12} align="center">
              <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                <T variant="smallSemi" accent>2</T>
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Sign In & Quick Profile Setup</T>
                <T variant="micro" muted>1-minute setup for your goals and muscle map</T>
              </View>
            </Row>
            <Row gap={12} align="center">
              <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                <T variant="smallSemi" accent>3</T>
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Duel & Track Progress Live</T>
                <T variant="micro" muted>Log your workouts and beat {incomingInvite.fromName}!</T>
              </View>
            </Row>
          </Card>

          <Button
            label="Sign In / Create Account to Accept"
            icon="log-in-outline"
            full
            size="lg"
            onPress={() => router.push('/auth/login' as never)}
          />

          <Pressable
            onPress={() => Linking.openURL('https://nextrep-app.vercel.app')}
            style={{ alignItems: 'center', marginTop: spacing.xs }}>
            <T variant="small" dim>
              Visit NextRep Web App
            </T>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Friend Challenge" subtitle="Turn training into friendly rivalry" back />

      {/* Incoming Invite Banner (if authenticated) */}
      {incomingInvite ? (
        <View style={styles.incomingBanner}>
          <LinearGradient colors={[accentTint(colors.accent, 0.22), colors.surface2]} style={StyleSheet.absoluteFill} />
          <Row align="space-between">
            <Row gap={12} align="center" style={{ flex: 1 }}>
              <Avatar name={incomingInvite.fromName} size={44} hue={210} showRing />
              <View style={{ flex: 1 }}>
                <T variant="micro" accent>INCOMING CHALLENGE</T>
                <T variant="bodySemi" numberOfLines={1}>{incomingInvite.fromName}</T>
                <T variant="micro" muted numberOfLines={1}>{incomingInvite.challengeTitle}</T>
              </View>
            </Row>
            <Button label="Accept" size="sm" onPress={acceptIncomingInvite} />
          </Row>
        </View>
      ) : null}

      {/* Active Duels */}
      {activeDuels.length > 0 ? (
        <View style={{ marginBottom: spacing.xl }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            Active Challenges ({activeDuels.length})
          </T>
          <View style={{ gap: spacing.sm }}>
            {activeDuels.map((d) => (
              <Card key={d.id} style={{ padding: spacing.md, gap: spacing.sm }}>
                <Row align="space-between">
                  <T variant="bodySemi">{d.title}</T>
                  <View style={[styles.daysLeftBadge, { backgroundColor: colors.accentSoft }]}>
                    <T variant="micro" accent>{d.daysLeft}d left</T>
                  </View>
                </Row>
                <Row align="space-between" style={{ marginTop: 4 }}>
                  <Row gap={8} align="center">
                    <Avatar name="You" size={28} hue={90} />
                    <T variant="smallSemi">You: {d.myScore}</T>
                  </Row>
                  <T variant="micro" muted>VS</T>
                  <Row gap={8} align="center">
                    <T variant="smallSemi">{d.friendName}: {d.friendScore}</T>
                    <Avatar name={d.friendName} size={28} hue={d.friendHue} />
                  </Row>
                </Row>
                <ProgressBar
                  value={(d.myScore / Math.max(1, d.myScore + d.friendScore)) * 100}
                  color={d.myScore >= d.friendScore ? colors.accent : colors.orange}
                  height={6}
                />
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <T variant="label" dim style={{ marginBottom: spacing.sm }}>
          Choose a challenge
        </T>
        <View style={{ gap: spacing.sm }}>
          {CHALLENGES.map((ch, i) => (
            <Pressable
              key={ch.title}
              onPress={() => setChallenge(i)}
              style={[styles.challengeCard, challenge === i && { borderColor: colors.accent, backgroundColor: `${colors.accent}0D` }]}>
              <LinearGradient colors={[...gradients[ch.grad]]} style={styles.challengeIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Icon name={ch.icon} size={20} color={colors.bg} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">{ch.title}</T>
                <T variant="small" dim style={{ fontSize: 12 }}>
                  {ch.desc}
                </T>
              </View>
              {challenge === i ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
            </Pressable>
          ))}
        </View>

        <T variant="label" dim style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Pick your rival or invite via SMS / link
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Pressable
            onPress={() => setFriendId(null)}
            style={[styles.friendChip, friendId === null && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
            <Icon name="share-social-outline" size={16} color={friendId === null ? colors.accent : colors.textDim} />
            <T variant="smallSemi" style={{ fontSize: 12, color: friendId === null ? colors.accent : colors.text }}>
              Invite Friend (SMS/Link)
            </T>
          </Pressable>
          {friends.filter((f) => f.id !== 'me').map((f) => (
            <Pressable key={f.id} onPress={() => setFriendId(f.id)} style={[styles.friendChip, friendId === f.id && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
              <Avatar name={f.name} size={34} hue={f.avatarHue} />
              <T variant="smallSemi" style={{ fontSize: 12 }}>
                {f.name}
              </T>
            </Pressable>
          ))}
        </View>

        <View style={styles.preview}>
          <LinearGradient colors={[accentTint(colors.accent, 0.15), '#0D0F12']} style={StyleSheet.absoluteFill} />
          <Row align="space-between">
            <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              <Avatar name="You" size={56} hue={90} showRing />
              <T variant="bodySemi">You</T>
              <T variant="micro" muted>
                Ready to go
              </T>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="flash" size={26} color={colors.accent} />
              <T variant="micro" accent style={{ marginTop: 4 }}>
                VS
              </T>
            </View>
            <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              {friend ? (
                <>
                  <Avatar name={friend.name} size={56} hue={friend.avatarHue} />
                  <T variant="bodySemi" numberOfLines={1}>
                    {friend.name}
                  </T>
                  <T variant="micro" muted>
                    Score {friend.score}
                  </T>
                </>
              ) : (
                <>
                  <View style={styles.ghost}>
                    <Icon name="person-add-outline" size={24} color={colors.textDim} />
                  </View>
                  <T variant="bodySemi" muted>
                    Any Friend
                  </T>
                  <T variant="micro" muted>
                    Share link
                  </T>
                </>
              )}
            </View>
          </Row>
          <T variant="small" dim center style={{ marginTop: spacing.md }}>
            &quot;{c.title}&quot; — the loser buys protein. 🤝
          </T>
        </View>

        <Button
          label={friend ? `Send Challenge to ${friend.name}` : 'Share Challenge via SMS / Link'}
          icon="paper-plane-outline"
          full
          size="lg"
          style={{ marginTop: spacing.lg }}
          onPress={sendChallenge}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
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
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  preview: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  ghost: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysLeftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  incomingHero: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  incomingBanner: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
