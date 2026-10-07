import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sparkline } from '../charts';
import { BottomSheet, EmptyState } from '../misc';
import { ExerciseThumb } from '../muscle-icon';
import { T } from '../Text';
import { Row, Tag } from '../ui';
import { EXERCISE_MAP } from '../../data/exercises';
import {
  buildRecords,
  monthlyBestE1rm,
  monthlyPrCounts,
  recordsSummary,
  RECORD_SORT_LABELS,
  RECORD_SORTS,
  sortRecords,
  type RecordSort,
} from '../../lib/records';
import { formatUserWeightWithUnit } from '../../lib/units';
import { usePulse } from '../../store/useStore';
import { colors, radius, spacing, useAccent } from '../../theme';
import type { Workout } from '../../types';

const CHART_MONTHS = 6;
/** Gold / silver / bronze for the podium ranks; later ranks stay neutral. */
const RANK_TINTS = [colors.gold, '#C7CED8', colors.orange];

/**
 * Records tab: the user's strongest lifts — manual PRs + workout bests, ranked
 * by estimated 1RM. Every number is derived from real history (lib/records.ts).
 */
export function RecordsView({ workouts }: { workouts: Workout[] }) {
  useAccent();
  const router = useRouter();
  const manualPRs = usePulse((s) => s.manualPRs);
  const weightUnit = usePulse((s) => s.weightUnit);
  const [sort, setSort] = useState<RecordSort>('e1rm');
  const [sortOpen, setSortOpen] = useState(false);

  const records = useMemo(() => buildRecords(workouts, manualPRs), [workouts, manualPRs]);
  const summary = useMemo(() => recordsSummary(workouts, manualPRs), [workouts, manualPRs]);
  const prBars = useMemo(() => monthlyPrCounts(workouts, CHART_MONTHS), [workouts]);
  const e1rmLine = useMemo(
    () => monthlyBestE1rm(workouts, manualPRs, CHART_MONTHS),
    [workouts, manualPRs],
  );
  const ranked = useMemo(() => sortRecords(records, sort), [records, sort]);

  if (records.length === 0) {
    return (
      <EmptyState
        icon="trophy-outline"
        title="No records yet"
        body="Log a few workouts and your strongest lifts will show up here as trophies."
      />
    );
  }

  // Real deltas only: badges appear when a previous window exists to compare.
  const prDelta = summary.prevPrs > 0 ? summary.recentPrs - summary.prevPrs : null;
  const prBadge =
    prDelta != null && prDelta > 0
      ? `+${prDelta}`
      : summary.prevPrs === 0 && summary.recentPrs > 0
      ? `+${summary.recentPrs}`
      : null;
  const prBadgeSub =
    prDelta != null ? 'vs prior 3M' : summary.recentPrs > 0 ? 'last 3 months' : undefined;

  const e1rmDeltaPct =
    summary.bestE1rmBefore3m > 0
      ? Math.round(
          ((summary.bestE1rm - summary.bestE1rmBefore3m) / summary.bestE1rmBefore3m) * 100,
        )
      : null;
  const e1rmBadge = e1rmDeltaPct != null && e1rmDeltaPct > 0 ? `+${e1rmDeltaPct}%` : null;

  return (
    <>
      <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
        <StatCard
          icon="trophy"
          tint={colors.accent}
          badge={prBadge}
          badgeSub={prBadgeSub}
          value={`${summary.allTimePrs}`}
          label="PRs (all lifts)">
          {prBars.some((v) => v > 0) ? <MiniBars data={prBars} color={colors.accent} /> : null}
        </StatCard>

        <StatCard
          icon="flash"
          tint={colors.accentDim}
          badge={e1rmBadge}
          badgeSub={e1rmBadge ? 'vs prior 3M' : undefined}
          value={summary.bestE1rm > 0 ? formatUserWeightWithUnit(summary.bestE1rm, weightUnit) : '—'}
          label="Best 1RM">
          {e1rmLine.some((v) => v > 0) ? (
            <Sparkline data={e1rmLine} width={52} height={26} color={colors.accentDim} />
          ) : null}
        </StatCard>
      </Row>

      <Row align="space-between" style={{ marginTop: spacing.xs }}>
        {/* minHeight keeps the header block the same height it had with the old
            subtitle line, so removing the copy does not shift the list up. */}
        <View style={{ flex: 1, paddingRight: spacing.sm, minHeight: 40 }}>
          <T variant="h3">All Time Records</T>
        </View>
        <Pressable
          onPress={() => setSortOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Sort records, currently ${RECORD_SORT_LABELS[sort]}`}
          style={({ pressed }) => [styles.sortPill, pressed && { opacity: 0.85 }]}>
          <Ionicons name="options-outline" size={14} color={colors.textDim} />
          <T variant="micro" style={{ color: colors.text, fontWeight: '600' }}>
            {RECORD_SORT_LABELS[sort]}
          </T>
          <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
        </Pressable>
      </Row>

      <View style={{ gap: spacing.sm }}>
        {ranked.map((r, index) => {
          const ex = EXERCISE_MAP[r.exerciseId];
          const rankTint = RANK_TINTS[index] ?? null;
          return (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/exercise/${r.exerciseId}` as never)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${ex?.name ?? r.exerciseId} record`}
              style={({ pressed }) => [styles.recordRow, pressed && { opacity: 0.85 }]}>
              <View
                style={[
                  styles.rankBadge,
                  rankTint
                    ? { backgroundColor: `${rankTint}22`, borderColor: `${rankTint}55` }
                    : null,
                ]}>
                <T variant="micro" style={{ fontWeight: '700', color: rankTint ?? colors.textDim }}>
                  {index + 1}
                </T>
              </View>

              <ExerciseThumb
                exerciseId={r.exerciseId}
                muscle={ex?.muscleGroup ?? 'Core'}
                size={50}
                rounded={14}
              />

              <View style={{ flex: 1, gap: 3 }}>
                <Row gap={6}>
                  <T variant="bodySemi" numberOfLines={1} style={{ flexShrink: 1, fontSize: 14 }}>
                    {ex?.name ?? r.exerciseId}
                  </T>
                  {index === 0 ? <Tag label="Highest" color={colors.gold} bg={colors.goldSoft} /> : null}
                </Row>
                <T variant="micro" dim numberOfLines={1}>
                  {formatUserWeightWithUnit(r.weightKg, weightUnit)} × {r.reps}
                  {r.date
                    ? ` · ${new Date(r.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}`
                    : ''}
                </T>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <T variant="numSm" accent numberOfLines={1}>
                  {formatUserWeightWithUnit(r.e1rmKg, weightUnit)}
                </T>
                <T variant="micro" muted style={{ fontSize: 9 }}>
                  est. 1RM
                </T>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerCard}>
        <LinearGradient
          colors={[`${colors.accent}1A`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        <MiniBars data={[1, 2, 3, 4.2]} color={colors.accent} width={34} />
        <View style={{ flex: 1 }}>
          <T variant="bodySemi" style={{ fontSize: 14 }}>
            Keep breaking your records!
          </T>
          <T variant="micro" dim style={{ marginTop: 2, lineHeight: 16 }}>
            Track consistently and progressively increase your lifts.
          </T>
        </View>
      </View>

      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort records">
        <View style={{ gap: spacing.xs }}>
          {RECORD_SORTS.map((key) => (
            <Pressable
              key={key}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
              style={[styles.sortOption, sort === key && { backgroundColor: colors.accentSoft }]}>
              <Ionicons
                name="fitness-outline"
                size={18}
                color={sort === key ? colors.accent : colors.textDim}
              />
              <T variant="bodySemi" style={{ flex: 1 }}>
                {RECORD_SORT_LABELS[key]}
              </T>
              {sort === key ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stat card (PRs / Best 1RM) with a real mini chart
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  tint,
  badge,
  badgeSub,
  value,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  badge?: string | null;
  badgeSub?: string;
  value: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.statCard, { borderColor: `${tint}3D` }]}>
      <LinearGradient
        colors={[`${tint}24`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Row align="space-between" style={{ alignItems: 'flex-start' }}>
        <View style={[styles.statIcon, { backgroundColor: `${tint}1F`, borderColor: `${tint}47` }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        {badge ? (
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.statBadge, { backgroundColor: `${tint}22` }]}>
              <Ionicons name="arrow-up" size={10} color={tint} />
              <T variant="micro" style={{ color: tint, fontWeight: '700', fontSize: 10 }}>
                {badge}
              </T>
            </View>
            {badgeSub ? (
              <T variant="micro" muted style={{ fontSize: 9, marginTop: 3 }}>
                {badgeSub}
              </T>
            ) : null}
          </View>
        ) : null}
      </Row>

      <T
        variant="num"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ fontSize: 26, lineHeight: 30, marginTop: 14 }}>
        {value}
      </T>

      <Row align="space-between" style={{ marginTop: 4, alignItems: 'flex-end' }}>
        <T variant="micro" dim numberOfLines={1} style={{ flex: 1, paddingRight: 6, fontSize: 10 }}>
          {label}
        </T>
        {children}
      </Row>
    </View>
  );
}

/** Tiny rounded bar chart used by the PR card (and the footer flourish). */
function MiniBars({ data, color, width = 52 }: { data: number[]; color: string; width?: number }) {
  const max = Math.max(...data, 1);
  const gap = 3;
  const barWidth = Math.max(3, Math.floor((width - gap * (data.length - 1)) / data.length));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap, width, height: 26 }}>
      {data.map((v, i) => (
        <View key={i} style={{ width: barWidth, height: 26, justifyContent: 'flex-end' }}>
          <LinearGradient
            colors={[color, `${color}55`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: barWidth,
              height: Math.max(4, Math.round((v / max) * 26)),
              borderRadius: barWidth / 2,
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minHeight: 128,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    padding: spacing.md,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
