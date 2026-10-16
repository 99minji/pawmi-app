import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import {
  AVATAR_BREED_LABELS,
  AVATAR_BREED_OPTIONS,
  petAvatars,
} from '@/constants/petAvatars';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { usePetStore } from '@/stores/usePetStore';

import { mapPetFromDb } from '@/mappers/pet';
import { createPet } from '@/services/pet';

// 요청 식별용 UUID v4 (보안 용도가 아니므로 Math.random으로 충분)
function createClientRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;

    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

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

  const [submitting, setSubmitting] = useState(false);

  // 연타 시 state 반영 전에 두 번째 요청이 들어가지 않도록 즉시 잠근다.
  const submittingRef = useRef(false);

  // 이 온보딩 제출을 식별하는 값. 재시도해도 같은 값을 보내 DB에서 중복 생성을 막는다.
  const clientRequestIdRef = useRef(createClientRequestId());

  const handleComplete = async () => {
    if (!species || !gender || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const createdPet = await createPet({
        name,
        species,
        gender,
        birthDate: birthDate || undefined,
        estimatedAge: estimatedAge ?? undefined,
        breed: avatarBreed ? AVATAR_BREED_LABELS[avatarBreed] : undefined,
        avatarBreed: avatarBreed ?? undefined,
        clientRequestId: clientRequestIdRef.current,
      });

      setPet(mapPetFromDb(createdPet));

      completeOnboarding();

      router.replace('/(tabs)');
    } catch (error) {
      console.log('CREATE PET ERROR:', error);

      Alert.alert('등록하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
          label={submitting ? '등록 중...' : '포우미 시작하기'}
          disabled={!avatarBreed || submitting}
          onPress={handleComplete}
        />
      }
    >
      <View style={styles.grid}>
        {AVATAR_BREED_OPTIONS.map((breed) => {
          const selected = avatarBreed === breed;

          return (
            <Pressable
              key={breed}
              onPress={() => setAvatarBreed(breed)}
              style={[styles.avatarCard, selected && styles.selected]}
            >
              <Image
                source={petAvatars[breed].idle}
                style={styles.avatar}
                resizeMode="contain"
              />

              <AppText variant="body2" color={selected ? 'brand' : 'primary'}>
                {AVATAR_BREED_LABELS[breed]}
              </AppText>
            </Pressable>
          );
        })}
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
    borderColor: colors.border.soft,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    padding: 12,
    ...shadows.soft,
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
