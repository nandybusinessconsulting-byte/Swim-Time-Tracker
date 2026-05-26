import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SwimmerProfile } from '@/context/SwimContext';
import { AGE_GROUPS, type AgeGroup } from '@/constants/standards';
import { useColors } from '@/hooks/useColors';
import { NJ_CLUBS, type NJClub } from '@/constants/njClubs';

const USA_ID_MAX = 14;
const USA_ID_REGEX = /^[A-Z0-9]*$/;

function formatUsaId(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, USA_ID_MAX);
}

interface ClubPickerProps {
  visible: boolean;
  selected: string;
  onSelect: (club: NJClub) => void;
  onClose: () => void;
}

function ClubPicker({ visible, selected, onSelect, onClose }: ClubPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NJ_CLUBS;
    return NJ_CLUBS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const renderItem = useCallback(({ item }: { item: NJClub }) => {
    const isSel = item.name === selected || item.code === selected;
    return (
      <TouchableOpacity
        style={[
          cpStyles.item,
          { borderBottomColor: colors.border },
          isSel && { backgroundColor: colors.primary + '12' },
        ]}
        onPress={() => { onSelect(item); onClose(); }}
        activeOpacity={0.7}
      >
        <View style={cpStyles.itemLeft}>
          <Text style={[cpStyles.itemName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[cpStyles.itemCode, { color: colors.mutedForeground }]}>{item.code}</Text>
        </View>
        {isSel && <Feather name="check" size={18} color={colors.primary} />}
      </TouchableOpacity>
    );
  }, [selected, colors]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[cpStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[cpStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[cpStyles.title, { color: colors.foreground }]}>Select Club</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Search */}
        <View style={[cpStyles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={[cpStyles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or club code…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {/* Count */}
        <Text style={[cpStyles.count, { color: colors.mutedForeground }]}>
          {filtered.length} club{filtered.length !== 1 ? 's' : ''}
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={null}
        />
      </View>
    </Modal>
  );
}

const cpStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, padding: 0 },
  count: { fontFamily: 'Inter_400Regular', fontSize: 12, marginHorizontal: 16, marginBottom: 6, marginTop: 4 },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: { gap: 2 },
  itemName: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  itemCode: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});

interface EditProfileSheetProps {
  visible: boolean;
  initial: SwimmerProfile;
  onSave: (p: SwimmerProfile) => void;
  onClose: () => void;
}

export function EditProfileSheet({ visible, initial, onSave, onClose }: EditProfileSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<SwimmerProfile>(initial);
  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [idInfoOpen, setIdInfoOpen] = useState(false);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible]);

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

  function handleUsaIdChange(raw: string) {
    setDraft(d => ({ ...d, usaSwimmingId: formatUsaId(raw) }));
  }

  async function handleSave() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ ...draft, name: draft.name.trim(), club: draft.club.trim() });
    onClose();
  }

  const idLen = draft.usaSwimmingId.length;
  const idValid = idLen === 0 || idLen === USA_ID_MAX;
  const canSave = draft.name.trim().length > 0;

  return (
    <>
      <Modal visible={visible && !clubPickerOpen} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={[epStyles.container, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[epStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[epStyles.cancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[epStyles.title, { color: colors.foreground }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[epStyles.saveText, { color: canSave ? colors.primary : colors.mutedForeground }]}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={epStyles.scroll}
            contentContainerStyle={epStyles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo */}
            <View style={epStyles.photoRow}>
              <TouchableOpacity onPress={pickPhoto} style={epStyles.photoBtn} activeOpacity={0.8}>
                {draft.photoUri ? (
                  <Image source={{ uri: draft.photoUri }} style={epStyles.photo} contentFit="cover" />
                ) : (
                  <View style={[epStyles.photoPlaceholder, { backgroundColor: colors.primary + '22' }]}>
                    <Feather name="user" size={32} color={colors.primary} />
                  </View>
                )}
                <View style={[epStyles.cameraChip, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={[epStyles.photoHint, { color: colors.mutedForeground }]}>
                Tap to change photo
              </Text>
            </View>

            {/* Name */}
            <View style={epStyles.fieldGroup}>
              <Text style={[epStyles.fieldLabel, { color: colors.mutedForeground }]}>SWIMMER NAME *</Text>
              <TextInput
                style={[epStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Full name"
                placeholderTextColor={colors.mutedForeground}
                value={draft.name}
                onChangeText={v => setDraft(d => ({ ...d, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
                autoFocus
              />
            </View>

            {/* Club picker */}
            <View style={epStyles.fieldGroup}>
              <Text style={[epStyles.fieldLabel, { color: colors.mutedForeground }]}>SWIM CLUB / TEAM</Text>
              <TouchableOpacity
                style={[epStyles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setClubPickerOpen(true)}
                activeOpacity={0.7}
              >
                {draft.club ? (
                  <View style={epStyles.pickerContent}>
                    <View>
                      <Text style={[epStyles.pickerValue, { color: colors.foreground }]}>{draft.club}</Text>
                      {NJ_CLUBS.find(c => c.name === draft.club) && (
                        <Text style={[epStyles.pickerCode, { color: colors.mutedForeground }]}>
                          {NJ_CLUBS.find(c => c.name === draft.club)!.code}
                        </Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </View>
                ) : (
                  <View style={epStyles.pickerContent}>
                    <Text style={[epStyles.pickerPlaceholder, { color: colors.mutedForeground }]}>
                      Select NJ club…
                    </Text>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={epStyles.otherClubRow}
                onPress={() => {
                  setDraft(d => ({ ...d, club: '' }));
                }}
              >
                <Text style={[epStyles.otherClubText, { color: colors.primary }]}>
                  {draft.club ? 'Clear selection' : 'Type a club name manually instead'}
                </Text>
              </TouchableOpacity>
              {!NJ_CLUBS.find(c => c.name === draft.club) && draft.club.length > 0 && (
                <TextInput
                  style={[epStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
                  placeholder="Enter club name"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.club}
                  onChangeText={v => setDraft(d => ({ ...d, club: v }))}
                  autoCapitalize="words"
                />
              )}
            </View>

            {/* Age Group */}
            <View style={epStyles.fieldGroup}>
              <Text style={[epStyles.fieldLabel, { color: colors.mutedForeground }]}>AGE GROUP</Text>
              <View style={[epStyles.segRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                {AGE_GROUPS.map(ag => {
                  const sel = draft.ageGroup === ag;
                  return (
                    <TouchableOpacity
                      key={ag}
                      style={[epStyles.segBtn, sel && { backgroundColor: colors.primary }]}
                      onPress={() => setDraft(d => ({ ...d, ageGroup: ag as AgeGroup }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[epStyles.segText, { color: sel ? '#FFF' : colors.mutedForeground }]}>{ag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* USA Swimming ID */}
            <View style={epStyles.fieldGroup}>
              <View style={epStyles.labelRow}>
                <Text style={[epStyles.fieldLabel, { color: colors.mutedForeground }]}>USA SWIMMING ID</Text>
                <TouchableOpacity onPress={() => setIdInfoOpen(v => !v)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Feather name="info" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {idInfoOpen && (
                <View style={[epStyles.infoBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                  <Text style={[epStyles.infoText, { color: colors.foreground }]}>
                    Your USA Swimming ID is a 14-character code on your USA Swimming membership card or online at{' '}
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }}>usaswimming.org</Text>.{'\n\n'}
                    Format: 3 letters (last name) + birth MMDDYYYY + 3 alphanumeric characters.{'\n'}
                    Example: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>SMI0315201001A</Text>
                  </Text>
                </View>
              )}

              <View style={epStyles.idRow}>
                <TextInput
                  style={[
                    epStyles.input,
                    epStyles.idInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: !idValid ? '#EF4444' : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="e.g. SMI0315201001A"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.usaSwimmingId}
                  onChangeText={handleUsaIdChange}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={USA_ID_MAX}
                  keyboardType="default"
                  returnKeyType="done"
                />
                <View style={[epStyles.idCounter, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[epStyles.idCounterText, { color: idLen === USA_ID_MAX ? colors.primary : colors.mutedForeground }]}>
                    {idLen}/{USA_ID_MAX}
                  </Text>
                </View>
              </View>
              {idLen > 0 && !idValid && (
                <Text style={[epStyles.idError, { color: '#EF4444' }]}>
                  Must be exactly {USA_ID_MAX} characters
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ClubPicker
        visible={clubPickerOpen}
        selected={draft.club}
        onSelect={club => setDraft(d => ({ ...d, club: club.name }))}
        onClose={() => setClubPickerOpen(false)}
      />
    </>
  );
}

const epStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  cancelText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 24, paddingBottom: 40 },
  segRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginTop: 6 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  photoRow: { alignItems: 'center', gap: 8 },
  photoBtn: { position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  cameraChip: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontFamily: 'Inter_400Regular', fontSize: 13 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8 },
  input: {
    height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular', fontSize: 16,
  },

  pickerBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  pickerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerValue: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  pickerCode: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 1 },
  pickerPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  otherClubRow: { alignSelf: 'flex-start' },
  otherClubText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  idInput: { flex: 1, letterSpacing: 1.5 },
  idCounter: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  idCounterText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  idError: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
