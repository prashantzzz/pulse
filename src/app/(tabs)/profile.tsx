import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ProgressRing } from '../../components/ring';
import { T } from '../../components/Text';
import { AchievementBadge, Avatar, toast } from '../../components/misc';
import { Button, Card, Icon, ProgressBar, Row, Screen, Section, Tag } from '../../components/ui';
import { EXERCISE_MAP } from '../../data/exercises';
import { computeAchievements } from '../../lib/achievements';
import { currentStreak, detectPRs, totalVolume, volumeByMuscle, workoutsInLastDays, workoutStats } from '../../lib/stats';
import { toUserVolume, formatUserWeightWithUnit } from '../../lib/units';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, layout, radius, spacing, useAccent } from '../../theme';
import { hapticsLight, hapticsSuccess, hapticsWarning } from '../../lib/haptics';
import { pickAndCropAvatar, pickRawAvatarImage, removeAvatarImage, uploadAvatarImage, type PickedImageResult } from '../../lib/storage';
import { AvatarCropModal } from '../../components/avatar-crop-modal';

export default function ProfileScreen() {
  useAccent();
  const router = useRouter();
  const profile = usePulse((s) => s.profile);
  const setProfile = usePulse((s) => s.setProfile);
  const user = useAuth((s) => s.user);
  const workouts = usePulse((s) => s.workouts);
  const plans = usePulse((s) => s.plans);
  const favorites = usePulse((s) => s.favorites);
  const measurements = usePulse((s) => s.measurements);
  const weightUnit = usePulse((s) => s.weightUnit);

  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);

  const handleSaveCroppedAvatar = async (picked: PickedImageResult) => {
    setUploading(true);
    try {
      const avatarUrl = await uploadAvatarImage(user?.id || 'me', picked);
      setProfile({ avatarUrl });
      hapticsSuccess();
      toast('Profile photo updated');
    } catch (err) {
      console.warn('Avatar update failed:', err);
      toast('Could not update avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickAvatar = async () => {
    hapticsLight();
    if (Platform.OS === 'web') {
      const rawUri = await pickRawAvatarImage();
      if (rawUri) {
        setCropImageUri(rawUri);
      }
    } else {
      const picked = await pickAndCropAvatar();
      if (picked) {
        await handleSaveCroppedAvatar(picked);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    hapticsWarning();
    setUploading(true);
    try {
      await removeAvatarImage(user?.id || 'me');
      setProfile({ avatarUrl: undefined });
      hapticsSuccess();
      toast('Profile photo removed');
      setPreviewOpen(false);
    } catch (err) {
      console.warn('Avatar removal failed:', err);
      toast('Could not remove avatar.');
    } finally {
      setUploading(false);
    }
  };

  const streak = currentStreak(workouts);
  const volume = totalVolume(workouts);
  const userVolume = toUserVolume(volume, weightUnit);
  const sets = workouts.reduce((s, w) => s + workoutStats(w).sets, 0);
  const monthWorkouts = workoutsInLastDays(workouts, 30);
  const monthVolume = totalVolume(monthWorkouts);
  const userMonthVolume = toUserVolume(monthVolume, weightUnit);
  const monthSets = monthWorkouts.reduce((s, w) => s + workoutStats(w).sets, 0);
  const monthlyTarget = Math.max(8, plans.length > 0 ? plans.length * 4 : 12);
  const monthProgress = Math.min(100, Math.round((monthWorkouts.length / monthlyTarget) * 100));
  const prCount = workouts.reduce((n, w) => n + detectPRs(w, workouts).length, 0);

  // exercise-based achievements, shared with the full gallery
  const achievements = computeAchievements(workouts, weightUnit);

  const byMuscle = volumeByMuscle(workouts, 60);
  const strongest = byMuscle[0];
  const weakest = byMuscle[byMuscle.length - 1];

  const latestWeight = measurements.length > 0
    ? measurements[measurements.length - 1].weightKg
    : (profile?.weightKg ?? null);
  const height = profile?.heightCm ?? null;
  const heightM = height ? height / 100 : null;
  const userBmi = heightM && heightM > 0.5 && latestWeight && latestWeight > 20
    ? Math.round((latestWeight / (heightM * heightM)) * 10) / 10
    : null;

  return (
    <Screen
      scroll
      onSwipeRight={() => router.push('/progress' as never)}
      contentStyle={{ paddingBottom: layout.tabContentBottomPad, paddingTop: layout.screenTopPad }}>
      {/* header */}
      <View style={styles.headerCard}>
        <LinearGradient colors={[accentTint(colors.accent, 0.15), '#0D0F12']} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerGlow, { backgroundColor: `${colors.accent}14` }]} />
        <Row align="space-between">
          <Pressable
            onPress={() => {
              hapticsLight();
              setPreviewOpen(true);
            }}
            style={({ pressed }) => [{ position: 'relative' }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="View profile photo">
            <Avatar
              name={profile?.name ?? 'Athlete'}
              uri={profile?.avatarUrl}
              size={64}
              hue={90}
              showRing={streak > 0}
            />
            <View style={[styles.avatarCameraBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="eye" size={11} color={colors.bg} />
            </View>
          </Pressable>
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
          <HeaderStat label="Total volume" value={`${(userVolume / 1000).toFixed(1)}k`} />
          <HeaderStat label="PRs" value={`${prCount}`} accent />
        </Row>
      </View>

      {/* body metrics & bmi */}
      <Section title="Body & Health Metrics" action={profile?.heightCm ? 'Update' : 'Set Up'} onAction={() => router.push('/measure' as never)}>
        {!profile?.heightCm ? (
          <Card style={{ padding: spacing.lg, gap: spacing.md }}>
            <Row gap={12} align="center">
              <View style={[styles.balanceIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="fitness-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">Set Up Your Body Baseline</T>
                <T variant="small" dim style={{ fontSize: 12 }}>
                  Add your height & weight to calculate your BMI and track body composition transformations.
                </T>
              </View>
            </Row>
            <Button
              label="Set Height & Weight"
              icon="add-outline"
              size="md"
              style={{ marginTop: 4 }}
              onPress={() => router.push('/measure' as never)}
            />
          </Card>
        ) : (
          <Card style={{ padding: spacing.lg, gap: spacing.md }}>
            <Row align="space-between">
              <View>
                <T variant="micro" muted>BODY MASS INDEX (BMI)</T>
                <Row align="center" gap={8} style={{ marginTop: 2 }}>
                  <T variant="h2" accent>{userBmi ?? '—'}</T>
                  {userBmi ? (
                    <View style={[styles.bmiBadge, {
                      backgroundColor: userBmi < 18.5 ? `${colors.cyan}1A` : userBmi < 25 ? `${colors.accent}1A` : userBmi < 30 ? `${colors.gold}1A` : `${colors.red}1A`,
                      borderColor: userBmi < 18.5 ? `${colors.cyan}44` : userBmi < 25 ? `${colors.accent}44` : userBmi < 30 ? `${colors.gold}44` : `${colors.red}44`,
                    }]}>
                      <T variant="smallSemi" style={{
                        color: userBmi < 18.5 ? colors.cyan : userBmi < 25 ? colors.accent : userBmi < 30 ? colors.gold : colors.red,
                        fontSize: 11,
                      }}>
                        {userBmi < 18.5 ? 'Underweight' : userBmi < 25 ? 'Normal / Healthy' : userBmi < 30 ? 'Overweight' : 'High BMI'}
                      </T>
                    </View>
                  ) : null}
                </Row>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="micro" muted>CURRENT WEIGHT</T>
                <T variant="bodySemi" style={{ marginTop: 2 }}>
                  {latestWeight != null
                    ? formatUserWeightWithUnit(latestWeight, weightUnit)
                    : '—'}
                </T>
              </View>
            </Row>

            {/* BMI spectrum meter */}
            <View style={{ marginTop: 4 }}>
              <View style={styles.bmiSpectrumTrack}>
                <View style={[styles.bmiSpectrumSegment, { backgroundColor: colors.cyan, flex: 18.5 }]} />
                <View style={[styles.bmiSpectrumSegment, { backgroundColor: colors.accent, flex: 6.5 }]} />
                <View style={[styles.bmiSpectrumSegment, { backgroundColor: colors.gold, flex: 5 }]} />
                <View style={[styles.bmiSpectrumSegment, { backgroundColor: colors.red, flex: 10 }]} />
              </View>
              {userBmi ? (
                <View style={[styles.bmiPointerWrap, { left: `${Math.max(5, Math.min(95, ((userBmi - 15) / 25) * 100))}%` }]}>
                  <View style={[styles.bmiPointer, { backgroundColor: colors.text }]} />
                </View>
              ) : null}
              <Row align="space-between" style={{ marginTop: 6 }}>
                <T variant="micro" muted>Under (18.5)</T>
                <T variant="micro" muted>Normal (25)</T>
                <T variant="micro" muted>Over (30)</T>
              </Row>
            </View>

            <Row align="space-between" style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: 4 }}>
              <View>
                <T variant="micro" muted>RECORDED HEIGHT</T>
                <T variant="smallSemi" style={{ marginTop: 2 }}>
                  {height != null
                    ? `${height} cm (${Math.floor(height / 30.48)}'${Math.round((height % 30.48) / 2.54)}")`
                    : '—'}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="micro" muted>LOGGED CHECK-INS</T>
                <T variant="smallSemi" style={{ marginTop: 2 }}>
                  {measurements.length} check-in{measurements.length === 1 ? '' : 's'}
                </T>
              </View>
            </Row>
          </Card>
        )}
      </Section>

      {/* monthly progress ring */}
      <Section title="This Month">
        <Card style={{ padding: spacing.lg }}>
          <Row align="space-between">
            <View style={{ flex: 1 }}>
              <T variant="label" dim>
                Monthly Volume
              </T>
              <T variant="numLg" style={{ marginTop: 4 }}>
                {userMonthVolume >= 1000 ? `${(userMonthVolume / 1000).toFixed(1)}k` : `${Math.round(userMonthVolume)}`}
              </T>
              <T variant="small" dim style={{ fontSize: 12, marginTop: 2 }}>
                {weightUnit} lifted · {monthSets} sets · {monthWorkouts.length} of {monthlyTarget} workouts
              </T>
            </View>
            <View style={{ width: 110, alignItems: 'center' }}>
              <ProgressRingBig value={monthProgress} />
              <T variant="micro" muted style={{ marginTop: 4, textAlign: 'center' }}>
                Monthly Goal
              </T>
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
                    {Math.round(toUserVolume(strongest.volume, weightUnit)).toLocaleString()} {weightUnit} volume
                  </T>
                </View>
              </Row>
            </Row>
          ) : null}
          {weakest && weakest.muscle !== strongest?.muscle ? (
            <Row align="space-between">
              <Row gap={12}>
                <View style={[styles.balanceIcon, { backgroundColor: colors.dangerSoft2 }]}>
                  <Icon name="alert-circle-outline" size={16} color={colors.orange} />
                </View>
                <View>
                  <T variant="bodySemi">Needs attention: {weakest.muscle}</T>
                  <T variant="small" dim style={{ fontSize: 12 }}>
                    {Math.round(toUserVolume(weakest.volume, weightUnit)).toLocaleString()} {weightUnit} volume — add a dedicated day
                  </T>
                </View>
              </Row>
            </Row>
          ) : null}
        </Card>
      </Section>

      {/* achievements */}
      <Section title="Achievements" action="View all" onAction={() => router.push('/achievements' as never)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {achievements.slice(0, 8).map((a) => (
            <AchievementBadge key={a.title} icon={a.icon} title={a.title} desc={a.desc} earned={a.earned} progress={a.progress} />
          ))}
        </View>
      </Section>

      {/* social */}
      <Section title="Social" style={{ marginBottom: 20 }}>
        <Card style={{ padding: spacing.md }}>
          <Pressable onPress={() => router.push('/leaderboard' as never)}>
            <Row align="space-between" style={{ paddingVertical: 6 }}>
              <Row gap={12}>
                <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="podium-outline" size={16} color={colors.accent} />
                </View>
                <T variant="bodySemi">Leaderboard</T>
              </Row>
              <Row gap={8}>
                <Tag label="Soon" color={colors.accent} bg={colors.accentSoft} />
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Row>
            </Row>
          </Pressable>
          <Pressable onPress={() => router.push('/challenge' as never)}>
            <Row align="space-between" style={{ paddingVertical: 6 }}>
              <Row gap={12}>
                <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="ribbon-outline" size={16} color={colors.accent} />
                </View>
                <T variant="bodySemi">Friend Challenges</T>
              </Row>
              <Row gap={8}>
                <Tag label="Soon" color={colors.accent} bg={colors.accentSoft} />
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Row>
            </Row>
          </Pressable>
          <Pressable onPress={() => router.push('/achievements' as never)}>
            <Row align="space-between" style={{ paddingVertical: 6 }}>
              <Row gap={12}>
                <View style={[styles.favIcon, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="medal-outline" size={16} color={colors.accent} />
                </View>
                <T variant="bodySemi">Achievements</T>
              </Row>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Row>
          </Pressable>
        </Card>
      </Section>

      {/* Profile Photo Preview & Edit Modal */}
      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewOpen(false)} />
          <View style={[styles.modalCard, { borderColor: `${colors.accent}40` }]}>
            <Row align="space-between" style={{ width: '100%', marginBottom: spacing.sm }}>
              <T variant="h3">Profile Photo</T>
              <Pressable
                onPress={() => setPreviewOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close photo preview">
                <Ionicons name="close" size={20} color={colors.textDim} />
              </Pressable>
            </Row>

            <View style={{ position: 'relative', marginVertical: spacing.lg, alignItems: 'center' }}>
              <Avatar
                name={profile?.name ?? 'Athlete'}
                uri={profile?.avatarUrl}
                size={180}
                hue={90}
                showRing
              />
              {uploading ? (
                <View style={[styles.avatarLoadingOverlay, { borderRadius: 90 }]}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : null}
            </View>

            <T variant="bodySemi" center style={{ fontSize: 17 }}>
              {profile?.name ?? 'Athlete'}
            </T>
            <T variant="micro" muted center style={{ marginBottom: spacing.xl, marginTop: 4 }}>
              {profile?.avatarUrl ? 'Photo synced with your account' : 'Default initials avatar'}
            </T>

            <View style={{ width: '100%', gap: spacing.sm }}>
              <Button
                label={uploading ? 'Updating Photo...' : 'Change Photo'}
                icon="camera-outline"
                disabled={uploading}
                full
                onPress={async () => {
                  await handlePickAvatar();
                }}
              />
              {profile?.avatarUrl ? (
                <Button
                  label="Remove Photo"
                  variant="ghost"
                  icon="trash-outline"
                  disabled={uploading}
                  full
                  onPress={handleRemoveAvatar}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Avatar Crop Modal for Web & In-App Cropping */}
      <AvatarCropModal
        visible={!!cropImageUri}
        imageUri={cropImageUri}
        onCrop={handleSaveCroppedAvatar}
        onClose={() => setCropImageUri(null)}
      />
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
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  bmiSpectrumTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
  },
  bmiSpectrumSegment: {
    height: '100%',
  },
  bmiPointerWrap: {
    position: 'relative',
    marginTop: -2,
    marginLeft: -4,
  },
  bmiPointer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface2,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
