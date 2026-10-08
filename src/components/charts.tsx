import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { PROMO } from '../promo/config';
import { usePromoPlay } from '../promo/reveal';
import { colors } from '../theme';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

// ---------------------------------------------------------------------------
// Promo draw-in wipe (promo/kinetic branch only)
// ---------------------------------------------------------------------------

/**
 * Reveals the SVG inside with a left→right (`x`) or bottom→top (`y`) wipe when
 * the promo build is active. Skipped entirely (no wrapper) on the shipped app.
 */
function PromoWipe({ axis, delay = 220, children }: { axis: 'x' | 'y'; delay?: number; children: ReactNode }) {
  const host = useRef<unknown>(null);
  const { token } = usePromoPlay();

  useEffect(() => {
    if (!PROMO.enabled || Platform.OS !== 'web') return;
    const node = host.current as HTMLElement | null;
    if (!node || typeof node.querySelector !== 'function') return;
    const svg = node.querySelector('svg') as (SVGElement & { style: CSSStyleDeclaration }) | null;
    if (!svg) return;

    let raf = 0;
    const startAt = performance.now() + (token === 0 ? delay : 120);
    const duration = 820;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - startAt) / duration));
      const eased = 1 - (1 - t) ** 3;
      const inset = (1 - eased) * 100;
      svg.style.clipPath = axis === 'x' ? `inset(0 ${inset}% 0 0)` : `inset(${inset}% 0 0 0)`;
      if (t < 1) raf = requestAnimationFrame(tick);
      else svg.style.clipPath = '';
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      svg.style.clipPath = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis, token]);

  if (!PROMO.enabled) return <>{children}</>;
  return <View ref={host as never}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Line chart with gradient fill
// ---------------------------------------------------------------------------

export function LineChart({
  data,
  labels,
  width,
  height = 150,
  color = colors.accent,
  fillColor = colors.accent,
  showDots = true,
  showGrid = true,
  baseline = 0,
}: {
  data: number[];
  labels?: string[];
  width: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showDots?: boolean;
  showGrid?: boolean;
  baseline?: number;
}) {
  const padX = 8;
  const padTop = 12;
  const padBottom = labels ? 22 : 8;
  const max = Math.max(niceMax(Math.max(...data, baseline)), 1);
  const min = Math.min(0, baseline);
  const range = max - min || 1;

  // Every data index maps to a fixed slot across the full time range, so a
  // point is drawn at its real position on the x-axis. Zero values mean "no
  // data that period" — they're skipped entirely: the line is ONE continuous
  // path through the logged points (bridging rest periods), so it never breaks
  // into disconnected fragments and never dips to zero.
  const pts = data.map((v, i) => ({
    x: padX + (i / Math.max(1, data.length - 1)) * (width - padX * 2),
    y: padTop + (1 - (v - min) / range) * (height - padTop - padBottom),
  }));

  const dataPts = pts.filter((_, i) => data[i] > 0);
  const line = smoothPath(dataPts);
  const area =
    dataPts.length > 1
      ? `${line} L ${dataPts[dataPts.length - 1].x} ${height - padBottom} L ${dataPts[0].x} ${height - padBottom} Z`
      : null;

  // Nothing logged in this time range — show a clear message instead of an
  // empty grid so the chart never looks like it failed to render.
  if (dataPts.length === 0) {
    return (
      <Svg width={width} height={height}>
        <SvgText
          x={width / 2}
          y={height / 2}
          fontSize={12}
          fill={colors.textMuted}
          textAnchor="middle"
          fontFamily="Inter_500Medium">
          No workouts logged in this period
        </SvgText>
      </Svg>
    );
  }

  const gridLines = [0.25, 0.5, 0.75].map((f) => padTop + f * (height - padTop - padBottom));

  return (
    <PromoWipe axis="x">
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id="linefill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fillColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={fillColor} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      {showGrid
        ? gridLines.map((y, i) => (
            <Path
              key={i}
              d={`M ${padX} ${y} L ${width - padX} ${y}`}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={i === 1 ? '3 5' : undefined}
            />
          ))
        : null}
      {area ? <Path d={area} fill="url(#linefill)" /> : null}
      {line ? <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
      {showDots
        ? pts.map((p, i) =>
            data[i] > 0 ? (
              <Circle key={i} cx={p.x} cy={p.y} r={3.2} fill={colors.bg} stroke={color} strokeWidth={2} />
            ) : null,
          )
        : null}
      {labels
        ? labels.map((l, i) =>
            i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1 ? (
              <SvgText
                key={i}
                x={pts[i]?.x ?? padX}
                y={height - 6}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="middle"
                fontFamily="Inter_500Medium">
                {l}
              </SvgText>
            ) : null,
          )
        : null}
    </Svg>
    </PromoWipe>
  );
}

// ---------------------------------------------------------------------------
// Rounded bar chart
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  width,
  height = 130,
  color = colors.accent,
  highlight,
  showValues,
}: {
  data: { label: string; value: number }[];
  width: number;
  height?: number;
  color?: string;
  /** index to highlight */
  highlight?: number;
  showValues?: boolean;
}) {
  const padBottom = 20;
  const padTop = showValues ? 16 : 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length || 1;
  const availW = Math.max(10, width - 16);
  const minGap = n > 25 ? 1.5 : n > 12 ? 3 : 6;
  const rawBarW = (availW - (n - 1) * minGap) / n;
  const barW = Math.max(2.5, Math.min(26, rawBarW));
  const gap = n > 1 ? (availW - barW * n) / (n - 1) : 0;

  // Smart label thinning: show max 6-8 labels evenly across the axis
  const labelInterval = n <= 8 ? 1 : n <= 16 ? 2 : n <= 30 ? 4 : Math.ceil(n / 6);

  return (
    <PromoWipe axis="y" delay={180}>
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id="barfill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.accent} />
          <Stop offset="1" stopColor={colors.accentDim} />
        </SvgLinearGradient>
        <SvgLinearGradient id="barfill-dim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A4150" />
          <Stop offset="1" stopColor="#232830" />
        </SvgLinearGradient>
      </Defs>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max(4, (d.value / max) * (height - padTop - padBottom)) : 3;
        const x = 8 + i * (barW + gap);
        const y = height - padBottom - h;
        const active = highlight == null || highlight === i;
        const useGrad = highlight == null || highlight === i;
        const showLabel = i % labelInterval === 0 || i === n - 1;

        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={barW > 4 ? barW / 2.4 : 1}
              fill={useGrad && active ? 'url(#barfill)' : 'url(#barfill-dim)'}
            />
            {showValues && (n <= 12 || showLabel) ? (
              <SvgText
                x={x + barW / 2}
                y={y - 6}
                fontSize={9}
                fill={active ? colors.accent : colors.textMuted}
                textAnchor="middle"
                fontFamily="SpaceGrotesk_600SemiBold">
                {d.value >= 1000 ? `${Math.round(d.value / 1000)}k` : d.value}
              </SvgText>
            ) : null}
            {showLabel ? (
              <SvgText
                x={x + barW / 2}
                y={height - 6}
                fontSize={9.5}
                fill={i === highlight ? colors.text : colors.textMuted}
                textAnchor="middle"
                fontFamily="Inter_500Medium">
                {d.label}
              </SvgText>
            ) : null}
          </G>
        );
      })}
    </Svg>
    </PromoWipe>
  );
}

// ---------------------------------------------------------------------------
// Donut chart
// ---------------------------------------------------------------------------

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerValue,
  centerLabel,
  gap = 0.03,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  gap?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  // Precompute each segment's stroke offset so no variable is mutated during
  // render (offset = circumference - accumulated arc length - segment length).
  const { offsets } = segments.reduce(
    (state, seg) => {
      const frac = seg.value / total;
      const len = Math.max(0, c * frac - (gap > 0 ? c * gap : 0));
      state.offsets.push(c - state.acc - len);
      state.acc += c * frac;
      return state;
    },
    { acc: 0, offsets: [] as number[] },
  );

  return (
    <PromoWipe axis="x" delay={200}>
    <Svg width={size} height={size}>
      {/* rotate around the center baked into the transform — react-native-svg's
          origin prop emits a `transform-origin` DOM prop that React 19 rejects on web */}
      <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const len = Math.max(0, c * frac - (gap > 0 ? c * gap : 0));
          const offset = offsets[i];
          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={seg.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${Math.max(0, len)} ${c}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </G>
      {centerValue ? (
        <>
          <SvgText
            x={size / 2}
            y={size / 2 - 4}
            fontSize={24}
            fill={colors.text}
            textAnchor="middle"
            fontFamily="SpaceGrotesk_700Bold">
            {centerValue}
          </SvgText>
          {centerLabel ? (
            <SvgText
              x={size / 2}
              y={size / 2 + 16}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="middle"
              fontFamily="Inter_500Medium">
              {centerLabel}
            </SvgText>
          ) : null}
        </>
      ) : null}
    </Svg>
    </PromoWipe>
  );
}

// ---------------------------------------------------------------------------
// Sparkline (tiny trend)
// ---------------------------------------------------------------------------

export function Sparkline({
  data,
  width,
  height = 32,
  color = colors.accent,
}: {
  data: number[];
  width: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / Math.max(1, data.length - 1)) * width,
    y: height - 4 - ((v - min) / range) * (height - 8),
  }));
  return (
    <PromoWipe axis="x" delay={320}>
    <Svg width={width} height={height}>
      <Path d={smoothPath(pts)} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
    </PromoWipe>
  );
}

export { colors as chartColors };
