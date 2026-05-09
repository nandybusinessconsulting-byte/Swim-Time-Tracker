import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { type DeltaStatus, formatDelta, formatHundredthsToTime } from '@/utils/timeUtils';

interface DeltaBadgeProps {
  deltaHundredths: number;
  status: DeltaStatus;
  size?: 'sm' | 'md' | 'lg';
  showAbsTime?: boolean;
  standardTimeHundredths?: number;
}

export function DeltaBadge({
  deltaHundredths,
  status,
  size = 'md',
  showAbsTime,
  standardTimeHundredths,
}: DeltaBadgeProps) {
  const colors = useColors();

  const statusColors = {
    qualified: { bg: colors.qualifiedBg, text: colors.qualified, label: 'QUALIFIED' },
    close:     { bg: colors.closeBg,     text: colors.close,     label: 'CLOSE' },
    near:      { bg: colors.nearBg,      text: colors.near,      label: 'NEAR' },
    far:       { bg: colors.farBg,       text: colors.far,       label: 'FAR' },
  } as const;

  const sc = statusColors[status];
  const isQualified = status === 'qualified';
  const deltaText = isQualified
    ? `${formatDelta(deltaHundredths)} under`
    : `${formatDelta(deltaHundredths)} to go`;

  const fontSizes = { sm: 11, md: 13, lg: 16 };
  const badgePads = { sm: { px: 6, py: 3 }, md: { px: 10, py: 5 }, lg: { px: 14, py: 8 } };
  const fontSize = fontSizes[size];
  const pad = badgePads[size];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.badge, { backgroundColor: sc.bg, paddingHorizontal: pad.px, paddingVertical: pad.py, borderColor: sc.text + '33' }]}>
        <Text style={[styles.deltaText, { color: sc.text, fontSize }]}>
          {deltaText}
        </Text>
      </View>
      {showAbsTime && standardTimeHundredths !== undefined && (
        <Text style={[styles.stdTime, { color: colors.mutedForeground }]}>
          Standard: {formatHundredthsToTime(standardTimeHundredths)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    gap: 4,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
  },
  deltaText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
  stdTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
});
