import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Polyline, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime } from '@/utils/timeUtils';

interface DataPoint {
  x: number;
  y: number;
  label: string;
}

interface CutLine {
  value: number;
  label: string;
  color: string;
}

interface LineChartProps {
  data: DataPoint[];
  cutLines?: CutLine[];
  height?: number;
  strokeColor?: string;
}

export function LineChart({ data, cutLines = [], height = 200, strokeColor }: LineChartProps) {
  const colors = useColors();
  const color = strokeColor ?? colors.primary;

  const W = 320;
  const H = height;
  const PAD = { top: 12, bottom: 40, left: 56, right: 16 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length < 2) {
    const single = data[0];
    return (
      <View style={[chartStyles.container, { height }]}>
        <View style={chartStyles.singlePoint}>
          <Text style={[chartStyles.singleTime, { color }]}>{formatHundredthsToTime(single.y)}</Text>
          <Text style={[chartStyles.singleLabel, { color: colors.mutedForeground }]}>Only one entry — log more times to see a trend</Text>
        </View>
      </View>
    );
  }

  const allValues = [...data.map(d => d.y), ...cutLines.map(c => c.value)];
  const yMin = Math.min(...allValues) * 0.985;
  const yMax = Math.max(...allValues) * 1.015;
  const xMin = 1;
  const xMax = data.length;

  function toSvgX(x: number) {
    return PAD.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  }
  function toSvgY(y: number) {
    return PAD.top + ((yMax - y) / (yMax - yMin || 1)) * innerH;
  }

  const points = data.map(d => `${toSvgX(d.x)},${toSvgY(d.y)}`).join(' ');

  // Y axis ticks
  const tickCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(yMin + (i / tickCount) * (yMax - yMin));
  }

  // X axis labels (show first, last, and every other if enough room)
  const xLabels = data.map((d, i) => {
    const show = i === 0 || i === data.length - 1 || (data.length <= 6) || (i % Math.ceil(data.length / 4) === 0);
    return { ...d, show };
  });

  return (
    <View style={chartStyles.container}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => (
          <Line
            key={i}
            x1={PAD.left}
            y1={toSvgY(tick)}
            x2={W - PAD.right}
            y2={toSvgY(tick)}
            stroke={colors.border}
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((tick, i) => (
          <SvgText
            key={i}
            x={PAD.left - 4}
            y={toSvgY(tick) + 4}
            fontSize={9}
            fill={colors.mutedForeground}
            textAnchor="end"
          >
            {formatHundredthsToTime(Math.round(tick))}
          </SvgText>
        ))}

        {/* Cut lines */}
        {cutLines.map((cut, i) => {
          const cy = toSvgY(cut.value);
          if (cy < PAD.top || cy > H - PAD.bottom) return null;
          return (
            <React.Fragment key={i}>
              <Line
                x1={PAD.left}
                y1={cy}
                x2={W - PAD.right}
                y2={cy}
                stroke={cut.color}
                strokeWidth={1}
                strokeDasharray="5,3"
                strokeOpacity={0.7}
              />
              <SvgText
                x={W - PAD.right - 2}
                y={cy - 3}
                fontSize={8}
                fill={cut.color}
                textAnchor="end"
              >
                {cut.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Polygon
          points={`${toSvgX(xMin)},${H - PAD.bottom} ${points} ${toSvgX(xMax)},${H - PAD.bottom}`}
          fill="url(#areaGrad)"
        />

        {/* Line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={toSvgX(d.x)}
            cy={toSvgY(d.y)}
            r={4}
            fill={color}
            stroke={colors.card}
            strokeWidth={2}
          />
        ))}

        {/* X axis labels */}
        {xLabels.map((d, i) =>
          d.show ? (
            <SvgText
              key={i}
              x={toSvgX(d.x)}
              y={H - PAD.bottom + 14}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="middle"
            >
              {d.label.length > 10 ? d.label.slice(0, 10) + '…' : d.label}
            </SvgText>
          ) : null
        )}

        {/* X axis baseline */}
        <Line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke={colors.border}
          strokeWidth={1}
        />
        {/* Y axis baseline */}
        <Line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          stroke={colors.border}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { width: '100%' },
  singlePoint: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6 },
  singleTime: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  singleLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
});
