import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { AVATAR_BREED_LABELS, petAvatars } from '@/constants/petAvatars';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { usePetStore } from '@/stores/usePetStore';

import { mapPetFromDb } from '@/mappers/pet';
import { createPet } from '@/services/pet';

export default function AvatarScreen() {
  const name = useOnboardingStore((state) => state.name);

  const species = useOnboardingStore((state) => state.species);

  const birthDate = useOnboardingStore((state) => state.birthDate);

  const estimatedAge = useOnboardingStore((state) => state.estimatedAge);

  const gender = useOnboardingStore((state) => state.gender);

  const avatarBreed = useOnboardingStore((state) => state.avatarBreed);

  const setAvatarBreed = useOnboardingStore((state) => state.setAvatarBreed);

  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );

  const setPet = usePetStore((state) => state.setPet);

  const handleComplete = async () => {
    if (!species || !gender) {
      return;
    }

    try {
      const createdPet = await createPet({
        name,
        species,
        gender,
        birthDate: birthDate || undefined,
        estimatedAge: estimatedAge ?? undefined,
        breed: avatarBreed ? AVATAR_BREED_LABELS[avatarBreed] : undefined,
        avatarBreed: avatarBreed ?? undefined,
      });

      setPet(mapPetFromDb(createdPet));

      completeOnboarding();

      router.replace('/(tabs)');
    } catch (error) {
      console.log('CREATE PET ERROR:', error);
    }
  };

  return (
    <OnboardingLayout
      step={5}
      total={5}
      title={`${name}의 품종을 골라주세요.`}
      description="나중에 언제든 바꿀 수 있어요."
      footer={
        <PrimaryButton
          label="포우미 시작하기"
          disabled={!avatarBreed}
          onPress={handleComplete}
        />
      }
    >
      <View style={styles.grid}>
        <Pressable
          onPress={() => setAvatarBreed('POMERANIAN')}
          style={[
            styles.avatarCard,
            avatarBreed === 'POMERANIAN' && styles.selected,
          ]}
        >
          <Image
            source={petAvatars.POMERANIAN.idle}
            style={styles.avatar}
            resizeMode="contain"
          />

          <AppText
            variant="body2"
            color={avatarBreed === 'POMERANIAN' ? 'brand' : 'primary'}
          >
            {AVATAR_BREED_LABELS.POMERANIAN}
          </AppText>
        </Pressable>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  avatarCard: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    padding: 12,
  },

  selected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  avatar: {
    width: '85%',
    height: '75%',
  },
});
