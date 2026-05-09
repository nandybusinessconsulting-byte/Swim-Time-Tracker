import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EVENTS, STROKE_COLORS } from '@/constants/events';
import type { AgeGroup, Gender, StandardLevel } from '@/constants/standards';
import { AGE_GROUPS, STANDARD_LEVELS, STANDARDS } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime } from '@/utils/timeUtils';

export default function StandardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSelectedSwimmer } = useSwim();

  const swimmer = getSelectedSwimmer();
  const [gender, setGender] = useState<Gender>(swimmer?.gender ?? 'F');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(swimmer?.ageGroup ?? '11-12');

  const webTop = Platform.OS === 'web' ? 67 : 0;

  const standardsByEvent = useMemo(() => {
    return EVENTS.map(event => {
      const levels: Partial<Record<StandardLevel, number>> = {};
      STANDARD_LEVELS.forEach(({ level }) => {
        const entry = STANDARDS.find(
          s =>
            s.ageGroup === ageGroup &&
            s.gender === gender &&
            s.eventId === event.id &&
            s.level === level &&
            s.courseType === 'SCY'
        );
        if (entry) levels[level] = entry.timeHundredths;
      });
      return { event, levels, hasAny: Object.keys(levels).length > 0 };
    }).filter(e => e.hasAny);
  }, [gender, ageGroup]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 },
      ]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Standards</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          USA Swimming · SCY · 2024-2025
        </Text>

        {/* Gender picker */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Gender</Text>
          <View style={styles.segmentRow}>
            {(['F', 'M'] as Gender[]).map(g => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: gender === g ? colors.primary : colors.secondary,
                    borderColor: gender === g ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.segmentText, { color: gender === g ? '#FFF' : colors.foreground }]}>
                  {g === 'F' ? 'Girls' : 'Boys'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age group picker */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Age</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {AGE_GROUPS.filter(ag => ag !== '8U').map(ag => (
                <TouchableOpacity
                  key={ag}
                  style={[
                    styles.agChip,
                    {
                      backgroundColor: ageGroup === ag ? colors.accent : colors.secondary,
                      borderColor: ageGroup === ag ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setAgeGroup(ag)}
                >
                  <Text style={[styles.agChipText, { color: ageGroup === ag ? '#FFF' : colors.foreground }]}>
                    {ag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Column headers */}
      <View style={[styles.colHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.colHeaderEvent, { color: colors.mutedForeground }]}>EVENT</Text>
        {STANDARD_LEVELS.map(({ level }) => (
          <Text key={level} style={[styles.colHeaderLevel, { color: colors.mutedForeground }]}>{level}</Text>
        ))}
      </View>

      <FlatList
        data={standardsByEvent}
        keyExtractor={item => item.event.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const { event, levels } = item;
          const strokeColor = STROKE_COLORS[event.stroke];
          return (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.eventCell}>
                <View style={[styles.strokeDot, { backgroundColor: strokeColor }]} />
                <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
              </View>
              {STANDARD_LEVELS.map(({ level }) => {
                const time = levels[level];
                return (
                  <Text key={level} style={[styles.timeCell, { color: time ? colors.foreground : colors.mutedForeground }]}>
                    {time ? formatHundredthsToTime(time) : '—'}
                  </Text>
                );
              })}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 16 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  filterLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, width: 46 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  segmentText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 6 },
  agChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  agChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colHeaderEvent: {
    flex: 1.4,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  colHeaderLevel: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  listContent: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventCell: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strokeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  timeCell: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
  },
});
