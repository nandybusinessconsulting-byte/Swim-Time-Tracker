import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
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

import type { AgeGroup, Gender } from '@/constants/standards';
import { AGE_GROUPS } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { birthYearToAgeGroup } from '@/utils/timeUtils';

interface SwimmerSetupModalProps {
  visible: boolean;
  onClose: () => void;
  editSwimmer?: { id: string; name: string; gender: Gender; birthYear: number; ageGroup: AgeGroup } | null;
}

export function SwimmerSetupModal({ visible, onClose, editSwimmer }: SwimmerSetupModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSwimmer, updateSwimmer } = useSwim();

  const [name, setName] = useState(editSwimmer?.name ?? '');
  const [gender, setGender] = useState<Gender>(editSwimmer?.gender ?? 'F');
  const [birthYear, setBirthYear] = useState(editSwimmer?.birthYear?.toString() ?? '');
  const [useAgeGroup, setUseAgeGroup] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(editSwimmer?.ageGroup ?? '11-12');

  const currentYear = new Date().getFullYear();
  const computedAgeGroup = birthYear && !useAgeGroup
    ? (birthYearToAgeGroup(parseInt(birthYear, 10)) as AgeGroup)
    : ageGroup;

  async function handleSave() {
    if (!name.trim()) return;
    const yr = parseInt(birthYear, 10);
    const ag = useAgeGroup ? ageGroup : (birthYear ? (birthYearToAgeGroup(yr) as AgeGroup) : ageGroup);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editSwimmer) {
      await updateSwimmer({ id: editSwimmer.id, name: name.trim(), gender, birthYear: yr || currentYear - 12, ageGroup: ag });
    } else {
      await addSwimmer({ name: name.trim(), gender, birthYear: yr || currentYear - 12, ageGroup: ag });
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {editSwimmer ? 'Edit Swimmer' : 'Add Swimmer'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Swimmer's name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus={!editSwimmer}
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>GENDER</Text>
            <View style={styles.segmentRow}>
              {(['F', 'M'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.segmentBtn,
                    { borderColor: colors.border, backgroundColor: gender === g ? colors.primary : colors.card },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.segmentText, { color: gender === g ? colors.primaryForeground : colors.foreground }]}>
                    {g === 'F' ? 'Girls' : 'Boys'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>BIRTH YEAR</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder={`e.g. ${currentYear - 12}`}
              placeholderTextColor={colors.mutedForeground}
              value={birthYear}
              onChangeText={setBirthYear}
              keyboardType="number-pad"
              maxLength={4}
            />
            {birthYear.length === 4 && (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Age group: {computedAgeGroup}
              </Text>
            )}
          </View>

          {(!birthYear || useAgeGroup) && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>AGE GROUP</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {AGE_GROUPS.map(ag => (
                    <TouchableOpacity
                      key={ag}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: ageGroup === ag ? colors.primary : colors.card },
                      ]}
                      onPress={() => setAgeGroup(ag)}
                    >
                      <Text style={[styles.chipText, { color: ageGroup === ag ? colors.primaryForeground : colors.foreground }]}>
                        {ag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  closeBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
