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

import type { CourseType } from '@/constants/standards';
import { useSwim } from '@/context/SwimContext';
import type { Meet } from '@/context/SwimContext';
import { useColors } from '@/hooks/useColors';

interface AddMeetSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (meet: Meet) => void;
}

export function AddMeetSheet({ visible, onClose, onCreated }: AddMeetSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMeet } = useSwim();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('SCY');

  async function handleCreate() {
    if (!name.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const meet = await addMeet({
      name: name.trim(),
      location: location.trim(),
      courseType,
      date: new Date().toISOString(),
    });
    setName('');
    setLocation('');
    onCreated(meet);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>New Meet</Text>
          <TouchableOpacity onPress={handleCreate} style={[styles.createBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>MEET NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. City Championships"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>LOCATION (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. University Aquatic Center"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
            returnKeyType="done"
          />

          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>COURSE</Text>
          <View style={styles.courseRow}>
            {(['SCY', 'SCM', 'LCM'] as CourseType[]).map(ct => (
              <TouchableOpacity
                key={ct}
                style={[
                  styles.courseBtn,
                  { borderColor: colors.border, backgroundColor: courseType === ct ? colors.primary : colors.card },
                ]}
                onPress={() => setCourseType(ct)}
              >
                <Text style={[styles.courseBtnText, { color: courseType === ct ? colors.primaryForeground : colors.foreground }]}>
                  {ct}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { padding: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  courseRow: { flexDirection: 'row', gap: 10 },
  courseBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
