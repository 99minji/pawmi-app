import { Cat, Dog } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { router } from 'expo-router';

export default function SpeciesScreen() {
  const species = useOnboardingStore((state) => state.species);
  const setSpecies = useOnboardingStore((state) => state.setSpecies);

  return (
    <OnboardingLayout
      step={2}
      title="어떤 반려동물과 함께하고 있나요?"
      footer={
        <PrimaryButton
          label="다음"
          disabled={!species}
          onPress={() => router.push('/onboarding/birth')}
        />
      }
    >
      <View style={styles.row}>
        <SpeciesCard
          label="강아지"
          selected={species === 'DOG'}
          onPress={() => setSpecies('DOG')}
          icon={<Dog size={32} color={colors.primary[700]} />}
        />

        <SpeciesCard
          label="고양이"
          selected={species === 'CAT'}
          onPress={() => setSpecies('CAT')}
          icon={<Cat size={32} color={colors.primary[700]} />}
        />
      </View>
    </OnboardingLayout>
  );
}

function SpeciesCard({
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
      <Text style={styles.label}>{label}</Text>
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
    borderColor: colors.border.soft,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    gap: 12,
    ...shadows.soft,
  },

  selectedCard: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  label: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 17,
    color: colors.neutral[900],
  },
});
