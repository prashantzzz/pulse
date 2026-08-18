import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { T } from '../Text';
import { colors, radius, spacing } from '../../theme';

/**
 * Chart series colors — the first slice follows the live accent, the rest stay
 * distinct. Shared by every chart on the Progress screen so the palette is
 * consistent across tabs.
 */
export function chartColor(i: number): string {
  return i === 0 ? colors.accent : colors.chart[i % colors.chart.length];
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
    <View style={[progressStyles.summaryCard, flex1 && { flex: 1 }]}>
      <Ionicons name={icon} size={16} color={accent ? colors.accent : colors.textDim} />
      <T variant="h3" style={{ color: accent ? colors.accent : colors.text, marginTop: 6 }}>
        {value}
      </T>
      <T variant="micro" muted style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
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
