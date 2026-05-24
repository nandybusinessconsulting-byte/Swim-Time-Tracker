import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { AGE_GROUPS, COURSE_TYPES } from '@/constants/standards';
import type { AgeGroup, CourseType, Gender } from '@/context/SwimContext';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatDelta, formatHundredthsToTime } from '@/utils/timeUtils';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'F', label: 'Girls' },
  { value: 'M', label: 'Boys' },
];

function MiniDelta({ delta, label, color }: { delta: number | null; label: string; color: string }) {
  const colors = useColors();
  if (delta === null) {
    return (
      <View style={[miniStyles.box, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[miniStyles.lbl, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[miniStyles.val, { color: colors.mutedForeground }]}>—</Text>
      </View>
    );
  }
  const qualified = delta <= 0;
  const bg = qualified ? color + '18' : colors.secondary;
  const textColor = qualified ? color : colors.foreground;
  return (
    <View style={[miniStyles.box, { backgroundColor: bg, borderColor: qualified ? color + '44' : colors.border }]}>
      <Text style={[miniStyles.lbl, { color: qualified ? color : colors.mutedForeground }]}>{label}</Text>
      <Text style={[miniStyles.val, { color: textColor }]}>
        {qualified ? '✓ QT' : formatDelta(delta)}
      </Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  box: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', gap: 2 },
  lbl: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.4 },
  val: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});

export default function TrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    timeEntries,
    selectedGender, selectedAgeGroup, selectedCourseType,
    setSelectedGender, setSelectedAgeGroup, setSelectedCourseType,
    getBestTimeForEvent, getStandardTimes,
  } = useSwim();

  const webTop = Platform.OS === 'web' ? 67 : 0;

  const eventsWithTimes = useMemo(() => {
    return EVENTS
      .map(event => {
        const best = getBestTimeForEvent(selectedGender, selectedAgeGroup, selectedCourseType, event.id);
        if (!best) return null;
        const std = getStandardTimes(selectedGender, selectedAgeGroup, selectedCourseType, event.id);
        const goldDelta = std.gold !== null ? best.timeHundredths - std.gold : null;
        const zoneDelta = std.zone !== null ? best.timeHundredths - std.zone : null;
        return { event, best, std, goldDelta, zoneDelta };
      })
      .filter(Boolean) as Array<{
        event: (typeof EVENTS)[0];
        best: NonNullable<ReturnType<typeof getBestTimeForEvent>>;
        std: ReturnType<typeof getStandardTimes>;
        goldDelta: number | null;
        zoneDelta: number | null;
      }>;
  }, [selectedGender, selectedAgeGroup, selectedCourseType, timeEntries]);

  const goldQualified = eventsWithTimes.filter(e => (e.goldDelta ?? 1) <= 0).length;
  const zoneQualified = eventsWithTimes.filter(e => (e.zoneDelta ?? 1) <= 0).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>2026 Standards</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>SwimTrack</Text>
          </View>
          <View style={styles.genderToggle}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderBtn, { backgroundColor: selectedGender === g.value ? colors.primary : colors.secondary, borderColor: selectedGender === g.value ? colors.primary : colors.border }]}
                onPress={() => setSelectedGender(g.value)}
              >
                <Text style={[styles.genderBtnText, { color: selectedGender === g.value ? '#FFF' : colors.foreground }]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age group */}
        <View style={[styles.chipRow, { marginBottom: 10 }]}>
          {AGE_GROUPS.map(ag => (
            <TouchableOpacity
              key={ag}
              style={[styles.ageBtn, { backgroundColor: selectedAgeGroup === ag ? colors.primary : colors.secondary, borderColor: selectedAgeGroup === ag ? colors.primary : colors.border }]}
              onPress={() => setSelectedAgeGroup(ag as AgeGroup)}
            >
              <Text style={[styles.ageBtnText, { color: selectedAgeGroup === ag ? '#FFF' : colors.foreground }]}>{ag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Course type */}
        <View style={styles.chipRow}>
          {COURSE_TYPES.map(ct => (
            <TouchableOpacity
              key={ct}
              style={[styles.courseBtn, { backgroundColor: selectedCourseType === ct ? colors.foreground : colors.secondary, borderColor: selectedCourseType === ct ? colors.foreground : colors.border }]}
              onPress={() => setSelectedCourseType(ct as CourseType)}
            >
              <Text style={[styles.courseBtnText, { color: selectedCourseType === ct ? colors.background : colors.foreground }]}>{ct}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {eventsWithTimes.length === 0 ? (
        <EmptyState icon="clock" title="No times logged yet" subtitle={`Go to the Log tab to record a ${selectedCourseType} time.`} />
      ) : (
        <>
          {/* Stats bar */}
          <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#D97706' }]}>{goldQualified}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Gold QT</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{zoneQualified}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Zone QT</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{eventsWithTimes.length}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Events</Text>
            </View>
          </View>

          <FlatList
            data={eventsWithTimes}
            keyExtractor={item => item.event.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const { event, best, goldDelta, zoneDelta } = item;
              const strokeColor = STROKE_COLORS[event.stroke];
              const entryDate = new Date(best.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.strokeBar, { backgroundColor: strokeColor }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                        <Text style={[styles.meetName, { color: colors.mutedForeground }]}>{entryDate}</Text>
                      </View>
                      <Text style={[styles.bestTime, { color: colors.foreground }]}>
                        {formatHundredthsToTime(best.timeHundredths)}
                      </Text>
                    </View>
                    <View style={styles.deltaRow}>
                      <MiniDelta delta={goldDelta} label="vs GOLD" color="#D97706" />
                      <MiniDelta delta={zoneDelta} label="vs ZONE" color={colors.primary} />
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 2 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  genderToggle: { flexDirection: 'row', gap: 6 },
  genderBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  genderBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 8 },
  ageBtn: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  ageBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  courseBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  courseBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.4 },
  statsBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  statDiv: { width: StyleSheet.hairlineWidth, height: 32 },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  strokeBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eventName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  meetName: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  bestTime: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  deltaRow: { flexDirection: 'row', gap: 8 },
});
