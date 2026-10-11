import { useLayoutEffect, useRef } from 'react';
import { Platform, View, StyleSheet, ScrollView } from 'react-native';

import { PROMO } from '../promo/config';
import { useReducedMotion } from '../promo/motion';
import { usePromoPlay } from '../promo/reveal';
import { colors, radius, useAccent } from '../theme';
import { T } from './Text';
import type { ProgressTimeframe } from './progress/shared';

export interface HeatDay {
  date: string; // YYYY-M-D or ISO
  intensity: number; // 0-1
}

export function intensityColor(intensity: number, accent: string = colors.accent): string {
  if (intensity <= 0) return colors.surface3;
  if (intensity < 0.25) return `${accent}60`; // ~38% alpha - clearly lighted and visible against dark surface
  if (intensity < 0.55) return `${accent}99`; // ~60% alpha - moderate volume
  if (intensity < 0.85) return `${accent}D9`; // ~85% alpha - high volume
  return accent; // 100% - peak volume
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
  selectedDate,
}: {
  weeks: HeatDay[][]; // array of weeks, each 7 days (Mon..Sun)
  timeframe?: ProgressTimeframe;
  cardWidth?: number;
  onDayPress?: (day: HeatDay) => void;
  selectedDate?: string | null;
}) {
  useAccent();
  const scrollViewRef = useRef<ScrollView>(null);
  const numWeeks = weeks.length;

  // ── promo: week-by-week ignition wave across the calendar ────────────────
  // Columns light left→right (one training week after another); cells in a
  // column pop with a tiny top-down offset. Step adapts to the range so a
  // full year still resolves in about a second. Re-waves when the dataset
  // changes (timeframe switch), not just on replay.
  const rootRef = useRef<unknown>(null);
  const { token, route } = usePromoPlay();
  const playKey = `${route}#${token}`;
  const reduced = useReducedMotion();
  const dataKey = weeks.map((w) => w.map((d) => `${d.date}:${d.intensity.toFixed(2)}`).join('|')).join(';');

  useLayoutEffect(() => {
    if (!PROMO.enabled || Platform.OS !== 'web' || reduced) return;
    const host = rootRef.current as { querySelectorAll?: (s: string) => ArrayLike<HTMLElement> } | null;
    if (!host || typeof host.querySelectorAll !== 'function') return;
    const cells = Array.from(host.querySelectorAll('[data-heat]')) as HTMLElement[];
    if (!cells.length) return;
    const colStep = Math.min(30, Math.max(8, 640 / Math.max(1, numWeeks)));
    const baseDelay = 250;
    const timers: ReturnType<typeof setTimeout>[] = [];
    cells.forEach((cell) => {
      const col = Number(cell.getAttribute('data-col') ?? 0);
      const row = Number(cell.getAttribute('data-row') ?? 0);
      const delay = Math.min(baseDelay + col * colStep + row * 6, 900);
      cell.style.opacity = '0';
      cell.style.transform = 'scale(0.6)';
      timers.push(
        setTimeout(() => {
          cell.style.transition =
            'opacity 240ms cubic-bezier(0.16, 1, 0.3, 1), transform 240ms cubic-bezier(0.16, 1, 0.3, 1)';
          cell.style.opacity = '1';
          cell.style.transform = 'scale(1)';
        }, delay),
      );
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
      cells.forEach((cell) => {
        cell.style.transition = '';
        cell.style.opacity = '';
        cell.style.transform = '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, reduced, dataKey]);

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
    <View ref={rootRef as never} style={{ flexDirection: 'row', height: TOTAL_HEATMAP_HEIGHT }}>
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
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: numWeeks > 13 ? 12 : 0 }}
        onContentSizeChange={() => {
          if (numWeeks > 12) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
        }}
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
                  const isSelected = selectedDate === day.date;
                  return (
                    <View
                      key={di}
                      {...({ dataSet: { heat: '1', col: String(wi), row: String(di) } } as any)}
                      onTouchEnd={onDayPress ? () => onDayPress(day) : undefined}
                      style={{
                        width: BLOCK_SIZE,
                        height: BLOCK_SIZE,
                        marginBottom: BLOCK_GAP,
                        borderRadius: 3,
                        backgroundColor: bg,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected
                          ? colors.white
                          : hasSession
                          ? `${colors.accent}66`
                          : colors.border,
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
