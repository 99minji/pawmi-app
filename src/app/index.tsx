import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';

import { useAuth } from '@/providers/AuthProvider';

import { getCareSchedules } from '@/services/care';
import { getHealthRecords } from '@/services/health';
import { getMyPets } from '@/services/pet';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePetStore } from '@/stores/usePetStore';
import {
  cancelAllCareNotifications,
  reconcileCareNotifications,
} from '@/utils/notification';

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

  // 오류 화면에서 다시 시도할 때 데이터 로드를 다시 실행한다.
  const [retryCount, setRetryCount] = useState(0);

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
        // 다중 펫 화면이 생기기 전까지는 가장 먼저 등록한 펫을 사용한다.
        const [pet] = await getMyPets();

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

        // DB 일정 기준으로 OS 예약 알림을 맞춘다. (앱 진입을 막지 않도록 기다리지 않음)
        reconcileCareNotifications(schedules, pet.name);

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
    retryCount,
  ]);

  /**
   * 오류 화면에서 로그아웃
   *
   * 세션은 남아 있는데 계속 불러오지 못하는 경우(계정 삭제 등) 빠져나올 수 있게 한다.
   * 로그아웃이 되면 위 effect가 store를 비우고 로그인 화면으로 보낸다.
   */
  const handleLogout = async () => {
    await cancelAllCareNotifications();

    useNotificationStore.getState().clearPendingScheduleId();

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('로그아웃하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

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
          네트워크 연결을 확인한 뒤 다시 시도해주세요.
        </AppText>

        <View style={styles.retryButton}>
          <PrimaryButton
            label="다시 시도"
            onPress={() => setRetryCount((count) => count + 1)}
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <AppText variant="body2" color="secondary">
            로그아웃
          </AppText>
        </Pressable>
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
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
  },

  message: {
    marginTop: 10,
  },

  retryButton: {
    alignSelf: 'stretch',
    marginTop: 24,
  },

  logoutButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
