import { router } from 'expo-router';
import { StyleSheet, TextInput } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export default function NameScreen() {
  const name = useOnboardingStore((state) => state.name);
  const setName = useOnboardingStore((state) => state.setName);

  const handleNext = () => {
    router.push('/onboarding/species');
  };

  return (
    <OnboardingLayout
      step={1}
      title="반려동물의 이름이 무엇인가요?"
      description="앞으로 포우미가 이름으로 불러드릴게요."
      footer={
        <PrimaryButton
          label="다음"
          onPress={handleNext}
          disabled={!name.trim()}
        />
      }
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="이름을 입력해주세요"
        placeholderTextColor={colors.neutral[400]}
        autoFocus
        maxLength={20}
        style={styles.input}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: 16,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 16,
    fontFamily: 'Pretendard-Regular',
    fontSize: 17,
    color: colors.neutral[900],
  },
});
