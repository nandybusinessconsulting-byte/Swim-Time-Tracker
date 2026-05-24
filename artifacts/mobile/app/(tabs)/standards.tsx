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
import type { AgeGroup, CourseType, Gender } from '@/constants/standards';
import { AGE_GROUPS, COURSE_TYPES, get2026Times } from '@/constants/standards';
import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime } from '@/utils/timeUtils';

function TimeCell({ value, accent }: { value: number | null; accent?: boolean }) {
  const colors = useColors();
  if (!value) return <Text style={[cellStyles.text, { color: colors.border, flex: 1, textAlign: 'center' }]}>—</Text>;
  return (
    <Text style={[cellStyles.text, {
      color: accent ? colors.primary : colors.foreground,
      fontFamily: accent ? 'Inter_600SemiBold' : 'Inter_400Regular',
      flex: 1, textAlign: 'center',
    }]}>
      {formatHundredthsToTime(value)}
    </Text>
  );
}
const cellStyles = StyleSheet.create({ text: { fontSize: 12 } });

export default function StandardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<Gender>('F');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('11-12');
  const [courseType, setCourseType] = useState<CourseType>('LCM');

  const webTop = Platform.OS === 'web' ? 67 : 0;

  const rows = useMemo(() => {
    if (courseType !== 'LCM') return [];
    return EVENTS
      .map(event => {
        const std = get2026Times(ageGroup, gender, event.id, courseType);
        const hasAny = std.silver !== null || std.gold !== null || std.zone !== null;
        return { event, std, hasAny };
      })
      .filter(r => r.hasAny);
  }, [gender, ageGroup, courseType]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Standards</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>2026 · Silver / Gold / EZ Zone</Text>

        {/* Course type */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Course</Text>
          <View style={styles.segRow}>
            {COURSE_TYPES.map(ct => (
              <TouchableOpacity key={ct}
                style={[styles.courseBtn, { backgroundColor: courseType === ct ? colors.foreground : colors.secondary, borderColor: courseType === ct ? colors.foreground : colors.border }]}
                onPress={() => setCourseType(ct)}
              >
                <Text style={[styles.courseBtnText, { color: courseType === ct ? colors.background : colors.foreground }]}>{ct}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gender */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Gender</Text>
          <View style={styles.segRow}>
            {(['F', 'M'] as Gender[]).map(g => (
              <TouchableOpacity key={g}
                style={[styles.segBtn, { backgroundColor: gender === g ? colors.primary : colors.secondary, borderColor: gender === g ? colors.primary : colors.border }]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.segText, { color: gender === g ? '#FFF' : colors.foreground }]}>
                  {g === 'F' ? 'Girls' : 'Boys'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age group */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Age</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.segRow}>
              {AGE_GROUPS.map(ag => (
                <TouchableOpacity key={ag}
                  style={[styles.agBtn, { backgroundColor: ageGroup === ag ? colors.accent : colors.secondary, borderColor: ageGroup === ag ? colors.accent : colors.border }]}
                  onPress={() => setAgeGroup(ag)}
                >
                  <Text style={[styles.agText, { color: ageGroup === ag ? '#FFF' : colors.foreground }]}>{ag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Column headers */}
      <View style={[styles.colHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.colEvent, { color: colors.mutedForeground }]}>EVENT</Text>
        <Text style={[styles.colTime, { color: colors.mutedForeground }]}>SILVER</Text>
        <Text style={[styles.colTime, { color: '#D97706' }]}>GOLD</Text>
        <Text style={[styles.colTime, { color: colors.primary }]}>ZONE</Text>
      </View>

      {rows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {courseType !== 'LCM'
              ? `${courseType} standards coming in a future update`
              : `No standards for ${ageGroup} ${gender === 'F' ? 'Girls' : 'Boys'}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.event.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const { event, std } = item;
            const sc = STROKE_COLORS[event.stroke];
            return (
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <View style={styles.eventCell}>
                  <View style={[styles.dot, { backgroundColor: sc }]} />
                  <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                </View>
                <TimeCell value={std.silver} />
                <TimeCell value={std.gold} accent />
                <TimeCell value={std.zone} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, marginBottom: 2 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  filterLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, width: 50 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  segText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  courseBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  courseBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.4 },
  agBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  agText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  colHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  colEvent: { flex: 1.6, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.6 },
  colTime: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  eventCell: { flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
