import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from './ThemeProvider';
import { fontFamily } from './theme';
import { trendGeometry, type TrendInput } from './trendGeometry';

type TrendChartProps = {
  data: TrendInput[];
  /** Spoken summary, e.g. "HbA1c 9.1% in January, 8.4% in July…" */
  accessibilityLabel: string;
  height?: number;
  formatValue?: (v: number) => string;
};

export function TrendChart({ data, accessibilityLabel, height = 170, formatValue = (v) => String(v) }: TrendChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const g = trendGeometry(data, width, height);
  const last = g.points.length - 1;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {g.bands.map((b, i) => (
            <Rect key={`b${i}`} x={b.x} y={b.y} width={b.width} height={b.height} fill={colors.success.bg} rx={i === 0 || i === g.bands.length - 1 ? 6 : 0} />
          ))}
          {g.bands.length ? (
            <SvgText x={g.plot.right - 6} y={g.bands[g.bands.length - 1].y + 14} textAnchor="end" fontSize={11} fontFamily={fontFamily[600]} fill={colors.success.fg}>
              Usual
            </SvgText>
          ) : null}
          {g.ticks.map((t, i) => (
            <Line key={`t${i}`} x1={g.plot.left} x2={g.plot.right} y1={t.y} y2={t.y} stroke={i === 0 ? colors.inputBorder : colors.border} strokeWidth={1} />
          ))}
          {g.ticks.map((t, i) => (
            <SvgText key={`tl${i}`} x={0} y={t.y + 4} fontSize={11} fontFamily={fontFamily[400]} fill={colors.textMuted}>
              {formatValue(t.value)}
            </SvgText>
          ))}
          {g.points.length > 1 ? (
            <Polyline points={g.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {g.points.map((p, i) => (
            <Circle key={`p${i}`} cx={p.x} cy={p.y} r={i === last ? 7 : 5} fill={i === last ? colors.primary : colors.card} stroke={i === last ? colors.card : colors.primary} strokeWidth={3} />
          ))}
          {g.points.map((p, i) => (
            <SvgText key={`v${i}`} x={p.x} y={p.y - (i === last ? 12 : 10)} textAnchor="middle" fontSize={12} fontFamily={fontFamily[700]} fill={colors.text}>
              {formatValue(p.value)}
            </SvgText>
          ))}
          {g.points.map((p, i) => (
            <SvgText key={`x${i}`} x={p.x} y={height - 8} textAnchor="middle" fontSize={11} fontFamily={fontFamily[i === last ? 700 : 400]} fill={i === last ? colors.text : colors.textMuted}>
              {p.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
