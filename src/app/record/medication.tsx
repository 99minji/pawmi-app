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

export default function MedicationRecordScreen() {
  const [medicationName, setMedicationName] = useState('');

  const [dosageText, setDosageText] = useState('');

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = medicationName.trim().length > 0;

  const handleSave = () => {
    if (!pet || !isValid) {
      return;
    }

    const now = new Date().toISOString();

    const name = medicationName.trim();

    const dosage = dosageText.trim();

    addRecord({
      id: `medication-${Date.now()}`,
      petId: pet.id,
      type: 'MEDICATION',

      title: `${name} 투약`,

      medicationName: name,

      dosageText: dosage.length > 0 ? dosage : undefined,

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
        <View>
          <AppText variant="heading1">먹인 약을 기록해볼까요?</AppText>

          <AppText variant="body1" color="secondary" style={styles.description}>
            약 이름과 복용 정보를 남겨두면 나중에 쉽게 확인할 수 있어요.
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <AppText variant="label" style={styles.label}>
              약 이름
            </AppText>

            <TextInput
              value={medicationName}
              onChangeText={setMedicationName}
              placeholder="예: 하트가드"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">복용량 · 메모</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={dosageText}
              onChangeText={setDosageText}
              placeholder="예: 1정, 저녁 식후"
              placeholderTextColor={colors.neutral[400]}
              multiline
              maxLength={200}
              style={[styles.input, styles.memoInput]}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="투약 기록하기"
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
    maxWidth: 320,
  },

  form: {
    marginTop: 36,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  label: {
    marginBottom: 2,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  input: {
    height: 56,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    borderRadius: 14,

    backgroundColor: colors.neutral[0],

    paddingHorizontal: 16,

    fontFamily: 'Pretendard-Regular',

    fontSize: 16,

    color: colors.neutral[900],
  },

  memoInput: {
    height: 110,
    paddingTop: 16,
    paddingBottom: 16,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
