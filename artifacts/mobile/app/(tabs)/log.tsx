import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { AGE_GROUPS, COURSE_TYPES, get2026Times } from '@/constants/standards';
import type { AgeGroup, CourseType, Gender } from '@/context/SwimContext';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import {
  formatDelta,
  formatHundredthsToTime,
  parseTimeToHundredths,
} from '@/utils/timeUtils';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'F', label: 'Girls' },
  { value: 'M', label: 'Boys' },
];

function DeltaRow({
  label, standardTime, delta, accentColor,
}: {
  label: string; standardTime: number | null; delta: number | null; accentColor: string;
}) {
  const colors = useColors();
  if (standardTime === null) {
    return (
      <View style={[drStyles.row, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[drStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[drStyles.noStd, { color: colors.mutedForeground }]}>No standard for this event / age</Text>
      </View>
    );
  }
  const qualified = delta !== null && delta <= 0;
  return (
    <View style={[drStyles.row, {
      backgroundColor: qualified ? accentColor + '15' : colors.card,
      borderColor: qualified ? accentColor + '55' : colors.border,
    }]}>
      <View style={drStyles.rowLeft}>
        <Text style={[drStyles.label, { color: qualified ? accentColor : colors.mutedForeground }]}>{label}</Text>
        <Text style={[drStyles.stdTime, { color: colors.mutedForeground }]}>{formatHundredthsToTime(standardTime)}</Text>
      </View>
      {delta !== null ? (
        <View style={drStyles.rowRight}>
          {qualified
            ? <Text style={[drStyles.qtText, { color: accentColor }]}>✓  Qualified</Text>
            : <>
                <Text style={[drStyles.deltaNum, { color: colors.foreground }]}>{formatDelta(delta)}</Text>
                <Text style={[drStyles.toGo, { color: colors.mutedForeground }]}>to go</Text>
              </>
          }
        </View>
      ) : (
        <Text style={[drStyles.noStd, { color: colors.mutedForeground }]}>Enter a time above</Text>
      )}
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  rowLeft: { gap: 2 },
  rowRight: { alignItems: 'flex-end' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  stdTime: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 1 },
  deltaNum: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  toGo: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  qtText: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  noStd: { fontFamily: 'Inter_400Regular', fontSize: 12, fontStyle: 'italic' },
});

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    timeEntries,
    selectedGender, selectedAgeGroup, selectedCourseType,
    setSelectedGender, setSelectedAgeGroup, setSelectedCourseType,
    addTimeEntry, deleteTimeEntry,
    getBestTimeForEvent,
  } = useSwim();

  const [selectedEventId, setSelectedEventId] = useState<string>('50free');
  const [timeInput, setTimeInput] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedTime = parseTimeToHundredths(timeInput);
  const webTop = Platform.OS === 'web' ? 67 : 0;

  const std = useMemo(() => {
    return get2026Times(selectedAgeGroup, selectedGender, selectedEventId, selectedCourseType);
  }, [selectedGender, selectedAgeGroup, selectedEventId, selectedCourseType]);

  const goldDelta = parsedTime !== null && std.gold !== null ? parsedTime - std.gold : null;
  const zoneDelta = parsedTime !== null && std.zone !== null ? parsedTime - std.zone : null;

  const recentEntries = useMemo(() => {
    return [...timeEntries]
      .filter(e => e.gender === selectedGender && e.ageGroup === selectedAgeGroup && e.courseType === selectedCourseType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  }, [timeEntries, selectedGender, selectedAgeGroup, selectedCourseType]);

  async function handleSave() {
    if (!parsedTime) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addTimeEntry({
      gender: selectedGender,
      ageGroup: selectedAgeGroup,
      courseType: selectedCourseType,
      eventId: selectedEventId,
      timeHundredths: parsedTime,
    });
    setTimeInput('');
    setSaving(false);
  }

  const canSave = parsedTime !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Fixed header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        paddingTop: insets.top + webTop + 8,
      }]}>
        {/* Row 1: title + gender */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Log Time</Text>
          <View style={styles.genderToggle}>
            {GENDERS.map(g => (
              <TouchableOpacity key={g.value}
                style={[styles.genderBtn, { backgroundColor: selectedGender === g.value ? colors.primary : colors.secondary, borderColor: selectedGender === g.value ? colors.primary : colors.border }]}
                onPress={() => setSelectedGender(g.value)}
              >
                <Text style={[styles.genderBtnText, { color: selectedGender === g.value ? '#FFF' : colors.foreground }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Row 2: age group */}
        <View style={[styles.pickerRow, { marginBottom: 10 }]}>
          {AGE_GROUPS.map(ag => (
            <TouchableOpacity key={ag}
              style={[styles.ageBtn, { backgroundColor: selectedAgeGroup === ag ? colors.primary : colors.secondary, borderColor: selectedAgeGroup === ag ? colors.primary : colors.border }]}
              onPress={() => setSelectedAgeGroup(ag as AgeGroup)}
            >
              <Text style={[styles.ageBtnText, { color: selectedAgeGroup === ag ? '#FFF' : colors.foreground }]}>{ag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 3: course type */}
        <View style={styles.pickerRow}>
          {COURSE_TYPES.map(ct => (
            <TouchableOpacity key={ct}
              style={[styles.courseBtn, { backgroundColor: selectedCourseType === ct ? colors.foreground : colors.secondary, borderColor: selectedCourseType === ct ? colors.foreground : colors.border }]}
              onPress={() => setSelectedCourseType(ct as CourseType)}
            >
              <Text style={[styles.courseBtnText, { color: selectedCourseType === ct ? colors.background : colors.foreground }]}>{ct}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EVENT</Text>
          <View style={styles.strokeGroups}>
            {(['Free', 'Back', 'Breast', 'Fly', 'IM'] as const).map(stroke => {
              const strokeEvents = EVENTS.filter(e => e.stroke === stroke);
              const sc = STROKE_COLORS[stroke];
              return (
                <View key={stroke} style={styles.strokeGroup}>
                  <View style={[styles.strokeLabel, { backgroundColor: sc + '18' }]}>
                    <View style={[styles.strokeDot, { backgroundColor: sc }]} />
                    <Text style={[styles.strokeLabelText, { color: sc }]}>{stroke}</Text>
                  </View>
                  <View style={styles.strokeChips}>
                    {strokeEvents.map(e => {
                      const isSel = selectedEventId === e.id;
                      return (
                        <TouchableOpacity key={e.id}
                          style={[styles.eventChip, { backgroundColor: isSel ? sc : colors.card, borderColor: isSel ? sc + '99' : colors.border }]}
                          onPress={() => setSelectedEventId(e.id)}
                        >
                          <Text style={[styles.eventChipText, { color: isSel ? '#FFF' : colors.foreground }]}>{e.distance}m</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Time input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR TIME  (M:SS.HH)</Text>
          <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: parsedTime !== null ? colors.primary : colors.border }]}>
            <TextInput
              style={[styles.timeInput, { color: colors.foreground }]}
              placeholder="0:00.00"
              placeholderTextColor={colors.mutedForeground}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            {parsedTime !== null && (
              <Text style={[styles.parsedDisplay, { color: colors.primary }]}>
                = {formatHundredthsToTime(parsedTime)}
              </Text>
            )}
          </View>
        </View>

        {/* Result */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESULT</Text>
          <View style={styles.deltaStack}>
            <DeltaRow label="🥇  NJ Gold cut" standardTime={std.gold} delta={goldDelta} accentColor="#D97706" />
            <DeltaRow label="🌊  Eastern Zone cut" standardTime={std.zone} delta={zoneDelta} accentColor={colors.primary} />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.muted, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          <Feather name="save" size={18} color={canSave ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.saveBtnText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
            {saving ? 'Saving…' : 'Save Time'}
          </Text>
        </TouchableOpacity>

        {/* Recent */}
        {recentEntries.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>RECENT TIMES</Text>
            {recentEntries.map(entry => {
              const event = EVENTS.find(e => e.id === entry.eventId);
              if (!event) return null;
              const sc = STROKE_COLORS[event.stroke];
              const best = getBestTimeForEvent(entry.gender, entry.ageGroup, entry.courseType, entry.eventId);
              const isPB = best?.id === entry.id;
              const es = get2026Times(entry.ageGroup, entry.gender, entry.eventId, entry.courseType);
              const gd = es.gold !== null ? entry.timeHundredths - es.gold : null;
              const zd = es.zone !== null ? entry.timeHundredths - es.zone : null;
              const dateStr = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <View key={entry.id} style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                  <View style={[styles.recentStroke, { backgroundColor: sc }]} />
                  <View style={styles.recentInfo}>
                    <View style={styles.recentNameRow}>
                      <Text style={[styles.recentEvent, { color: colors.foreground }]}>{event.displayName}</Text>
                      {isPB && <View style={[styles.pbBadge, { backgroundColor: colors.primary + '20' }]}><Text style={[styles.pbText, { color: colors.primary }]}>PB</Text></View>}
                    </View>
                    <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
                    <View style={styles.recentDeltas}>
                      {gd !== null && <Text style={[styles.recentDelta, { color: gd <= 0 ? '#D97706' : colors.mutedForeground }]}>{gd <= 0 ? '🥇 QT' : `Gold ${formatDelta(gd)}`}</Text>}
                      {zd !== null && <Text style={[styles.recentDelta, { color: zd <= 0 ? colors.primary : colors.mutedForeground }]}>{zd <= 0 ? '🌊 QT' : `Zone ${formatDelta(zd)}`}</Text>}
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={[styles.recentTime, { color: colors.foreground }]}>{formatHundredthsToTime(entry.timeHundredths)}</Text>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); deleteTimeEntry(entry.id); }} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={13} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  genderToggle: { flexDirection: 'row', gap: 6 },
  genderBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  genderBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  pickerRow: { flexDirection: 'row', gap: 8 },
  ageBtn: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  ageBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  courseBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  courseBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },
  strokeGroups: { gap: 10 },
  strokeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strokeLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, minWidth: 62 },
  strokeDot: { width: 7, height: 7, borderRadius: 4 },
  strokeLabelText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  strokeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  eventChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  eventChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  timeCard: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeInput: { fontFamily: 'Inter_700Bold', fontSize: 32, flex: 1 },
  parsedDisplay: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  deltaStack: { gap: 10 },
  saveBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  recentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  recentStroke: { width: 4, alignSelf: 'stretch' },
  recentInfo: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  recentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentEvent: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  pbBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pbText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  recentDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  recentDeltas: { flexDirection: 'row', gap: 10, marginTop: 4 },
  recentDelta: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  recentRight: { alignItems: 'flex-end', paddingRight: 4 },
  recentTime: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  deleteBtn: { padding: 10 },
});
