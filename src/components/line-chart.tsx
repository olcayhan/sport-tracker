import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Line as SvgLine,
} from 'react-native-svg';

import { colors, spacing } from '@/theme';

import { T } from './ui';

export interface ChartPoint {
  label: string; // x ekseni etiketi (kısa tarih)
  value: number;
}

interface Props {
  points: ChartPoint[];
  color?: string;
  unit?: string;
  height?: number;
}

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 22;

/** Apple tarzı degrade dolgulu, noktalı custom çizgi grafik. */
export function LineChart({ points, color = colors.move, unit = '', height = 200 }: Props) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <T variant="subhead">Bu hareket için henüz veri yok.</T>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  // Grafiğin altını biraz nefes aldır (min'in altına pay bırak).
  const yMin = min - range * 0.15;
  const yMax = max + range * 0.15;
  const yRange = yMax - yMin || 1;

  const innerW = Math.max(0, width - PAD_L - PAD_R);
  const innerH = height - PAD_T - PAD_B;

  const x = (i: number) =>
    PAD_L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD_T + innerH - ((v - yMin) / yRange) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const areaPath =
    `M ${x(0).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ') +
    ` L ${x(points.length - 1).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} Z`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* Üstte min–max bilgisi */}
      <View style={styles.minmax}>
        <T variant="caption">
          en yüksek {max}
          {unit}
        </T>
      </View>

      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* yatay taban çizgisi */}
          <SvgLine
            x1={PAD_L}
            y1={PAD_T + innerH}
            x2={width - PAD_R}
            y2={PAD_T + innerH}
            stroke={colors.separator}
            strokeWidth={1}
          />

          <Path d={areaPath} fill="url(#area)" />
          <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={points.length > 15 ? 2.5 : 4}
              fill={colors.bg}
              stroke={color}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}

      {/* x ekseni etiketleri (ilk / orta / son) */}
      <View style={styles.xLabels}>
        <T variant="caption">{points[0].label}</T>
        {points.length > 2 && <T variant="caption">{points[Math.floor(points.length / 2)].label}</T>}
        <T variant="caption">{points[points.length - 1].label}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minmax: { position: 'absolute', top: 0, right: 0, zIndex: 1 },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
