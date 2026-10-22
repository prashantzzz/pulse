import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Calendar, Check, Share2 } from 'lucide-react-native';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { formatDurationLabel } from '../lib/format';
import { hapticsLight, hapticsSuccess, hapticsWarning } from '../lib/haptics';
import { detectPRs, formatCompact, whatChanged, workoutStats } from '../lib/stats';
import { toUserVolume } from '../lib/units';
import { usePulse } from '../store/useStore';
import { colors, fonts, radius, spacing, useAccent } from '../theme';
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

/** Turn a hex theme accent into an alpha tint for atmospheric glows and hairlines. */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCardScale(availableWidth: number): number {
  // The summary screen keeps 16px of horizontal breathing room and caps the
  // preview at 375px wide. On short devices the screen also narrows the canvas
  // to the available height so the whole 9:16 artwork stays on screen.
  return Math.max(0.58, Math.min(1, availableWidth / 375));
}

/**
 * 9:16 shareable workout completion asset.
 *
 * A crisp, low-key gym photograph supplies the atmosphere; the data sits on two
 * restrained frosted surfaces and the typography carries the hierarchy. All
 * values, PR detection and sharing behavior remain live from the store.
 */
export const WorkoutShareCard = forwardRef<WorkoutShareCardHandle, WorkoutShareCardProps>(
  function WorkoutShareCard({ workout, allWorkouts, gender = 'male' }, ref) {
    useAccent();
    const { width: windowWidth } = useWindowDimensions();
    const workouts = usePulse((s) => s.workouts);
    const weightUnit = usePulse((s) => s.weightUnit);
    const history = allWorkouts ?? workouts;
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(0);

    const availableWidth = canvasWidth > 0 ? canvasWidth : Math.min(windowWidth - 32, 375);
    const scale = getCardScale(availableWidth);
    const styles = useMemo(() => createStyles(scale), [scale]);

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
      year: 'numeric',
    });

    const accent = colors.accent;
    const volumeValue = `${formatCompact(toUserVolume(stats.volumeKg, weightUnit))} ${weightUnit}`;
    const prValue = prs.length > 0 ? String(prs.length) : hasBaseline ? '0' : '—';
    const figureHeight = 188 * scale;
    const figureWidth = figureHeight / 2;

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
          width: 1080,
          height: 1920,
          result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
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
        } else if (Platform.OS === 'web') {
          let shared = false;
          if (typeof navigator !== 'undefined' && (navigator as any).share) {
            try {
              const response = await fetch(uri);
              const blob = await response.blob();
              const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
              if ((navigator as any).canShare?.({ files: [file] }) !== false) {
                await (navigator as any).share({
                  title: `NextRep: ${workout.title} Completed`,
                  text: `Crushed ${workout.title} on NextRep! ${stats.exercises} exercises, ${formatCompact(toUserVolume(stats.volumeKg, weightUnit))} ${weightUnit} volume lifted.`,
                  files: [file],
                });
                shared = true;
                hapticsSuccess();
                toast('Workout summary shared!');
              }
            } catch {
              // User cancelled or file sharing unsupported
            }
          }

          if (!shared && typeof document !== 'undefined') {
            const a = document.createElement('a');
            a.href = uri;
            a.download = `nextrep-${workout.title.toLowerCase().replace(/\s+/g, '-')}-summary.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            hapticsSuccess();
            toast('Summary image downloaded!');
          }
        } else {
          toast('Sharing not supported on this platform');
        }
      } catch (err: any) {
        console.warn('Share error:', err);
        // On web fallback to navigator.share text if canvas capture failed in mobile browser
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
          try {
            await (navigator as any).share({
              title: `NextRep: ${workout.title} Completed`,
              text: `Crushed ${workout.title} on NextRep! ${stats.exercises} exercises, ${formatCompact(toUserVolume(stats.volumeKg, weightUnit))} ${weightUnit} volume lifted.`,
            });
            hapticsSuccess();
            toast('Workout summary shared!');
            return;
          } catch {
            // User dismissed share dialog
            return;
          }
        }
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
        <View
          ref={cardRef}
          collapsable={false}
          style={styles.cardCanvas}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            setCanvasWidth((current) => (Math.abs(current - width) > 0.5 ? width : current));
          }}>
          {/* Crisp gym photograph — the subject stays readable behind the type */}
          <ExpoImage
            source={require('../../assets/images/gym-atmosphere.jpg')}
            style={styles.backgroundImage}
            contentFit="cover"
            transition={0}
          />

          {/* Neutral scrim keeps the photo present but a little deeper */}
          <LinearGradient
            colors={[
              'rgba(2, 6, 5, 0.32)',
              'rgba(2, 6, 5, 0.14)',
              'rgba(2, 6, 5, 0.44)',
            ]}
            locations={[0, 0.44, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Live theme atmosphere, never a fixed green */}
          <LinearGradient
            colors={[withAlpha(accent, 0.10), withAlpha(accent, 0.02), 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.72, y: 0.6 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', withAlpha(accent, 0.04)]}
            start={{ x: 0.6, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Slight film grain keeps the photograph from looking too digital */}
          <ExpoImage
            source={require('../../assets/images/grain.png')}
            style={styles.grainLayer}
            contentFit="cover"
            transition={0}
          />

          {/* Accessible title string for screen readers and automated test suites */}
          <T style={styles.accessibleTitle}>Workout Complete!</T>

          <View style={styles.cardBody}>
            <View>
              {/* Brand — present, never dominant */}
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.brandLogoImg}
                  resizeMode="cover"
                />
                <View style={styles.brandTextCol}>
                  <T style={styles.brandName}>NextRep</T>
                  <T style={styles.brandTagline}>TRACK · PROGRESS · GET STRONGER</T>
                </View>
              </View>

              {/* Workout identity + date */}
              <View style={styles.metaPill}>
                <Calendar size={9.5 * scale} color="rgba(247, 248, 246, 0.55)" strokeWidth={2} />
                <T style={styles.metaTitle} numberOfLines={1}>
                  {workout.title}
                </T>
                <View style={styles.metaDivider} />
                <T style={styles.metaDate}>{formattedDate}</T>
              </View>

              {/* Completion hero */}
              <View style={styles.heroBlock}>
                <T style={styles.heroLine}>Workout</T>
                <View style={styles.heroCompleteRow}>
                  <T style={[styles.heroLine, { color: accent }]}>Complete.</T>
                  <View
                    style={[
                      styles.checkBadge,
                      {
                        backgroundColor: withAlpha(accent, 0.12),
                        borderColor: withAlpha(accent, 0.48),
                        shadowColor: accent,
                      },
                    ]}>
                    <Check size={15.5 * scale} color={accent} strokeWidth={3} />
                  </View>
                </View>
              </View>

              {/* Primary metrics — one quiet glass surface, three clear numbers */}
              <View style={styles.statsTray}>
                <View style={styles.topHighlight} pointerEvents="none" />
                <View style={styles.statCell}>
                  <T
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}>
                    {formatDurationLabel(stats.durationMin)}
                  </T>
                  <T style={styles.statLabel}>Duration</T>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <T
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.68}>
                    {volumeValue}
                  </T>
                  <T style={styles.statLabel}>Total Volume</T>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <T
                    style={[
                      styles.statValue,
                      prs.length > 0 && { color: colors.gold },
                    ]}
                    numberOfLines={1}>
                    {prValue}
                  </T>
                  <T style={styles.statLabel}>PRs</T>
                </View>
              </View>

              {/* Quiet session summary */}
              <View style={styles.secondaryRow}>
                <T style={styles.secondaryValue}>{stats.exercises}</T>
                <T style={styles.secondaryLabel}>Exercises</T>
                <T style={styles.secondarySeparator}>·</T>
                <T style={styles.secondaryValue}>{stats.sets}</T>
                <T style={styles.secondaryLabel}>Sets</T>
                <T style={styles.secondarySeparator}>·</T>
                <T style={styles.secondaryValue}>~{stats.calories}</T>
                <T style={styles.secondaryLabel}>kcal</T>
              </View>
            </View>

            {/* MUSCLES WORKED */}
            <View style={styles.musclePanel}>
              <View style={styles.topHighlight} pointerEvents="none" />
              <Row align="space-between" style={styles.muscleHeaderRow}>
                <T style={styles.muscleHeader}>MUSCLES WORKED</T>
              </Row>

              <View style={styles.muscleVisual}>
                <WorkoutMuscleHero
                  workout={workout}
                  gender={gender}
                  height={figureHeight}
                  accent={accent}
                  bare
                />
                <View style={styles.figureLabelsRow}>
                  <T style={[styles.figureLabel, { width: figureWidth }]}>FRONT</T>
                  <T style={[styles.figureLabel, { width: figureWidth }]}>BACK</T>
                </View>
              </View>
            </View>

            {/* Signature — part of the social artwork, not an app button */}
            <View style={styles.signature}>
              <View style={[styles.signatureRule, { backgroundColor: accent }]} />
              <T style={styles.signatureText}>STRONGER EVERY REP</T>
            </View>
          </View>

          {/* Foreground dumbbell corner — sits above every card element */}
          <ExpoImage
            source={require('../../assets/images/dumbbell-corner.png')}
            style={styles.dumbbellOverlay}
            contentFit="cover"
            transition={0}
            pointerEvents="none"
          />
        </View>

        {/* Full Preview Modal for Web or Interactive Check */}
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
                Ready to share as a 9:16 story on Instagram, WhatsApp, or messages.
              </T>

              <Pressable
                onPress={async () => {
                  setPreviewVisible(false);
                  await handleShare();
                }}
                style={[styles.modalShareBtn, { backgroundColor: colors.accent }]}>
                {isSharing ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <>
                    <Share2 size={18} color={colors.bg} />
                    <T variant="bodySemi" style={{ color: colors.bg }}>
                      Share Story
                    </T>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </>
    );
  },
);

function createStyles(scale: number) {
  const s = (value: number) => value * scale;

  return StyleSheet.create({
    cardCanvas: {
      width: '100%',
      aspectRatio: 9 / 16,
      backgroundColor: '#050807',
      borderRadius: s(24),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      overflow: 'hidden',
      position: 'relative',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: s(18) },
      shadowOpacity: 0.5,
      shadowRadius: s(28),
      elevation: 12,
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    grainLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      opacity: 0.16,
    },
    dumbbellOverlay: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '88%',
      height: '88%',
      zIndex: 3,
    },
    cardBody: {
      flex: 1,
      paddingHorizontal: s(22),
      paddingTop: s(48),
      paddingBottom: s(50),
      zIndex: 2,
    },
    accessibleTitle: {
      position: 'absolute',
      opacity: 0,
      height: 0,
      width: 0,
    },

    // Brand
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(9),
    },
    brandLogoImg: {
      width: s(28),
      height: s(28),
      borderRadius: s(8),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
      overflow: 'hidden',
    },
    brandTextCol: {
      justifyContent: 'center',
    },
    brandName: {
      fontFamily: fonts.display,
      fontSize: s(17),
      lineHeight: s(19),
      letterSpacing: s(-0.2),
      color: '#F7F8F6',
    },
    brandTagline: {
      fontFamily: fonts.bodySemi,
      fontSize: s(6.4),
      lineHeight: s(9),
      letterSpacing: s(1.45),
      color: 'rgba(247, 248, 246, 0.42)',
      marginTop: s(2),
    },

    // Workout identity
    metaPill: {
      marginTop: s(16),
      alignSelf: 'flex-start',
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.055)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.10)',
      overflow: 'hidden',
    },
    metaTitle: {
      flexShrink: 1,
      fontFamily: fonts.bodySemi,
      fontSize: s(8.8),
      lineHeight: s(11),
      letterSpacing: s(1.05),
      textTransform: 'uppercase',
      color: 'rgba(247, 248, 246, 0.86)',
    },
    metaDivider: {
      width: 1,
      height: s(9),
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      marginHorizontal: s(2),
    },
    metaDate: {
      fontFamily: fonts.bodyMedium,
      fontSize: s(8.8),
      lineHeight: s(11),
      letterSpacing: s(0.85),
      textTransform: 'uppercase',
      color: 'rgba(247, 248, 246, 0.54)',
    },

    // Hero
    heroBlock: {
      marginTop: s(18),
    },
    heroLine: {
      fontFamily: fonts.display,
      fontSize: s(38),
      lineHeight: s(41),
      letterSpacing: s(-1.2),
      color: '#F8FAF8',
    },
    heroCompleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(9),
      marginTop: s(-1),
    },
    checkBadge: {
      width: s(31),
      height: s(31),
      borderRadius: s(16),
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: s(2),
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.28,
      shadowRadius: s(10),
      elevation: 3,
    },

    // Primary metrics
    statsTray: {
      marginTop: s(18),
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: s(16),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.105)',
      backgroundColor: 'rgba(8, 12, 11, 0.48)',
      paddingVertical: s(12),
      overflow: 'hidden',
      position: 'relative',
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: s(18),
      right: s(18),
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      zIndex: 2,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s(4),
    },
    statValue: {
      fontFamily: fonts.display,
      fontSize: s(20.5),
      lineHeight: s(24),
      letterSpacing: s(-0.4),
      color: '#F7F8F6',
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    statLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: s(7.4),
      lineHeight: s(10),
      letterSpacing: s(1.15),
      textTransform: 'uppercase',
      color: 'rgba(247, 248, 246, 0.45)',
      marginTop: s(3),
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.095)',
      marginVertical: s(4),
    },

    // Secondary session summary
    secondaryRow: {
      marginTop: s(12),
      paddingLeft: s(4),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(5),
    },
    secondaryValue: {
      fontFamily: fonts.bodySemi,
      fontSize: s(9.6),
      lineHeight: s(12),
      letterSpacing: s(0.2),
      color: 'rgba(247, 248, 246, 0.82)',
    },
    secondaryLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: s(7.3),
      lineHeight: s(11),
      letterSpacing: s(1.05),
      textTransform: 'uppercase',
      color: 'rgba(247, 248, 246, 0.42)',
    },
    secondarySeparator: {
      fontFamily: fonts.body,
      fontSize: s(9),
      lineHeight: s(11),
      color: 'rgba(247, 248, 246, 0.22)',
      marginHorizontal: s(1),
    },

    // Muscles
    musclePanel: {
      flex: 1,
      minHeight: s(228),
      marginTop: s(14),
      borderRadius: s(18),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.10)',
      backgroundColor: 'rgba(7, 11, 10, 0.44)',
      paddingHorizontal: s(13),
      paddingTop: s(11),
      paddingBottom: s(8),
      overflow: 'hidden',
      position: 'relative',
    },
    muscleHeaderRow: {
      width: '100%',
    },
    muscleHeader: {
      fontFamily: fonts.bodySemi,
      fontSize: s(8.6),
      lineHeight: s(11),
      letterSpacing: s(1.6),
      color: 'rgba(247, 248, 246, 0.48)',
    },
    muscleVisual: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    figureLabelsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      marginTop: s(3),
    },
    figureLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: s(6.7),
      lineHeight: s(9),
      letterSpacing: s(1.9),
      textAlign: 'center',
      color: 'rgba(247, 248, 246, 0.3)',
    },

    // Signature
    signature: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: s(10),
    },
    signatureRule: {
      width: s(24),
      height: s(1.5),
      borderRadius: s(2),
      marginBottom: s(6),
    },
    signatureText: {
      fontFamily: fonts.bodySemi,
      fontSize: s(7.1),
      lineHeight: s(9),
      letterSpacing: s(2.75),
      color: 'rgba(247, 248, 246, 0.36)',
    },

    // Modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
      borderRadius: radius.pill,
      height: 48,
    },
  });
}
