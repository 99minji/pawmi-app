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

export default function VetVisitRecordScreen() {
  const [clinicName, setClinicName] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [memo, setMemo] = useState('');

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = visitReason.trim().length > 0;

  const handleSave = () => {
    if (!pet || !isValid) {
      return;
    }

    const now = new Date().toISOString();

    const reason = visitReason.trim();

    const clinic = clinicName.trim();

    const memoText = memo.trim();

    addRecord({
      id: `vet-${Date.now()}`,

      petId: pet.id,

      type: 'VET_VISIT',

      title: clinic ? `${clinic} 방문` : '병원 방문',

      clinicName: clinic || undefined,

      visitReason: reason,

      memo: memoText || undefined,

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
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="병원 방문 기록하기"
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

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  input: {
    minHeight: 56,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    borderRadius: 14,

    backgroundColor: colors.neutral[0],

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
