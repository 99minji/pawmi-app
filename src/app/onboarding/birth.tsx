import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

type BirthMode = 'DATE' | 'AGE';

export default function BirthScreen() {
  const birthDate = useOnboardingStore((state) => state.birthDate);

  const estimatedAge = useOnboardingStore((state) => state.estimatedAge);

  const setBirthDate = useOnboardingStore((state) => state.setBirthDate);

  const setEstimatedAge = useOnboardingStore((state) => state.setEstimatedAge);

  const [mode, setMode] = useState<BirthMode>(
    estimatedAge !== null ? 'AGE' : 'DATE',
  );

  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = birthDate ? parseDate(birthDate) : new Date();

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (!date) {
      return;
    }

    setBirthDate(formatDateValue(date));
  };

  const handleModeChange = (nextMode: BirthMode) => {
    setMode(nextMode);

    if (nextMode === 'DATE') {
      setEstimatedAge(null);
    }

    if (nextMode === 'AGE') {
      setBirthDate('');
    }
  };

  const age = estimatedAge ?? 1;

  const decreaseAge = () => {
    setEstimatedAge(Math.max(0, age - 1));
  };

  const increaseAge = () => {
    setEstimatedAge(Math.min(30, age + 1));
  };

  const isValid = mode === 'DATE' ? Boolean(birthDate) : estimatedAge !== null;

  return (
    <OnboardingLayout
      step={3}
      title="생일은 언제인가요?"
      description="정확한 생일을 모르더라도 괜찮아요."
      footer={
        <PrimaryButton
          label="다음"
          disabled={!isValid}
          onPress={() => router.push('/onboarding/gender')}
        />
      }
    >
      <View style={styles.modeContainer}>
        <ModeButton
          label="생일을 알아요"
          selected={mode === 'DATE'}
          onPress={() => handleModeChange('DATE')}
        />

        <ModeButton
          label="정확히 몰라요"
          selected={mode === 'AGE'}
          onPress={() => handleModeChange('AGE')}
        />
      </View>

      {mode === 'DATE' ? (
        <>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <AppText variant="body1" color={birthDate ? 'primary' : 'tertiary'}>
              {birthDate ? formatKoreanDate(birthDate) : '생일을 선택해주세요'}
            </AppText>
          </Pressable>

          {showPicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
                locale="ko-KR"
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.ageBox}>
          <AppText variant="body2" color="secondary">
            대략 몇 살인가요?
          </AppText>

          <View style={styles.ageControl}>
            <Pressable style={styles.ageButton} onPress={decreaseAge}>
              <Minus size={20} color={colors.primary[700]} />
            </Pressable>

            <AppText variant="heading1" style={styles.ageText}>
              {age}살
            </AppText>

            <Pressable style={styles.ageButton} onPress={increaseAge}>
              <Plus size={20} color={colors.primary[700]} />
            </Pressable>
          </View>
        </View>
      )}
    </OnboardingLayout>
  );
}

function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, selected && styles.modeButtonSelected]}
    >
      <AppText variant="body2" color={selected ? 'brand' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return `${year}년 ${month}월 ${day}일`;
}

const styles = StyleSheet.create({
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },

  modeButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  modeButtonSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  dateButton: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
  },

  pickerWrapper: {
    marginTop: 16,
  },

  ageBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
  },

  ageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 28,
  },

  ageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  ageText: {
    minWidth: 70,
    textAlign: 'center',
  },
});
