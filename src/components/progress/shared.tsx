import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { T } from '../Text';
import { PromoReveal } from '../../promo/reveal';
import { Chip, Row } from '../ui';
import { colors, radius, spacing } from '../../theme';

// ---------------------------------------------------------------------------
// Timeframe (shared by the Strength and Volume tabs so both offer the same
// 7D / 1M / 3M / 6M / 1Y range control and the header badge stays in sync)
// ---------------------------------------------------------------------------

export const TIMEFRAMES = ['7D', '1M', '3M', '6M', '1Y'] as const;
export type ProgressTimeframe = (typeof TIMEFRAMES)[number];

export const TF_LABELS: Record<ProgressTimeframe, string> = {
  '7D': 'This Week',
  '1M': 'This Month',
  '3M': 'Last 3 Months',
  '6M': 'Last 6 Months',
  '1Y': 'This Year',
};

/** Chip row used by every Progress tab with a date range. */
export function TimeframeChips({
  tf,
  onChange,
  options = TIMEFRAMES,
}: {
  tf: ProgressTimeframe;
  onChange: (t: ProgressTimeframe) => void;
  options?: readonly ProgressTimeframe[];
}) {
  return (
    <Row gap={8} {...({ 'data-horizontal-scroll': 'true' } as any)}>
      {options.map((t) => (
        <Chip key={t} label={t} selected={tf === t} onPress={() => onChange(t)} />
      ))}
    </Row>
  );
}

/** High-contrast, vibrant distinct color palette for multi-slice charts based on app theme colors */
export const DISTINCT_CHART_COLORS = [
  '#F472B6', // Rose Pink (instant contrast against Mint/Sky/Lime at index 0)
  '#38BDF8', // Sky Blue
  '#FF9F43', // Warm Coral / Orange
  '#A78BFA', // Lavender Purple
  '#34D399', // Mint Green (separated from Sky Blue & Teal)
  '#B8FF20', // Electric Lime
  '#2FD8D0', // Teal Cyan
  '#FF5B66', // Crimson Red
  '#818CF8', // Indigo
  '#FFC53D', // Amber Gold (placed lower to avoid competing with Coral in 6-slice charts)
  '#22D3EE', // Bright Cyan
  '#E879F9', // Fuchsia
  '#4ADE80', // Emerald
  '#C084FC', // Light Violet
  '#FB7185', // Strawberry
  '#F97316', // Deep Orange
];

/**
 * Chart series colors — the first slice follows the live accent, the rest use
 * distinct, vibrant high-contrast colors without repeating or clashing with the accent.
 */
export function chartColor(i: number): string {
  if (i === 0) return colors.accent;
  // Filter out the live accent color so every segment has a unique color
  const palette = DISTINCT_CHART_COLORS.filter(
    (c) => c.toLowerCase() !== colors.accent.toLowerCase()
  );
  return palette[(i - 1) % palette.length];
}

/** Small stat tile used at the top of each Progress tab. */
export function SummaryCard({
  label,
  value,
  accent,
  icon,
  flex1,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  flex1?: boolean;
}) {
  return (
    <PromoReveal variant="pop" style={flex1 ? { flex: 1 } : undefined} observe={false}>
    <View style={[progressStyles.summaryCard, flex1 && { flex: 1 }]}>
      <Ionicons name={icon} size={16} color={accent ? colors.accent : colors.textDim} />
      <T variant="h3" style={{ color: accent ? colors.accent : colors.text, marginTop: 6 }}>
        {value}
      </T>
      <T variant="micro" muted style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
    </PromoReveal>
  );
}

export const progressStyles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  periodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deltaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  exercisePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderBright,
    padding: spacing.sm,
  },
  pickerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recordTrophy: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
});
