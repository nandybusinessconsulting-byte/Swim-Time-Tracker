import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
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

import type { Gender } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import type { Swimmer } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';
import { birthYearToAgeGroup } from '@/utils/timeUtils';

interface SwimmerSetupModalProps {
  visible: boolean;
  onClose: () => void;
  editSwimmer?: Swimmer | null;
}

export function SwimmerSetupModal({ visible, onClose, editSwimmer }: SwimmerSetupModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSwimmer, updateSwimmer } = useSwim();

  const [name, setName]       = useState(editSwimmer?.name ?? '');
  const [gender, setGender]   = useState<Gender>(editSwimmer?.gender ?? 'F');
  const [birthYear, setBirthYear] = useState(editSwimmer?.birthYear?.toString() ?? '');

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(birthYear, 10);
  const ageGroup = birthYear.length === 4 && !isNaN(yearNum) ? birthYearToAgeGroup(yearNum) : null;

  async function handleSave() {
    if (!name.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const yr = yearNum || currentYear - 12;
    if (editSwimmer) {
      await updateSwimmer({ id: editSwimmer.id, name: name.trim(), gender, birthYear: yr });
    } else {
      await addSwimmer({ name: name.trim(), gender, birthYear: yr });
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

        <View style={styles.body}>
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
            <View style={styles.segRow}>
              {(['F', 'M'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.segBtn, { borderColor: colors.border, backgroundColor: gender === g ? colors.primary : colors.card }]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.segText, { color: gender === g ? colors.primaryForeground : colors.foreground }]}>
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
            {ageGroup && (
              <View style={[styles.agePill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.ageText, { color: colors.mutedForeground }]}>
                  Age group: <Text style={[styles.ageValue, { color: colors.primary }]}>{ageGroup}</Text>
                  {'  ·  '}LCM 2026 standards applied
                </Text>
              </View>
            )}
          </View>
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
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  closeBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  input: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 16 },
  segRow: { flexDirection: 'row', gap: 10 },
  segBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  agePill: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  ageText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  ageValue: { fontFamily: 'Inter_600SemiBold' },
});
