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

import { EmptyState } from '@/components/EmptyState';
import { SwimmerSetupModal } from '@/components/SwimmerSetupModal';
import { EVENTS, STROKE_COLORS } from '@/constants/events';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { formatDelta, formatHundredthsToTime, getDeltaStatus } from '@/utils/timeUtils';

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
    swimmers, selectedSwimmerId, timeEntries, meets,
    setSelectedSwimmerId, getBestTimeForEvent, getStandardTimes, getSelectedSwimmer,
  } = useSwim();

  const [showAddSwimmer, setShowAddSwimmer] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<Parameters<typeof SwimmerSetupModal>[0]['editSwimmer']>(null);

  const swimmer = getSelectedSwimmer();
  const webTop = Platform.OS === 'web' ? 67 : 0;

  const eventsWithTimes = useMemo(() => {
    if (!selectedSwimmerId) return [];
    return EVENTS
      .map(event => {
        const best = getBestTimeForEvent(selectedSwimmerId, event.id);
        if (!best) return null;
        const std = getStandardTimes(selectedSwimmerId, event.id);
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
  }, [selectedSwimmerId, timeEntries, swimmers]);

  const goldQualified = eventsWithTimes.filter(e => (e.goldDelta ?? 1) <= 0).length;
  const zoneQualified = eventsWithTimes.filter(e => (e.zoneDelta ?? 1) <= 0).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTop + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>2026 LCM Standards</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {swimmer ? swimmer.name : 'SwimTrack'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.secondary }]} onPress={() => setShowAddSwimmer(true)}>
            <Feather name="user-plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Swimmer chips */}
        {swimmers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {swimmers.map(s => {
              const isSel = selectedSwimmerId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, { backgroundColor: isSel ? colors.primary : colors.secondary, borderColor: isSel ? colors.primary : colors.border }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedSwimmerId(s.id); }}
                  onLongPress={() => setEditingSwimmer(s)}
                >
                  <Text style={[styles.chipName, { color: isSel ? '#FFF' : colors.foreground }]}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {swimmers.length === 0 ? (
        <EmptyState icon="user" title="Add a swimmer to get started" subtitle="Track their best times against 2026 LCM Gold and EZ Zone qualifying standards." actionLabel="Add Swimmer" onAction={() => setShowAddSwimmer(true)} />
      ) : eventsWithTimes.length === 0 ? (
        <EmptyState icon="clock" title="No times logged yet" subtitle="Go to the Log tab to record a time. Each entry instantly shows your Gold and Zone deltas." />
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
              const meetName = meets.find(m => m.id === best.meetId)?.name;
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.strokeBar, { backgroundColor: strokeColor }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventName, { color: colors.foreground }]}>{event.displayName}</Text>
                        {meetName && <Text style={[styles.meetName, { color: colors.mutedForeground }]}>{meetName}</Text>}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 2 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chipsScroll: { marginBottom: 4 },
  chip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
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
