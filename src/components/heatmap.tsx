import { View, StyleSheet, ScrollView } from 'react-native';

import { colors, radius, useAccent } from '../theme';
import { T } from './Text';
import type { ProgressTimeframe } from './progress/shared';

export interface HeatDay {
  date: string; // YYYY-M-D or ISO
  intensity: number; // 0-1
}

export function intensityColor(intensity: number, accent: string = colors.accent): string {
  if (intensity <= 0) return colors.surface3;
  if (intensity < 0.25) return `${accent}33`;
  if (intensity < 0.55) return `${accent}77`;
  if (intensity < 0.85) return `${accent}BB`;
  return accent;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const BLOCK_SIZE = 14;
const BLOCK_GAP = 4;
const DAY_LABEL_WIDTH = 18;
const MONTH_HEADER_HEIGHT = 16;
const MONTH_HEADER_MARGIN = 6;
const GRID_HEIGHT = 7 * BLOCK_SIZE + 6 * BLOCK_GAP; // 122px
const TOTAL_HEATMAP_HEIGHT = MONTH_HEADER_HEIGHT + MONTH_HEADER_MARGIN + GRID_HEIGHT; // 144px

/**
 * Clean, constant-dimension training calendar heatmap.
 * Block sizes (14px), row heights, card padding, and container heights remain
 * perfectly constant across all date ranges (1M, 3M, 6M, 1Y).
 */
export function CalendarHeatmap({
  weeks,
  timeframe = '3M',
  cardWidth,
  onDayPress,
}: {
  weeks: HeatDay[][]; // array of weeks, each 7 days (Mon..Sun)
  timeframe?: ProgressTimeframe;
  cardWidth?: number;
  onDayPress?: (day: HeatDay) => void;
}) {
  useAccent();
  const numWeeks = weeks.length;

  // Build clean, non-overlapping month header labels
  const monthLabels: { text: string; colIndex: number }[] = [];
  let lastLabeledCol = -4;

  weeks.forEach((week, i) => {
    if (!week[0]) return;
    const d = new Date(week[0].date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const prevWeekMonth = i > 0 && weeks[i - 1][0] ? new Date(weeks[i - 1][0].date).toLocaleDateString('en-US', { month: 'short' }) : '';

    if (i === 0 || (month !== prevWeekMonth && i - lastLabeledCol >= 3)) {
      monthLabels.push({ text: month, colIndex: i });
      lastLabeledCol = i;
    }
  });

  return (
    <View style={{ flexDirection: 'row', height: TOTAL_HEATMAP_HEIGHT }}>
      {/* Pinned Left Weekday Labels */}
      <View
        style={{
          width: DAY_LABEL_WIDTH,
          height: TOTAL_HEATMAP_HEIGHT,
          paddingTop: MONTH_HEADER_HEIGHT + MONTH_HEADER_MARGIN,
        }}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={{ height: BLOCK_SIZE, marginBottom: BLOCK_GAP, justifyContent: 'center' }}>
            <T variant="micro" muted style={{ fontSize: 9, lineHeight: 10, color: colors.textMuted }}>
              {d}
            </T>
          </View>
        ))}
      </View>

      {/* Week Columns with Month Header Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: numWeeks > 13 ? 12 : 0 }}
        style={{ flex: 1 }}>
        <View style={{ height: TOTAL_HEATMAP_HEIGHT }}>
          {/* Month labels row */}
          <View style={{ height: MONTH_HEADER_HEIGHT, marginBottom: MONTH_HEADER_MARGIN, position: 'relative' }}>
            {monthLabels.map((m, idx) => (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: m.colIndex * (BLOCK_SIZE + BLOCK_GAP),
                  top: 0,
                }}>
                <T variant="micro" muted style={{ fontSize: 10, fontWeight: '500' }}>
                  {m.text}
                </T>
              </View>
            ))}
          </View>

          {/* Grid columns */}
          <View style={{ flexDirection: 'row' }}>
            {weeks.map((week, wi) => (
              <View key={wi} style={{ marginRight: wi < numWeeks - 1 ? BLOCK_GAP : 0 }}>
                {week.map((day, di) => {
                  const bg = intensityColor(day.intensity, colors.accent);
                  const hasSession = day.intensity > 0;
                  return (
                    <View
                      key={di}
                      onTouchEnd={hasSession && onDayPress ? () => onDayPress(day) : undefined}
                      style={{
                        width: BLOCK_SIZE,
                        height: BLOCK_SIZE,
                        marginBottom: BLOCK_GAP,
                        borderRadius: 3,
                        backgroundColor: bg,
                        borderWidth: hasSession ? 0 : 1,
                        borderColor: colors.border,
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export { radius as heatRadius };
