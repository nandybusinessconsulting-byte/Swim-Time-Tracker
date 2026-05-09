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
import type { AgeGroup, Gender } from '@/constants/standards';
import { AGE_GROUPS, STANDARD_SETS, STANDARDS } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime } from '@/utils/timeUtils';

export default function StandardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSelectedSwimmer, selectedStandardSetId, setSelectedStandardSetId } = useSwim();

  const swimmer = getSelectedSwimmer();
  const [gender, setGender] = useState<Gender>(swimmer?.gender ?? 'F');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(swimmer?.ageGroup ?? '11-12');
  const [selectedSetId, setSelectedSetId] = useState(selectedStandardSetId);

  const currentSet = STANDARD_SETS.find(s => s.id === selectedSetId) ?? STANDARD_SETS[0];
  const webTop = Platform.OS === 'web' ? 67 : 0;

  // Valid age groups for this set (some sets don't have all age groups)
  const availableAgeGroups = useMemo(() => {
    const available = new Set(
      STANDARDS
        .filter(s => s.setId === selectedSetId && s.gender === gender)
        .map(s => s.ageGroup)
    );
    return AGE_GROUPS.filter(ag => ag !== '8U' && available.has(ag));
  }, [selectedSetId, gender]);

  // Auto-correct age group if it's not available in the new set
  const effectiveAgeGroup = availableAgeGroups.includes(ageGroup)
    ? ageGroup
    : (availableAgeGroups[0] ?? ageGroup);

  // Get all events that have standards for this set/gender/age group
  const standardsByEvent = useMemo(() => {
    const setLevels = currentSet.levels.map(l => l.level);
    return EVENTS
      .filter(ev => ev.applicableTo === 'both' || ev.applicableTo === currentSet.courseType)
      .map(event => {
        const levelTimes: Record<string, number | undefined> = {};
        setLevels.forEach(level => {
          const entry = STANDARDS.find(
            s => s.setId === selectedSetId && s.ageGroup === effectiveAgeGroup && s.gender === gender && s.eventId === event.id && s.level === level
          );
          levelTimes[level] = entry?.timeHundredths;
        });
        const hasAny = Object.values(levelTimes).some(v => v !== undefined);
        return { event, levelTimes, hasAny };
      })
      .filter(e => e.hasAny)
      .sort((a, b) => a.event.stroke.localeCompare(b.event.stroke) || a.event.sortOrder - b.event.sortOrder);
  }, [selectedSetId, gender, effectiveAgeGroup, currentSet]);

  function handleSetChange(id: string) {
    setSelectedSetId(id);
    setSelectedStandardSetId(id);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Standards</Text>

        {/* Standard Set Picker */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Set</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {STANDARD_SETS.map(set => {
                const isSelected = selectedSetId === set.id;
                const isLCM = set.courseType === 'LCM';
                return (
                  <TouchableOpacity
                    key={set.id}
                    style={[styles.setChip, { backgroundColor: isSelected ? colors.primary : colors.secondary, borderColor: isSelected ? colors.primary : colors.border }]}
                    onPress={() => handleSetChange(set.id)}
                  >
                    <Text style={[styles.setChipText, { color: isSelected ? '#FFF' : colors.foreground }]}>
                      {set.shortName}
                    </Text>
                    {isLCM && (
                      <View style={[styles.courseTag, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.accent + '22' }]}>
                        <Text style={[styles.courseTagText, { color: isSelected ? '#FFF' : colors.accent }]}>LCM</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Gender */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Gender</Text>
          <View style={styles.segRow}>
            {(['F', 'M'] as Gender[]).map(g => (
              <TouchableOpacity
                key={g}
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
            <View style={styles.chipRow}>
              {availableAgeGroups.map(ag => (
                <TouchableOpacity
                  key={ag}
                  style={[styles.agChip, { backgroundColor: effectiveAgeGroup === ag ? colors.accent : colors.secondary, borderColor: effectiveAgeGroup === ag ? colors.accent : colors.border }]}
                  onPress={() => setAgeGroup(ag)}
                >
                  <Text style={[styles.agText, { color: effectiveAgeGroup === ag ? '#FFF' : colors.foreground }]}>{ag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Org / season note */}
        <Text style={[styles.orgNote, { color: colors.mutedForeground }]}>
          {currentSet.org} · {currentSet.courseType} · {currentSet.season}
          {(currentSet.id === 'usswim-2526-scy' || currentSet.id === 'usswim-2526-lcm') ? ' · approx.' : ''}
        </Text>
      </View>

      {/* Column header */}
      <View style={[styles.colHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.colEvent, { color: colors.mutedForeground }]}>EVENT</Text>
        {currentSet.levels.map(({ level, label }) => (
          <Text key={level} style={[styles.colLevel, { color: colors.mutedForeground }]}>{label}</Text>
        ))}
      </View>

      {standardsByEvent.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No standards for {effectiveAgeGroup} {gender === 'F' ? 'Girls' : 'Boys'} in this set
          </Text>
        </View>
      ) : (
        <FlatList
          data={standardsByEvent}
          keyExtractor={item => item.event.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const { event, levelTimes } = item;
            const strokeColor = STROKE_COLORS[event.stroke];
            return (
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <View style={styles.eventCell}>
                  <View style={[styles.dot, { backgroundColor: strokeColor }]} />
                  <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                </View>
                {currentSet.levels.map(({ level }) => {
                  const time = levelTimes[level];
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, marginBottom: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  filterLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, width: 44 },
  chipRow: { flexDirection: 'row', gap: 6 },
  setChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  setChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  courseTag: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  courseTagText: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 18, borderWidth: 1 },
  segText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  agChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  agText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  orgNote: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2, marginBottom: 4 },
  colHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  colEvent: { flex: 1.4, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.6 },
  colLevel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  eventCell: { flex: 1.4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  timeCell: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
