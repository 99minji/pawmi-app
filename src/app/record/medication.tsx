import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { createMedicationRecord } from '@/services/health';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { dateToOccurredAt } from '@/utils/date';

export default function MedicationRecordScreen() {
  const [medicationName, setMedicationName] = useState('');

  const [dosageText, setDosageText] = useState('');

  const [memo, setMemo] = useState('');

  const [occurredDate, setOccurredDate] = useState(() => new Date());

  const [saving, setSaving] = useState(false);

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = medicationName.trim().length > 0;

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const trimmedName = medicationName.trim();

    if (!trimmedName) {
      Alert.alert('약 이름을 입력해주세요');

      return;
    }

    setSaving(true);

    try {
      const record = await createMedicationRecord(
        pet.id,
        trimmedName,
        dosageText,
        memo,
        dateToOccurredAt(occurredDate),
      );

      addRecord(record);

      router.back();
    } catch (error) {
      console.log('CREATE MEDICATION ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
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
              <AppText variant="label">복용량</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={dosageText}
              onChangeText={setDosageText}
              placeholder="예: 1정"
              placeholderTextColor={colors.neutral[400]}
              maxLength={50}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <DateField
            label="복용 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">복용 메모</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="예: 저녁 식후에 사료에 섞어서 먹였어요"
              placeholderTextColor={colors.neutral[400]}
              multiline
              maxLength={200}
              style={[styles.input, styles.memoInput]}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '기록 중...' : '기록하기'}
          disabled={!isValid || saving}
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

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
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
