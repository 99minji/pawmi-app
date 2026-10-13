import {
  ChevronRight,
  HeartPulse,
  Hospital,
  Pill,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { QuickRecordSheet } from '@/components/record/QuickRecordSheet';
import { colors } from '@/constants/colors';
import { petAvatars } from '@/constants/petAvatars';
import { completeCareScheduleById, createCareSchedule } from '@/services/care';
import {
  createMedicationRecord,
  createVaccinationRecord,
} from '@/services/health';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareSchedule, CareSuggestion } from '@/types/care';
import { addRepeatToDate } from '@/utils/care';
import { getCareSuggestions } from '@/utils/careEngine';
import { dateToOccurredAt } from '@/utils/date';
import { hasRecentRecord } from '@/utils/healthInsight';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';
import { formatBreed, formatGender, formatPetAge } from '@/utils/pet';
import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

const renderScheduleIcon = (type: CareSchedule['type']) => {
  switch (type) {
    case 'VACCINATION':
      return <ShieldCheck size={20} color={colors.primary[700]} />;

    case 'MEDICATION':
      return <Pill size={20} color={colors.primary[700]} />;

    case 'HEARTWORM':
      return <HeartPulse size={20} color={colors.primary[700]} />;

    case 'CHECKUP':
      return <Hospital size={20} color={colors.primary[700]} />;
  }
};

// 스크롤 후 카드 위에 남겨둘 여백
const SCROLL_TOP_OFFSET = 24;

const getScheduleTitle = (schedule: CareSchedule) => {
  switch (schedule.type) {
    case 'VACCINATION':
      return `${schedule.name} 예방하는 날이에요`;

    case 'MEDICATION':
      return `${schedule.name} 먹이는 날이에요`;

    case 'HEARTWORM':
      return `${schedule.name} 예방하는 날이에요`;

    case 'CHECKUP':
      return `${schedule.name} 확인하는 날이에요`;

    default:
      return `${schedule.name} 관리하는 날이에요`;
  }
};

export default function TodayScreen() {
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);

  const addRecord = useHealthStore((state) => state.addRecord);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const replaceSchedule = useCareScheduleStore(
    (state) => state.replaceSchedule,
  );

  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const pendingScheduleId = useNotificationStore(
    (state) => state.pendingScheduleId,
  );

  const clearPendingScheduleId = useNotificationStore(
    (state) => state.clearPendingScheduleId,
  );

  const quickRecordSheetRef = useRef<BottomSheet>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // 알림으로 진입했을 때 카드 위치를 찾기 위한 레이아웃 정보
  const taskListYRef = useRef<number | null>(null);

  const taskCardYRef = useRef<Record<string, number>>({});

  const [completingScheduleId, setCompletingScheduleId] = useState<
    string | null
  >(null);

  /**
   * 현재 반려동물의 건강 기록
   */
  const records = useMemo(
    () => allRecords.filter((record) => record.petId === pet?.id),
    [allRecords, pet?.id],
  );

  /**
   * 최근 24시간 동안 건강 기록이 있는지
   *
   * 있으면 아바타를 care 상태로 보여준다.
   */
  const hasRecentCareRecord = useMemo(
    () => hasRecentRecord(records),
    [records],
  );

  const todayDateString = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');

    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }, []);

  /**
   * 오늘 해야 할 관리 일정
   */
  const todaySchedules = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.petId === pet?.id &&
          schedule.dueDate <= todayDateString &&
          !schedule.completedAt,
      )
      .sort((a, b) => {
        const aToday = a.dueDate === todayDateString;
        const bToday = b.dueDate === todayDateString;

        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;

        return b.dueDate.localeCompare(a.dueDate);
      });
  }, [schedules, pet?.id, todayDateString]);

  /**
   * 알림으로 진입한 일정 카드로 스크롤
   *
   * 목록과 카드의 레이아웃이 모두 잡힌 뒤에만 스크롤하고 대기 상태를 비운다.
   */
  const scrollToPendingSchedule = useCallback(() => {
    if (!pendingScheduleId) {
      return;
    }

    const taskListY = taskListYRef.current;

    const taskCardY = taskCardYRef.current[pendingScheduleId];

    if (taskListY === null || taskCardY === undefined) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(taskListY + taskCardY - SCROLL_TOP_OFFSET, 0),
      animated: true,
    });

    clearPendingScheduleId();
  }, [pendingScheduleId, clearPendingScheduleId]);

  useEffect(() => {
    if (!pendingScheduleId || !pet) {
      return;
    }

    // 오늘 할 일에 없는 일정(완료됐거나 날짜가 지난 일정)이면 스크롤하지 않는다.
    if (!todaySchedules.some((schedule) => schedule.id === pendingScheduleId)) {
      clearPendingScheduleId();

      return;
    }

    // 앱 실행 중 알림을 누른 경우 이미 레이아웃이 잡혀 있으므로 바로 스크롤한다.
    scrollToPendingSchedule();
  }, [
    pendingScheduleId,
    pet,
    todaySchedules,
    clearPendingScheduleId,
    scrollToPendingSchedule,
  ]);

  const careSuggestions = useMemo(() => {
    if (!pet) {
      return [];
    }

    return getCareSuggestions({
      pet,
      records,
      schedules,
    });
  }, [pet, records, schedules]);

  const openQuickRecordSheet = () => {
    quickRecordSheetRef.current?.expand();
  };

  /**
   * 오늘 할 일 완료
   *
   * 1. CareSchedule 완료 처리
   * 2. 실제 수행 이력을 HealthRecord에 남김
   * 3. 반복 일정이면 다음 일정과 알림을 등록
   */
  const handleCompleteSchedule = async (schedule: CareSchedule) => {
    if (!pet || completingScheduleId) {
      return;
    }

    setCompletingScheduleId(schedule.id);

    try {
      // 1. 현재 일정을 DB에서 완료 처리
      const completedSchedule = await completeCareScheduleById(schedule.id);

      // 2. 화면 상태에도 DB 결과 반영하고, 예약된 알림은 취소
      replaceSchedule(completedSchedule);

      await cancelCareNotification(schedule.id);

      // 3. 예방접종 일정이었다면
      // 실제 건강 기록에도 남긴다.
      if (schedule.type === 'VACCINATION') {
        const record = await createVaccinationRecord(
          pet.id,
          schedule.name,
          undefined,
          dateToOccurredAt(new Date()),
        );

        addRecord(record);
      }

      if (schedule.type === 'MEDICATION') {
        const record = await createMedicationRecord(
          pet.id,
          schedule.name,
          schedule.dosageText,
          undefined,
          dateToOccurredAt(new Date()),
        );

        addRecord(record);
      }

      // 4. 반복 일정이 없다면 종료
      if (!schedule.repeat) {
        return;
      }

      // 5. 다음 예정일 계산
      const nextDueDate = addRepeatToDate(schedule.dueDate, schedule.repeat);

      // 6. DB에 다음 일정 생성
      const nextSchedule = await createCareSchedule({
        petId: schedule.petId,
        type: schedule.type,
        name: schedule.name,

        dueDate: nextDueDate,

        repeat: schedule.repeat,

        dosageText: schedule.dosageText,

        notificationEnabled: schedule.notificationEnabled,

        notificationTime:
          schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
      });

      // 7. 화면에 바로 반영하고 다음 일정 알림 예약
      addScheduleFromDb(nextSchedule);

      if (nextSchedule.notificationEnabled) {
        await scheduleCareNotification({
          scheduleId: nextSchedule.id,
          petName: pet.name,
          careName: nextSchedule.name,
          dueDate: nextSchedule.dueDate,
          notificationTime:
            nextSchedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
        });
      }
    } catch (error) {
      console.log('COMPLETE CARE ERROR:', error);

      Alert.alert('완료 처리하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setCompletingScheduleId(null);
    }
  };

  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          반려동물 정보를 불러오고 있어요.
        </AppText>
      </View>
    );
  }

  /**
   * 아바타 상태
   */
  const avatarSource = hasRecentCareRecord
    ? petAvatars.POMERANIAN.care
    : petAvatars.POMERANIAN.idleBody;

  const tailSource = hasRecentCareRecord
    ? undefined
    : petAvatars.POMERANIAN.idleTail;

  const primarySuggestion = careSuggestions[0];

  const handleCareSuggestionAction = (suggestion: CareSuggestion) => {
    if (!suggestion.action) {
      return;
    }

    switch (suggestion.action.type) {
      case 'CREATE_CARE':
        router.push({
          pathname: '/care/create',
          params: {
            type: suggestion.action.careType,
          },
        });
        break;

      case 'CREATE_WEIGHT_RECORD':
        router.push('/record/weight');
        break;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
              <AppText variant="label" color="brand" style={styles.heroEyebrow}>
                오늘의 포우미
              </AppText>

              <AppText variant="heading1">
                오늘도 {pet.name}의 하루를{'\n'}
                챙겨볼까요?
              </AppText>
            </View>
          </View>

          <View style={styles.avatarArea}>
            <View style={styles.avatarGlow} />

            <AnimatedPetAvatar
              size={220}
              source={avatarSource}
              tailSource={tailSource}
            />
          </View>

          <View style={styles.petSummary}>
            <View style={styles.petSummaryText}>
              <AppText variant="heading2">{pet.name}</AppText>

              <AppText
                variant="body2"
                color="secondary"
                style={styles.petDescription}
              >
                {formatBreed(pet)} · {formatPetAge(pet)} ·{' '}
                {formatGender(pet.gender)}
              </AppText>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/pet/edit')}
            >
              <ChevronRight size={20} color={colors.primary[700]} />
            </Pressable>
          </View>
        </View>

        {/* 오늘 할 일 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          오늘 할 일
        </AppText>

        {todaySchedules.length > 0 ? (
          <View
            style={styles.taskList}
            onLayout={(event) => {
              taskListYRef.current = event.nativeEvent.layout.y;

              scrollToPendingSchedule();
            }}
          >
            {todaySchedules.map((schedule) => (
              <View
                key={schedule.id}
                style={styles.taskCard}
                onLayout={(event) => {
                  taskCardYRef.current[schedule.id] =
                    event.nativeEvent.layout.y;

                  scrollToPendingSchedule();
                }}
              >
                <View style={styles.taskIcon}>
                  {renderScheduleIcon(schedule.type)}
                </View>

                <View style={styles.taskContent}>
                  <AppText variant="body1">
                    {getScheduleTitle(schedule)}
                  </AppText>

                  {schedule.type === 'MEDICATION' && schedule.dosageText && (
                    <AppText
                      variant="body2"
                      color="secondary"
                      style={styles.taskDosage}
                    >
                      복용량 {schedule.dosageText}
                    </AppText>
                  )}

                  <AppText
                    variant="label"
                    color={
                      schedule.dueDate < todayDateString ? 'error' : 'tertiary'
                    }
                    style={styles.taskDescription}
                  >
                    {schedule.dueDate < todayDateString
                      ? '놓친 일정'
                      : '오늘 예정'}
                  </AppText>
                </View>

                <Pressable
                  style={[
                    styles.completeButton,
                    completingScheduleId === schedule.id &&
                      styles.completeButtonDisabled,
                  ]}
                  disabled={completingScheduleId === schedule.id}
                  onPress={() => handleCompleteSchedule(schedule)}
                >
                  <AppText variant="label" color="inverse">
                    {completingScheduleId === schedule.id ? '처리 중' : '완료'}
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTaskCard}>
            <AppText variant="body2" color="secondary">
              오늘 예정된 관리가 없어요.
            </AppText>

            <AppText
              variant="label"
              color="tertiary"
              style={styles.taskDescription}
            >
              관리 일정은 반려동물 탭에서 예약할 수 있어요.
            </AppText>
          </View>
        )}

        {primarySuggestion && (
          <View style={styles.careSuggestionCard}>
            <AppText variant="label" color="brand">
              포우미가 챙겨봤어요
            </AppText>

            <AppText variant="body1" style={styles.careSuggestionTitle}>
              {primarySuggestion.title}
            </AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.careSuggestionDescription}
            >
              {primarySuggestion.description}
            </AppText>

            {primarySuggestion.action && (
              <Pressable
                style={styles.careSuggestionAction}
                onPress={() => handleCareSuggestionAction(primarySuggestion)}
              >
                <AppText variant="label" color="brand">
                  {primarySuggestion.action.type === 'CREATE_CARE'
                    ? '일정 추가하기'
                    : '기록 남기기'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}

        {/* 건강 기록 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          건강 기록
        </AppText>

        <Pressable
          style={styles.quickRecordButton}
          onPress={openQuickRecordSheet}
        >
          <View style={styles.quickRecordIcon}>
            <Plus size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.quickRecordContent}>
            <AppText variant="body1">건강 기록 남기기</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.quickRecordDescription}
            >
              체중, 증상, 투약 등 이미 있었던 일을 기록해요.
            </AppText>
          </View>

          <ChevronRight size={20} color={colors.neutral[400]} />
        </Pressable>
      </ScrollView>

      <QuickRecordSheet ref={quickRecordSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  hero: {
    backgroundColor: colors.primary[50],
    borderRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    marginBottom: 32,
    overflow: 'hidden',
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  heroTitleArea: {
    flex: 1,
  },

  heroEyebrow: {
    marginBottom: 8,
  },

  avatarArea: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatarGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[100],
  },

  petSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  petSummaryText: {
    flex: 1,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },

  petDescription: {
    marginTop: 4,
  },

  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
  },

  taskList: {
    gap: 10,
    marginBottom: 28,
  },

  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  taskContent: {
    flex: 1,
    marginLeft: 12,
  },

  taskDosage: {
    marginTop: 4,
  },

  taskDescription: {
    marginTop: 4,
  },

  emptyTaskCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },

  completeButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },

  completeButtonDisabled: {
    opacity: 0.5,
  },

  careSuggestionCard: {
    marginBottom: 28,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },

  careSuggestionTitle: {
    marginTop: 8,
  },

  careSuggestionDescription: {
    marginTop: 6,
  },

  careSuggestionAction: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[100],
  },

  quickRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    marginBottom: 28,
  },

  quickRecordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  quickRecordContent: {
    flex: 1,
    marginLeft: 12,
  },

  quickRecordDescription: {
    marginTop: 4,
  },
});
