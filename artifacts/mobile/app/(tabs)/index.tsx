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
import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { STANDARD_LEVELS } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import {
  formatHundredthsToTime,
  getDeltaStatus,
} from '@/utils/timeUtils';

export default function TrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    swimmers,
    selectedSwimmerId,
    selectedStandardLevel,
    timeEntries,
    setSelectedSwimmerId,
    setSelectedStandardLevel,
    getBestTimeForEvent,
    getDeltaToStandard,
    getSelectedSwimmer,
    meets,
  } = useSwim();

  const [showAddSwimmer, setShowAddSwimmer] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<null | Parameters<typeof SwimmerSetupModal>[0]['editSwimmer']>(null);

  const swimmer = getSelectedSwimmer();

  const eventsWithTimes = useMemo(() => {
    if (!selectedSwimmerId) return [];
    return EVENTS.map(event => {
      const best = getBestTimeForEvent(selectedSwimmerId, event.id);
      const delta = getDeltaToStandard(selectedSwimmerId, event.id);
      return { event, best, delta };
    }).filter(e => e.best !== null);
  }, [selectedSwimmerId, timeEntries, selectedStandardLevel]);

  const qualifiedCount = eventsWithTimes.filter(e => (e.delta ?? 1) <= 0).length;
  const totalEvents = eventsWithTimes.length;

  const webTop = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + webTop + 8,
        },
      ]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>Tracking</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {swimmer ? swimmer.name : 'My Swimmer'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addSwimmerBtn, { backgroundColor: colors.secondary }]}
            onPress={() => setShowAddSwimmer(true)}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Swimmer Picker */}
        {swimmers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swimmerScroll}>
            {swimmers.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.swimmerChip,
                  {
                    backgroundColor: selectedSwimmerId === s.id ? colors.primary : colors.secondary,
                    borderColor: selectedSwimmerId === s.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSwimmerId(s.id);
                }}
                onLongPress={() => setEditingSwimmer(s)}
              >
                <Text style={[
                  styles.swimmerChipText,
                  { color: selectedSwimmerId === s.id ? colors.primaryForeground : colors.foreground },
                ]}>
                  {s.name}
                </Text>
                <Text style={[
                  styles.swimmerChipSub,
                  { color: selectedSwimmerId === s.id ? colors.primaryForeground + 'CC' : colors.mutedForeground },
                ]}>
                  {s.ageGroup} · {s.gender === 'F' ? 'Girls' : 'Boys'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Standard Level Picker */}
        <View style={styles.standardRow}>
          <Text style={[styles.standardLabel, { color: colors.mutedForeground }]}>Target</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.levelChips}>
              {STANDARD_LEVELS.map(({ level, label }) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelChip,
                    {
                      backgroundColor: selectedStandardLevel === level ? colors.accent : colors.secondary,
                      borderColor: selectedStandardLevel === level ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedStandardLevel(level);
                  }}
                >
                  <Text style={[
                    styles.levelChipText,
                    { color: selectedStandardLevel === level ? '#FFF' : colors.foreground },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Content */}
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
          subtitle="Tap the Log tab to record your first swim time."
        />
      ) : (
        <>
          {/* Summary Banner */}
          {totalEvents > 0 && (
            <View style={[styles.summaryBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: colors.qualified }]}>{qualifiedCount}</Text>
                <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Qualified</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: colors.foreground }]}>{totalEvents}</Text>
                <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Events</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: colors.primary }]}>{selectedStandardLevel}</Text>
                <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>Standard</Text>
              </View>
            </View>
          )}

          <FlatList
            data={eventsWithTimes}
            keyExtractor={item => item.event.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!!eventsWithTimes.length}
            renderItem={({ item }) => {
              const { event, best, delta } = item;
              if (!best) return null;
              const status = delta !== null ? getDeltaStatus(delta) : 'far';
              const strokeColor = STROKE_COLORS[event.stroke];

              const meetName = meets.find(m => m.id === best.meetId)?.name ?? 'Unknown meet';

              return (
                <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.strokeBar, { backgroundColor: strokeColor }]} />
                  <View style={styles.entryContent}>
                    <View style={styles.entryTop}>
                      <View>
                        <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                        <Text style={[styles.meetName, { color: colors.mutedForeground }]}>{meetName}</Text>
                      </View>
                      <Text style={[styles.timeText, { color: colors.foreground }]}>
                        {formatHundredthsToTime(best.timeHundredths)}
                      </Text>
                    </View>
                    {delta !== null && (
                      <View style={styles.deltaRow}>
                        <DeltaBadge deltaHundredths={delta} status={status} size="sm" />
                      </View>
                    )}
                    {delta === null && (
                      <Text style={[styles.noStd, { color: colors.mutedForeground }]}>
                        No {selectedStandardLevel} standard for this event/age group
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      <SwimmerSetupModal
        visible={showAddSwimmer}
        onClose={() => setShowAddSwimmer(false)}
      />
      {editingSwimmer && (
        <SwimmerSetupModal
          visible={!!editingSwimmer}
          onClose={() => setEditingSwimmer(null)}
          editSwimmer={editingSwimmer}
        />
      )}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  addSwimmerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swimmerScroll: { marginBottom: 12 },
  swimmerChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  swimmerChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  swimmerChipSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  standardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  standardLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  levelChips: { flexDirection: 'row', gap: 6 },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  levelChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  summaryLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  listContent: { padding: 16, gap: 10 },
  entryCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  strokeBar: { width: 4 },
  entryContent: { flex: 1, padding: 14 },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  meetName: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  timeText: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  deltaRow: { flexDirection: 'row' },
  noStd: { fontFamily: 'Inter_400Regular', fontSize: 12, fontStyle: 'italic' },
});
