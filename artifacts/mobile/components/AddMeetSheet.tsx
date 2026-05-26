import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getListMeetsQueryKey, useListMeets } from '@workspace/api-client-react';

import { useColors } from '@/hooks/useColors';

interface AddMeetSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (name: string, location: string) => void;
}

export function AddMeetSheet({ visible, onClose, onCreated }: AddMeetSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data: meetsData, isLoading: meetsLoading } = useListMeets({
    query: {
      queryKey: getListMeetsQueryKey(),
      enabled: visible,
      staleTime: 60 * 60 * 1000,
    },
  });

  const suggestions = useMemo(() => {
    if (!meetsData?.meets) return [];
    const q = name.trim().toLowerCase();
    if (!q) return meetsData.meets.slice(0, 8);
    return meetsData.meets
      .filter(m => m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q))
      .slice(0, 6);
  }, [meetsData, name]);

  async function handleCreate(overrideName?: string, overrideLocation?: string) {
    const finalName = (overrideName ?? name).trim();
    const finalLocation = (overrideLocation ?? location).trim();
    if (!finalName) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName('');
    setLocation('');
    onCreated(finalName, finalLocation);
    onClose();
  }

  function handleSelectSuggestion(meetName: string, meetLocation: string) {
    setName(meetName);
    setLocation(meetLocation);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>New Meet</Text>
          <TouchableOpacity
            onPress={() => handleCreate()}
            disabled={!name.trim()}
            style={[styles.createBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
          >
            <Text style={[styles.createBtnText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Meet name */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>MEET NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. NJ SCAR Memorial Day"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />

          {/* Location */}
          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>LOCATION (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Piscataway, NJ"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
            returnKeyType="done"
            onSubmitEditing={() => handleCreate()}
          />

          {/* NJ Meets suggestions */}
          <View style={styles.suggestionsHeader}>
            <Text style={[styles.suggestionsTitle, { color: colors.mutedForeground }]}>
              NJ MEETS FROM SWIMCLOUD
            </Text>
            {meetsLoading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {!meetsLoading && meetsData && meetsData.meets.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No NJ meets found — type a name above to create one.
            </Text>
          )}

          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={item => item.url}
              style={[styles.suggestionList, { borderColor: colors.border }]}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectSuggestion(item.name, item.location)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionInfo}>
                    <Text style={[styles.suggestionName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.location} · {item.date}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { padding: 20, flex: 1 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  input: {
    height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular', fontSize: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 28, marginBottom: 8,
  },
  suggestionsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  suggestionList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionInfo: { flex: 1, gap: 2, marginRight: 8 },
  suggestionName: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  suggestionMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
