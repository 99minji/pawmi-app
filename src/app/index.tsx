import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';

import { useAuth } from '@/providers/AuthProvider';

import { getCareSchedules } from '@/services/care';
import { getHealthRecords } from '@/services/health';
import { getMyPet } from '@/services/pet';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';

export default function IndexScreen() {
  const { session, loading: authLoading } = useAuth();

  const setPet = usePetStore((state) => state.setPet);

  const clearPet = usePetStore((state) => state.clearPet);

  const setRecords = useHealthStore((state) => state.setRecords);

  const clearRecords = useHealthStore((state) => state.clearRecords);

  const setSchedules = useCareScheduleStore((state) => state.setSchedules);

  const clearSchedules = useCareScheduleStore((state) => state.clearSchedules);

  const [checkingData, setCheckingData] = useState(true);

  const [hasPet, setHasPet] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    // 로그아웃 상태면 이전 사용자 데이터만 비운다. 화면은 아래 render에서 로그인으로 보낸다.
    if (!session) {
      clearPet();
      clearRecords();
      clearSchedules();

      return;
    }

    const loadAppData = async () => {
      setCheckingData(true);
      setError(false);

      try {
        const pet = await getMyPet();

        if (!pet) {
          clearPet();
          clearRecords();
          clearSchedules();

          setHasPet(false);

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
        console.log('APP DATA LOAD ERROR:', error);

        setError(true);
      } finally {
        setCheckingData(false);
      }
    };

    loadAppData();
  }, [
    session,
    authLoading,
    setPet,
    clearPet,
    setRecords,
    clearRecords,
    setSchedules,
    clearSchedules,
  ]);

  if (authLoading || (session && checkingData)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary[600]} />

        <AppText variant="body2" color="secondary" style={styles.message}>
          포우미를 준비하고 있어요.
        </AppText>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AppText variant="body1">정보를 불러오지 못했어요.</AppText>

        <AppText variant="body2" color="secondary" style={styles.message}>
          앱을 다시 실행해주세요.
        </AppText>
      </View>
    );
  }

  if (!hasPet) {
    return <Redirect href="/onboarding/name" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 20,
  },

  message: {
    marginTop: 10,
  },
});
