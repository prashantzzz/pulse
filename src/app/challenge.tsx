import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { Avatar, toast } from '../components/misc';
import { Button, Icon, Row, Screen, ScreenHeader, type IonName } from '../components/ui';
import { usePulse } from '../store/useStore';
import { accentTint, colors, gradients, radius, spacing, useAccent } from '../theme';

const CHALLENGES: { icon: IonName; title: string; desc: string; grad: keyof typeof gradients }[] = [
  { icon: 'barbell-outline', title: 'Most workouts this week', desc: 'Who trains more? Winner takes the streak crown.', grad: 'accent' },
  { icon: 'trending-up-outline', title: 'Biggest Bench improvement', desc: 'Most kg added to bench press in 2 weeks.', grad: 'emerald' },
  { icon: 'flame-outline', title: 'Longest streak', desc: 'Most consecutive training days. No breaks allowed.', grad: 'orange' },
  { icon: 'calendar-outline', title: 'Most consistent', desc: 'Best attendance over 14 days.', grad: 'teal' },
];

export default function ChallengeScreen() {
  useAccent();
  const friends = usePulse((s) => s.friends);
  const [challenge, setChallenge] = useState(0);
  const [friendId, setFriendId] = useState<string | null>(null);

  const c = CHALLENGES[challenge];
  const friend = friends.find((f) => f.id === friendId);

  return (
    <Screen scroll>
      <ScreenHeader title="Friend Challenge" subtitle="Turn training into friendly rivalry" back />

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
          Pick your rival
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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
                  <View style={styles.ghost} />
                  <T variant="bodySemi" muted>
                    Pick someone
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
          label={friend ? `Send Challenge to ${friend.name}` : 'Choose a friend first'}
          icon="paper-plane-outline"
          full
          size="lg"
          disabled={!friend}
          style={{ marginTop: spacing.lg }}
          onPress={() => toast('Challenge sent! They have 7 days.')}
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
  },
});
