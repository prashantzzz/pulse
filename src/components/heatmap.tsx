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

/**
 * Clean, theme-reactive training calendar heatmap.
 * Automatically adapts block sizing and month labels to fit the active timeframe and screen width.
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
  const dayLabelWidth = 18;
  const availableWidth = cardWidth ? Math.max(cardWidth - dayLabelWidth - 10, 200) : 300;

  // Calculate dynamic block size and gap based on timeframe & width
  let size = 14;
  let gap = 4;
  let shouldScroll = false;

  if (numWeeks <= 4) {
    // 1M (4 weeks) or 7D (1 week): give generous block sizes that fill the card nicely
    gap = 6;
    size = Math.min(Math.floor((availableWidth - (numWeeks - 1) * gap) / numWeeks), 44);
  } else if (numWeeks <= 13) {
    // 3M (12-13 weeks): fit perfectly on mobile screen
    gap = 4;
    size = Math.min(Math.floor((availableWidth - (numWeeks - 1) * gap) / numWeeks), 20);
    size = Math.max(size, 14);
  } else {
    // 6M (26 weeks) or 1Y (52 weeks): standard compact size with smooth horizontal scroll
    size = 14;
    gap = 4;
    shouldScroll = true;
  }

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

  const totalGridWidth = numWeeks * (size + gap) - gap;

  const content = (
    <View style={{ width: shouldScroll ? totalGridWidth + dayLabelWidth + 8 : '100%' }}>
      {/* Month labels row */}
      <View style={[styles.monthRow, { height: 18, marginLeft: dayLabelWidth + 4, position: 'relative' }]}>
        {monthLabels.map((m, idx) => (
          <View
            key={idx}
            style={{
              position: 'absolute',
              left: m.colIndex * (size + gap),
              top: 0,
            }}>
            <T variant="micro" muted style={{ fontSize: 10, fontWeight: '500' }}>
              {m.text}
            </T>
          </View>
        ))}
      </View>

      {/* Grid with weekday row labels */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Left weekday labels aligned with each row */}
        <View style={{ width: dayLabelWidth, alignItems: 'flex-start', paddingTop: 1 }}>
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={{ height: size, marginBottom: gap, justifyContent: 'center' }}>
              <T variant="micro" muted style={{ fontSize: 9, lineHeight: 10, color: colors.textMuted }}>
                {d}
              </T>
            </View>
          ))}
        </View>

        {/* Heatmap blocks */}
        <View style={{ flexDirection: 'row', flex: shouldScroll ? undefined : 1, justifyContent: shouldScroll ? undefined : 'space-between' }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ marginRight: shouldScroll ? gap : 0 }}>
              {week.map((day, di) => {
                const bg = intensityColor(day.intensity, colors.accent);
                const hasSession = day.intensity > 0;
                return (
                  <View
                    key={di}
                    onTouchEnd={hasSession && onDayPress ? () => onDayPress(day) : undefined}
                    style={{
                      width: size,
                      height: size,
                      marginBottom: gap,
                      borderRadius: Math.max(3, Math.floor(size * 0.25)),
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
    </View>
  );

  if (shouldScroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  monthRow: {
    marginBottom: 6,
  },
});

export { radius as heatRadius };
