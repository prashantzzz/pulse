import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type AccentPalette } from '../theme';
import { T } from './Text';

/**
 * Small mockup of the app's core UI elements, rendered in a chosen accent
 * palette — used on the onboarding color step and in Settings so users can
 * preview a theme before committing.
 */
export function AccentPreview({ palette }: { palette: AccentPalette }) {
  const p = palette;
  return (
    <View style={styles.mock}>
      {/* fake status / app bar */}
      <View style={styles.mockBar}>
        <T variant="smallSemi" style={{ color: p.accent, fontSize: 12, letterSpacing: 1 }}>
          NEXTREP
        </T>
        <View style={[styles.dot, { backgroundColor: p.accent }]} />
      </View>

      {/* fake hero row */}
      <View style={styles.mockHero}>
        <View>
          <T variant="micro" muted>
            Sets this week
          </T>
          <T variant="num" style={{ color: p.accent, fontSize: 30, lineHeight: 34 }}>
            12
          </T>
        </View>
        <View style={[styles.pill, { backgroundColor: p.accentSoft, borderColor: `${p.accent}55` }]}>
          <T variant="micro" style={{ color: p.accent, fontWeight: '700' }}>
            +25%
          </T>
        </View>
      </View>

      {/* fake progress bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: p.accent }]} />
      </View>

      {/* fake chips */}
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: p.accent, borderColor: p.accent }]}>
          <T variant="micro" style={{ color: colors.bg, fontWeight: '700' }}>
            Push Day
          </T>
        </View>
        <View style={[styles.chip, { backgroundColor: p.accentSoft, borderColor: `${p.accent}44` }]}>
          <T variant="micro" style={{ color: p.accent, fontWeight: '600' }}>
            Pull Day
          </T>
        </View>
      </View>

      {/* fake primary button */}
      <LinearGradient colors={[p.gradient[0], p.gradient[1]]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <T variant="bodySemi" style={{ color: colors.bg, fontSize: 14 }}>
          Start Workout
        </T>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mock: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mockBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  mockHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.surface3, overflow: 'hidden', marginTop: 2 },
  fill: { width: '62%', height: '100%', borderRadius: 999 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  btn: { borderRadius: 999, alignItems: 'center', paddingVertical: 12, marginTop: 2 },
});
