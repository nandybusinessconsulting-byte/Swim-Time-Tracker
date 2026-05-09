import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddMeetSheet } from '@/components/AddMeetSheet';
import { DeltaBadge } from '@/components/DeltaBadge';
import { EmptyState } from '@/components/EmptyState';
import { SwimmerSetupModal } from '@/components/SwimmerSetupModal';
import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { getStandard } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import type { Meet } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import {
  formatHundredthsToTime,
  getDeltaStatus,
  parseTimeToHundredths,
} from '@/utils/timeUtils';

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    swimmers,
    meets,
    selectedSwimmerId,
    selectedStandardLevel,
    selectedCourseType,
    timeEntries,
    addTimeEntry,
    deleteTimeEntry,
    getSelectedSwimmer,
    setSelectedSwimmerId,
    getBestTimeForEvent,
  } = useSwim();

  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(meets[0]?.id ?? null);
  const [selectedEventId, setSelectedEventId] = useState<string>('50free');
  const [timeInput, setTimeInput] = useState('');
  const [showAddMeet, setShowAddMeet] = useState(false);
  const [showAddSwimmer, setShowAddSwimmer] = useState(false);
  const [saving, setSaving] = useState(false);

  const swimmer = getSelectedSwimmer();
  const parsedTime = parseTimeToHundredths(timeInput);
  const selectedEvent = EVENTS.find(e => e.id === selectedEventId);

  const standard = useMemo(() => {
    if (!swimmer || !selectedEventId) return null;
    return getStandard(swimmer.ageGroup, swimmer.gender, selectedEventId, selectedStandardLevel, selectedCourseType);
  }, [swimmer, selectedEventId, selectedStandardLevel, selectedCourseType]);

  const previewDelta = useMemo(() => {
    if (parsedTime === null || !standard) return null;
    return parsedTime - standard.timeHundredths;
  }, [parsedTime, standard]);

  const recentEntries = useMemo(() => {
    if (!selectedSwimmerId) return [];
    return [...timeEntries]
      .filter(e => e.swimmerId === selectedSwimmerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [timeEntries, selectedSwimmerId]);

  async function handleSave() {
    if (!parsedTime || !selectedSwimmerId || !selectedMeetId) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addTimeEntry({
      swimmerId: selectedSwimmerId,
      meetId: selectedMeetId,
      eventId: selectedEventId,
      timeHundredths: parsedTime,
    });
    setTimeInput('');
    setSaving(false);
  }

  function handleMeetCreated(meet: Meet) {
    setSelectedMeetId(meet.id);
  }

  const canSave = parsedTime !== null && selectedSwimmerId && selectedMeetId;
  const webTop = Platform.OS === 'web' ? 67 : 0;

  if (swimmers.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="user"
          title="Add a swimmer first"
          subtitle="Go to the Tracker tab and add a swimmer to start logging times."
          actionLabel="Add Swimmer"
          onAction={() => setShowAddSwimmer(true)}
        />
        <SwimmerSetupModal visible={showAddSwimmer} onClose={() => setShowAddSwimmer(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + webTop + 8, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Log Time</Text>

        {/* Swimmer selector */}
        {swimmers.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SWIMMER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {swimmers.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedSwimmerId === s.id ? colors.primary : colors.card,
                        borderColor: selectedSwimmerId === s.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSwimmerId(s.id)}
                  >
                    <Text style={[styles.chipText, { color: selectedSwimmerId === s.id ? '#FFF' : colors.foreground }]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Meet selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MEET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, styles.addChip, { borderColor: colors.primary, backgroundColor: colors.secondary }]}
                onPress={() => setShowAddMeet(true)}
              >
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary }]}>New Meet</Text>
              </TouchableOpacity>
              {[...meets].reverse().map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedMeetId === m.id ? colors.primary : colors.card,
                      borderColor: selectedMeetId === m.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedMeetId(m.id)}
                >
                  <Text style={[styles.chipText, { color: selectedMeetId === m.id ? '#FFF' : colors.foreground }]}>
                    {m.name}
                  </Text>
                  <Text style={[styles.chipSub, { color: selectedMeetId === m.id ? '#FFFFFF99' : colors.mutedForeground }]}>
                    {m.courseType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Event selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EVENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {EVENTS.map(e => {
                const strokeColor = STROKE_COLORS[e.stroke];
                const isSelected = selectedEventId === e.id;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? strokeColor : colors.card,
                        borderColor: isSelected ? strokeColor : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedEventId(e.id)}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.foreground }]}>
                      {e.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TIME</Text>
          <View style={[styles.timeInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.timeInput, { color: colors.foreground }]}
              placeholder="0:00.00"
              placeholderTextColor={colors.mutedForeground}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Text style={[styles.timeHint, { color: colors.mutedForeground }]}>MM:SS.HH</Text>
          </View>

          {/* Delta Preview */}
          {parsedTime !== null && (
            <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.previewRow}>
                <View>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Your time</Text>
                  <Text style={[styles.previewTime, { color: colors.foreground }]}>
                    {formatHundredthsToTime(parsedTime)}
                  </Text>
                </View>
                {standard && (
                  <>
                    <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
                    <View>
                      <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                        {selectedStandardLevel} standard
                      </Text>
                      <Text style={[styles.previewTime, { color: colors.foreground }]}>
                        {formatHundredthsToTime(standard.timeHundredths)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              {previewDelta !== null && (
                <View style={styles.previewDelta}>
                  <DeltaBadge
                    deltaHundredths={previewDelta}
                    status={getDeltaStatus(previewDelta)}
                    size="md"
                  />
                </View>
              )}
              {!standard && swimmer && (
                <Text style={[styles.noStdText, { color: colors.mutedForeground }]}>
                  No {selectedStandardLevel} standard for {swimmer.ageGroup} {selectedEvent?.displayName}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor: canSave ? colors.primary : colors.muted,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          <Feather name="save" size={18} color={canSave ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.saveBtnText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
            {saving ? 'Saving...' : 'Save Time'}
          </Text>
        </TouchableOpacity>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECENT TIMES</Text>
            <View style={styles.recentList}>
              {recentEntries.map(entry => {
                const event = EVENTS.find(e => e.id === entry.eventId);
                const meetName = meets.find(m => m.id === entry.meetId)?.name ?? '—';
                const strokeColor = event ? STROKE_COLORS[event.stroke] : colors.primary;
                return (
                  <View
                    key={entry.id}
                    style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.recentStroke, { backgroundColor: strokeColor }]} />
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentEvent, { color: colors.foreground }]}>
                        {event?.displayName ?? entry.eventId}
                      </Text>
                      <Text style={[styles.recentMeet, { color: colors.mutedForeground }]}>{meetName}</Text>
                    </View>
                    <Text style={[styles.recentTime, { color: colors.foreground }]}>
                      {formatHundredthsToTime(entry.timeHundredths)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        deleteTimeEntry(entry.id);
                      }}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <AddMeetSheet
        visible={showAddMeet}
        onClose={() => setShowAddMeet(false)}
        onCreated={handleMeetCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  addChip: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  chipSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  timeInputCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    flex: 1,
  },
  timeHint: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  previewCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 2 },
  previewTime: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  previewDelta: { marginTop: 4 },
  noStdText: { fontFamily: 'Inter_400Regular', fontSize: 12, fontStyle: 'italic' },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  recentList: { gap: 8 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentStroke: { width: 4, alignSelf: 'stretch' },
  recentInfo: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  recentEvent: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  recentMeet: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  recentTime: { fontFamily: 'Inter_700Bold', fontSize: 16, marginRight: 4 },
  deleteBtn: { padding: 14 },
});
