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
import { createVetVisitRecord } from '@/services/health';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { dateToOccurredAt } from '@/utils/date';

export default function VetVisitRecordScreen() {
  const params = useLocalSearchParams<{
    ai?: string;
    occurredAt?: string;
    clinicName?: string;
    visitReason?: string;
    memo?: string;
  }>();

  const [clinicName, setClinicName] = useState(
    typeof params.clinicName === 'string' ? params.clinicName : '',
  );

  const [visitReason, setVisitReason] = useState(
    typeof params.visitReason === 'string' ? params.visitReason : '',
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

  const isValid = visitReason.trim().length > 0;

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const trimmedReason = visitReason.trim();

    if (!trimmedReason) {
      Alert.alert('방문 이유를 입력해주세요');

      return;
    }

    setSaving(true);

    try {
      const record = await createVetVisitRecord(
        pet.id,
        trimmedReason,
        clinicName,
        memo,
        dateToOccurredAt(occurredDate),
      );

      addRecord(record);

      router.back();
    } catch (error) {
      console.log('CREATE VET VISIT ERROR:', error);

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
        <AppText variant="heading1">병원 방문을 기록해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          진료 내용을 남겨두면 나중에 다시 확인하기 쉬워요.
        </AppText>

        <View style={styles.form}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">병원명</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="예: 포우미 동물병원"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
          </View>

          <DateField
            label="방문 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />

          <View style={styles.field}>
            <AppText variant="label">진료 내용</AppText>

            <TextInput
              value={visitReason}
              onChangeText={setVisitReason}
              placeholder="예: 오른쪽 뒷다리 절뚝거림 진료"
              placeholderTextColor={colors.neutral[400]}
              multiline
              maxLength={300}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">메모</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="예: 3일간 산책을 줄이기로 했어요"
              placeholderTextColor={colors.neutral[400]}
              multiline
              maxLength={500}
              style={[styles.input, styles.textArea]}
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
    maxWidth: 320,
  },

  form: {
    marginTop: 36,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  input: {
    minHeight: 56,

    borderWidth: 1,
    borderColor: colors.border.input,

    borderRadius: 16,

    backgroundColor: colors.surface.card,

    paddingHorizontal: 16,

    fontFamily: 'Pretendard-Regular',

    fontSize: 16,

    color: colors.neutral[900],
  },

  textArea: {
    minHeight: 110,
    paddingTop: 16,
    paddingBottom: 16,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
