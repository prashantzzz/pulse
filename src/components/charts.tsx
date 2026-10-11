import { useEffect, useRef } from 'react';
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
import { EASE, driveNumber, useReducedMotion } from '../promo/motion';
import { staggerDrive } from '../promo/dataviz';
import { usePromoCountUp } from '../promo/metric';
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
// Promo chart reveals (promo/kinetic branch only)
//
// Web-only DOM drivers that animate the real SVG elements — bars grow from
// their baseline, lines draw left→right with synced dots, donut segments
// sweep, sparklines draw. Native keeps the static (already beautiful) charts;
// the card-level reveal still animates around them. Data changes morph from
// the previous state instead of replaying entrances.
// ---------------------------------------------------------------------------

/** Play/replay key + slow-mo + accessibility flags shared by the chart drivers. */
function useChartPlay() {
  const { token, route, slowMo } = usePromoPlay();
  const reduced = useReducedMotion();
  return { playKey: `${route}#${token}`, slowMo, reduced };
}

type SvgHost = { querySelector: (selector: string) => Element | null };

function svgHost(ref: { current: unknown }): SvgHost | null {
  if (!PROMO.enabled || Platform.OS !== 'web') return null;
  const node = ref.current as SvgHost | null;
  if (!node || typeof node.querySelector !== 'function') return null;
  return node;
}

/** Bars rise from the baseline one after another, left→right.
 * Timing adapts to the bar count so sparse charts read as a clear sequence
 * (~110ms apart) while dense year-views still resolve in ~1.2s. */
function useBarReveal(dataKey: string) {
  const host = useRef<unknown>(null);
  const { playKey, slowMo, reduced } = useChartPlay();
  const prevKey = useRef('');
  const prevHeights = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) return;
    const node = svgHost(host);
    if (!node) return;
    const svg = node.querySelector('svg');
    if (!svg) return;
    const rects = Array.from(svg.querySelectorAll('rect')) as SVGRectElement[];
    if (!rects.length) return;

    const finals = rects.map((r) => ({
      y: Number(r.getAttribute('y') ?? 0),
      h: Number(r.getAttribute('height') ?? 0),
    }));
    const isUpdate = prevKey.current === playKey;
    const froms =
      isUpdate && prevHeights.current.length === finals.length ? prevHeights.current : finals.map(() => 0);
    prevKey.current = playKey;
    prevHeights.current = finals.map((f) => f.h);

    const slow = slowMo ? PROMO.slowMoFactor : 1;
    const n = rects.length;
    const step = (isUpdate ? 16 : Math.min(110, Math.max(22, 760 / Math.max(1, n)))) * slow;
    const duration = (isUpdate ? 380 : Math.min(520, step * 3.2)) * slow;
    const cancel = staggerDrive({
      count: n,
      duration,
      step,
      // Fresh mounts wait for the enclosing card to land first — otherwise
      // the wave finishes behind the card fade and the chart looks static.
      delay: (isUpdate ? 120 : 350) * slow,
      onItem: (i, t) => {
        const f = finals[i];
        if (!f) return;
        const from = froms[i] ?? 0;
        const h = from + (f.h - from) * t;
        rects[i].setAttribute('height', String(Math.max(0, h)));
        rects[i].setAttribute('y', String(f.y + (f.h - h)));
      },
    });
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, dataKey, reduced]);

  return host;
}

/** Line draws left→right; area fades in after it; dots pop in sync. */
function useLineReveal(dataKey: string) {
  const host = useRef<unknown>(null);
  const { playKey, slowMo, reduced } = useChartPlay();
  const prevKey = useRef('');

  useEffect(() => {
    if (reduced) return;
    const node = svgHost(host);
    if (!node) return;
    const svg = node.querySelector('svg');
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
    if (!paths.length) return;
    const area = paths.find((p) => (p.getAttribute('fill') ?? '').startsWith('url(')) ?? null;
    const line = paths.filter((p) => p.getAttribute('fill') === 'none').pop() ?? null;
    if (!line) return;
    const dots = Array.from(svg.querySelectorAll('circle')) as SVGCircleElement[];

    let length = 0;
    try {
      length = (line as unknown as { getTotalLength?: () => number }).getTotalLength?.() ?? 0;
    } catch {
      length = 0;
    }

    const isUpdate = prevKey.current === playKey;
    prevKey.current = playKey;
    const slow = slowMo ? PROMO.slowMoFactor : 1;

    if (length > 0) {
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
    }
    if (area) area.style.opacity = '0';
    dots.forEach((d) => {
      d.style.opacity = '0';
      // Scale-pop around each dot's own center (transform-box keeps the
      // circle anchored while it grows from 0 with the line's arrival).
      d.style.transformBox = 'fill-box';
      d.style.transformOrigin = 'center';
      d.style.transform = 'scale(0.2)';
    });

    const xs = dots.map((d) => Number(d.getAttribute('cx') ?? 0));
    const minX = xs.length ? Math.min(...xs) : 0;
    const spanX = xs.length ? Math.max(1, Math.max(...xs) - minX) : 1;

    const settleDots = () => {
      dots.forEach((d) => {
        d.style.opacity = '';
        d.style.transform = '';
        d.style.transformBox = '';
        d.style.transformOrigin = '';
      });
    };

    const cancel = driveNumber({
      duration: (isUpdate ? 520 : PROMO.duration.chart + 100) * slow,
      // Let the enclosing card finish landing before the draw starts —
      // otherwise the front-loaded easing finishes the line while the card
      // is still fading in and the chart looks static on page load.
      delay: (isUpdate ? 120 : 380) * slow,
      easing: EASE.sweep,
      onUpdate: (t) => {
        if (length > 0) line.style.strokeDashoffset = `${length * (1 - t)}`;
        if (area) area.style.opacity = String(Math.max(0, Math.min(1, (t - 0.45) / 0.5)));
        dots.forEach((d, i) => {
          const frac = (xs[i] - minX) / spanX;
          const local = Math.max(0, Math.min(1, (t - frac * 0.85) / 0.15));
          d.style.opacity = String(local);
          d.style.transform = `scale(${(0.2 + 0.8 * local).toFixed(3)})`;
        });
      },
      onDone: () => {
        if (length > 0) {
          line.style.strokeDasharray = '';
          line.style.strokeDashoffset = '';
        }
        if (area) area.style.opacity = '';
        settleDots();
      },
    });

    return () => {
      cancel();
      if (length > 0) {
        line.style.strokeDasharray = '';
        line.style.strokeDashoffset = '';
      }
      if (area) area.style.opacity = '';
      settleDots();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, dataKey, reduced]);

  return host;
}

/** Donut segments fill from zero one color after another, then the legend follows. */
function useDonutReveal(dataKey: string) {
  const host = useRef<unknown>(null);
  const { playKey, slowMo, reduced } = useChartPlay();
  const prevKey = useRef('');

  useEffect(() => {
    if (reduced) return;
    const node = svgHost(host);
    if (!node) return;
    const svg = node.querySelector('svg');
    if (!svg) return;
    const circles = Array.from(svg.querySelectorAll('circle')) as SVGCircleElement[];
    if (!circles.length) return;

    const finals = circles.map((c) => {
      const offset = Number(c.getAttribute('stroke-dashoffset') ?? 0);
      const dash = String(c.getAttribute('stroke-dasharray') ?? '0 0');
      const len = Number(dash.split(' ')[0] ?? '0') || 0;
      return { offset, len };
    });

    const isUpdate = prevKey.current === playKey;
    prevKey.current = playKey;
    const slow = slowMo ? PROMO.slowMoFactor : 1;
    const restore = () => finals.forEach((f, i) => circles[i].setAttribute('stroke-dashoffset', String(f.offset)));

    const cancel = staggerDrive({
      count: circles.length,
      duration: (isUpdate ? 360 : 420) * slow,
      step: (isUpdate ? 80 : 150) * slow,
      // Let the enclosing card land first on fresh mounts.
      delay: (isUpdate ? 120 : 400) * slow,
      onItem: (i, t) => {
        const f = finals[i];
        if (!f) return;
        circles[i].setAttribute('stroke-dashoffset', String(f.offset + f.len * (1 - t)));
      },
      onDone: restore,
    });

    return () => {
      cancel();
      restore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, dataKey, reduced]);

  return host;
}

/** Single-path sparkline draws left→right. */
function useSparkReveal(dataKey: string) {
  const host = useRef<unknown>(null);
  const { playKey, slowMo, reduced } = useChartPlay();

  useEffect(() => {
    if (reduced) return;
    const node = svgHost(host);
    if (!node) return;
    const svg = node.querySelector('svg');
    if (!svg) return;
    const path = svg.querySelector('path') as SVGPathElement | null;
    if (!path) return;

    let length = 0;
    try {
      length = (path as unknown as { getTotalLength?: () => number }).getTotalLength?.() ?? 0;
    } catch {
      length = 0;
    }
    if (length <= 0) return;

    const slow = slowMo ? PROMO.slowMoFactor : 1;
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const cancel = driveNumber({
      duration: 560 * slow,
      delay: 250 * slow,
      easing: EASE.sweep,
      onUpdate: (t) => {
        path.style.strokeDashoffset = `${length * (1 - t)}`;
      },
      onDone: () => {
        path.style.strokeDasharray = '';
        path.style.strokeDashoffset = '';
      },
    });

    return () => {
      cancel();
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, dataKey, reduced]);

  return host;
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

  const revealHost = useLineReveal(data.join(','));

  return (
    <View ref={revealHost as never}>
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
    </View>
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

  const revealHost = useBarReveal(data.map((d) => d.value).join(','));

  return (
    <View ref={revealHost as never}>
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
    </View>
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

  const revealHost = useDonutReveal(segments.map((s) => s.value).join(','));
  const shownCenter = usePromoCountUp(centerValue ?? '', PROMO.enabled);

  return (
    <View ref={revealHost as never}>
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
            {shownCenter}
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
    </View>
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
  const revealHost = useSparkReveal(data.join(','));
  return (
    <View ref={revealHost as never}>
    <Svg width={width} height={height}>
      <Path d={smoothPath(pts)} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
    </View>
  );
}

export { colors as chartColors };
