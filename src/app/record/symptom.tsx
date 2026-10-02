import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';

export default function SymptomRecordScreen() {
  const [symptom, setSymptom] = useState('');

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = symptom.trim().length > 0;

  const handleSave = () => {
    if (!pet || !isValid) {
      return;
    }

    const now = new Date().toISOString();

    addRecord({
      id: `symptom-${Date.now()}`,
      petId: pet.id,
      type: 'SYMPTOM',
      title: symptom.trim(),
      symptom: symptom.trim(),
      occurredAt: now,
      createdAt: now,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <AppText variant="heading1">어떤 증상이 있었나요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          짧게 기록해도 괜찮아요.
        </AppText>

        <TextInput
          value={symptom}
          onChangeText={setSymptom}
          placeholder="예: 산책 중 오른쪽 뒷다리를 들었어요"
          placeholderTextColor={colors.neutral[400]}
          multiline
          maxLength={500}
          style={styles.input}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="기록하기"
          disabled={!isValid}
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },

  description: {
    marginTop: 8,
  },

  input: {
    minHeight: 160,
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    padding: 16,
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.neutral[900],
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
