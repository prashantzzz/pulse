import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import {
  Clock,
  Dumbbell,
  Flame,
  Sparkles,
  Trophy,
  Weight,
  Zap,
  Activity,
  Footprints,
  Share2,
} from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { formatDurationLabel } from '../lib/format';
import { hapticsLight, hapticsSuccess, hapticsWarning } from '../lib/haptics';
import { detectPRs, formatCompact, whatChanged, workoutStats } from '../lib/stats';
import { usePulse } from '../store/useStore';
import { accentTint, colors, radius, spacing, useAccent } from '../theme';
import type { Workout } from '../types';
import { WorkoutMuscleHero } from './workout-muscle-hero';
import { toast } from './misc';
import { T } from './Text';
import { Row } from './ui';

export interface WorkoutShareCardHandle {
  share: () => Promise<void>;
  openPreview: () => void;
}

export interface WorkoutShareCardProps {
  workout: Workout;
  allWorkouts?: Workout[];
  gender?: 'male' | 'female';
}

/**
 * 9:16 Shareable "Workout Summary" card optimized for Instagram Stories,
 * WhatsApp status, and direct chats.
 * Acts as a viral marketing asset with NextRep branding, celebratory header,
 * core metrics, and side-by-side 2D muscle activation visual.
 */
export const WorkoutShareCard = forwardRef<WorkoutShareCardHandle, WorkoutShareCardProps>(
  function WorkoutShareCard({ workout, allWorkouts, gender = 'male' }, ref) {
    useAccent();
    const workouts = usePulse((s) => s.workouts);
    const history = allWorkouts ?? workouts;
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);

    const stats = workoutStats(workout);
    const prs = detectPRs(workout, history);
    const prevEquivalent = [...history]
      .reverse()
      .find((w) => w.title === workout.title && w.id !== workout.id);
    const changed = prevEquivalent ? whatChanged(workout, prevEquivalent) : null;
    const prevStats = prevEquivalent ? workoutStats(prevEquivalent) : null;
    const hasBaseline = prevStats != null && prevStats.sets > 0;

    const formattedDate = new Date(workout.startTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const handleShare = async () => {
      if (isSharing) return;
      setIsSharing(true);
      hapticsLight();

      try {
        if (!cardRef.current) {
          throw new Error('Card view reference not available');
        }

        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${workout.title} Summary`,
            UTI: 'public.png',
          });
          hapticsSuccess();
          toast('Workout summary shared!');
        } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
          // Web Share API fallback
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
            await (navigator as any).share({
              title: `NextRep: ${workout.title} Completed`,
              text: `Crushed ${workout.title} on NextRep! ${stats.exercises} exercises, ${formatCompact(stats.volumeKg)} kg volume lifted.`,
              files: [file],
            });
            hapticsSuccess();
          } catch {
            // User cancelled or file sharing unsupported
            toast('Summary ready for download');
          }
        } else {
          toast('Sharing not supported on this platform');
        }
      } catch (err: any) {
        console.warn('Share error:', err);
        hapticsWarning();
        toast('Could not generate share image');
      } finally {
        setIsSharing(false);
      }
    };

    useImperativeHandle(ref, () => ({
      share: handleShare,
      openPreview: () => setPreviewVisible(true),
    }));

    return (
      <>
        {/* Renderable 9:16 Canvas Card */}
        <View ref={cardRef} collapsable={false} style={styles.cardCanvas}>
          {/* Ambient dynamic gradient wash */}
          <LinearGradient
            colors={[accentTint(colors.accent, 0.22), 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.45 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Background gym doodles for athletic aesthetic */}
          <View style={styles.doodleLayer} pointerEvents="none">
            <View style={[styles.doodle, { top: '3%', left: '6%', transform: [{ rotate: '-15deg' }] }]}>
              <Dumbbell size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '4%', left: '50%', transform: [{ rotate: '12deg' }] }]}>
              <Zap size={16} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '15%', left: '88%', transform: [{ rotate: '-12deg' }] }]}>
              <Flame size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '25%', left: '4%', transform: [{ rotate: '16deg' }] }]}>
              <Activity size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '38%', left: '90%', transform: [{ rotate: '-18deg' }] }]}>
              <Weight size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '60%', left: '5%', transform: [{ rotate: '-10deg' }] }]}>
              <Footprints size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '65%', left: '88%', transform: [{ rotate: '15deg' }] }]}>
              <Trophy size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '82%', left: '8%', transform: [{ rotate: '12deg' }] }]}>
              <Zap size={16} color={colors.accent} strokeWidth={1.4} />
            </View>
            <View style={[styles.doodle, { top: '85%', left: '86%', transform: [{ rotate: '-14deg' }] }]}>
              <Dumbbell size={18} color={colors.accent} strokeWidth={1.4} />
            </View>
          </View>

          {/* CARD CONTENT (Strictly fits without scroll) */}
          <View style={styles.cardBody}>
            {/* Top Bar: Subtitle on Left, NextRep Brand Badge on Top Right */}
            <Row align="space-between" style={styles.topBar}>
              <View style={styles.titleInfo}>
                <T variant="micro" muted numberOfLines={1}>
                  {workout.title.toUpperCase()} · {formattedDate}
                </T>
              </View>

              {/* Small Top-Right NextRep Branding Asset */}
              <View style={styles.brandBadge}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <T variant="smallSemi" style={styles.brandText}>
                  NextRep
                </T>
              </View>
            </Row>

            {/* Header: Celebratory Title + Trophy Icon in same row */}
            <Row align="space-between" style={styles.headerSection}>
              <View style={{ flex: 1 }}>
                <Row gap={8} align="center">
                  <T variant="h2" style={styles.celebrateTitle}>
                    Workout Complete!
                  </T>
                  <LinearGradient
                    colors={['#FFD700', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.trophyIconBox}>
                    <Trophy size={16} color="#1A1500" strokeWidth={2.4} />
                  </LinearGradient>
                </Row>
                <T variant="small" dim style={styles.headerSubtitle}>
                  Crushed in {formatDurationLabel(stats.durationMin)} · Great intensity
                </T>
              </View>
            </Row>

            {/* Quick Core Stats Bar */}
            <Row gap={8} style={styles.coreStatsRow}>
              <View style={styles.coreStatChip}>
                <Clock size={13} color={colors.accent} strokeWidth={2} />
                <T variant="smallSemi" style={styles.coreStatText}>
                  {formatDurationLabel(stats.durationMin)}
                </T>
              </View>

              <View style={styles.coreStatChip}>
                <Weight size={13} color={colors.accent} strokeWidth={2} />
                <T variant="smallSemi" style={styles.coreStatText}>
                  {formatCompact(stats.volumeKg)} kg
                </T>
              </View>

              <View style={[styles.coreStatChip, prs.length > 0 && styles.prChipActive]}>
                <Trophy size={13} color={prs.length > 0 ? '#FFD700' : colors.textDim} strokeWidth={2} />
                <T
                  variant="smallSemi"
                  style={[styles.coreStatText, prs.length > 0 && { color: '#FFD700' }]}>
                  {prs.length > 0 ? `${prs.length} PR${prs.length === 1 ? '' : 's'}` : 'Target Hit'}
                </T>
              </View>
            </Row>

            {/* Summarized Info Card */}
            <View style={styles.summaryCard}>
              <Row align="space-between" style={styles.metricGrid}>
                <View style={styles.metricCol}>
                  <T variant="numSm" style={styles.metricNum}>
                    {stats.exercises}
                  </T>
                  <T variant="micro" muted>
                    Exercises
                  </T>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCol}>
                  <T variant="numSm" style={styles.metricNum}>
                    {stats.sets}
                  </T>
                  <T variant="micro" muted>
                    Sets
                  </T>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCol}>
                  <T variant="numSm" style={[styles.metricNum, { color: colors.accent }]}>
                    {formatCompact(stats.volumeKg)}
                  </T>
                  <T variant="micro" muted>
                    Volume kg
                  </T>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCol}>
                  <T variant="numSm" style={styles.metricNum}>
                    ~{stats.calories}
                  </T>
                  <T variant="micro" muted>
                    est. kcal
                  </T>
                </View>
              </Row>

              {/* What changed? vs last session */}
              {changed && prevEquivalent && hasBaseline ? (
                <View style={styles.deltaBox}>
                  <Row align="space-between" style={{ marginBottom: 4 }}>
                    <T variant="micro" muted style={{ fontWeight: '600' }}>
                      What changed? vs last session
                    </T>
                  </Row>
                  <Row align="space-between">
                    <Row gap={3}>
                      <T variant="micro" muted>
                        Vol:
                      </T>
                      <T
                        variant="micro"
                        style={{
                          color: changed.volumePct >= 0 ? colors.accent : colors.red,
                          fontWeight: '700',
                        }}>
                        {changed.volumePct > 0 ? '+' : ''}
                        {changed.volumePct}%
                      </T>
                    </Row>
                    <Row gap={3}>
                      <T variant="micro" muted>
                        Reps:
                      </T>
                      <T
                        variant="micro"
                        style={{
                          color: changed.repsDelta >= 0 ? colors.accent : colors.red,
                          fontWeight: '700',
                        }}>
                        {changed.repsDelta > 0 ? '+' : ''}
                        {changed.repsDelta}
                      </T>
                    </Row>
                    <Row gap={3}>
                      <T variant="micro" muted>
                        Avg wt:
                      </T>
                      <T
                        variant="micro"
                        style={{
                          color: changed.avgWeightDelta >= 0 ? colors.accent : colors.red,
                          fontWeight: '700',
                        }}>
                        {changed.avgWeightDelta > 0 ? '+' : ''}
                        {changed.avgWeightDelta} kg
                      </T>
                    </Row>
                  </Row>
                </View>
              ) : null}
            </View>

            {/* HERO SECTION: Muscle Activation Visual */}
            <View style={styles.heroSection}>
              <WorkoutMuscleHero workout={workout} gender={gender} height={190} />
            </View>

            {/* Card Bottom Viral Branding Watermark */}
            <Row align="space-between" style={styles.footerBranding}>
              <Row gap={5} align="center">
                <Sparkles size={12} color={colors.accent} />
                <T variant="micro" muted style={{ letterSpacing: 0.4 }}>
                  Tracked on NextRep
                </T>
              </Row>
              <T variant="micro" style={{ color: colors.accent, fontWeight: '600', letterSpacing: 0.5 }}>
                #NextRep
              </T>
            </Row>
          </View>
        </View>

        {/* Optional Full Preview Modal */}
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Row align="space-between" style={{ marginBottom: spacing.md }}>
                <T variant="h3">Share Summary</T>
                <Pressable onPress={() => setPreviewVisible(false)} hitSlop={10}>
                  <T variant="bodySemi" dim>
                    Close
                  </T>
                </Pressable>
              </Row>

              <T variant="small" dim style={{ marginBottom: spacing.lg }}>
                Ready to share as 9:16 story on Instagram, WhatsApp, or messages.
              </T>

              <Pressable
                onPress={async () => {
                  setPreviewVisible(false);
                  await handleShare();
                }}
                style={styles.modalShareBtn}>
                <Share2 size={18} color={colors.bg} />
                <T variant="bodySemi" style={{ color: colors.bg }}>
                  Share Story
                </T>
              </Pressable>
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  cardCanvas: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 640,
    backgroundColor: '#0C0F14',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  doodleLayer: {
    ...(StyleSheet.absoluteFill as object),
    overflow: 'hidden',
  },
  doodle: {
    position: 'absolute',
    opacity: 0.1,
  },
  topBar: {
    marginBottom: 6,
  },
  titleInfo: {
    flex: 1,
    paddingRight: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandLogo: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
  },
  headerSection: {
    marginBottom: 8,
  },
  celebrateTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  trophyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  coreStatsRow: {
    marginBottom: 10,
  },
  coreStatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  prChipActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  coreStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 4,
  },
  metricGrid: {
    paddingVertical: 2,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  metricNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  deltaBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  footerBranding: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 48,
  },
});
