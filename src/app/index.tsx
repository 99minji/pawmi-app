import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { getCareSchedules } from '@/services/care';
import { getHealthRecords } from '@/services/health';
import { getMyPet } from '@/services/pet';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';

export default function IndexScreen() {
  const { session, loading } = useAuth();

  const setPet = usePetStore((state) => state.setPet);
  const setRecords = useHealthStore((state) => state.setRecords);

  const setSchedules = useCareScheduleStore((state) => state.setSchedules);

  const [checkingPet, setCheckingPet] = useState(true);

  const [hasPet, setHasPet] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session) {
      return;
    }

    const checkPet = async () => {
      try {
        const pet = await getMyPet();

        if (!pet) {
          setHasPet(false);
          setRecords([]);
          setSchedules([]);
          return;
        }

        setPet(pet);

        const [records, schedules] = await Promise.all([
          getHealthRecords(pet.id),
          getCareSchedules(pet.id),
        ]);

        setRecords(records);
        setSchedules(schedules);
        setHasPet(true);
      } catch (error) {
        console.log('PET CHECK ERROR:', error);
      } finally {
        setCheckingPet(false);
      }
    };

    checkPet();
  }, [session, loading, setPet, setRecords]);

  if (loading || (session && checkingPet)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.neutral[50],
        }}
      >
        <ActivityIndicator color={colors.primary[600]} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  if (!hasPet) {
    return <Redirect href="/onboarding/name" />;
  }

  return <Redirect href="/(tabs)" />;
}
