import { router, useLocalSearchParams } from 'expo-router';
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
import { createSymptomRecord } from '@/services/health';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { dateToOccurredAt } from '@/utils/date';

export default function SymptomRecordScreen() {
  const params = useLocalSearchParams<{
    ai?: string;
    occurredAt?: string;
    symptom?: string;
    memo?: string;
  }>();

  const [symptom, setSymptom] = useState(
    typeof params.symptom === 'string' ? params.symptom : '',
  );

  const [memo, setMemo] = useState(
    typeof params.memo === 'string' ? params.memo : '',
  );

  const [occurredDate, setOccurredDate] = useState(() =>
    typeof params.occurredAt === 'string' && params.occurredAt
      ? parseLocalDate(params.occurredAt)
      : new Date(),
  );

  const [saving, setSaving] = useState(false);

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = symptom.trim().length > 0;

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const trimmedSymptom = symptom.trim();

    if (!trimmedSymptom) {
      Alert.alert('증상을 입력해주세요');

      return;
    }

    setSaving(true);

    try {
      const record = await createSymptomRecord(
        pet.id,
        trimmedSymptom,
        memo,
        dateToOccurredAt(occurredDate),
      );

      addRecord(record);

      router.back();
    } catch (error) {
      console.log('CREATE SYMPTOM ERROR:', error);

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

        <View style={styles.dateField}>
          <DateField
            label="기록 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />
        </View>

        <View style={styles.memoField}>
          <View style={styles.labelRow}>
            <AppText variant="label">메모</AppText>

            <AppText variant="label" color="tertiary">
              선택
            </AppText>
          </View>

          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="예: 저녁 이후로는 괜찮아 보였어요"
            placeholderTextColor={colors.neutral[400]}
            multiline
            maxLength={500}
            style={[styles.input, styles.memoInput]}
            textAlignVertical="top"
          />
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

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  },

  input: {
    minHeight: 160,
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: 16,
    backgroundColor: colors.surface.card,
    padding: 16,
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.neutral[900],
  },

  dateField: {
    marginTop: 28,
  },

  memoField: {
    marginTop: 28,
    gap: 10,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  memoInput: {
    minHeight: 110,
    marginTop: 0,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
