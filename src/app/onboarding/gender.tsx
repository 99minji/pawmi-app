import { router } from 'expo-router';
import { Mars, Venus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export default function GenderScreen() {
  const name = useOnboardingStore((state) => state.name);
  const gender = useOnboardingStore((state) => state.gender);

  const setGender = useOnboardingStore((state) => state.setGender);

  return (
    <OnboardingLayout
      step={4}
      title={`${name}의 성별을 알려주세요.`}
      footer={
        <PrimaryButton
          label="다음"
          disabled={!gender}
          onPress={() => router.push('/onboarding/avatar')}
        />
      }
    >
      <View style={styles.row}>
        <GenderCard
          label="남아"
          selected={gender === 'MALE'}
          onPress={() => setGender('MALE')}
          icon={
            <Mars
              size={32}
              color={
                gender === 'MALE' ? colors.primary[700] : colors.neutral[500]
              }
            />
          }
        />

        <GenderCard
          label="여아"
          selected={gender === 'FEMALE'}
          onPress={() => setGender('FEMALE')}
          icon={
            <Venus
              size={32}
              color={
                gender === 'FEMALE' ? colors.primary[700] : colors.neutral[500]
              }
            />
          }
        />
      </View>
    </OnboardingLayout>
  );
}

function GenderCard({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.selectedCard]}
    >
      {icon}

      <AppText
        variant="body1"
        color={selected ? 'brand' : 'primary'}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },

  card: {
    flex: 1,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    gap: 12,
  },

  selectedCard: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  label: {
    fontFamily: 'Pretendard-SemiBold',
  },
});
