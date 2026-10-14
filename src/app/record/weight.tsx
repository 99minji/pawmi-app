import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { createWeightRecord } from '@/services/health';
import { updatePetById } from '@/services/pet';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { dateToOccurredAt } from '@/utils/date';
import { isWeightRecord, sortByLatest } from '@/utils/health';

export default function WeightRecordScreen() {
  const [weight, setWeight] = useState('');

  const [occurredDate, setOccurredDate] = useState(() => new Date());

  const [saving, setSaving] = useState(false);

  const pet = usePetStore((state) => state.pet);
  const setPet = usePetStore((state) => state.setPet);

  const records = useHealthStore((state) => state.records);

  const addRecord = useHealthStore((state) => state.addRecord);

  const numericWeight = Number(weight);

  const isValid =
    weight.trim().length > 0 &&
    !Number.isNaN(numericWeight) &&
    numericWeight > 0;

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const weightKg = Number(weight);

    if (Number.isNaN(weightKg) || weightKg <= 0) {
      Alert.alert('체중을 확인해주세요', '올바른 체중을 입력해주세요.');

      return;
    }

    const occurredAt = dateToOccurredAt(occurredDate);

    // 지난 날짜 기록이 현재 체중을 덮어쓰지 않도록, 가장 최근 기록일 때만 반려동물 체중을 갱신한다.
    const latestWeightRecord = sortByLatest(
      records.filter(
        (record) => record.petId === pet.id && isWeightRecord(record),
      ),
    )[0];

    const isLatest =
      !latestWeightRecord ||
      new Date(occurredAt).getTime() >=
        new Date(latestWeightRecord.occurredAt).getTime();

    setSaving(true);

    try {
      const record = await createWeightRecord(pet.id, weightKg, occurredAt);

      addRecord(record);
    } catch (error) {
      console.log('CREATE WEIGHT ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');

      setSaving(false);

      return;
    }

    // 체중 기록은 이미 저장됐으므로, 반려동물 체중 갱신이 실패해도
    // 재시도로 기록이 중복되지 않게 화면은 닫는다.
    try {
      if (isLatest) {
        const updatedPet = await updatePetById(pet.id, {
          weightKg,
        });

        setPet(updatedPet);
      }
    } catch (error) {
      console.log('UPDATE PET WEIGHT ERROR:', error);
    } finally {
      setSaving(false);

      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <AppText variant="heading1">체중을 기록해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          체중과 잰 날짜를 입력해주세요.
        </AppText>

        <View style={styles.inputRow}>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="0.0"
            placeholderTextColor={colors.neutral[400]}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.input}
          />

          <AppText variant="heading2">kg</AppText>
        </View>

        <View style={styles.dateField}>
          <DateField
            label="측정 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />
        </View>
      </View>

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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },

  description: {
    marginTop: 8,
  },

  inputRow: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  input: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 24,
    color: colors.neutral[900],
  },

  dateField: {
    marginTop: 28,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
