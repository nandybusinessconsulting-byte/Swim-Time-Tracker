import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

import { DeltaBadge } from '@/components/DeltaBadge';
import { EmptyState } from '@/components/EmptyState';
import { SwimmerSetupModal } from '@/components/SwimmerSetupModal';
import { getEventsForCourse, STROKE_COLORS } from '@/constants/events';
import { STANDARD_SETS } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatHundredthsToTime, getDeltaStatus } from '@/utils/timeUtils';

export default function TrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    swimmers,
    selectedSwimmerId,
    selectedStandardSetId,
    selectedStandardLevel,
    selectedCourseType,
    timeEntries,
    meets,
    setSelectedSwimmerId,
    setSelectedStandardSetId,
    setSelectedStandardLevel,
    getBestTimeForEvent,
    getDeltaToStandard,
    getStandardTime,
    getSelectedSwimmer,
  } = useSwim();

  const [showAddSwimmer, setShowAddSwimmer] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<null | Parameters<typeof SwimmerSetupModal>[0]['editSwimmer']>(null);

  const swimmer = getSelectedSwimmer();
  const selectedSet = STANDARD_SETS.find(s => s.id === selectedStandardSetId);
  const eventsForCourse = getEventsForCourse(selectedCourseType);

  const eventsWithTimes = useMemo(() => {
    if (!selectedSwimmerId) return [];
    return eventsForCourse.map(event => {
      const best = getBestTimeForEvent(selectedSwimmerId, event.id);
      const delta = getDeltaToStandard(selectedSwimmerId, event.id);
      const stdTime = getStandardTime(selectedSwimmerId, event.id);
      return { event, best, delta, stdTime };
    }).filter(e => e.best !== null);
  }, [selectedSwimmerId, timeEntries, selectedStandardSetId, selectedStandardLevel, selectedCourseType]);

  const qualifiedCount = eventsWithTimes.filter(e => (e.delta ?? 1) <= 0).length;
  const totalEvents = eventsWithTimes.length;

  const webTop = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>Tracking</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {swimmer ? swimmer.name : 'My Swimmer'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            onPress={() => setShowAddSwimmer(true)}
          >
            <Feather name="user-plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Swimmer chips */}
        {swimmers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
            {swimmers.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  { backgroundColor: selectedSwimmerId === s.id ? colors.primary : colors.secondary, borderColor: selectedSwimmerId === s.id ? colors.primary : colors.border },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedSwimmerId(s.id); }}
                onLongPress={() => setEditingSwimmer(s)}
              >
                <Text style={[styles.chipText, { color: selectedSwimmerId === s.id ? '#FFF' : colors.foreground }]}>{s.name}</Text>
                <Text style={[styles.chipSub, { color: selectedSwimmerId === s.id ? '#FFFFFF99' : colors.mutedForeground }]}>
                  {s.ageGroup} · {s.gender === 'F' ? 'Girls' : 'Boys'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Standard Set picker */}
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Standard set</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {STANDARD_SETS.map(set => {
                const isSelected = selectedStandardSetId === set.id;
                const isLCM = set.courseType === 'LCM';
                return (
                  <TouchableOpacity
                    key={set.id}
                    style={[
                      styles.setChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedStandardSetId(set.id); }}
                  >
                    <Text style={[styles.setChipTitle, { color: isSelected ? '#FFF' : colors.foreground }]}>
                      {set.shortName}
                    </Text>
                    {isLCM && (
                      <View style={[styles.lcmTag, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.accent + '22' }]}>
                        <Text style={[styles.lcmTagText, { color: isSelected ? '#FFF' : colors.accent }]}>LCM</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Level picker — hidden for single-level sets (EZ) */}
        {selectedSet && selectedSet.levels.length > 1 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Target level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {selectedSet.levels.map(({ level, label }) => {
                  const isSelected = selectedStandardLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelChip,
                        { backgroundColor: isSelected ? colors.accent : colors.secondary, borderColor: isSelected ? colors.accent : colors.border },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedStandardLevel(level); }}
                    >
                      <Text style={[styles.levelChipText, { color: isSelected ? '#FFF' : colors.foreground }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      {swimmers.length === 0 ? (
        <EmptyState
          icon="user"
          title="Add a swimmer to get started"
          subtitle="Track your child's times and see their progress towards qualifying standards."
          actionLabel="Add Swimmer"
          onAction={() => setShowAddSwimmer(true)}
        />
      ) : eventsWithTimes.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No times logged yet"
          subtitle={`Go to the Log tab to record times. Make sure your meet type matches the ${selectedCourseType} standard set.`}
        />
      ) : (
        <>
          {/* Summary bar */}
          <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.qualified }]}>{qualifiedCount}</Text>
              <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Qualified</Text>
            </View>
            <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.foreground }]}>{totalEvents}</Text>
              <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Events</Text>
            </View>
            <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.primary }]} numberOfLines={1}>
                {selectedSet?.shortName ?? selectedStandardLevel}
              </Text>
              <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Standard</Text>
            </View>
          </View>

          <FlatList
            data={eventsWithTimes}
            keyExtractor={item => item.event.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const { event, best, delta, stdTime } = item;
              if (!best) return null;
              const status = delta !== null ? getDeltaStatus(delta) : 'far';
              const strokeColor = STROKE_COLORS[event.stroke];
              const meetName = meets.find(m => m.id === best.meetId)?.name ?? 'Unknown meet';

              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.strokeBar, { backgroundColor: strokeColor }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                        <Text style={[styles.meetName, { color: colors.mutedForeground }]}>{meetName}</Text>
                      </View>
                      <Text style={[styles.timeText, { color: colors.foreground }]}>
                        {formatHundredthsToTime(best.timeHundredths)}
                      </Text>
                    </View>
                    {delta !== null ? (
                      <View style={styles.badgeRow}>
                        <DeltaBadge
                          deltaHundredths={delta}
                          status={status}
                          size="sm"
                          showAbsTime={stdTime !== null}
                          standardTimeHundredths={stdTime ?? undefined}
                        />
                      </View>
                    ) : (
                      <Text style={[styles.noStd, { color: colors.mutedForeground }]}>
                        No {selectedStandardLevel} standard for this event / age group
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      <SwimmerSetupModal visible={showAddSwimmer} onClose={() => setShowAddSwimmer(false)} />
      {editingSwimmer && (
        <SwimmerSetupModal visible={!!editingSwimmer} onClose={() => setEditingSwimmer(null)} editSwimmer={editingSwimmer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scrollRow: { marginBottom: 12 },
  chip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  chipSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  pickerSection: { marginBottom: 10 },
  pickerLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 6 },
  setChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  setChipTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  lcmTag: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  lcmTagText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  levelChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  levelChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  summaryLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  summaryDiv: { width: StyleSheet.hairlineWidth, height: 32 },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  strokeBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eventName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  meetName: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  timeText: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  badgeRow: { flexDirection: 'row' },
  noStd: { fontFamily: 'Inter_400Regular', fontSize: 12, fontStyle: 'italic' },
});
