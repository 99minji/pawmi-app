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
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { createWeightRecord } from '@/services/health';
import { updatePetById } from '@/services/pet';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';

export default function WeightRecordScreen() {
  const [weight, setWeight] = useState('');

  const pet = usePetStore((state) => state.pet);
  const setPet = usePetStore((state) => state.setPet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const numericWeight = Number(weight);

  const isValid =
    weight.trim().length > 0 &&
    !Number.isNaN(numericWeight) &&
    numericWeight > 0;

  const handleSave = async () => {
    if (!pet) {
      return;
    }

    const weightKg = Number(weight);

    if (Number.isNaN(weightKg) || weightKg <= 0) {
      Alert.alert('체중을 확인해주세요', '올바른 체중을 입력해주세요.');

      return;
    }

    try {
      const record = await createWeightRecord(pet.id, weightKg);

      addRecord(record);

      const updatedPet = await updatePetById(pet.id, {
        weightKg,
      });

      setPet(updatedPet);

      router.back();
    } catch (error) {
      console.log('CREATE WEIGHT ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
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
          현재 체중을 입력해주세요.
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

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
