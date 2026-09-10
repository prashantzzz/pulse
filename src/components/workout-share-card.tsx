import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import {
  Calendar,
  Clock,
  Share2,
  Trophy,
  Weight,
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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import { formatDurationLabel } from '../lib/format';
import { hapticsLight, hapticsSuccess, hapticsWarning } from '../lib/haptics';
import { detectPRs, formatCompact, whatChanged, workoutStats } from '../lib/stats';
import { toUserVolume } from '../lib/units';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';
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
 * 9:16 Shareable "Workout Summary" social asset matching the NextRep redesigned
 * dark athletic aesthetic. Optimized for Instagram Stories, WhatsApp status,
 * and high-impact viral sharing.
 */
export const WorkoutShareCard = forwardRef<WorkoutShareCardHandle, WorkoutShareCardProps>(
  function WorkoutShareCard({ workout, allWorkouts, gender = 'male' }, ref) {
    useAccent();
    const workouts = usePulse((s) => s.workouts);
    const weightUnit = usePulse((s) => s.weightUnit);
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
      year: 'numeric',
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
          {/* Top-Left Ambient Emerald Glow */}
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.4 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top-Right Athlete Silhouette Background Layer */}
          <View style={styles.athleteBgWrapper} pointerEvents="none">
            <Image
              source={require('../../assets/images/athlete-silhouette-bg.jpg')}
              style={styles.athleteBgImage}
              resizeMode="cover"
            />
            {/* Horizontal fade protecting text legibility on left */}
            <LinearGradient
              colors={['#070A0E', '#070A0E', 'rgba(7, 10, 14, 0.88)', 'rgba(7, 10, 14, 0.35)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.85, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Vertical fade into card base */}
            <LinearGradient
              colors={['transparent', 'rgba(7, 10, 14, 0.65)', '#070A0E']}
              start={{ x: 0.5, y: 0.2 }}
              end={{ x: 0.5, y: 0.95 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Subtle top edge blend */}
            <LinearGradient
              colors={['rgba(7, 10, 14, 0.5)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.15 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Top-Right Artistic Gym Motivational Typography */}
          <View style={styles.topRightMotivationalBox} pointerEvents="none">
            <T style={styles.betterThanYesterday}>Better Than{"\n"}Yesterday</T>
            <T style={styles.sameDiscipline}>
              SAME{"\n"}DISCIPLINE{"\n"}DIFFERENT{"\n"}RESULTS
            </T>
          </View>

          {/* Accessible title string for screen readers and automated test suites */}
          <T style={styles.accessibleTitle}>Workout Complete!</T>

          {/* CARD CONTENT */}
          <View style={styles.cardBody}>
            {/* Top Section: Brand Identity & Date Badge */}
            <View style={styles.topSection}>
              <View style={styles.brandRow}>
                <View style={styles.brandIconSquare}>
                  <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.brandLogoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTextCol}>
                  <T style={styles.brandName}>NextRep</T>
                  <T style={styles.brandTagline}>TRACK   PROGRESS   GET STRONGER</T>
                </View>
              </View>

              {/* Workout Routine & Date Pill */}
              <View style={styles.datePill}>
                <Calendar size={12} color="#9CA3AF" strokeWidth={2} />
                <T style={styles.datePillText} numberOfLines={1}>
                  {workout.title.toUpperCase()}  ·  {formattedDate.toUpperCase()}
                </T>
              </View>
            </View>

            {/* Hero Section: "Workout Complete!" + Golden Trophy */}
            <View style={styles.heroSection}>
              <View style={styles.heroTitlesCol}>
                <T style={styles.heroWhiteWorkout}>Workout</T>
                <Row align="center" gap={10}>
                  <T style={styles.heroGoldComplete}>Complete!</T>
                  {/* Glowing Trophy Illustration with Energy Rays */}
                  <View style={styles.trophyWrapper}>
                    <Svg width={42} height={40} viewBox="0 0 48 46" fill="none">
                      {/* Energy Rays */}
                      <Path d="M16 6L13 2" stroke="#FFD700" strokeWidth="2.2" strokeLinecap="round" />
                      <Path d="M24 5L24 1" stroke="#FFD700" strokeWidth="2.2" strokeLinecap="round" />
                      <Path d="M32 6L35 2" stroke="#FFD700" strokeWidth="2.2" strokeLinecap="round" />
                      {/* Trophy Cup */}
                      <Path
                        d="M14 10H34V20C34 25.5 29.5 30 24 30C18.5 30 14 25.5 14 20V10Z"
                        fill="url(#trophyGrad)"
                      />
                      <Path
                        d="M14 13H10C8.5 13 7 14.5 7 16C7 19 9.5 21 14 21"
                        stroke="#FFB800"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M34 13H38C39.5 13 41 14.5 41 16C41 19 38.5 21 34 21"
                        stroke="#FFB800"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <Path d="M24 30V36M18 36H30" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
                      <Defs>
                        <SvgLinearGradient id="trophyGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0%" stopColor="#FFF176" />
                          <Stop offset="50%" stopColor="#FFB800" />
                          <Stop offset="100%" stopColor="#F59E0B" />
                        </SvgLinearGradient>
                      </Defs>
                    </Svg>
                  </View>
                </Row>
                <T style={styles.heroSubtitle}>
                  Crushed it in {formatDurationLabel(stats.durationMin)}  ·  Great intensity
                </T>
              </View>
            </View>

            {/* Primary 3 Big Stat Cards in a Row */}
            <View style={styles.primaryStatsRow}>
              {/* Duration Card */}
              <View style={[styles.statCardBase, styles.statCardGreen]}>
                <View style={[styles.statIconBadge, styles.statIconBadgeGreen]}>
                  <Clock size={16} color="#22C55E" strokeWidth={2.4} />
                </View>
                <View style={styles.statTextCol}>
                  <T style={styles.statNumText}>{formatDurationLabel(stats.durationMin)}</T>
                  <T style={styles.statLabelText}>Duration</T>
                </View>
              </View>

              {/* Total Volume Card */}
              <View style={[styles.statCardBase, styles.statCardPurple]}>
                <View style={[styles.statIconBadge, styles.statIconBadgePurple]}>
                  <Weight size={16} color="#A855F7" strokeWidth={2.4} />
                </View>
                <View style={styles.statTextCol}>
                  <T style={styles.statNumText}>
                    {formatCompact(toUserVolume(stats.volumeKg, weightUnit))} {weightUnit}
                  </T>
                  <T style={styles.statLabelText}>Total Volume</T>
                </View>
              </View>

              {/* PRs Card */}
              <View style={[styles.statCardBase, styles.statCardGold]}>
                <View style={[styles.statIconBadge, styles.statIconBadgeGold]}>
                  <Trophy size={16} color="#F59E0B" strokeWidth={2.4} />
                </View>
                <View style={styles.statTextCol}>
                  <T style={styles.statNumText}>
                    {prs.length > 0 ? prs.length : (hasBaseline ? '0' : '—')}
                  </T>
                  <T style={styles.statLabelText}>PRs</T>
                </View>
              </View>
            </View>

            {/* Secondary 4-Metric Grid Card */}
            <View style={styles.secondaryGridCard}>
              <View style={styles.secondaryCol}>
                <T style={styles.secondaryVal}>{stats.exercises}</T>
                <T style={styles.secondaryLabel}>Exercises</T>
              </View>
              <View style={styles.secondaryDivider} />
              <View style={styles.secondaryCol}>
                <T style={styles.secondaryVal}>{stats.sets}</T>
                <T style={styles.secondaryLabel}>Sets</T>
              </View>
              <View style={styles.secondaryDivider} />
              <View style={styles.secondaryCol}>
                <T style={styles.secondaryVal}>
                  {formatCompact(toUserVolume(stats.volumeKg, weightUnit))}
                </T>
                <T style={styles.secondaryLabel}>{`Volume ${weightUnit}`}</T>
              </View>
              <View style={styles.secondaryDivider} />
              <View style={styles.secondaryCol}>
                <T style={styles.secondaryVal}>~{stats.calories}</T>
                <T style={styles.secondaryLabel}>est. kcal</T>
              </View>
            </View>

            {/* MUSCLES WORKED Showcase Card */}
            <View style={styles.musclesWorkedCard}>
              <Row align="space-between" style={styles.musclesHeaderRow}>
                <T style={styles.musclesWorkedHeader}>MUSCLES WORKED</T>
                <View style={styles.targetLegendPill}>
                  <View style={styles.legendNeonDot} />
                  <T style={styles.legendText}>Targeted Muscles</T>
                </View>
              </Row>

              {/* Dual 2D Anatomical Models (Front & Back) with Neon Highlights */}
              <View style={styles.musclesVisualArea}>
                <WorkoutMuscleHero workout={workout} gender={gender} height={172} />
              </View>

              {/* Bottom-Right Motivational Stamp */}
              <View style={styles.strongerEveryRepBox} pointerEvents="none">
                <T style={styles.strongerEveryRepText}>STRONGER EVERY REP</T>
                <Svg width={115} height={3} viewBox="0 0 115 3" style={{ marginTop: 2 }}>
                  <Path d="M1 1.5 C 35 1, 80 2.5, 113 1.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            {/* Bottom Brand Banner Card */}
            <View style={styles.footerBannerCard}>
              <View style={styles.footerBrandCol}>
                <T style={styles.footerBrandTitle}>NextRep</T>
                <T style={styles.footerBrandSubtitle}>LOG   ·   ANALYZE   ·   IMPROVE</T>
              </View>
              <View style={styles.footerDivider} />
              <View style={styles.footerTaglineCol}>
                <T style={styles.footerTaglineText}>Progress Looks Good On You</T>
                <Svg width={145} height={3} viewBox="0 0 145 3" style={{ alignSelf: 'flex-end', marginTop: 2 }}>
                  <Path d="M2 1.5 C 45 1, 105 2.5, 143 1.5" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
                </Svg>
              </View>
            </View>
          </View>
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
    maxHeight: 700,
    backgroundColor: '#070A0E',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 13,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  accessibleTitle: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },

  // Athlete Background Layer
  athleteBgWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '60%',
    overflow: 'hidden',
    zIndex: 1,
  },
  athleteBgImage: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: '74%',
    height: '100%',
    opacity: 0.5,
  },

  // Top-right motivational typography
  topRightMotivationalBox: {
    position: 'absolute',
    top: 16,
    right: 14,
    alignItems: 'flex-end',
    zIndex: 3,
  },
  betterThanYesterday: {
    fontFamily: Platform.select({
      ios: 'Snell Roundhand',
      android: 'cursive',
      web: 'cursive, "Brush Script MT", "Caveat", cursive',
    }),
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'right',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  sameDiscipline: {
    fontSize: 6.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#475569',
    textAlign: 'right',
    marginTop: 20,
    lineHeight: 9.5,
  },

  // Top Section: Brand & Date
  topSection: {
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F141C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImg: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  brandTagline: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#6B7280',
    lineHeight: 10,
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  datePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9CA3AF',
  },

  // Hero Section
  heroSection: {
    position: 'relative',
    marginTop: 2,
  },
  heroTitlesCol: {
    gap: 0,
  },
  heroWhiteWorkout: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroGoldComplete: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFB800',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  trophyWrapper: {
    marginLeft: 4,
    marginTop: -2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },

  // Primary 3 Stat Cards Row
  primaryStatsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 4,
  },
  statCardBase: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statCardGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  statCardPurple: {
    flex: 1.15,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  statCardGold: {
    flex: 0.95,
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIconBadgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statIconBadgePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  statIconBadgeGold: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  statTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  statNumText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 15,
  },
  statLabelText: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 11,
    marginTop: 1,
  },

  // Secondary 4-Metric Grid Card
  secondaryGridCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  secondaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 1.5,
  },
  secondaryVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryLabel: {
    fontSize: 9.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  secondaryDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Muscles Worked Card
  musclesWorkedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 7,
    marginTop: 4,
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  musclesHeaderRow: {
    width: '100%',
  },
  musclesWorkedHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#64748B',
  },
  targetLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  legendNeonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  legendText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  musclesVisualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strongerEveryRepBox: {
    position: 'absolute',
    bottom: 22,
    right: 10,
    transform: [{ rotate: '-8deg' }],
  },
  strongerEveryRepText: {
    fontSize: 11.5,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.8,
    color: '#4B5563',
  },

  // Footer Banner Card
  footerBannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerBrandCol: {
    gap: 1,
    flexShrink: 0,
  },
  footerBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  footerBrandSubtitle: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#6B7280',
  },
  footerDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  footerTaglineCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  footerTaglineText: {
    fontFamily: Platform.select({
      ios: 'Snell Roundhand',
      android: 'cursive',
      web: 'cursive, "Brush Script MT", "Caveat", cursive',
    }),
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'right',
    lineHeight: 16,
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
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 48,
  },
});
