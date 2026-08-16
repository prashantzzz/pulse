import { View, StyleSheet } from 'react-native';

import { colors, radius } from '../theme';
import { T } from './Text';

export interface HeatDay {
  date: string; // YYYY-M-D
  intensity: number; // 0-1
}

function intensityColor(intensity: number): string {
  if (intensity <= 0) return colors.surface3;
  if (intensity < 0.34) return 'rgba(255, 92, 102, 0.55)';
  if (intensity < 0.67) return 'rgba(255, 197, 61, 0.6)';
  return colors.accent;
}

/**
 * GitHub-style calendar heatmap. Weeks are columns, days are rows,
 * colored by training intensity (volume relative to your best week).
 */
export function CalendarHeatmap({
  weeks,
  weekLabels,
  height = 150,
  onDayPress,
}: {
  weeks: HeatDay[][]; // array of weeks, each 7 days (Mon..Sun)
  weekLabels?: string[];
  height?: number;
  onDayPress?: (day: HeatDay) => void;
}) {
  const size = 14;
  const gap = 4;
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View>
      <View style={styles.weekRow}>
        <View style={{ width: 18 }} />
        {weekLabels?.map((l, i) => (
          <T key={i} variant="micro" muted style={{ width: size, marginRight: gap, textAlign: 'center', fontSize: 9 }}>
            {l}
          </T>
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 18, alignItems: 'flex-end', paddingRight: 4 }}>
          {dayNames.map((d, i) => (
            <T key={i} variant="micro" muted style={{ height: size, fontSize: 9, lineHeight: size }}>
              {d}
            </T>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ marginRight: gap }}>
            {week.map((day, di) => (
              <View
                key={di}
                onTouchEnd={day.intensity > 0 && onDayPress ? () => onDayPress(day) : undefined}
                style={{
                  width: size,
                  height: size,
                  marginBottom: gap,
                  borderRadius: 4,
                  backgroundColor: intensityColor(day.intensity),
                  borderWidth: day.intensity > 0 ? 0 : 1,
                  borderColor: colors.border,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: 6, marginLeft: 18 },
});

export { intensityColor, radius as heatRadius };
