import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
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

import { LineChart } from '@/components/LineChart';
import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime } from '@/utils/timeUtils';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    profile, setProfile,
    timeEntries,
    selectedGender, selectedAgeGroup, selectedCourseType,
    getEntriesForEvent, getStandardTimes,
  } = useSwim();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const webTop = Platform.OS === 'web' ? 67 : 0;

  const eventsWithEntries = useMemo(() => {
    return EVENTS
      .map(event => {
        const entries = getEntriesForEvent(selectedGender, selectedAgeGroup, selectedCourseType, event.id);
        return entries.length ? { event, entries, count: entries.length } : null;
      })
      .filter(Boolean) as Array<{ event: typeof EVENTS[0]; entries: ReturnType<typeof getEntriesForEvent>; count: number }>;
  }, [timeEntries, selectedGender, selectedAgeGroup, selectedCourseType]);

  const chartEntries = useMemo(() => {
    if (!selectedEventId) return [];
    return getEntriesForEvent(selectedGender, selectedAgeGroup, selectedCourseType, selectedEventId);
  }, [selectedEventId, timeEntries, selectedGender, selectedAgeGroup, selectedCourseType]);

  const chartStd = useMemo(() => {
    if (!selectedEventId) return null;
    return getStandardTimes(selectedGender, selectedAgeGroup, selectedCourseType, selectedEventId);
  }, [selectedEventId, selectedGender, selectedAgeGroup, selectedCourseType]);

  const chartData = chartEntries.map((e, i) => ({
    x: i + 1,
    y: e.timeHundredths,
    label: e.meetName || new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  const cutLines = chartStd ? [
    chartStd.silver !== null ? { value: chartStd.silver, label: 'Silver', color: '#6B7280' } : null,
    chartStd.gold   !== null ? { value: chartStd.gold,   label: 'Gold',   color: '#D97706' } : null,
    chartStd.zone   !== null ? { value: chartStd.zone,   label: 'Zone',   color: colors.primary } : null,
  ].filter(Boolean) as { value: number; label: string; color: string }[] : [];

  const selectedEvent = EVENTS.find(e => e.id === selectedEventId);
  const strokeColor = selectedEvent ? STROKE_COLORS[selectedEvent.stroke] : colors.primary;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraft(d => ({ ...d, photoUri: result.assets[0].uri }));
    }
  }

  function saveProfile() {
    setProfile(draft);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  const hasProfile = profile.name.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        paddingTop: insets.top + webTop + 8,
      }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={() => { setDraft(profile); setEditing(true); }} style={styles.editBtn}>
          <Feather name="edit-2" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={editing ? pickPhoto : undefined} style={styles.avatarWrap}>
            {(editing ? draft.photoUri : profile.photoUri) ? (
              <Image
                source={{ uri: editing ? draft.photoUri! : profile.photoUri! }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '22' }]}>
                <Feather name="user" size={36} color={colors.primary} />
              </View>
            )}
            {editing && (
              <View style={[styles.avatarOverlay, { backgroundColor: '#000A' }]}>
                <Feather name="camera" size={18} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            {editing ? (
              <>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  placeholder="Swimmer name"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.name}
                  onChangeText={v => setDraft(d => ({ ...d, name: v }))}
                />
                <TextInput
                  style={[styles.subInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  placeholder="Club / Team"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.club}
                  onChangeText={v => setDraft(d => ({ ...d, club: v }))}
                />
                <TextInput
                  style={[styles.subInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  placeholder="USA Swimming ID"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.usaSwimmingId}
                  onChangeText={v => setDraft(d => ({ ...d, usaSwimmingId: v }))}
                  autoCapitalize="none"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={saveProfile}
                  >
                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={cancelEdit}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : hasProfile ? (
              <>
                <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
                {!!profile.club && (
                  <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>{profile.club}</Text>
                )}
                {!!profile.usaSwimmingId && (
                  <View style={[styles.idBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Text style={[styles.idText, { color: colors.mutedForeground }]}>USA ID  {profile.usaSwimmingId}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyProfile}>
                <Text style={[styles.emptyProfileTitle, { color: colors.foreground }]}>Set up your profile</Text>
                <Text style={[styles.emptyProfileSub, { color: colors.mutedForeground }]}>
                  Tap ✏️ to add your name, club, and USA Swimming ID.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats row */}
        {eventsWithEntries.length > 0 && (() => {
          const myEntries = timeEntries.filter(
            e => e.gender === selectedGender && e.ageGroup === selectedAgeGroup && e.courseType === selectedCourseType
          );
          const goldQTs = eventsWithEntries.filter(({ event }) => {
            const entries = getEntriesForEvent(selectedGender, selectedAgeGroup, selectedCourseType, event.id);
            const best = entries.reduce((b, c) => c.timeHundredths < b.timeHundredths ? c : b);
            const std = getStandardTimes(selectedGender, selectedAgeGroup, selectedCourseType, event.id);
            return std.gold !== null && best.timeHundredths <= std.gold;
          }).length;

          return (
            <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{myEntries.length}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Times</Text>
              </View>
              <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{eventsWithEntries.length}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Events</Text>
              </View>
              <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#D97706' }]}>{goldQTs}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Gold QTs</Text>
              </View>
            </View>
          );
        })()}

        {/* Progress section */}
        {eventsWithEntries.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="trending-up" size={32} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No progress yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Log times in Track Cuts and your progress charts will appear here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROGRESS CHART</Text>

            {/* Event pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
              <View style={styles.eventPills}>
                {eventsWithEntries.map(({ event, count }) => {
                  const sc = STROKE_COLORS[event.stroke];
                  const sel = selectedEventId === event.id;
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.eventPill, {
                        backgroundColor: sel ? sc : colors.card,
                        borderColor: sel ? sc : colors.border,
                      }]}
                      onPress={() => setSelectedEventId(event.id)}
                    >
                      <View style={[styles.pillDot, { backgroundColor: sel ? '#FFF' : sc }]} />
                      <Text style={[styles.pillText, { color: sel ? '#FFF' : colors.foreground }]}>
                        {event.displayName}
                      </Text>
                      <Text style={[styles.pillCount, { color: sel ? '#FFFFFF99' : colors.mutedForeground }]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Chart card */}
            {selectedEventId && chartData.length > 0 ? (
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: colors.foreground }]}>
                    {selectedEvent?.displayName}
                  </Text>
                  <Text style={[styles.chartBest, { color: strokeColor }]}>
                    PB  {formatHundredthsToTime(Math.min(...chartData.map(d => d.y)))}
                  </Text>
                </View>

                <LineChart
                  data={chartData}
                  cutLines={cutLines}
                  height={210}
                  strokeColor={strokeColor}
                />

                {/* Cut legend */}
                {cutLines.length > 0 && (
                  <View style={styles.cutLegend}>
                    {cutLines.map(cl => (
                      <View key={cl.label} style={styles.cutRow}>
                        <View style={[styles.cutDash, { backgroundColor: cl.color }]} />
                        <Text style={[styles.cutLabel, { color: cl.color }]}>{cl.label}  {formatHundredthsToTime(cl.value)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Entry list */}
                <View style={[styles.entryList, { borderTopColor: colors.border }]}>
                  {[...chartEntries].reverse().map(entry => {
                    const isPB = entry.timeHundredths === Math.min(...chartEntries.map(e => e.timeHundredths));
                    const dateStr = new Date(entry.date).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: '2-digit',
                    });
                    return (
                      <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                        <View>
                          <Text style={[styles.entryMeet, { color: colors.foreground }]}>
                            {entry.meetName || '—'}
                          </Text>
                          <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
                        </View>
                        <View style={styles.entryRight}>
                          {isPB && (
                            <View style={[styles.pbBadge, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.pbText, { color: colors.primary }]}>PB</Text>
                            </View>
                          )}
                          <Text style={[styles.entryTime, { color: colors.foreground }]}>
                            {formatHundredthsToTime(entry.timeHundredths)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : selectedEventId === null ? (
              <View style={[styles.chartPlaceholder, { borderColor: colors.border }]}>
                <Feather name="bar-chart-2" size={28} color={colors.border} />
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                  Tap an event above to see your trend
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  editBtn: { padding: 6 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  profileCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarOverlay: { position: 'absolute', inset: 0, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  profileSub: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  idBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  idText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  nameInput: { fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 4, borderBottomWidth: 1, marginBottom: 8 },
  subInput: { fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 4, borderBottomWidth: 1, marginBottom: 8 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  emptyProfile: { gap: 4 },
  emptyProfileTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyProfileSub: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },

  statsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  statLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  statDiv: { width: StyleSheet.hairlineWidth, height: 36 },

  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8 },
  eventScroll: { marginHorizontal: -16 },
  eventPills: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  eventPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  pillCount: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  chartCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  chartTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  chartBest: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  cutLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 12, flexWrap: 'wrap' },
  cutRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cutDash: { width: 14, height: 2, borderRadius: 1, opacity: 0.7 },
  cutLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  entryList: { borderTopWidth: StyleSheet.hairlineWidth },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  entryMeet: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  entryDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pbBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pbText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  entryTime: { fontFamily: 'Inter_700Bold', fontSize: 15 },

  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 36, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  chartPlaceholder: { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 8 },
  placeholderText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
