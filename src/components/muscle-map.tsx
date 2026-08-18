import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Body, { type BodyPartStyles, type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';

import { colors } from '../theme';
import type { MuscleGroup } from '../types';
import { T } from './Text';

/**
 * Signature PULSE visualization: front/back anatomical muscle figures whose
 * muscle groups glow by recent training volume. Tap a muscle to inspect it.
 *
 * Rendered with `react-native-body-highlighter` (MIT) — a realistic SVG
 * anatomy map (same classic muscle-man artwork used across fitness apps),
 * with each muscle as its own clickable path. The app's coarse MuscleGroup
 * model is mapped onto the library's finer muscle slugs (e.g. Back →
 * trapezius + upper-back + lower-back, Legs → quads/hamstrings/adductors),
 * so highlighting and taps stay anatomically correct on each side.
 */

/** library SVG viewBox dimensions (per figure) */
const VIEW_H = 400;
const VIEW_W = 200;

/** base body tone — dark charcoal to match the app's dark theme */
const BODY_FILL = '#1B2027';

type Side = 'front' | 'back';

/** every muscle slug present in each side's SVG asset (library v3.2.0) */
const SIDE_SLUGS: Record<Side, Slug[]> = {
  front: ['abs', 'adductors', 'ankles', 'biceps', 'calves', 'chest', 'deltoids', 'feet', 'forearm', 'hair', 'hands', 'head', 'knees', 'neck', 'obliques', 'quadriceps', 'tibialis', 'trapezius', 'triceps'],
  back: ['adductors', 'ankles', 'calves', 'deltoids', 'feet', 'forearm', 'gluteal', 'hair', 'hamstring', 'hands', 'head', 'lower-back', 'neck', 'trapezius', 'triceps', 'upper-back'],
};

/** groups visible on each side and the slugs they light up */
const SIDE_GROUPS: Record<Side, [MuscleGroup, Slug[]][]> = {
  front: [
    ['Chest', ['chest']],
    ['Core', ['abs', 'obliques']],
    ['Quads', ['quadriceps', 'adductors']],
    ['Shoulders', ['deltoids']],
    ['Biceps', ['biceps']],
    ['Forearms', ['forearm']],
    ['Calves', ['calves']],
  ],
  back: [
    ['Back', ['trapezius', 'upper-back', 'lower-back']],
    ['Hamstrings', ['hamstring']],
    ['Shoulders', ['deltoids']],
    ['Triceps', ['triceps']],
    ['Forearms', ['forearm']],
    ['Glutes', ['gluteal']],
    ['Calves', ['calves']],
  ],
};

const SLUG_TO_GROUP: Partial<Record<Slug, MuscleGroup>> = {
  chest: 'Chest',
  trapezius: 'Back',
  'upper-back': 'Back',
  'lower-back': 'Back',
  deltoids: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Core',
  obliques: 'Core',
  forearm: 'Forearms',
  quadriceps: 'Quads',
  adductors: 'Quads',
  hamstring: 'Hamstrings',
  calves: 'Calves',
  gluteal: 'Glutes',
};

const REGION_META: Record<MuscleGroup, { label: string }> = {
  Chest: { label: 'Chest' },
  Back: { label: 'Back' },
  Quads: { label: 'Quads' },
  Hamstrings: { label: 'Hamstrings' },
  Shoulders: { label: 'Shoulders' },
  Biceps: { label: 'Biceps' },
  Triceps: { label: 'Triceps' },
  Core: { label: 'Core' },
  Calves: { label: 'Calves' },
  Glutes: { label: 'Glutes' },
  Forearms: { label: 'Forearms' },
  Cardio: { label: 'Cardio' },
};

/** 0..1 intensity → library intensity level (1..3) over the zone colors */
function levelFor(inten: number): number | undefined {
  if (inten <= 0) return undefined;
  return Math.min(3, Math.max(1, Math.ceil(inten * 3)));
}

function buildData(side: Side, intensity: Record<string, number>, selected: MuscleGroup | null, strokeColor: string): ExtendedBodyPart[] {
  const data: ExtendedBodyPart[] = [];
  // base entry for every part so the whole figure uses the dark body fill
  for (const slug of SIDE_SLUGS[side]) data.push({ slug });
  for (const [group, slugs] of SIDE_GROUPS[side]) {
    const level = levelFor(intensity[group] ?? 0);
    const isSel = group === selected;
    for (const slug of slugs) {
      if (isSel) {
        const styles: BodyPartStyles = { stroke: strokeColor, strokeWidth: 1.6 };
        if (level == null) styles.fill = colors.accentSoft;
        data.push({ slug, ...(level != null ? { intensity: level } : {}), styles });
      } else if (level != null) {
        data.push({ slug, intensity: level });
      }
    }
  }
  return data;
}

function FigurePanel({
  side,
  label,
  intensity,
  selected,
  onPress,
  height,
  gender,
  palette = [colors.zoneLow, colors.zoneMod, colors.zoneWell] as [string, string, string],
  strokeColor = colors.accent,
}: {
  side: Side;
  label: string;
  intensity: Record<string, number>;
  selected: MuscleGroup | null;
  onPress: (part: ExtendedBodyPart) => void;
  height: number;
  gender: 'male' | 'female';
  /** low → high intensity fill colors (library maps intensity 1..3 onto these) */
  palette?: [string, string, string];
  /** stroke used for the selected muscle */
  strokeColor?: string;
}) {
  const [panelW, setPanelW] = useState(0);
  // fit the figure inside the panel without overflowing either dimension
  const scale = panelW > 0 ? Math.min(height / VIEW_H, (panelW - 16) / VIEW_W) : height / VIEW_H;

  return (
    <View style={styles.figure} onLayout={(e) => setPanelW(e.nativeEvent.layout.width)}>
      <View style={styles.figureInner}>
        <Body
          data={buildData(side, intensity, selected, strokeColor)}
          side={side}
          scale={scale}
          gender={gender}
          border={colors.borderBright}
          defaultFill={BODY_FILL}
          defaultStroke="rgba(255,255,255,0.10)"
          defaultStrokeWidth={1}
          colors={palette}
          onBodyPartPress={onPress}
        />
      </View>
      <T variant="micro" muted style={styles.label}>
        {label}
      </T>
    </View>
  );
}

export function MuscleMap({
  intensity,
  height = 300,
  selected,
  onSelect,
  gender = 'male',
}: {
  /** muscle -> 0..1 training intensity */
  intensity: Record<string, number>;
  height?: number;
  selected?: MuscleGroup | null;
  onSelect?: (m: MuscleGroup) => void;
  /** body model — matches the user's profile gender */
  gender?: 'male' | 'female';
}) {
  const [local, setLocal] = useState<MuscleGroup | null>(null);
  const sel = selected ?? local;
  const pick = (m: MuscleGroup) => (onSelect ?? setLocal)(m);
  const press = (part: ExtendedBodyPart) => {
    if (!part.slug) return;
    const group = SLUG_TO_GROUP[part.slug];
    if (group) pick(group);
  };

  return (
    <View style={{ flexDirection: 'row', height, gap: 8 }}>
      <FigurePanel side="front" label="Front" intensity={intensity} selected={sel} onPress={press} height={height} gender={gender} />
      <FigurePanel side="back" label="Back" intensity={intensity} selected={sel} onPress={press} height={height} gender={gender} />
    </View>
  );
}

/** deep → mid → light orange: primary target pulses between deep/mid, secondary stays light */
const TARGET_PALETTE: [string, string, string] = ['#FFC08A', '#FF9F43', '#F97316'];

/**
 * Exercise-target view: shows which muscles an exercise works on the front and
 * back figures — primary target in deep orange (slow blinking), secondary
 * muscles in a lighter orange shade.
 */
export function MuscleTargetMap({
  primary,
  secondary = [],
  height = 240,
  gender = 'male',
}: {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
  gender?: 'male' | 'female';
}) {
  // slow blink: the primary muscle alternates deep/mid orange every ~750 ms
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 750);
    return () => clearInterval(t);
  }, []);

  const intensity: Record<string, number> = { [primary]: pulse ? 1 : 0.5 };
  for (const m of secondary) intensity[m] = 0.25;

  return (
    <View style={{ flexDirection: 'row', height, gap: 8 }}>
      <FigurePanel side="front" label="Front" intensity={intensity} selected={primary} onPress={() => undefined} height={height} gender={gender} palette={TARGET_PALETTE} strokeColor={TARGET_PALETTE[2]} />
      <FigurePanel side="back" label="Back" intensity={intensity} selected={primary} onPress={() => undefined} height={height} gender={gender} palette={TARGET_PALETTE} strokeColor={TARGET_PALETTE[2]} />
    </View>
  );
}

export function MuscleLegend() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      {[
        { c: colors.zoneWell, l: 'Well trained' },
        { c: colors.zoneMod, l: 'Moderate' },
        { c: colors.zoneLow, l: 'Undertrained' },
      ].map((x) => (
        <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: x.c }} />
          <T variant="micro" muted>
            {x.l}
          </T>
        </View>
      ))}
    </View>
  );
}

export { REGION_META };

const styles = StyleSheet.create({
  // no border/background here — the figure sits directly on the card so the
  // front/back panels look like clean, frameless body models
  figure: { flex: 1, position: 'relative' },
  figureInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', bottom: 4, alignSelf: 'center', left: 0, right: 0, textAlign: 'center' },
});
